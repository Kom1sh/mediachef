/**
 * Пингует IndexNow списком страниц после выкладки.
 *
 * Зачем: BingBot заходил на сайт раз в сутки, и в индекс Bing (а через него —
 * в выдачу ассистентов) новые страницы попадали месяцами. IndexNow переворачивает
 * схему: не робот приходит за изменениями, а мы сообщаем о них сами.
 *
 * Адреса берём из собранного dist/sitemap.xml, а не из ROUTES: карта сайта —
 * это ровно то, что уехало в выкладку, и она не может разойтись со сборкой.
 *
 * Эндпоинт общий (api.indexnow.org): он раздаёт пинг всем участникам протокола
 * сразу — Bing, Yandex, Seznam, Naver, — вместо того чтобы дёргать каждого.
 * Яндекс здесь особенно кстати: фавиконку и страницы он подхватывает неспешно.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HOST = "mediachef.app";
const KEY = "bb9de52571b69f7d30e45a28b9c4b289";
const ENDPOINT = "https://api.indexnow.org/indexnow";

const here = dirname(fileURLToPath(import.meta.url));
const sitemap = join(here, "..", "dist", "sitemap.xml");

const xml = await readFile(sitemap, "utf8").catch(() => {
  console.error(`IndexNow: нет ${sitemap} — сначала сборка, потом пинг.`);
  process.exit(1);
});

const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (urlList.length === 0) {
  console.error("IndexNow: в sitemap.xml нет ни одного <loc> — пинговать нечем.");
  process.exit(1);
}

const res = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList,
  }),
});

// 200 — приняли, 202 — приняли, ключ проверят позже. Остальное разбираем:
// 403 — ключ не читается по keyLocation, 422 — адреса не с этого хоста,
// 429 — слишком часто. Ни один из них не должен пройти молча.
const body = await res.text();
if (res.status === 200 || res.status === 202) {
  console.log(`IndexNow: отправлено ${urlList.length} адресов, ответ ${res.status}.`);
} else {
  console.error(`IndexNow: ответ ${res.status}. ${body.slice(0, 300)}`);
  process.exit(1);
}
