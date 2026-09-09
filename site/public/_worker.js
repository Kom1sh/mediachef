// Cloudflare Pages, advanced mode: этот файл копируется в dist/ и Pages
// запускает его вместо статической раздачи «как есть».
//
// Три задачи:
//  1. Корень «/» отдаёт 302 на /en/ или /ru/ по Accept-Language браузера.
//     302, а не 301: ответ зависит от заголовка, поэтому кешировать его нельзя
//     (отсюда Vary + no-store). Бот без Accept-Language уезжает на /en/.
//  2. Заголовки безопасности и кеширования навешиваются здесь же: в advanced
//     mode файл _headers может не применяться, а терять их не хочется.
//     public/_headers оставлен как дубль для обычного режима — значения те же.
//  3. Заходы роботов пишутся в D1 (`env.CRAWLERS`). Зачем не хватило готовой
//     аналитики: панель Cloudflare показывает роботов сводкой — сколько раз
//     приходил GPTBot, — но не отвечает на вопрос «что именно он забрал и с
//     каким кодом». Здесь пишется строка на запрос: кто, когда, что, в каком
//     формате, с каким статусом и из какой сети.
//
//  4. Приём формы обратной связи: POST на страницу формы пишет сообщение в ту
//     же базу D1. Единственный путь наружу у сайта, и он ручной — человек
//     нажимает «отправить» сам.
//
// Плюс мелочь, выросшая из журнала: на HTML-ответы вешается заголовок `Link`
// с указателем на llms.txt — см. ниже.

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

// Слаги страницы обратной связи по локалям и подписи страницы «спасибо».
// Продублированы здесь по той же причине, что список языков: `_worker.js`
// уезжает в dist как есть и ничего не импортирует. Поменяли слаг в
// `content.ts` — поправьте и тут, иначе отправка формы начнёт отдавать 404.
const FEEDBACK = {
  en: { slug: "feedback", thanks: "Thank you — the message arrived.", body: "We will read it. If you left an address, we will reply to it." },
  ru: { slug: "obratnaya-svyaz", thanks: "Спасибо — сообщение дошло.", body: "Мы его прочитаем. Если вы оставили адрес, ответим на него." },
  es: { slug: "contacto", thanks: "Gracias: el mensaje ha llegado.", body: "Lo leeremos. Si dejaste una dirección, te responderemos a ella." },
  pt: { slug: "contato", thanks: "Obrigado — a mensagem chegou.", body: "Vamos ler. Se você deixou um endereço, responderemos nele." },
  fr: { slug: "contact", thanks: "Merci — le message est arrivé.", body: "Nous le lirons. Si vous avez laissé une adresse, nous y répondrons." },
  de: { slug: "kontakt", thanks: "Danke — die Nachricht ist angekommen.", body: "Wir lesen sie. Wenn Sie eine Adresse hinterlassen haben, antworten wir darauf." },
  pl: { slug: "kontakt", thanks: "Dziękujemy — wiadomość dotarła.", body: "Przeczytamy ją. Jeśli zostawiłeś adres, odpowiemy na niego." },
  it: { slug: "contatti", thanks: "Grazie — il messaggio è arrivato.", body: "Lo leggeremo. Se hai lasciato un indirizzo, ti risponderemo lì." },
  ar: { slug: "tawasul", thanks: "شكراً — وصلت الرسالة.", body: "سنقرأها. وإن تركت عنواناً فسنجيبك عليه." },
  zh: { slug: "fankui", thanks: "谢谢——消息已收到。", body: "我们会读。如果你留了地址，我们会回复到那里。" },
};

/** Локаль, если путь — это страница обратной связи; иначе `null`. */
function feedbackLocale(pathname) {
  const m = pathname.match(/^\/([a-z]{2})\/([^/]+)\/$/);
  if (!m) return null;
  const [, loc, slug] = m;
  return FEEDBACK[loc]?.slug === slug ? loc : null;
}

