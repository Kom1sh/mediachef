// Реестр сайта: языки, маршруты и сборка текстов. Сами тексты лежат по одному
// файлу на язык в copy/<locale>.ts — здесь только структура.
//
// Добавить язык = написать copy/<locale>.ts, дописать строку в META и слаги
// в ROUTES. Дальше он сам появится в меню, в бургере, в подвале, в hreflang,
// в sitemap.xml и в роутах: всё считается из этой таблицы.
import en from "./copy/en";
import ru from "./copy/ru";
import shotLight from "./assets/app-main-light.png";
import shotDark from "./assets/app-main-dark.png";

export { SITE, LINKS, FACTS } from "./facts";

export type PageId = "home" | "mp3" | "transcribe";

/**
 * Языки с полным переводом. `name` — самоназвание: в переключателе язык
 * подписан на себе, иначе испанец ищет «Spanish» глазами по чужому алфавиту.
 * `flag` — ключ флажка в components/Flag.astro, `dir` — только для письма
 * справа налево.
 */
const META = {
  en: { lang: "en", ogLocale: "en_US", name: "English", flag: "gb" },
  ru: { lang: "ru", ogLocale: "ru_RU", name: "Русский", flag: "ru" },
} as const;

export type Locale = keyof typeof META;
export type LocaleMeta = { lang: string; ogLocale: string; name: string; flag: string; dir?: "rtl" };

export const LOCALE_META = META as Record<Locale, LocaleMeta>;
export const LOCALES = Object.keys(META) as Locale[];

/** Слаги по локалям: переключатель языка бьёт страницу в страницу, а не в главную. */
export const ROUTES: Record<PageId, Record<Locale, string>> = {
  home: { en: "", ru: "" },
  mp3: { en: "convert-mp4-to-mp3", ru: "mp4-v-mp3" },
  transcribe: { en: "transcribe-audio-to-text", ru: "transkribaciya-audio-v-tekst" },
};

/** Путь страницы внутри локали, всегда со слешем на конце. */
export function pathFor(page: PageId, locale: Locale): string {
  const slug = ROUTES[page][locale];
  return `/${locale}/${slug ? slug + "/" : ""}`;
}

/** Модели Whisper — id ровно как в app/core/src/models.rs. Размеры подписаны
 *  в текстах локали: разделитель и единицы у языков разные. */
export const MODELS = [
  { id: "tiny" },
  { id: "base" },
  { id: "small", isDefault: true },
  { id: "large-v3-turbo" },
] as const;

export type ModelId = (typeof MODELS)[number]["id"];

/**
 * Настоящее окно приложения, снятое с работающей сборки (2360×1520 = 1180×760 @2x).
 * Две темы: страница показывает ту, в которой сидит посетитель. В schema.org
 * уходит светлая — там нужен один адрес.
 *
 * Файлы лежат в src/assets, а не в public/: тогда в имя попадает хеш содержимого.
 * Из public/ они раздавались с max-age=86400 под неизменным именем, и после
 * пересъёмки Cloudflare сутки отдавал старую картинку.
 */
export const SHOT = {
  light: shotLight.src,
  dark: shotDark.src,
  src: shotLight.src,
  w: shotLight.width,
  h: shotLight.height,
};

type Row = readonly string[];

export interface LandingCopy {
  title: string;
  description: string;
  h1: string;
  crumb: string;
  lead: string;
  sections: { how: string; table: string; why: string; faq: string };
  toc: readonly string[];
  // Образец результата в hero — только там, где это РЕЗУЛЬТАТ работы программы
  // (готовый текст расшифровки). Строку запускаемой команды в hero не показываем:
  // страница продаёт приложение, а не то, что под ним лежит.
  outLabel?: string;
  outSample?: string;
  outNote?: string;
  stepsTitle: string;
  steps: readonly { h: string; p: string }[];
  shotAlt: string;
  shotCaption: string;
  tableTitle: string;
  tableLead: string;
  tableHead: Row;
  tableRows: readonly Row[];
  tableNote: string;
  whyTitle: string;
  whyBullets: readonly { h: string; p: string }[];
  faqTitle: string;
  faq: readonly { q: string; a: string }[];
  ctaTitle: string;
  ctaSub: string;
  also: readonly { page: PageId; label: string }[];
}

/**
 * Тип текстов интерфейса выведен из английского файла — он эталон. Присваивание
 * ниже проверяет каждую локаль на совпадение формы, поэтому забытое поле
 * в новом языке не соберётся, а не вылезет пустотой на странице.
 */
export type UiCopy = typeof en.ui;

export const T: Record<Locale, UiCopy> = {
  en: en.ui,
  ru: ru.ui,
};

export const LANDINGS: Record<Exclude<PageId, "home">, Record<Locale, LandingCopy>> = {
  mp3: {
    en: en.landings.mp3,
    ru: ru.landings.mp3,
  },
  transcribe: {
    en: en.landings.transcribe,
    ru: ru.landings.transcribe,
  },
};
