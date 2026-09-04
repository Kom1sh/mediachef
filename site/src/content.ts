// Реестр сайта: языки, маршруты и сборка текстов. Сами тексты лежат по одному
// файлу на язык в copy/<locale>.ts — здесь только структура.
//
// Добавить язык = написать copy/<locale>.ts, дописать строку в META и слаги
// в ROUTES. Дальше он сам появится в меню, в бургере, в подвале, в hreflang,
// в sitemap.xml и в роутах: всё считается из этой таблицы.
import en from "./copy/en";
import ru from "./copy/ru";
import es from "./copy/es";
import pt from "./copy/pt";
import fr from "./copy/fr";
import de from "./copy/de";
import pl from "./copy/pl";
import it from "./copy/it";
import ar from "./copy/ar";
import zh from "./copy/zh";

export { SITE, LINKS, FACTS, FEEDBACK_EMAIL } from "./facts";

export type PageId = "home" | "mp3" | "transcribe" | "catalog" | "gif" | "compress";

/**
 * Языки с полным переводом. `name` — самоназвание: в переключателе язык
 * подписан на себе, иначе испанец ищет «Spanish» глазами по чужому алфавиту.
 * `flag` — ключ флажка в components/Flag.astro, `dir` — только для письма
 * справа налево.
 */
const META = {
  en: { lang: "en", ogLocale: "en_US", name: "English", flag: "gb" },
  ru: { lang: "ru", ogLocale: "ru_RU", name: "Русский", flag: "ru" },
  es: { lang: "es", ogLocale: "es_ES", name: "Español", flag: "es" },
  pt: { lang: "pt", ogLocale: "pt_BR", name: "Português", flag: "pt" },
  fr: { lang: "fr", ogLocale: "fr_FR", name: "Français", flag: "fr" },
  de: { lang: "de", ogLocale: "de_DE", name: "Deutsch", flag: "de" },
  pl: { lang: "pl", ogLocale: "pl_PL", name: "Polski", flag: "pl" },
  it: { lang: "it", ogLocale: "it_IT", name: "Italiano", flag: "it" },
  ar: { lang: "ar", ogLocale: "ar_SA", name: "العربية", flag: "sa", dir: "rtl" },
  zh: { lang: "zh", ogLocale: "zh_CN", name: "中文", flag: "cn" },
} as const;

export type Locale = keyof typeof META;
export type LocaleMeta = { lang: string; ogLocale: string; name: string; flag: string; dir?: "rtl" };

export const LOCALE_META = META as Record<Locale, LocaleMeta>;
export const LOCALES = Object.keys(META) as Locale[];

/** Слаги по локалям: переключатель языка бьёт страницу в страницу, а не в главную. */
export const ROUTES: Record<PageId, Record<Locale, string>> = {
  home: { en: "", ru: "", zh: "", ar: "", it: "", pl: "", de: "", fr: "", pt: "", es: "" },
  mp3: { en: "convert-mp4-to-mp3", zh: "mp4-zhuan-mp3", ar: "tahwil-mp4-ila-mp3", it: "convertire-mp4-in-mp3", pl: "konwersja-mp4-na-mp3", de: "mp4-in-mp3-umwandeln", fr: "convertir-mp4-en-mp3", pt: "converter-mp4-em-mp3", ru: "mp4-v-mp3", es: "convertir-mp4-a-mp3" },
  transcribe: { en: "transcribe-audio-to-text", zh: "yinpin-zhuan-wenzi", ar: "tafrigh-sawti-ila-nass", it: "trascrivere-audio-in-testo", pl: "transkrypcja-audio-na-tekst", de: "audio-in-text-umwandeln", fr: "transcrire-audio-en-texte", pt: "transcrever-audio-para-texto", ru: "transkribaciya-audio-v-tekst", es: "transcribir-audio-a-texto" },
  catalog: { en: "recipes", zh: "caipu", ar: "wasafat", it: "ricette", pl: "przepisy", de: "rezepte", fr: "recettes", pt: "receitas", ru: "recepty", es: "recetas" },
  // Слаги под то, как эту задачу реально ищут, а не под кальку с английского:
  // по-русски набирают «видео в гиф», по-немецки «video in gif umwandeln»,
  // по-китайски «视频转gif» — отсюда и разная форма.
  compress: { en: "compress-video", zh: "yasuo-shipin", ar: "dagt-video", it: "comprimere-video", pl: "kompresja-wideo", de: "video-komprimieren", fr: "compresser-une-video", pt: "comprimir-video", ru: "szhat-video", es: "comprimir-video" },
  gif: { en: "video-to-gif", zh: "shipin-zhuan-gif", ar: "tahwil-video-ila-gif", it: "video-in-gif", pl: "wideo-na-gif", de: "video-in-gif-umwandeln", fr: "video-en-gif", pt: "video-para-gif", ru: "video-v-gif", es: "video-a-gif" },
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
  zh: zh.ui,
  ar: ar.ui,
  it: it.ui,
  pl: pl.ui,
  de: de.ui,
  fr: fr.ui,
  pt: pt.ui,
  ru: ru.ui,
  es: es.ui,
};

/** Страницы под один поисковый интент — те, что рисует Intent.astro.
 *  У «home», «catalog» и гайдов свой макет: они устроены иначе. */
export type IntentId = Exclude<PageId, "home" | "catalog" | "gif" | "compress">;

/** Тексты каталога выведены из английского файла — форма проверяется присваиванием. */
export type CatalogCopy = typeof en.catalog;

export const CATALOG: Record<Locale, CatalogCopy> = {
  en: en.catalog,
  zh: zh.catalog,
  ar: ar.catalog,
  it: it.catalog,
  pl: pl.catalog,
  de: de.catalog,
  fr: fr.catalog,
  pt: pt.catalog,
  ru: ru.catalog,
  es: es.catalog,
};

export const LANDINGS: Record<IntentId, Record<Locale, LandingCopy>> = {
  mp3: {
    en: en.landings.mp3,
    zh: zh.landings.mp3,
    ar: ar.landings.mp3,
    it: it.landings.mp3,
    pl: pl.landings.mp3,
    de: de.landings.mp3,
    fr: fr.landings.mp3,
    pt: pt.landings.mp3,
    ru: ru.landings.mp3,
    es: es.landings.mp3,
  },
  transcribe: {
    en: en.landings.transcribe,
    zh: zh.landings.transcribe,
    ar: ar.landings.transcribe,
    it: it.landings.transcribe,
    pl: pl.landings.transcribe,
    de: de.landings.transcribe,
    fr: fr.landings.transcribe,
    pt: pt.landings.transcribe,
    ru: ru.landings.transcribe,
    es: es.landings.transcribe,
  },
};
