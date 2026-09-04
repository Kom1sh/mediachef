// Страницы-гайды: подробный разбор одной задачи, а не короткая посадочная.
//
// Отличие от LandingCopy не в объёме ради объёма. Форма собрана под то, что
// измеримо влияет на попадание в ответы ассистентов:
//
//  - `answer` — прямой ответ в первых ста словах. У девяти из десяти страниц,
//    которые движки цитируют чаще всего, ответ стоит именно там; 44% цитат
//    приходится на первые 30% страницы. Поэтому ответ идёт ДО шагов и таблиц,
//    а не после вступления «в этой статье мы разберём».
//  - `facts` — сводка «что нужно / сколько занимает / что получится» рядом
//    с ответом. Своя проверяемая цифра в тексте поднимает цитируемость сильнее
//    почти любой другой правки, а три и больше — заметно сильнее.
//  - `tables` — их несколько, и в них наши измерения, а не общие слова.
//    Табличные данные вытаскиваются из страницы дословно и переживают
//    пересказ лучше абзаца.
//  - `notFor` — раздел «когда не надо». Честное ограничение цитируют охотнее
//    похвалы, потому что оно отвечает на вопрос, который человек задаёт
//    следующим.
//  - `faq` — много конкретных пар вопрос-ответ, сформулированных так, как
//    спрашивают, а не как удобно писать.
//
// Формат один на все будущие гайды по рецептам: у каждого рецепта в
// recipes/*.yaml уже есть seo.slug и приоритет.
import gifEn from "./copy/gif/en";
import gifRu from "./copy/gif/ru";
import gifEs from "./copy/gif/es";
import gifPt from "./copy/gif/pt";
import gifFr from "./copy/gif/fr";
import gifDe from "./copy/gif/de";
import gifPl from "./copy/gif/pl";
import gifIt from "./copy/gif/it";
import gifAr from "./copy/gif/ar";
import gifZh from "./copy/gif/zh";
import compressEn from "./copy/compress/en";
import compressRu from "./copy/compress/ru";
import compressEs from "./copy/compress/es";
import compressPt from "./copy/compress/pt";
import compressFr from "./copy/compress/fr";
import compressDe from "./copy/compress/de";
import compressPl from "./copy/compress/pl";
import compressIt from "./copy/compress/it";
import compressAr from "./copy/compress/ar";
import compressZh from "./copy/compress/zh";
import { type Locale, type PageId } from "./content";

type Row = readonly string[];

export interface GuideTable {
  /** Идентификатор для якоря и содержания. */
  id: string;
  title: string;
  lead: string;
  head: Row;
  rows: readonly Row[];
  note?: string;
}

export interface GuideCopy {
  title: string;
  description: string;
  h1: string;
  crumb: string;

  /** Прямой ответ на запрос. Первое, что читает и человек, и машина. */
  answer: string;
  /** Сводка рядом с ответом: короткое имя факта и его значение. */
  facts: readonly { k: string; v: string }[];

  /** Содержание. `id` совпадает с id раздела или таблицы. */
  toc: readonly { id: string; label: string }[];

  stepsTitle: string;
  steps: readonly { h: string; p: string }[];
  shotAlt: string;
  shotCaption: string;

  tables: readonly GuideTable[];

  whyTitle: string;
  whyBullets: readonly { h: string; p: string }[];

  notForTitle: string;
  notForLead: string;
  notFor: readonly { h: string; p: string }[];

  faqTitle: string;
  faq: readonly { q: string; a: string }[];

  ctaTitle: string;
  ctaSub: string;
  also: readonly { page: PageId; label: string }[];
}

/** Идентификаторы гайдов. Растёт по одному на рецепт. */
export type GuideId = "gif" | "compress";

export const GUIDES: Record<GuideId, Record<Locale, GuideCopy>> = {
  gif: {
    en: gifEn,
    ru: gifRu,
    es: gifEs,
    pt: gifPt,
    fr: gifFr,
    de: gifDe,
    pl: gifPl,
    it: gifIt,
    ar: gifAr,
    zh: gifZh,
  },
  compress: {
    en: compressEn,
    ru: compressRu,
    es: compressEs,
    pt: compressPt,
    fr: compressFr,
    de: compressDe,
    pl: compressPl,
    it: compressIt,
    ar: compressAr,
    zh: compressZh,
  },
};

export const GUIDE_IDS = Object.keys(GUIDES) as GuideId[];
