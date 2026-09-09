/**
 * Отчёты по журналу заходов роботов.
 *
 *   npm run crawlers                    сводка по роботам за 7 дней
 *   npm run crawlers -- --days 30       другой период
 *   npm run crawlers -- --pages         какие страницы забирают
 *   npm run crawlers -- --nets          бот × сеть, с пометкой о несовпадении
 *   npm run crawlers -- --fake          только подозрительное: чужая сеть и поиск секретов
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

/**
 * Сети, из которых робот с таким именем ходит на самом деле.
 *
 * Зачем таблица понадобилась. 8 сентября в журнале оказалось 11 запросов от
 * «ChatGPT-User» и 9 от «Googlebot», которые дёргали `/.env`, `/.git/HEAD`,
 * `/.aws/credentials` и `/.cursor/mcp.json`. Настоящие ходят из сетей 8075 и
 * 15169, а эти — из 13335. То есть сканер, искавший утёкшие ключи под именем
 * ИИ-ботов. Увидеть это можно было только сверив имя с сетью, и увидели мы
 * глазами — а значит в следующий раз пропустим.
 *
 * Номера собраны из нашего же журнала и общеизвестных фактов: OpenAI и Bing
 * живут в сети Microsoft (8075), Google — 15169, Apple — 714, Meta — 32934.
 * Список неизбежно устареет: робот может получить новую сеть, и тогда честное
 * совпадение попадёт в подозрительные. Поэтому пометка называется «не
 * сходится», а не «подделка», и решает человек. Робота без записи здесь не
 * проверяем вовсе — выдумывать за него ожидание хуже, чем не иметь его.
 */
const KNOWN_NETS = {
  GPTBot: [8075],
  "OAI-SearchBot": [8075],
  "ChatGPT-User": [8075],
  Googlebot: [15169],
  GoogleOther: [15169],
  "Google-Extended": [15169],
  Bingbot: [8075],
  BingPreview: [8075],
  // DuckDuckGo ищет на инфраструктуре Bing, поэтому та же сеть Microsoft.
  DuckDuckBot: [8075],
  YandexBot: [13238],
  Applebot: [714],
  "Applebot-Extended": [714],
  facebookexternalhit: [32934],
  FacebookBot: [32934],
  "meta-externalagent": [32934],
  Amazonbot: [14618, 16509],
  AhrefsBot: [16276],
  SemrushBot: [209366],
  PetalBot: [136907],
  DotBot: [23033],
  Twitterbot: [62041],
};

/** `true`, если у робота есть список сетей и этой в нём нет. */
function netMismatch(bot, asn) {
  const nets = KNOWN_NETS[bot];
  return Boolean(nets) && asn != null && !nets.includes(asn);
}

/**
 * Пути, которые на сайте существуют по построению: страницы внутри локали,
 * служебные файлы, собранные ассеты и ключ IndexNow.
 *
 * Всё остальное, отданное с 404, — это перебор чужих адресов. Признак не
 * требует никаких списков и не устаревает: он о форме нашего сайта, а не о
 * повадках сканеров, и поймает следующий, который придёт за другими файлами.
 */
