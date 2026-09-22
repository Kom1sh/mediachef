/**
 * Пульс проекта одной командой: неделя к неделе.
 *
 *   npm run pulse
 *
 * Собирает то, что раньше смотрели четырьмя разными способами: люди (Метрика),
 * отзывы и роботы ИИ (D1), живые копии программы и звёзды (GitHub), статус
 * заявки в winget. Каждая часть отвечает сама за себя: не открылась Метрика —
 * остальное всё равно печатается, с одной строкой о том, чего не хватило.
 *
 * Токен Метрики не хранится в репозитории: берётся из METRIKA_TOKEN или из
 * ~/.claude/secrets/yandex-metrika-token (право metrika:read).
 */
import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const DB = "mediachef-crawlers";
const ACCOUNT = "6956daeaca797b15f29d16a83f6b9c0a";
const COUNTER = 112053786; // счётчик Метрики mediachef.app — публичный, он в коде страниц
const GOAL = 603461103; // цель «Скачал приложение»
const REPO = "Kom1sh/mediachef";
const WINGET_PR = 434688;

// Сети, из которых сайт проверяли мы сами: чистый тест Claude 15.09 и
// проверка «как видят сайт роботы» 20.09 шли через VPN (польские, немецкие,
// нидерландские и эстонские выходы) и за одну минуту представлялись всеми
// ботами подряд. Настоящих заходов роботов из них не было, а без этого
// фильтра они выглядели как «первые визиты ботов Claude».
const OWN_CHECK_NETS = [25198, 34702, 60404];
const notOurs = `(asn IS NULL OR asn NOT IN (${OWN_CHECK_NETS.join(",")}))`;

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const weekStart = now - 7 * DAY;
const prevStart = now - 14 * DAY;

// ── Вывод ───────────────────────────────────────────────────────────────────
// У каждой части свой буфер: части собираются параллельно, и общий вывод
// перемешал бы их строки. Печатаются они потом в фиксированном порядке.
function report(title) {
  const lines = ["", title, "─".repeat(title.length)];
  return {
    lines,
    line(label, value, prev) {
      let delta = "";
      if (typeof value === "number" && typeof prev === "number") {
        const d = value - prev;
        delta = d === 0 ? "  = как неделей раньше" : `  ${d > 0 ? "▲" : "▼"} ${Math.abs(d)} (было ${prev})`;
      }
      lines.push(`  ${label.padEnd(34)} ${String(value).padStart(5)}${delta}`);
    },
    note(text) { lines.push(`  ${text}`); },
  };
}

// ── Источники ───────────────────────────────────────────────────────────────
async function d1(sql) {
  const { stdout } = await run(
    "npx",
    ["wrangler", "d1", "execute", DB, "--remote", "--json", "--command", sql],
    { env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: ACCOUNT }, maxBuffer: 32 * 1024 * 1024 },
  );
  return JSON.parse(stdout.slice(stdout.indexOf("[")));
}

async function github(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "mediachef-pulse" },
  });
  if (!res.ok) throw new Error(`GitHub ${path}: HTTP ${res.status}`);
  return res.json();
}

function metrikaToken() {
  if (process.env.METRIKA_TOKEN) return process.env.METRIKA_TOKEN.trim();
  try {
    return readFileSync(join(homedir(), ".claude/secrets/yandex-metrika-token"), "utf8").trim();
  } catch {
    return "";
  }
}

const ymd = (ms) => new Date(ms).toISOString().slice(0, 10);

async function metrika(token, from, to) {
  const q = new URLSearchParams({
    ids: String(COUNTER),
    metrics: `ym:s:visits,ym:s:goal${GOAL}visits`,
    dimensions: "ym:s:lastsignSourceEngine",
    date1: ymd(from),
    date2: ymd(to),
    accuracy: "full",
    limit: "100",
  });
  const res = await fetch(`https://api-metrika.yandex.net/stat/v1/data?${q}`, {
    headers: { Authorization: `OAuth ${token}` },
  });
  if (!res.ok) throw new Error(`Метрика: HTTP ${res.status}`);
  const data = await res.json();
  const byEngine = (id) => data.data.find((r) => r.dimensions[0]?.id === id)?.metrics ?? [0, 0];
  return {
    visits: data.totals[0],
    downloads: data.totals[1],
    chatgptVisits: byEngine("referral.chatgpt.com")[0],
    chatgptDownloads: byEngine("referral.chatgpt.com")[1],
    google: byEngine("organic.google")[0],
    yandex: byEngine("organic.yandex")[0],
  };
}

