// Сборщики JSON-LD. Ни одного выдуманного факта: версия, движки, лицензия и
// вопросы приходят из content.ts, а вопросы совпадают с видимым FAQ страницы.
import { SITE, LINKS, FACTS, FEEDBACK_EMAIL, LOCALES, T, type Locale } from "./content";
import { SECTIONS } from "./recipes";
import { SHOTS } from "./shots";

const ORG_ID = `${SITE}/#organization`;
const APP_ID = `${SITE}/#app`;

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: "MediaChef",
    url: `${SITE}/`,
    logo: {
      "@type": "ImageObject",
      url: `${SITE}/logo.png`,
      width: 512,
      height: 512,
    },
    // Адрес и в `email`, и в contactPoint: первое поле читают ассистенты и
    // агрегаторы, второе — то, из чего Google собирает контакты организации.
    // Оба указывают на один ящик, так что разойтись не могут.
    email: FEEDBACK_EMAIL,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: FEEDBACK_EMAIL,
      url: `${SITE}/`,
      // Все десять языков сайта, а не только два. Прежде здесь стояло
      // `["en", "ru"]` с оговоркой «обещать поддержку на арабском мы не можем»,
      // и это устарело: письмо на любом языке мы принимаем и отвечаем через
      // переводчик — так и написано в заметках к выпуску. Схема, утверждавшая
      // обратное, отговаривала писать восемь языков из десяти.
      availableLanguage: [...LOCALES],
    },
    sameAs: [LINKS.github],
  };
}

export function softwareApplicationLd(locale: Locale, pageUrl: string) {
  const t = T[locale];
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": APP_ID,
    name: "MediaChef",
    softwareVersion: FACTS.version,
    operatingSystem: "macOS, Windows, Linux",
    applicationCategory: "MultimediaApplication",
    description: t.description,
    url: pageUrl,
    downloadUrl: LINKS.releases,
    installUrl: LINKS.releases,
    // Снимок той локали, чью страницу описываем: в schema.org уходит один
    // адрес, и он должен показывать интерфейс на языке этой страницы.
    screenshot: `${SITE}${SHOTS[locale].light}`,
    license: "https://www.gnu.org/licenses/gpl-3.0.html",
    // Все десять локалей интерфейса, а не две: до этого схема утверждала, что
    // программа только на английском и русском, хотя переведена целиком.
    inLanguage: [...LOCALES],
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    // Что программа умеет — списком, из того же каталога рецептов, который
    // рисует страница. Не рекламные формулировки, а названия задач на языке
    // страницы: ассистент, которого спросили «а умеет ли она обрезать видео»,
    // получает ответ из разметки, не разбирая вёрстку.
    //
    // `aggregateRating` здесь сознательно НЕТ и не будет, пока не появятся
    // настоящие отзывы: рейтинг в разметке без отзывов — фальсификация и
    // прямое нарушение правил Google, а не «дополнение разметки».
    featureList: SECTIONS.flatMap((sec) => sec.recipes.map((r) => r.title(locale))),
    publisher: { "@id": ORG_ID },
  };
}

/**
 * Разметка главной: сама страница и машиночитаемая карта её разделов.
 *
 * Главная была самой бедной страницей сайта — три схемы против шести у
 * гайдов, — и при этом единственной, которую ChatGPT читает: сорок с лишним
 * обращений в сутки, все на неё. Здесь исправляется именно это.
 *
 * `WebPage`, а не `Article`: главная — страница продукта, а не разбор темы, и
 * называть её статьёй было бы неправдой ради поля `articleBody`. Полный текст
 * лежит в `text` — это то же свойство `CreativeWork`, только под своим именем.
 *
 * `mainEntity` указывает на приложение: страница о нём, и связь стоит назвать
 * прямо, а не оставлять её на догадку читающего.
 */
/**
 * Сайт как целое: к нему относятся все страницы. Описан отдельной функцией, а
 * не скопирован в каждую разметку, чтобы `@id` совпадал буква в букву — на
 * несовпадении узлы просто перестают склеиваться, и об этом никто не сообщит.
 */
function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": `${SITE}/#website`,
    name: "MediaChef",
    url: `${SITE}/`,
    inLanguage: [...LOCALES],
    publisher: { "@id": ORG_ID },
  };
}