const OUR_SHAPE = /^\/([a-z]{2}\/|_astro\/|robots\.txt$|sitemap\.xml$|llms\.txt$|favicon|apple-touch-icon|og\.png$|logo\.png$|feedback\/?$|[0-9a-f]{32}\.txt$|$)/;

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
    console.log(`\nБот × сеть за ${days} дн. Столбец «сходится» сверяет имя робота с сетями, из которых он ходит:\n`);
    const rows = await query(
      `SELECT bot, asn, country, COUNT(*) AS hits, SUM(status >= 400) AS errs, MAX(${when}) AS last
         FROM hits WHERE at >= ? GROUP BY bot, asn, country
        ORDER BY bot, hits DESC LIMIT 80`,
      [since],
    );
    table(
      rows.map((r) => ({
        бот: r.bot,
        ASN: r.asn,
        страна: r.country,
        хитов: r.hits,
        ошибок: r.errs,
        // Три состояния, а не два: «не проверяли» честнее, чем «сходится».
        сходится: netMismatch(r.bot, r.asn) ? "НЕТ" : KNOWN_NETS[r.bot] ? "да" : "—",
        последний: r.last,
      })),
    );
    console.log("\n  «—» значит, что ожидаемых сетей для этого робота мы не знаем и не проверяли.\n");
  },
  /**
   * Только подозрительное — по двум признакам сразу.
   *
   * Первый: имя робота не сходится с сетью. Второй: перебор адресов, которых
   * на сайте нет, — он не зависит ни от каких списков и поймает сканер, даже
   * если тот назовётся невиданным именем.
   */
  async fake() {
    const rows = await query(
      `SELECT bot, asn, country, path, status, datetime(at/1000,'unixepoch','localtime') AS t
         FROM hits WHERE at >= ? ORDER BY at DESC LIMIT 4000`,
      [since],
    );

    const byNet = new Map();
    for (const r of rows) {
      if (!netMismatch(r.bot, r.asn)) continue;
      const key = `${r.bot}|${r.asn}|${r.country}`;
      const g = byNet.get(key) ?? { бот: r.bot, ASN: r.asn, страна: r.country, хитов: 0, ошибок: 0, ожидали: (KNOWN_NETS[r.bot] || []).join(", "), последний: r.t };
      g.хитов += 1;
      if (r.status >= 400) g.ошибок += 1;
      byNet.set(key, g);
    }

    const byProbe = new Map();
    for (const r of rows) {
      if (r.status < 400 || OUR_SHAPE.test(r.path)) continue;
      const key = `${r.bot}|${r.asn}`;
      const g = byProbe.get(key) ?? { бот: r.bot, ASN: r.asn, страна: r.country, запросов: 0, примеры: [], последний: r.t };
      g.запросов += 1;
      if (g.примеры.length < 3) g.примеры.push(r.path);
      byProbe.set(key, g);
    }

    console.log(`\nИмя не сходится с сетью, за ${days} дн.:\n`);
    table([...byNet.values()].sort((a, b) => b.хитов - a.хитов));

    console.log(`\nПеребор адресов, которых на сайте нет, за ${days} дн.:\n`);
    table(
      [...byProbe.values()]
        .sort((a, b) => b.запросов - a.запросов)
        .map((g) => ({ ...g, примеры: g.примеры.join(" ") })),
    );

    if (byNet.size === 0 && byProbe.size === 0) {
      console.log("\n  Чисто: ни расхождений по сетям, ни перебора чужих адресов.\n");
    } else {
      console.log("\n  Все такие запросы получили 404 — на сайте нет ни .env, ни .git, ни ключей.");
      console.log("  Пометка не приговор: у робота могла появиться новая сеть. Сверяйтесь с поведением.\n");
    }
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
    // Предупреждение в сводке, а не только в своём отчёте: подделку заметили
    // глазами один раз, и рассчитывать на второй раз нельзя.
    const suspicious = await query(
      `SELECT bot, asn, COUNT(*) AS hits FROM hits WHERE at >= ? GROUP BY bot, asn`,
      [since],
    );
    const bad = suspicious.filter((r) => netMismatch(r.bot, r.asn));
    if (bad.length > 0) {
      const total = bad.reduce((n, r) => n + r.hits, 0);
      const names = [...new Set(bad.map((r) => r.bot))].join(", ");
      console.log(`  ⚠ ${total} запрос(ов) от «${names}» пришли из чужих сетей — подробности: --fake`);
    }

    console.log("\n  Подробности: --pages, --nets, --fake, --errors, --unknown, --bot ИМЯ, --url /путь\n");
  },
};

try {
  if (value("bot")) await reports.bot(value("bot"));
  else if (value("url")) await reports.url(value("url"));
  else if (flag("pages")) await reports.pages();
  else if (flag("nets")) await reports.nets();
  else if (flag("fake")) await reports.fake();
  else if (flag("errors")) await reports.errors();
  else if (flag("unknown")) await reports.unknown();
  else await reports.summary();
} catch (e) {
  console.error("Не удалось прочитать журнал:", e.stderr || e.message);
  process.exit(1);
}
