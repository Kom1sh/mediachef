// Сборщики JSON-LD. Ни одного выдуманного факта: версия, движки, лицензия и
// вопросы приходят из content.ts, а вопросы совпадают с видимым FAQ страницы.
import { SITE, LINKS, FACTS, FEEDBACK_EMAIL, SHOT, T, type Locale } from "./content";

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
    screenshot: `${SITE}${SHOT.src}`,
    license: "https://www.gnu.org/licenses/gpl-3.0.html",
    inLanguage: ["en", "ru"],
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
