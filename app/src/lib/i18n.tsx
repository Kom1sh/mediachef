/**
 * The app's ten languages. The words live one file per language in `locales/`;
 * this module is the wiring around them.
 *
 * Three rules hold the whole thing together:
 *
 *  1. Every user-visible string in the UI is a key here — including the ones a
 *     screen reader reads and nobody sees (`aria-label`, `title`). The exceptions
 *     are the brand, format and codec names (MP3, libx264), ISO language codes and
 *     bare numerals, which are the same word in both languages.
 *  2. The locale travels through React context, never through a module-level
 *     variable. A variable would make the Settings switch a no-op until the next
 *     restart: nothing re-renders when a module's local changes.
 *  3. There is no plural machinery, and none is needed while every key keeps its
 *     counted noun out of agreement position — «Добавить все файлы ({n})», not
 *     «Добавить {n} файл(а/ов)»; Russian would otherwise need three forms for one
 *     English "files". A key that genuinely cannot be phrased that way is the
 *     signal to add a `plural(n, forms)` helper, not to guess one form.
 *
 * Text that comes from the catalog rather than from here — recipe titles,
 * descriptions, parameter labels — arrives as a map of language code to string;
 * `loc` picks one side of it and falls back to English.
 */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { dict as en, type Key } from "./locales/en";
import { dict as ru } from "./locales/ru";
import { dict as es } from "./locales/es";
import { dict as pt } from "./locales/pt";
import { dict as fr } from "./locales/fr";
import { dict as de } from "./locales/de";
import { dict as pl } from "./locales/pl";
import { dict as it } from "./locales/it";
import { dict as ar } from "./locales/ar";
import { dict as zh } from "./locales/zh";

export const DICTS = { en, ru, es, pt, fr, de, pl, it, ar, zh } as const;

export type Locale = keyof typeof DICTS;

/** Порядок здесь — порядок в списке языков в настройках. */
export const LOCALES = Object.keys(DICTS) as Locale[];

/**
 * Самоназвание языка. В настройках язык подписан на себе: человек, попавший
 * в чужой интерфейс, ищет глазами «Español», а не «Spanish».
 */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  ru: "Русский",
  es: "Español",
  pt: "Português",
  fr: "Français",
  de: "Deutsch",
  pl: "Polski",
  it: "Italiano",
  ar: "العربية",
  zh: "中文",
};

/** Языки с письмом справа налево. Атрибут dir проставляет App. */
const RTL: ReadonlySet<string> = new Set(["ar"]);

export const localeDir = (locale: Locale): "rtl" | "ltr" => (RTL.has(locale) ? "rtl" : "ltr");

/** Ключ словаря. Набор задаёт английский файл — он эталон. */
export type TKey = Key;

/** What `useT` hands out. `vars` fills `{name}` placeholders. */
export type TFn = (key: TKey, vars?: Record<string, string | number>) => string;

/**
 * The whole translation, minus React. Exported because App is the component that
 * *provides* the locale and therefore cannot consume its own context — and
 * because a pure function is what the tests can hold still.
 */
export function makeT(locale: Locale): TFn {
  const dict = DICTS[locale];
  return (key, vars) => {
    const raw: string = dict[key];
    if (!vars) return raw;
    // A placeholder with no value is left as written: "{n}" is odd, "undefined" is
    // alarming, and the missing var is a bug to be seen rather than hidden.
    // `hasOwnProperty.call` rather than `name in vars`, which would answer `true`
    // for "toString" and substitute a function body. (`Object.hasOwn` is ES2022;
    // this program targets ES2021.)
    return raw.replace(/\{(\w+)\}/g, (whole, name: string) =>
      Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : whole);
  };
}

/**
 * The stored setting ("system" | "en" | "ru") turned into a language the app
 * actually has words for.
 *
 * Anything unrecognised — a hand-edited settings.json, a locale we do not ship —
 * asks the browser and then falls back to English, so the UI can never end up
 * rendering keys.
 */
export function resolveLocale(setting: string, osLocale = ""): Locale {
  if (setting in DICTS) return setting as Locale;
  // Сначала то, что сказала операционная система, и только потом webview:
  // на macOS WKWebView сообщает локаль приложения, а не системы, и у
  // нелокализованной сборки это всегда «en-US» — «как в системе» тогда молча
  // означало бы «английский» на любой машине.
  const nav = typeof navigator === "undefined" ? "" : navigator.language || "";
  const lang = osLocale || nav;
  // Совпадение по основному субтегу: pt-BR — это pt, zh-Hans — zh.
  const primary = lang.toLowerCase().split("-")[0];
  return (LOCALES.find((l) => l === primary) ?? "en") as Locale;
}

// English rather than a "no locale chosen" sentinel: a component rendered outside
// the provider (a test, a future portal) should show words, not blanks.
const LocaleContext = createContext<Locale>("en");

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

/** The locale itself, for the callers that pass it to `loc` (recipe titles, model
 *  notes) rather than looking a key up. */
export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** `t` for the current locale. Stable while the locale is, so it is safe in a
 *  dependency list. */
export function useT(): TFn {
  const locale = useLocale();
  return useMemo(() => makeT(locale), [locale]);
}

/**
 * One side of a language map from the catalog.
 *
 * A missing or blank side falls back to English: recipes are hand-written YAML,
 * so a language that has not been filled in yet is a matter of when rather than
 * if, and an English label beats an empty card.
 */
export function loc(l: Partial<Record<Locale, string>> & { en: string }, locale: Locale): string {
  const own = l[locale];
  return own && own.trim() !== "" ? own : l.en;
}

/**
 * The display name of a recipe category. Categories come from the YAML catalog,
 * so one this build has never heard of renders its own name — the same open-map
 * contract `categoryIcon` keeps in icons.ts.
 */
export function categoryLabel(category: string, locale: Locale): string {
  const key = `cat_${category}` as TKey;
  return key in en ? makeT(locale)(key) : category;
}
