// Разовая отладка: что на странице и что в консоли, когда подставлен Tauri IPC.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright";

const APP_DIST = "/Users/egor/.claude/worktrees/mediachef-site/app/dist";
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".woff2": "font/woff2",
  ".woff": "font/woff", ".png": "image/png" };

const server = createServer(async (req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const rel = normalize(p === "/" ? "/index.html" : p).replace(/^(\.\.[/\\])+/, "");
  try {
    const body = await readFile(join(APP_DIST, rel));
    res.writeHead(200, { "content-type": MIME[extname(rel)] ?? "application/octet-stream" }).end(body);
  } catch { res.writeHead(404).end("nf"); }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1180, height: 760 } });
await ctx.addInitScript(`
  window.__TAURI_INTERNALS__ = {
    invoke: (cmd) => { console.log("[invoke]", cmd); return Promise.resolve(
      cmd === "settings_get" ? {language:"en",theme:"light",output_mode:"beside",output_dir:null,notifications:true,ffmpeg_workers:1}
      : cmd === "recipes" || cmd === "jobs" || cmd === "models_list" ? []
      : cmd === "plugin:app|version" ? "0.7.2"
      : cmd === "system_locale" ? "en-US"
      : null); },
    transformCallback: (cb) => { const id = "cb" + Math.random(); window[id] = cb; return id; },
    unregisterCallback: () => {},
    convertFileSrc: (p) => p,
    metadata: {},
  };
`);
const page = await ctx.newPage();
page.on("console", (m) => console.log(`[${m.type()}]`, m.text().slice(0, 300)));
page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 500)));
await page.goto(base, { waitUntil: "load" });
await page.waitForTimeout(3000);

console.log("\n--- что в DOM ---");
console.log("html lang:", await page.evaluate(() => document.documentElement.lang));
console.log("body длина:", await page.evaluate(() => document.body.innerHTML.length));
console.log("есть main:", await page.evaluate(() => !!document.querySelector("main")));
console.log("заголовки:", await page.evaluate(() =>
  [...document.querySelectorAll("h1,h2,h3")].map((e) => e.textContent.trim()).slice(0, 6)));
console.log("начало body:", (await page.evaluate(() => document.body.innerHTML)).slice(0, 400));

await browser.close();
server.close();
