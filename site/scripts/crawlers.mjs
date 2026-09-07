/**
 * Отчёты по журналу заходов роботов.
 *
 *   npm run crawlers                    сводка по роботам за 7 дней
 *   npm run crawlers -- --days 30       другой период
 *   npm run crawlers -- --pages         какие страницы забирают
 *   npm run crawlers -- --nets          бот × сеть: так видно подделку User-Agent
 *   npm run crawlers -- --errors        что отдавалось с 4xx/5xx
 *   npm run crawlers -- --unknown       незнакомые роботы с полным User-Agent
 *   npm run crawlers -- --bot GPTBot    последние запросы одного робота
 *   npm run crawlers -- --url /ru/      кто заходил на страницу (совпадение по началу пути)
 *
 * Читается через `wrangler d1 execute`, а не через ручку на сайте, и это
 * осознанно: журнал заходов — внутренние данные, и публичный адрес, который
 * их отдаёт, придётся ещё и защищать. CLI уже знает, кто мы: авторизация у
 * него своя.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const DB = "mediachef-crawlers";
const ACCOUNT = "6956daeaca797b15f29d16a83f6b9c0a";

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name, fallback = null) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const days = Number.parseInt(value("days", "7"), 10);
if (!Number.isFinite(days) || days <= 0) {
  console.error("--days ждёт положительное число дней");
  process.exit(1);
}
const since = Date.now() - days * 24 * 60 * 60 * 1000;

/**
 * Один запрос к базе. Параметры уезжают через `--json` + позиционные `?`:
 * склеивать SQL строками нельзя даже во внутреннем скрипте — путь и имя
 * робота приходят из аргументов командной строки.
 */
async function query(sql, params = []) {
  // У `d1 execute` нет отдельного флага для параметров, поэтому подстановка
  // делается здесь — с экранированием одинарных кавычек по правилам SQLite.
  // Числа уезжают как числа, всё остальное — строковым литералом.
  const filled = params.reduce(
    (acc, p) =>
      acc.replace("?", typeof p === "number" ? String(p) : `'${String(p).replaceAll("'", "''")}'`),
    sql,
  );
  const argv = ["wrangler", "d1", "execute", DB, "--remote", "--json", "--command", filled];
  const { stdout } = await run("npx", argv, {
    env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: ACCOUNT },
    maxBuffer: 32 * 1024 * 1024,
  });
  // Wrangler иногда печатает предупреждения перед JSON — берём от первой
  // скобки массива.
  const start = stdout.indexOf("[");
  const parsed = JSON.parse(stdout.slice(start));
  return parsed[0]?.results ?? [];
}

/** Таблица с выровненными колонками: заголовки берутся из первой строки. */
function table(rows) {
  if (rows.length === 0) {
    console.log("  (пусто)");
    return;
  }
  const cols = Object.keys(rows[0]);
  const width = (c) =>
    Math.max(c.length, ...rows.map((r) => String(r[c] ?? "").length));
  const widths = Object.fromEntries(cols.map((c) => [c, Math.min(width(c), 70)]));
  const line = (cells) =>
    cols.map((c, i) => {
      const s = String(cells[i] ?? "");
      const w = widths[c];
      return (s.length > w ? s.slice(0, w - 1) + "…" : s).padEnd(w);
    }).join("  ");
  console.log("  " + line(cols));
  console.log("  " + cols.map((c) => "─".repeat(widths[c])).join("  "));
  for (const r of rows) console.log("  " + line(cols.map((c) => r[c])));
}

const when = "datetime(at / 1000, 'unixepoch', 'localtime')";

const reports = {
  async unknown() {
    console.log(`\nНезнакомые роботы за ${days} дн. — опознать и добавить в BOTS в _worker.js:\n`);
    table(await query(
      `SELECT COUNT(*) AS хитов, MAX(${when}) AS последний, ua AS "user-agent"
         FROM hits WHERE bot = 'other' AND at >= ?
        GROUP BY ua ORDER BY хитов DESC LIMIT 30`,
      [since],
    ));
  },
  async nets() {
    console.log(`\nБот × сеть за ${days} дн. Один робот с нескольких ASN — повод глянуть, кто из них настоящий:\n`);
    table(await query(
      `SELECT bot AS бот, asn AS ASN, country AS страна, COUNT(*) AS хитов, MAX(${when}) AS последний
         FROM hits WHERE at >= ? GROUP BY bot, asn, country
        ORDER BY бот, хитов DESC LIMIT 60`,
      [since],
    ));
  },
  async pages() {
    console.log(`\nСтраницы за ${days} дн.:\n`);
    table(await query(
      `SELECT path AS страница, COUNT(*) AS хитов, COUNT(DISTINCT bot) AS роботов,
              MAX(${when}) AS последний
         FROM hits WHERE at >= ? GROUP BY path ORDER BY хитов DESC LIMIT 40`,
      [since],
    ));
  },
  async errors() {
    console.log(`\nОтветы с ошибкой за ${days} дн.:\n`);
    table(await query(
      `SELECT status AS статус, path AS страница, bot AS бот, COUNT(*) AS хитов,
              MAX(${when}) AS последний
         FROM hits WHERE at >= ? AND status >= 400
        GROUP BY status, path, bot ORDER BY хитов DESC LIMIT 40`,
      [since],
    ));
  },
  async bot(name) {
    console.log(`\nПоследние запросы «${name}»:\n`);
    table(await query(
      `SELECT ${when} AS когда, method AS метод, path AS страница, status AS статус,
              type AS формат
         FROM hits WHERE bot = ? AND at >= ? ORDER BY at DESC LIMIT 40`,
      [name, since],
    ));
  },
  async url(path) {
    console.log(`\nКто заходил на «${path}*» за ${days} дн.:\n`);
    table(await query(
      `SELECT bot AS бот, COUNT(*) AS хитов, MAX(${when}) AS последний,
              GROUP_CONCAT(DISTINCT status) AS статусы
         FROM hits WHERE path LIKE ? AND at >= ? GROUP BY bot ORDER BY хитов DESC`,
      [`${path}%`, since],
    ));
  },
  async summary() {
    const total = await query("SELECT COUNT(*) AS n, MIN(at) AS first FROM hits");
    const n = total[0]?.n ?? 0;
    if (n === 0) {
      console.log("\nЖурнал пуст. Либо роботы ещё не заходили после выкладки, либо привязка базы не доехала:");
      console.log("  npx wrangler pages deployment list --project-name=mediachef\n");
      return;
    }
    console.log(`\nРоботы за ${days} дн. (всего в журнале ${n} строк, с ${new Date(total[0].first).toISOString().slice(0, 10)}):\n`);
    table(await query(
      `SELECT bot AS бот, COUNT(*) AS хитов, COUNT(DISTINCT path) AS страниц,
              SUM(status >= 400) AS ошибок, MAX(${when}) AS последний
         FROM hits WHERE at >= ? GROUP BY bot ORDER BY хитов DESC`,
      [since],
    ));
    console.log("\n  Подробности: --pages, --nets, --errors, --unknown, --bot ИМЯ, --url /путь\n");
  },
};

try {
  if (value("bot")) await reports.bot(value("bot"));
  else if (value("url")) await reports.url(value("url"));
  else if (flag("pages")) await reports.pages();
  else if (flag("nets")) await reports.nets();
  else if (flag("errors")) await reports.errors();
  else if (flag("unknown")) await reports.unknown();
  else await reports.summary();
} catch (e) {
  console.error("Не удалось прочитать журнал:", e.stderr || e.message);
  process.exit(1);
}