// ── Части отчёта ────────────────────────────────────────────────────────────
async function people() {
  const r = report("Люди — Метрика, 7 дней к предыдущим 7");
  const { line, note } = r;
  const token = metrikaToken();
  if (!token) {
    note("нет токена: METRIKA_TOKEN или ~/.claude/secrets/yandex-metrika-token");
    return [r];
  }
  // Сегодня ещё не кончилось, поэтому сравниваем семь последних полных дней с
  // семью перед ними — иначе текущая неделя всегда проигрывала бы на полдня.
  const [cur, prev] = await Promise.all([
    metrika(token, now - 7 * DAY, now - DAY),
    metrika(token, now - 14 * DAY, now - 8 * DAY),
  ]);
  line("визиты", cur.visits, prev.visits);
  line("скачивания (клик по файлу)", cur.downloads, prev.downloads);
  line("из ChatGPT — визиты", cur.chatgptVisits, prev.chatgptVisits);
  line("из ChatGPT — скачивания", cur.chatgptDownloads, prev.chatgptDownloads);
  // Интерес и кликабельность падают по отдельности, и путать их дорого.
  // «Разбор» — ChatGPT сам открыл страницу, чтобы ответить человеку: это
  // журнал на сервере, согласия и блокировщики на него не влияют. Визит —
  // человек после этого ответа пришёл. 20.09.2026 разборы держались ровно
  // (~17 в день), а переходы упали с 6–9 до 1–3 в день: спрос был прежний,
  // изменилась только доля тех, кто нажимает ссылку в ответе.
  try {
    const [reads] = await d1(
      `SELECT SUM(at>=${weekStart}) AS week, SUM(at<${weekStart} AND at>=${prevStart}) AS prev
         FROM hits WHERE bot='ChatGPT-User' AND asn=8075 AND status=200`,
    );
    const r = reads.results[0] ?? {};
    const [week, before] = [r.week ?? 0, r.prev ?? 0];
    line("ChatGPT разобрал страницу", week, before);
    const per = (v, reads) => (reads ? (10 * v / reads).toFixed(1) : "—");
    note(`на 10 разборов приходит переходов: ${per(cur.chatgptVisits, week)} (неделей раньше ${per(prev.chatgptVisits, before)})`);
  } catch {
    note("журнал роботов не ответил — строка про разборы пропущена");
  }
  line("из Google", cur.google, prev.google);
  line("из Яндекса", cur.yandex, prev.yandex);
  return [r];
}