/** Экранирование для вставки в HTML страницы «спасибо». */
function esc(x) {
  return String(x).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

/**
 * Принимает форму и пишет сообщение в базу.
 *
 * Отвечает страницей «спасибо», а не редиректом: страница формы статическая и
 * про успешную отправку ничего не знает, а показать результат человеку надо.
 *
 * Ошибку записи здесь проглатывать НЕЛЬЗЯ — в отличие от журнала роботов. Если
 * сообщение не сохранилось, человек обязан об этом узнать и написать письмом:
 * молчаливое «спасибо» на потерянное сообщение — худшее из возможных
 * поведений для канала, который и создан затем, чтобы о поломках узнавали.
 */
async function takeFeedback(request, env, locale) {
  const t = FEEDBACK[locale] ?? FEEDBACK.en;
  const url = new URL(request.url);

  let form;
  try {
    form = await request.formData();
  } catch {
    return new Response("bad form", { status: 400 });
  }

  const message = (form.get("message") || "").toString().trim();
  const contact = (form.get("contact") || "").toString().trim().slice(0, 200);
  const kindRaw = (form.get("kind") || "").toString();
  const kind = kindRaw === "idea" ? "idea" : "bug";
  const trap = (form.get("website") || "").toString().trim();

  // Ловушка сработала — робот. Отвечаем как при успехе: сообщать роботу, что
  // его раскусили, значит помогать его следующей попытке.
  if (trap) return thanksPage(t, locale);

  if (message.length < 10 || message.length > 4000) {
    return new Response("message too short or too long", { status: 400 });
  }
  if (!env.CRAWLERS) {
    return new Response("storage unavailable", { status: 503 });
  }

  // Простой предохранитель от потока: двадцать сообщений в час — заведомо
  // больше того, что бывает у живого канала такого размера, и заведомо меньше
  // того, чем способен завалить базу скрипт.
  try {
    const hour = Date.now() - 60 * 60 * 1000;
    const { results } = await env.CRAWLERS.prepare(
      "SELECT COUNT(*) AS n FROM feedback WHERE at > ?",
    )
      .bind(hour)
      .all();
    if ((results?.[0]?.n ?? 0) >= 20) {
      return new Response("too many messages, try later", { status: 429 });
    }
  } catch {
    // Не смогли посчитать — не повод отказать человеку в отправке.
  }

  try {
    await env.CRAWLERS.prepare(
      "INSERT INTO feedback (at, kind, message, contact, version, platform, locale, context)" +
        " VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(
        Date.now(),
        kind,
        message,
        contact || null,
        (url.searchParams.get("v") || "").slice(0, 40) || null,
        (url.searchParams.get("os") || "").slice(0, 80) || null,
        locale,
        (url.searchParams.get("ctx") || "").slice(0, 200) || null,
      )
      .run();
  } catch (e) {
    console.error("feedback: не записали сообщение:", e?.message || String(e));
    return new Response("could not save the message", { status: 500 });
  }

  return thanksPage(t, locale);
}

/** Страница «спасибо»: минимальная, в стиле сайта, со ссылкой назад. */
function thanksPage(t, locale) {
  const dir = locale === "ar" ? ' dir="rtl"' : "";
  const html = `<!doctype html>
<html lang="${locale}"${dir}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, follow">
<title>${esc(t.thanks)}</title>
<style>
  :root { color-scheme: light dark; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center;
         font: 16px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
         padding: 24px; text-align: center; }
  h1 { font-size: 1.4rem; margin: 0 0 10px; }
  p { margin: 0 0 20px; opacity: 0.75; }
  a { color: inherit; font-weight: 700; }
</style>
</head>
<body>
  <div>
    <h1>${esc(t.thanks)}</h1>
    <p>${esc(t.body)}</p>
    <a href="/${locale}/">MediaChef</a>
  </div>
</body>
</html>
`;
  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      ...SECURITY,
    },
  });
}

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

