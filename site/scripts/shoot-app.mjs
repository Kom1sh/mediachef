/**
 * Снимает интерфейс приложения на каждом языке — по кадру на локаль и тему.
 *
 * Зачем: на сайте лежал ОДИН скриншот, снятый с русского интерфейса, и он
 * показывался на всех десяти локалях. Англоязычному посетителю картинка
 * сообщала, что программа русская, — то есть ровно обратное правде, потому что
 * интерфейс переведён на все десять.
 *
 * Почему не снимаем экран. Оконный режим `screencapture -l` у Tauri отдаёт
 * белую заглушку: содержимое WKWebView не попадает в тот слой, откуда он
 * читает. Полноэкранный снимок с обрезкой по границам окна берёт то, что
 * ВИДНО, — и дважды поймал чужие окна вместо приложения, включая браузер
 * с личными данными. Оба подхода отвергнуты.
 *
 * Вместо этого мы поднимаем собранный фронтенд приложения в headless-браузере
 * и подставляем ему Tauri IPC. Отрисовывается настоящий `App` — тот же код,
 * что в поставке, — поэтому кадр не может разойтись с программой. Побочно это
 * воспроизводимо: чтобы обновить картинки после редизайна, достаточно снова
 * запустить скрипт, а не ловить окно на своём экране.
 *
 * Запуск:  npm run shots     (сначала соберите фронтенд: cd ../app && npm run build)
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = fileURLToPath(new URL(".", import.meta.url));
const APP_DIST = join(here, "..", "..", "app", "dist");
const OUT = join(here, "..", "src", "assets");

const LOCALES = ["en", "ru", "es", "pt", "fr", "de", "pl", "it", "ar", "zh"];
const THEMES = ["light", "dark"];

// Размер окна приложения по умолчанию (tauri.conf.json) и множитель Retina:
// 1180×760 @2x = 2360×1520, ровно как у снимков, которые лежали до этого.
const WIDTH = 1180;
const HEIGHT = 760;
const SCALE = 2;

if (!existsSync(join(APP_DIST, "index.html"))) {
  console.error(`нет собранного фронтенда в ${APP_DIST}`);
  console.error("сначала: cd app && npm run build");
  process.exit(1);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".png": "image/png",
  ".json": "application/json; charset=utf-8",
};

// Свой статический сервер, а не `vite dev`: снимаем ровно тот бандл, который
// уезжает в поставку, без подстановок и оверлеев режима разработки.
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const rel = normalize(path === "/" ? "/index.html" : path).replace(/^(\.\.[/\\])+/, "");
  const file = join(APP_DIST, rel);
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/`;

/**
 * Подставной Tauri IPC. Возвращает ровно то, что нужно пустому главному экрану:
 * очередь без задач, рецепты не нужны (список появляется только когда на доске
 * есть файл), обновлений нет — иначе поверх кадра встала бы полоса «вышла
 * версия», которой на снимке быть не должно.
 *
 * Неизвестная команда отвечает null, а не падает: любой вызов, о котором я не
 * подумал, тогда просто ничего не меняет на экране — вместо необработанного
 * промиса, который снял бы половину интерфейса.
 */
function tauriStub(locale, theme, version) {
  return `
    const CANNED = {
      "recipes": [],
      "jobs": [],
      "models_list": [],
      "settings_get": {
        language: ${JSON.stringify(locale)},
        theme: ${JSON.stringify(theme)},
        output_mode: "beside",
        output_dir: null,
        notifications: true,
        ffmpeg_workers: 1,
      },
      "system_locale": ${JSON.stringify(locale)},
      "platform_info": "macos aarch64",
      "plugin:app|version": ${JSON.stringify(version)},
      "plugin:updater|check": null,
    };
    window.__TAURI_INTERNALS__ = {
      invoke: (cmd) => Promise.resolve(cmd in CANNED ? CANNED[cmd] : null),
      transformCallback: (cb) => { const id = Math.random(); window[id] = cb; return id; },
      unregisterCallback: () => {},
      convertFileSrc: (p) => p,
      // Не пустышка: getCurrentWindow()/getCurrentWebview() читают отсюда label,
      // и без него подписка на события падает с «reading 'label'» — а падает она
      // в App на монтировании, то есть интерфейс не отрисовывается вообще.
      // Имя окна — то же, что в tauri.conf.json.
      metadata: {
        currentWindow: { label: "main" },
        currentWebview: { label: "main" },
      },
    };
    // index.html читает это до первой отрисовки, чтобы не мигнуть чужой темой.
    try { localStorage.setItem("mc-theme", ${JSON.stringify(theme)}); } catch {}
  `;
}

const version = JSON.parse(
  await readFile(join(here, "..", "..", "app", "src-tauri", "tauri.conf.json"), "utf8"),
).version;

const browser = await chromium.launch();
let made = 0;
try {
  for (const locale of LOCALES) {
    for (const theme of THEMES) {
      const context = await browser.newContext({
        viewport: { width: WIDTH, height: HEIGHT },
        deviceScaleFactor: SCALE,
        colorScheme: theme,
      });
      await context.addInitScript(tauriStub(locale, theme, version));
      const page = await context.newPage();
      await page.goto(base, { waitUntil: "load" });
      // Ждём не таймер, а сам интерфейс: приглашение положить файл появляется
      // после того, как локаль доехала из подставного settings_get.
      await page.waitForSelector("main h1", { timeout: 15000 });
      await page.waitForFunction(
        () => document.documentElement.lang && document.fonts.status === "loaded",
        null,
        { timeout: 15000 },
      );
      const out = join(OUT, `app-main-${locale}-${theme}.png`);
      await page.screenshot({ path: out });
      const lang = await page.evaluate(() => document.documentElement.lang);
      const dir = await page.evaluate(() => document.documentElement.dir);
      const title = await page.textContent("main h1");
      console.log(`${locale}/${theme}: lang=${lang} dir=${dir || "ltr"} «${title?.trim()}»`);
      made += 1;
      await context.close();
    }
  }
} finally {
  await browser.close();
  server.close();
}

console.log(`\nготово: ${made} кадров в site/src/assets/`);