async function robotsAndFeedback() {
  const [counts, deep, fb, started] = await d1(
    [
      `SELECT
         SUM(at>=${weekStart} AND bot='ChatGPT-User' AND asn=8075 AND path IN ('/','/en/')) AS cg_root,
         SUM(at<${weekStart} AND bot='ChatGPT-User' AND asn=8075 AND path IN ('/','/en/')) AS cg_root_prev,
         SUM(at>=${weekStart} AND bot='ChatGPT-User' AND asn=8075 AND path NOT IN ('/','/en/','/robots.txt')) AS cg_deep,
         SUM(at<${weekStart} AND bot='ChatGPT-User' AND asn=8075 AND path NOT IN ('/','/en/','/robots.txt')) AS cg_deep_prev,
         COUNT(DISTINCT CASE WHEN at>=${weekStart} AND bot='OAI-SearchBot' AND path<>'/robots.txt' THEN path END) AS oai,
         COUNT(DISTINCT CASE WHEN at<${weekStart} AND bot='OAI-SearchBot' AND path<>'/robots.txt' THEN path END) AS oai_prev,
         COUNT(DISTINCT CASE WHEN at>=${weekStart} AND bot='GPTBot' THEN path END) AS gpt,
         COUNT(DISTINCT CASE WHEN at<${weekStart} AND bot='GPTBot' THEN path END) AS gpt_prev,
         SUM(at>=${weekStart} AND bot='PerplexityBot' AND ${notOurs}) AS pplx,
         SUM(at<${weekStart} AND bot='PerplexityBot' AND ${notOurs}) AS pplx_prev,
         SUM(at>=${weekStart} AND bot LIKE 'Claude%' AND ${notOurs}) AS claude,
         SUM(at<${weekStart} AND bot LIKE 'Claude%' AND ${notOurs}) AS claude_prev
       FROM hits WHERE at>=${prevStart}`,
      `SELECT path, COUNT(*) AS n FROM hits
       WHERE at>=${weekStart} AND bot='ChatGPT-User' AND asn=8075 AND path NOT IN ('/','/en/','/robots.txt')
       GROUP BY path ORDER BY n DESC LIMIT 8`,
      `SELECT COUNT(*) AS total, SUM(at>=${weekStart}) AS week FROM feedback`,
      "SELECT MIN(at) AS first FROM hits",
    ].join(";\n"),
  );

  const f = fb.results[0];
  const feedback = report("Отзывы");
  let { line, note } = feedback;
  line("за неделю", f.week ?? 0);
  line("всего", f.total ?? 0);
  if (f.week) note("прочитать: npm run feedback -- --new  (и они же приходят письмом)");

  const c = counts.results[0];
  const n = (k) => c[k] ?? 0;
  const robots = report("Роботы ИИ — 7 дней к предыдущим 7");
  ({ line, note } = robots);
  // Журнал ведётся не с начала времён: пока он моложе двух недель, «было»
  // считает не прошлую неделю, а её хвост — и любой рост выглядит взрывом.
  const first = started.results[0]?.first;
  if (first && first > prevStart) {
    note(`журнал ведётся с ${new Date(first).toLocaleDateString("ru-RU")} — прошлая неделя неполная, сравнение завышено`);
  }
  line("ChatGPT-User → главная", n("cg_root"), n("cg_root_prev"));
  line("ChatGPT-User → гайды", n("cg_deep"), n("cg_deep_prev"));
  for (const r of deep.results) note(`    ${String(r.n).padStart(3)}× ${r.path}`);
  line("OAI-SearchBot, разных страниц", n("oai"), n("oai_prev"));
  line("GPTBot, разных страниц", n("gpt"), n("gpt_prev"));
  line("PerplexityBot, заходов", n("pplx"), n("pplx_prev"));
  line("боты Claude, заходов", n("claude"), n("claude_prev"));
  note("ChatGPT-User открывает страницу, когда её используют в ответе человеку: рост «гайдов» — главный сигнал.");
  return [feedback, robots];
}

async function copiesAndStars() {
  const r = report("GitHub");
  const { line, note } = r;
  const [repo, release] = await Promise.all([
    github(`/repos/${REPO}`),
    github(`/repos/${REPO}/releases/latest`),
  ]);
  line("звёзды", repo.stargazers_count);
  line("форки", repo.forks_count);

  // Каждая установленная копия при запуске забирает latest.json текущего
  // релиза, так что счётчик его скачиваний — это запуски, а не люди.
  const manifest = release.assets.find((a) => a.name === "latest.json");
  const days = Math.max((now - Date.parse(release.published_at)) / DAY, 0.5);
  if (manifest) {
    line(`запуски программы с ${release.tag_name}`, manifest.download_count);
    note(`    ≈ ${(manifest.download_count / days).toFixed(1)} в день за ${days.toFixed(1)} дн. — запуски, не люди`);
  }

  try {
    const pr = await github(`/repos/microsoft/winget-pkgs/pulls/${WINGET_PR}`);
    const labels = pr.labels.map((l) => l.name).join(", ") || "без меток";
    const state = pr.merged ? "принят — winget install Kom1sh.MediaChef" : pr.state === "open" ? `ждёт (${labels})` : "закрыт без слияния";
    note(`winget PR #${WINGET_PR}: ${state}`);
  } catch (e) {
    note(`winget: ${e.message}`);
  }
  return [r];
}

// ── Сборка ──────────────────────────────────────────────────────────────────
const names = ["Люди", "Отзывы и роботы", "GitHub"];
const parts = await Promise.allSettled([people(), robotsAndFeedback(), copiesAndStars()]);
console.log(`\nПульс MediaChef · ${new Date(now).toLocaleString("ru-RU")}`);
parts.forEach((p, i) => {
  if (p.status === "fulfilled") {
    for (const r of p.value) console.log(r.lines.join("\n"));
  } else {
    const why = p.reason?.stderr || p.reason?.message || String(p.reason);
    console.log(`\n${names[i]}: не собралось — ${why.split("\n")[0]}`);
  }
});
console.log("");