// Известные роботы: [подстрока User-Agent в нижнем регистре, имя для журнала].
// Порядок значим — первое совпадение выигрывает, поэтому частные случаи стоят
// раньше общих: «claudebot» до «claude», «bingbot» до «bing», «googlebot» до
// «google». ИИ-роботы идут первыми не для приоритета, а чтобы список читался
// по назначению.
const BOTS = [
  // ИИ: обучение, поиск ассистентов, переходы по ссылке из ответа.
  ["gptbot", "GPTBot"],
  ["oai-searchbot", "OAI-SearchBot"],
  ["chatgpt-user", "ChatGPT-User"],
  ["claudebot", "ClaudeBot"],
  ["claude-searchbot", "Claude-SearchBot"],
  ["claude-user", "Claude-User"],
  ["anthropic-ai", "anthropic-ai"],
  ["perplexitybot", "PerplexityBot"],
  ["perplexity-user", "Perplexity-User"],
  ["google-extended", "Google-Extended"],
  ["googleother", "GoogleOther"],
  ["applebot-extended", "Applebot-Extended"],
  ["meta-externalagent", "meta-externalagent"],
  ["meta-externalfetcher", "meta-externalfetcher"],
  ["facebookbot", "FacebookBot"],
  ["bytespider", "Bytespider"],
  ["ccbot", "CCBot"],
  ["amazonbot", "Amazonbot"],
  ["duckassistbot", "DuckAssistBot"],
  ["mistralai-user", "MistralAI-User"],
  ["cohere-ai", "cohere-ai"],
  ["ai2bot", "Ai2Bot"],
  ["youbot", "YouBot"],
  ["diffbot", "Diffbot"],
  ["timpibot", "Timpibot"],
  ["omgilibot", "Omgilibot"],
  ["imagesiftbot", "ImagesiftBot"],
  ["pangubot", "PanguBot"],
  // Поисковые.
  ["googlebot", "Googlebot"],
  ["bingbot", "Bingbot"],
  ["yandexbot", "YandexBot"],
  ["yandex", "Yandex-other"],
  ["duckduckbot", "DuckDuckBot"],
  ["baiduspider", "Baiduspider"],
  ["applebot", "Applebot"],
  ["seznambot", "SeznamBot"],
  ["naver", "Naver"],
  ["petalbot", "PetalBot"],
  ["sogou", "Sogou"],
  ["slurp", "Yahoo-Slurp"],
  // Соцсети и мессенджеры — превью ссылок.
  //
  // `telegrambot` СТРОГО раньше `twitterbot`: Телеграм представляется как
  // «TelegramBot (like TwitterBot)», и при обратном порядке весь его трафик
  // записывается в Twitterbot. Так и было — поймали на живом журнале, когда
  // искали, почему превью не строится: Телеграма в отчётах не было вовсе, а
  // пять строк «Twitterbot» оказались его. Это общее свойство списка:
  // совпадение ищется подстрокой, поэтому частное имя всегда выше общего.
  ["facebookexternalhit", "facebookexternalhit"],
  ["telegrambot", "TelegramBot"],
  ["twitterbot", "Twitterbot"],
  ["linkedinbot", "LinkedInBot"],
  ["slackbot", "Slackbot"],
  ["discordbot", "Discordbot"],
  ["whatsapp", "WhatsApp"],
  ["redditbot", "redditbot"],
  ["vkshare", "VK"],
  // SEO-сканеры: трафика не приносят, но объясняют скачки в статистике.
  ["ahrefsbot", "AhrefsBot"],
  ["semrushbot", "SemrushBot"],
  ["mj12bot", "MJ12bot"],
  ["dotbot", "DotBot"],
  ["screaming frog", "ScreamingFrog"],
  ["dataforseo", "DataForSeo"],
  // Наши же проверки доступности и пинги.
  ["bingpreview", "BingPreview"],
  ["indexnow", "IndexNow"],
];

/**
 * Имя робота по User-Agent или `null`, если это похоже на человека.
 *
 * Два уровня. Сначала известные роботы по таблице выше — их имена нужны
 * ровно для того, чтобы группировка в отчётах не рассыпалась по версиям.
 * Потом общая примета (`bot`, `crawler`, `spider`) — новый робот попадёт в
 * журнал как «other» вместе с полным User-Agent, и его можно будет опознать
 * и добавить в таблицу. Пустой User-Agent — тоже «other»: у браузеров он
 * есть всегда.
 */
function botFrom(ua) {
  if (!ua) return "other";
  const low = ua.toLowerCase();
  for (const [needle, name] of BOTS) if (low.includes(needle)) return name;
  if (/bot\b|bot\/|crawler|spider|crawl;/.test(low)) return "other";
  return null;
}

/**
 * Пишет одну строку в журнал. Зовётся только через `ctx.waitUntil`: ответ
 * человеку (точнее, роботу) не должен ждать базу — и не должен падать вместе
 * с ней, поэтому ошибка здесь проглатывается. Журнал заходов — не та вещь,
 * ради которой можно отдать 500 на живой странице.
 *
 * Раз в двести записей заодно чистится хвост старше девяноста дней: жить
 * вечно этой таблице незачем, а отдельный планировщик ради уборки — это
 * второй воркер и второй конфиг.
 */
async function logHit(env, entry) {
  try {
    await env.CRAWLERS.prepare(
      "INSERT INTO hits (at, bot, method, path, status, type, asn, country, ua)" +
        " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(
        entry.at,
        entry.bot,
        entry.method,
        entry.path,
        entry.status,
        entry.type,
        entry.asn,
        entry.country,
        entry.ua,
      )
      .run();
    if (Math.random() < 0.005) {
      const cutoff = entry.at - 90 * 24 * 60 * 60 * 1000;
      await env.CRAWLERS.prepare("DELETE FROM hits WHERE at < ?").bind(cutoff).run();
    }
  } catch (e) {
    // Ответ роботу не должен ни ждать базу, ни падать вместе с ней — поэтому
    // проглатываем. Но не бесследно: строка видна в
    // `npx wrangler pages deployment tail`, иначе пустой журнал не отличить
    // от «роботы не заходили».
    console.error("crawlers: заход не записан:", e?.message || String(e));
  }
}

