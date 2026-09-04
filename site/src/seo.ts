// Сборщики JSON-LD. Ни одного выдуманного факта: версия, движки, лицензия и
// вопросы приходят из content.ts, а вопросы совпадают с видимым FAQ страницы.
import { SITE, LINKS, FACTS, FEEDBACK_EMAIL, LOCALES, T, type Locale } from "./content";
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
      // Языки, на которых письмо действительно прочтут, а не все десять локалей
      // сайта: обещать поддержку на арабском мы не можем.
      availableLanguage: ["en", "ru"],
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
    publisher: { "@id": ORG_ID },
  };
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
export function itemListLd(items: readonly { name: string; description: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
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