export function homePageLd(opts: {
  locale: Locale;
  url: string;
  name: string;
  description: string;
  body: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": opts.url,
    url: opts.url,
    name: opts.name,
    description: opts.description,
    inLanguage: opts.locale,
    isPartOf: websiteNode(),
    mainEntity: { "@id": APP_ID },
    primaryImageOfPage: { "@type": "ImageObject", url: `${SITE}/og.png` },
    dateModified: FACTS.updated,
    text: opts.body,
  };
}

/**
 * Каталог как страница-коллекция вместе с полным текстом.
 *
 * `CollectionPage`, а не `WebPage`: у schema.org это ровно «страница,
 * представляющая набор элементов», чем каталог и является. Сам набор —
 * `ItemList` рядом, и `mainEntity` указывает на него по адресу: иначе
 * читающему приходится догадываться, что список на странице и есть её
 * содержимое, а не врезка сбоку.
 *
 * `text` появился по той же причине, что и на главной. У каталога в разметке
 * лежали только названия и описания рецептов, а половина фактуры страницы —
 * что рецепт принимает, что отдаёт, какие у него настройки, какими словами он
 * ищется — не лежала нигде, кроме вёрстки. Спрашивающему «а можно ли из видео
 * получить WebVTT» отвечать было нечем.
 */
export function catalogPageLd(opts: {
  locale: Locale;
  url: string;
  name: string;
  description: string;
  body: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": opts.url,
    url: opts.url,
    name: opts.name,
    description: opts.description,
    inLanguage: opts.locale,
    isPartOf: websiteNode(),
    about: { "@id": APP_ID },
    mainEntity: { "@id": `${opts.url}#recipes` },
    primaryImageOfPage: { "@type": "ImageObject", url: `${SITE}/og.png` },
    dateModified: FACTS.updated,
    text: opts.body,
  };
}

/**
 * Плоский текст каталога. Порядок тот же, что на странице: заголовок, лид,
 * затем разделы и карточки внутри них.
 *
 * Подписи берутся со страницы («Принимает», «Отдаёт», «Ищется как»), а не
 * пишутся здесь по-английски: текст должен читаться на языке страницы, иначе
 * русская разметка отвечает вперемешку с английской.
 */
export function catalogBody(
  c: {
    h1: string;
    lead: string;
    accepts: string;
    produces: string;
    settings: string;
    noParams: string;
    searchAs: string;
    ctaTitle: string;
    ctaSub: string;
  },
  groups: readonly {
    label: string;
    recipes: readonly {
      title: string;
      description: string;
      accepts: string;
      ext: string;
      settings: readonly string[];
      aliases: readonly string[];
    }[];
  }[],
): string {
  const card = (r: (typeof groups)[number]["recipes"][number]) => {
    const facts = [
      `${c.accepts}: ${r.accepts}`,
      `${c.produces}: .${r.ext}`,
      `${c.settings}: ${r.settings.length ? r.settings.join("; ") : c.noParams}`,
    ];
    if (r.aliases.length) facts.push(`${c.searchAs}: ${r.aliases.join(", ")}`);
    return `${r.title} — ${r.description} ${facts.join(". ")}.`;
  };
  return [
    c.h1,
    c.lead,
    ...groups.map((g) => [g.label, ...g.recipes.map(card)].join("\n")),
    c.ctaTitle,
    c.ctaSub,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Список страниц сайта с адресами — та же карта, что и ссылки в теле, только
 * машиночитаемая.
 *
 * Отдельно от [`itemListLd`], который описывает рецепты внутри каталога и
 * адресов не имеет: там перечисляются возможности программы, здесь — страницы,
 * куда можно пойти. Смешивать их значило бы отдать читающему список, половина
 * которого никуда не ведёт.
 */
export function pageListLd(items: readonly { name: string; url: string; description: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${SITE}/#pages`,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      url: it.url,
      item: { "@type": "WebPage", "@id": it.url, name: it.name, description: it.description },
    })),
  };
}

/**
 * Плоский текст главной для `WebPage.text`. Порядок тот же, что на странице:
 * заголовок, подзаголовок, шаги, плитки задач, таблица форматов, модели, FAQ.
 */
