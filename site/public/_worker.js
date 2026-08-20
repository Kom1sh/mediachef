// Cloudflare Pages, advanced mode: этот файл копируется в dist/ и Pages
// запускает его вместо статической раздачи «как есть».
//
// Две задачи:
//  1. Корень «/» отдаёт 302 на /en/ или /ru/ по Accept-Language браузера.
//     302, а не 301: ответ зависит от заголовка, поэтому кешировать его нельзя
//     (отсюда Vary + no-store). Бот без Accept-Language уезжает на /en/.
//  2. Заголовки безопасности и кеширования навешиваются здесь же: в advanced
//     mode файл _headers может не применяться, а терять их не хочется.
//     public/_headers оставлен как дубль для обычного режима — значения те же.

const SECURITY = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
};

// Статусы, у которых тела быть не может: такой ответ переупаковывать нельзя.
const NULL_BODY = new Set([101, 204, 205, 304]);

// Языки сайта. Список продублирован здесь намеренно: _worker.js едет в dist
// как есть и ничего не импортирует. Добавили локаль в content.ts — допишите
// сюда, иначе корень будет отправлять её носителей на английский.
// Порядок = приоритет при равном качестве совпадения.
const SUPPORTED = ["en", "ru", "es", "pt", "fr", "de", "pl", "it", "ar", "zh"];
const DEFAULT_LOCALE = "en";

/**
 * Какой язык просит браузер. Смотрим не «есть ли ru где-нибудь в строке», а
 * весь список по убыванию q: у `en-GB,ru;q=0.7` человек всё-таки просит
 * английский. Совпадение по основному субтегу, поэтому pt-BR уходит на pt,
 * а zh-Hans — на zh. Пустой или битый заголовок (боты) — язык по умолчанию.
 */
function pickLocale(header) {
  if (!header) return DEFAULT_LOCALE;
  const wanted = header
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const weight = q ? Number.parseFloat(q.slice(2)) : 1;
      return { tag: tag.trim().toLowerCase(), q: Number.isFinite(weight) ? weight : 0, index };
    })
    .filter((lang) => lang.tag && lang.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);

  for (const lang of wanted) {
    if (lang.tag === "*") return DEFAULT_LOCALE;
    const primary = lang.tag.split("-")[0];
    const hit = SUPPORTED.find((l) => l === primary);
    if (hit) return hit;
  }
  return DEFAULT_LOCALE;
}

function cacheControlFor(pathname) {
  // Файлы из /_astro/ — с хешем в имени, живут вечно.
  if (pathname.startsWith("/_astro/")) return "public, max-age=31536000, immutable";
  if (/\.(png|jpe?g|svg|webp|avif|ico|woff2?)$/i.test(pathname)) return "public, max-age=86400";
  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      const locale = pickLocale(request.headers.get("accept-language"));
      const target = new URL(`/${locale}/` + url.search, url);
      return new Response(null, {
        status: 302,
        headers: {
          location: target.toString(),
          vary: "accept-language",
          "cache-control": "no-store",
          ...SECURITY,
        },
      });
    }

    const asset = await env.ASSETS.fetch(request);
    if (NULL_BODY.has(asset.status)) return asset;

    // Заголовки ответа ASSETS иммутабельны — правим копию.
    const out = new Response(asset.body, asset);
    for (const [name, value] of Object.entries(SECURITY)) out.headers.set(name, value);
    const cc = cacheControlFor(url.pathname);
    if (cc) out.headers.set("cache-control", cc);
    return out;
  },
};