function cacheControlFor(pathname) {
  // Файлы из /_astro/ — с хешем в имени, живут вечно.
  if (pathname.startsWith("/_astro/")) return "public, max-age=31536000, immutable";
  if (/\.(png|jpe?g|svg|webp|avif|ico|woff2?)$/i.test(pathname)) return "public, max-age=86400";
  return null;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // Робота определяем один раз на запрос: User-Agent читается дважды —
    // для журнала редиректа и для журнала страницы.
    const ua = request.headers.get("user-agent") || "";
    const bot = botFrom(ua);
    // Журнал включается наличием привязки. Без неё (локальный `astro dev`,
    // чужая копия проекта) сайт работает ровно как раньше.
    if (bot && !env.CRAWLERS) {
      console.error("crawlers: привязки CRAWLERS нет — заходы роботов не пишутся");
    }
    const record = bot && env.CRAWLERS ? (status, type) => {
      ctx.waitUntil(
        logHit(env, {
          at: Date.now(),
          bot,
          method: request.method,
          // Без query: у роботов её не бывает, а группировку по страницам
          // она бы разнесла.
          path: url.pathname,
          status,
          type,
          // `cf` на бесплатном тарифе отдаёт ASN и страну — этого хватает,
          // чтобы поймать подделку User-Agent.
          asn: request.cf?.asn ?? null,
          country: request.cf?.country ?? null,
          ua,
        }),
      );
    } : null;

    // Форма обратной связи. Только POST: обычный переход по этому адресу
    // отдаёт статическую страницу, как и любая другая.
    if (request.method === "POST") {
      const fbLocale = feedbackLocale(url.pathname);
      if (fbLocale) return takeFeedback(request, env, fbLocale);
    }

    // Один стабильный адрес формы для приложения: `/feedback/?lang=ru&v=…`.
    // Слаги у локалей разные, и дублировать их карту ещё и в приложении —
    // значит однажды разойтись с сайтом. Приложение знает один адрес, а
    // раскладку по языкам делает тот, кто ей владеет.
    if (url.pathname === "/feedback" || url.pathname === "/feedback/") {
      const lang = url.searchParams.get("lang") || "";
      const loc = FEEDBACK[lang] ? lang : DEFAULT_LOCALE;
      const target = new URL(`/${loc}/${FEEDBACK[loc].slug}/`, url);
      // Параметры приложения переносим, кроме служебного `lang`.
      for (const [k, v] of url.searchParams) if (k !== "lang") target.searchParams.set(k, v);
      record?.(302, null);
      return new Response(null, {
        status: 302,
        headers: { location: target.toString(), "cache-control": "no-store", ...SECURITY },
      });
    }

    if (url.pathname === "/") {
      const locale = pickLocale(request.headers.get("accept-language"));
      const target = new URL(`/${locale}/` + url.search, url);
      // Редирект тоже в журнал: по нему видно, что робот пришёл на корень —
      // и на какой язык его увело.
      record?.(302, null);
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
    if (NULL_BODY.has(asset.status)) {
      record?.(asset.status, asset.headers.get("content-type"));
      return asset;
    }

    // Заголовки ответа ASSETS иммутабельны — правим копию.
    const out = new Response(asset.body, asset);
    for (const [name, value] of Object.entries(SECURITY)) out.headers.set(name, value);
    // Долгий кеш — только на успешный ответ. Раньше max-age вешался на любой,
    // включая 404, и это выстрелило: сразу после выкладки часть узлов ещё
    // отдаёт прошлую сборку, её 404 на новый файл получал `max-age=86400`
    // и залипал в кеше на сутки — свежий /favicon.ico был не виден никому,
    // включая роботов. Ошибку не кешируем вовсе: пусть следующий запрос
    // дойдёт до узла, который уже обновился.
    if (out.ok) {
      const cc = cacheControlFor(url.pathname);
      if (cc) out.headers.set("cache-control", cc);
    } else {
      out.headers.set("cache-control", "no-store");
    }
    // Указатель на llms.txt заголовком, а не только тегом в разметке: клиент,
    // который делает HEAD или читает заголовки, разметку не парсит. Спецификация
    // llmstxt.org предлагает ровно это отношение. Только на HTML: у картинок и
    // шрифтов описания нет.
    if (out.ok && (out.headers.get("content-type") || "").startsWith("text/html")) {
      out.headers.set("link", '</llms.txt>; rel="describedby"; type="text/plain"');
    }
    // После правки заголовков: в журнал уезжает то, что реально ушло роботу,
    // включая итоговый Content-Type.
    record?.(out.status, out.headers.get("content-type"));
    return out;
  },
};