export function homeBody(t: {
  heroTitle1: string;
  heroTitle2: string;
  heroAccent: string;
  heroSub: string;
  trust: readonly string[];
  howTitle: string;
  steps: readonly { h: string; p: string }[];
  recipesTitle: string;
  recipesLead: string;
  recipes: readonly { h: string; p: string }[];
  outTitle: string;
  outLead: string;
  outHead: readonly string[];
  outRows: readonly (readonly string[])[];
  trTitle: string;
  trBullets: readonly { h: string; p: string }[];
  faqTitle: string;
  faq: readonly { q: string; a: string }[];
}): string {
  const parts: string[] = [
    [t.heroTitle1, t.heroAccent, t.heroTitle2].filter(Boolean).join(" "),
    t.heroSub,
    t.trust.join("\n"),
    t.howTitle,
    t.steps.map((s, i) => `${i + 1}. ${s.h} — ${s.p}`).join("\n"),
    t.recipesTitle,
    t.recipesLead,
    t.recipes.map((r) => `${r.h} — ${r.p}`).join("\n"),
    t.outTitle,
    t.outLead,
    // Таблица разворачивается парами «шапка: значение», как у гайдов: так
    // число не отрывается от своей подписи при пересказе.
    t.outRows
      .map((r) => r.map((cell, i) => `${t.outHead[i]}: ${String(cell).replace(/<[^>]+>/g, "")}`).join("; "))
      .join("\n"),
    t.trTitle,
    t.trBullets.map((b) => `${b.h} ${b.p}`).join("\n"),
    t.faqTitle,
    t.faq.map((f) => `${f.q}\n${f.a}`).join("\n\n"),
  ];
  return parts.filter(Boolean).join("\n\n");
}

export function faqLd(items: readonly { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function breadcrumbLd(home: { name: string; url: string }, current: { name: string; url: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: home.name, item: home.url },
      { "@type": "ListItem", position: 2, name: current.name, item: current.url },
    ],
  };
}

/**
 * Каталог рецептов как перечень. Элементы — просто имя и описание, без url:
 * у рецепта нет отдельной страницы, он живёт секцией внутри каталога, и
 * выдумывать ему адрес значило бы обещать поисковику несуществующую цель.
 */
export function itemListLd(
  items: readonly { name: string; description: string }[],
  id?: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    // Адрес нужен, только если на список кто-то ссылается: у каталога это
    // делает `CollectionPage.mainEntity`.
    ...(id ? { "@id": id } : {}),
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      description: it.description,
    })),
  };
}

/**
 * Гайд как статья, вместе с полным текстом в `articleBody`.
 *
 * Зачем дублировать текст в разметку. Ассистенты забирают страницу по-разному:
 * часть просит markdown через content negotiation, часть берёт HTML как есть,
 * а ChatGPT не исполняет JS вообще. `articleBody` — способ отдать всем один
 * и тот же чистый текст без вёрстки, независимо от того, как страницу тянут;
 * приём проверен на живом кейсе, где им заменили markdown-отдачу.
 *
 * Текст собирается из тех же полей, что рисуются на странице, а не пишется
 * отдельно: разойтись они тогда не могут. Дублирование видимого текста —
 * не скрытый контент: это ровно то, что человек видит глазами.
 *
 * `dateModified` двигается вместе с FACTS.updated, который правится руками при
 * правке текстов. Дата, которая не двигается при реальных изменениях, — частая
 * и бессмысленная ошибка: свежесть влияет на цитируемость, но только настоящая.
 */
export function guideArticleLd(opts: {
  locale: Locale;
  url: string;
  headline: string;
  description: string;
  body: string;
  imageUrl: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `${opts.url}#article`,
    headline: opts.headline,
    description: opts.description,
    inLanguage: opts.locale,
    url: opts.url,
    mainEntityOfPage: { "@type": "WebPage", "@id": opts.url },
    datePublished: FACTS.updated,
    dateModified: FACTS.updated,
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    image: opts.imageUrl,
    about: { "@id": APP_ID },
    articleBody: opts.body,
  };
}

/**
 * Плоский текст гайда для `articleBody`. Порядок тот же, что на странице:
 * ответ, шаги, таблицы, ограничения, вопросы — чтобы пересказ по этому тексту
 * начинался с того же, с чего начинается страница.
 */
