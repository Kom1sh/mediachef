/**
 * Читает сообщения с формы обратной связи.
 *
 *   npm run feedback              последние 20 сообщений
 *   npm run feedback -- --all     все
 *   npm run feedback -- --new     только пришедшие за сутки
 *
 * Отдельный скрипт, а не отчёт внутри `crawlers.mjs`: там машинные заходы, тут
 * письма от людей. Складывать их в одну команду значило бы прятать второе за
 * первым — а именно второе нельзя пропустить.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const DB = "mediachef-crawlers";
const ACCOUNT = "6956daeaca797b15f29d16a83f6b9c0a";

const args = process.argv.slice(2);
const all = args.includes("--all");
const onlyNew = args.includes("--new");

const where = onlyNew ? `WHERE at > ${Date.now() - 24 * 60 * 60 * 1000}` : "";
const limit = all ? "" : "LIMIT 20";

const sql =
  "SELECT id, datetime(at/1000,'unixepoch','localtime') AS t, kind, locale, version," +
  " platform, context, contact, message FROM feedback " +
  `${where} ORDER BY at DESC ${limit}`;

let rows;
try {
  const { stdout } = await run(
    "npx",
    ["wrangler", "d1", "execute", DB, "--remote", "--json", "--command", sql],
    { env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: ACCOUNT }, maxBuffer: 32 * 1024 * 1024 },
  );
  rows = JSON.parse(stdout.slice(stdout.indexOf("[")))[0]?.results ?? [];
} catch (e) {
  console.error("Не удалось прочитать сообщения:", e.stderr || e.message);
  process.exit(1);
}

if (rows.length === 0) {
  console.log(onlyNew ? "\nЗа сутки сообщений не было.\n" : "\nСообщений пока нет.\n");
  process.exit(0);
}

console.log(`\nСообщений: ${rows.length}\n`);
for (const r of rows) {
  // Шапка одной строкой: по ней видно, отвечать ли и на что именно.
  const head = [
    `#${r.id}`,
    r.t,
    r.kind === "idea" ? "предложение" : "поломка",
    r.locale,
    r.version && r.platform ? `${r.version} · ${r.platform}` : r.version || r.platform,
    r.context && `контекст: ${r.context}`,
  ]
    .filter(Boolean)
    .join("  |  ");
  console.log("─".repeat(Math.min(head.length, 100)));
  console.log(head);
  // Адрес отдельной строкой и с пометкой: без него отвечать некуда, и это
  // первое, что нужно увидеть.
  console.log(r.contact ? `ответить: ${r.contact}` : "ответить некуда — адреса нет");
  console.log("");
  console.log(r.message);
  console.log("");
}