export function guideBody(g: {
  h1: string;
  answer: string;
  facts: readonly { k: string; v: string }[];
  stepsTitle: string;
  steps: readonly { h: string; p: string }[];
  tables: readonly {
    title: string;
    lead: string;
    head: readonly string[];
    rows: readonly (readonly string[])[];
    note?: string;
  }[];
  whyTitle: string;
  whyBullets: readonly { h: string; p: string }[];
  notForTitle: string;
  notForLead: string;
  notFor: readonly { h: string; p: string }[];
  faqTitle: string;
  faq: readonly { q: string; a: string }[];
}): string {
  const parts: string[] = [g.h1, g.answer];

  parts.push(g.facts.map((f) => `${f.k}: ${f.v}`).join("\n"));

  parts.push(g.stepsTitle);
  parts.push(g.steps.map((s, i) => `${i + 1}. ${s.h} — ${s.p}`).join("\n"));

  for (const t of g.tables) {
    parts.push(t.title);
    parts.push(t.lead);
    // Таблица разворачивается в строки «шапка: значение»: так пара
    // «столбец — число» остаётся связанной и после пересказа.
    parts.push(
      t.rows
        .map((r) => r.map((cell, i) => `${t.head[i]}: ${cell}`).join("; "))
        .join("\n"),
    );
    if (t.note) parts.push(t.note);
  }

  parts.push(g.whyTitle);
  parts.push(g.whyBullets.map((b) => `${b.h} ${b.p}`).join("\n"));

  parts.push(g.notForTitle, g.notForLead);
  parts.push(g.notFor.map((b) => `${b.h} ${b.p}`).join("\n"));

  parts.push(g.faqTitle);
  parts.push(g.faq.map((f) => `${f.q}\n${f.a}`).join("\n\n"));

  return parts.join("\n\n");
}

/**
 * Плоский текст посадочной для `articleBody`.
 *
 * Отдельно от [`guideBody`], потому что раскладка другая: у посадочной одна
 * таблица плоскими ключами, нет блока фактов и нет раздела «когда не надо».
 * Свести их в одну функцию значило бы принимать половину полей как
 * необязательные и внутри разбираться, что именно пришло, — то есть спрятать
 * два разных типа страниц под один и тот же неочевидный интерфейс.
 *
 * Порядок тот же, что на странице: заголовок, вводный абзац, образец
 * результата, шаги, таблица, доводы, вопросы.
 */
export function intentBody(l: {
  h1: string;
  lead: string;
  outLabel?: string;
  outSample?: string;
  outNote?: string;
  stepsTitle: string;
  steps: readonly { h: string; p: string }[];
  tableTitle: string;
  tableLead: string;
  tableHead: readonly string[];
  tableRows: readonly (readonly string[])[];
  tableNote: string;
  whyTitle: string;
  whyBullets: readonly { h: string; p: string }[];
  faqTitle: string;
  faq: readonly { q: string; a: string }[];
}): string {
  const parts: string[] = [l.h1, l.lead];

  // Образец результата — то, за чем на страницу и приходят: готовая
  // расшифровка. Есть он не у всех посадочных.
  if (l.outSample) {
    parts.push([l.outLabel, l.outSample, l.outNote].filter(Boolean).join("\n"));
  }

  parts.push(l.stepsTitle);
  parts.push(l.steps.map((st, i) => `${i + 1}. ${st.h} — ${st.p}`).join("\n"));

  parts.push(l.tableTitle, l.tableLead);
  // Как и у гайдов: строка разворачивается в пары «шапка: значение», чтобы
  // число не отрывалось от своей подписи при пересказе.
  parts.push(
    l.tableRows
      .map((r) => r.map((cell, i) => `${l.tableHead[i]}: ${cell}`).join("; "))
      .join("\n"),
  );
  if (l.tableNote) parts.push(l.tableNote);

  parts.push(l.whyTitle);
  parts.push(l.whyBullets.map((b) => `${b.h} ${b.p}`).join("\n"));

  parts.push(l.faqTitle);
  parts.push(l.faq.map((f) => `${f.q}\n${f.a}`).join("\n\n"));

  return parts.join("\n\n");
}

export function howToLd(opts: {
  name: string;
  description: string;
  url: string;
  steps: readonly { h: string; p: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: opts.name,
    description: opts.description,
    tool: { "@id": APP_ID },
    step: opts.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.h,
      text: s.p,
      url: `${opts.url}#how`,
    })),
  };
}
