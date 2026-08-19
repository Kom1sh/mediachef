/**
 * The app's two languages, in one file.
 *
 * Two rules hold the whole thing together:
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
 * descriptions, parameter labels, model notes — is a `{ en, ru }` pair on the
 * wire; `loc` picks a side of it.
 */
import { createContext, useContext, useMemo, type ReactNode } from "react";

export type Locale = "en" | "ru";

/** The English dictionary is the source of truth for the key set: `TKey` is
 *  derived from it, and the Russian one below is typed to match. */
const EN = {
  // ── Shell ────────────────────────────────────────────────────────────────
  appName: "MediaChef",
  navSections: "Sections",
  navConvert: "Convert",
  navModels: "Models",
  navSettings: "Settings",

  // ── Board: drop zone, search, recipe list ────────────────────────────────
  dropZone: "Drop files here or click to choose",
  dropHint: "Drop files to filter recipes by type.",
  // Both example queries stay in both locales on purpose: the Russian one shows a
  // Russian speaker that their own words work, the English one that the search is
  // not fussy about which language it is asked in.
  searchPlaceholder: "Search: «видео в мп3», «make gif»…",
  nothingFound: "Nothing found",
  popular: "Popular",

  // ── File card ────────────────────────────────────────────────────────────
  clearFile: "Clear file",
  clearNamed: "Clear {name}",
  unitMB: "MB",
  unitGB: "GB",
  unitSeconds: "s",
  // The badge on a probed file. "any" is the catalog's wildcard and never the
  // answer to "what is this file", but the map is exhaustive by type.
  mt_video: "video",
  mt_audio: "audio",
  mt_image: "image",
  mt_subtitle: "subtitle",
  mt_any: "any",

  // ── Recipe form ──────────────────────────────────────────────────────────
  advanced: "Advanced",
  close: "Close",
  addToQueue: "Add to queue",
  adding: "Adding…",
  addingN: "Adding {n}…",
  addAllN: "Add all {n} files",
  retryOne: "Retry",
  retryN: "Retry {n}",
  clickToCopy: "Click to copy",
  clickToCopyPreview: "Click to copy — illustrative, not runnable as-is",
  copied: "Copied to clipboard",
  previewOnly: "# preview only — the queue decodes a 16 kHz WAV first, so this is not runnable as-is",
  loadingModels: "Loading models…",
  openModels: "Open Models",
  downloadModelPrompt: "Download a model → Models",

  // ── Queue ────────────────────────────────────────────────────────────────
  queue: "Queue",
  queueEmpty: "Jobs will appear here.",
  st_queued: "queued",
  st_running: "running",
  st_done: "done",
  st_error: "error",
  st_cancelled: "cancelled",
  cancel: "Cancel",
  etaLeft: "~{time} left",
  showInFinder: "Show in Finder",
  copyLog: "Copy log",
  failed: "Failed",
  notifyDone: "Done: {name}",

  // ── Models ───────────────────────────────────────────────────────────────
  modelsTitle: "Whisper models",
  modelsBlurb: "Transcription runs locally. A model is downloaded once.",
  download: "Download",
  deleteModel: "Delete",
  cancelling: "Cancelling…",
  cancelDownload: "Cancel download",
  cancelHint: "A cancel lands at the download's next read — up to 30s if the connection died.",
  // Whisper heard nothing worth writing down. Used by the transcription screen.
  noSpeech: "No speech detected",

  // ── Settings ─────────────────────────────────────────────────────────────
  loadingSettings: "Loading settings…",
  // Shared by the language and the theme control, so the Russian side has to work
  // for both — hence "как в системе" rather than an adjective that would have to
  // agree with one noun or the other.
  optSystem: "System",
  themeLight: "Light",
  themeDark: "Dark",
  setLanguage: "Language",
  setLanguageHint: "«System» follows your OS.",
  setTheme: "Theme",
  setThemeHint: "Applies immediately.",
  setOutput: "Output folder",
  setOutputHint: "Where finished files are written.",
  outBeside: "Next to input",
  outFixed: "Fixed folder",
  change: "Change…",
  setNotifications: "Notifications",
  setNotificationsHint: "A desktop alert when a job finishes.",
  setWorkers: "Parallel conversions",
  setWorkersHint: "How many ffmpeg jobs run at once. Takes effect after a restart.",

  // ── Recipe categories ────────────────────────────────────────────────────
  // One per key of `CATEGORY_ICON` in icons.ts, reached through `categoryLabel`
  // so an unknown category from the YAML catalog renders its own name instead of
  // a missing key.
  "cat_convert-video": "Convert video",
  "cat_convert-audio": "Convert audio",
  cat_extract: "Extract",
  cat_compress: "Compress",
  cat_cut: "Cut",
  cat_geometry: "Size",
  cat_gif: "GIF",
  "cat_audio-in-video": "Audio in video",
  "cat_mux-subs": "Subtitles",
  cat_speed: "Speed",
  cat_transcribe: "Transcribe",
  cat_translate: "Translate",
  cat_advanced: "Advanced",
} as const;

export type TKey = keyof typeof EN;

/** `Record<TKey, string>` is the compile-time half of the key-parity guarantee: a
 *  key added to `EN` and forgotten here is a type error, and a key here that `EN`
 *  does not have is too. `i18n.test.ts` checks the same thing at runtime. */
const RU: Record<TKey, string> = {
  appName: "MediaChef",
  navSections: "Разделы",
  navConvert: "Конвертация",
  navModels: "Модели",
  navSettings: "Настройки",

  dropZone: "Перетащите файлы сюда или нажмите, чтобы выбрать",
  dropHint: "Перетащите файлы — рецепты отфильтруются по типу.",
  searchPlaceholder: "Поиск: «видео в мп3», «make gif»…",
  nothingFound: "Ничего не нашлось",
  popular: "Популярное",

  clearFile: "Убрать файл",
  clearNamed: "Убрать {name}",
  unitMB: "МБ",
  unitGB: "ГБ",
  unitSeconds: "с",
  mt_video: "видео",
  mt_audio: "аудио",
  mt_image: "изображение",
  mt_subtitle: "субтитры",
  mt_any: "любой",

  advanced: "Дополнительно",
  close: "Закрыть",
  addToQueue: "В очередь",
  adding: "Добавляю…",
  addingN: "Добавляю {n}…",
  addAllN: "Добавить все файлы ({n})",
  retryOne: "Повторить",
  retryN: "Повторить ({n})",
  clickToCopy: "Нажмите, чтобы скопировать",
  clickToCopyPreview: "Нажмите, чтобы скопировать — команда только для наглядности, в таком виде она не запустится",
  copied: "Скопировано в буфер обмена",
  previewOnly: "# только для наглядности — очередь сначала готовит WAV 16 кГц, поэтому в таком виде команда не запустится",
  // "Получаю список", not "Загружаю": next to a «Скачать» button, "загружаю"
  // reads as *downloading a model* rather than as fetching the list of them.
  loadingModels: "Получаю список моделей…",
  openModels: "Открыть «Модели»",
  downloadModelPrompt: "Скачать модель → «Модели»",

  queue: "Очередь",
  queueEmpty: "Здесь появятся задачи.",
  st_queued: "в очереди",
  st_running: "выполняется",
  st_done: "готово",
  st_error: "ошибка",
  st_cancelled: "отменено",
  cancel: "Отменить",
  etaLeft: "осталось ~{time}",
  showInFinder: "Показать в Finder",
  copyLog: "Скопировать лог",
  failed: "Не удалось",
  notifyDone: "Готово: {name}",

  modelsTitle: "Модели Whisper",
  modelsBlurb: "Расшифровка идёт на вашем компьютере. Модель скачивается один раз.",
  download: "Скачать",
  deleteModel: "Удалить",
  cancelling: "Отмена…",
  cancelDownload: "Отменить загрузку",
  cancelHint: "Отмена срабатывает на следующем чтении из сети — до 30 с, если соединение уже оборвалось.",
  noSpeech: "Речь не распознана",

  loadingSettings: "Загружаю настройки…",
  optSystem: "Как в системе",
  themeLight: "Светлая",
  themeDark: "Тёмная",
  setLanguage: "Язык",
  setLanguageHint: "«Как в системе» — язык вашей ОС.",
  setTheme: "Тема",
  setThemeHint: "Применяется сразу.",
  setOutput: "Папка для результатов",
  setOutputHint: "Куда складывать готовые файлы.",
  outBeside: "Рядом с исходным",
  outFixed: "Выбранная папка",
  change: "Изменить…",
  setNotifications: "Уведомления",
  setNotificationsHint: "Уведомление на рабочем столе, когда задача готова.",
  setWorkers: "Параллельные конвертации",
  // «Сколько задач … выполняется», singular: "сколько" + genitive plural takes a
  // singular predicate. "Выполняется" is also the word st_running uses for a job
  // that is running, so the setting and the queue name the same thing the same way.
  setWorkersHint: "Сколько задач ffmpeg выполняется одновременно. Применится после перезапуска.",

  "cat_convert-video": "Конвертация видео",
  "cat_convert-audio": "Конвертация аудио",
  cat_extract: "Извлечение",
  cat_compress: "Сжатие",
  cat_cut: "Обрезка",
  cat_geometry: "Размер",
  cat_gif: "GIF",
  "cat_audio-in-video": "Звук в видео",
  "cat_mux-subs": "Субтитры",
  cat_speed: "Скорость",
  cat_transcribe: "Расшифровка",
  cat_translate: "Перевод",
  cat_advanced: "Для продвинутых",
};

export const DICTS = { en: EN, ru: RU } as const;

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
export function resolveLocale(setting: string): Locale {
  if (setting === "ru" || setting === "en") return setting;
  const lang = typeof navigator === "undefined" ? "" : navigator.language || "";
  return lang.toLowerCase().startsWith("ru") ? "ru" : "en";
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
 * A side of a `{ en, ru }` pair from the catalog.
 *
 * A blank Russian side falls back to English: recipes and model notes are
 * hand-written YAML, so a missing `ru:` is a matter of when rather than if, and an
 * English label beats an empty card.
 */
export function loc(l: { en: string; ru: string }, locale: Locale): string {
  if (locale === "ru" && l.ru && l.ru.trim() !== "") return l.ru;
  return l.en;
}

/**
 * The display name of a recipe category. Categories come from the YAML catalog,
 * so one this build has never heard of renders its own name — the same open-map
 * contract `categoryIcon` keeps in icons.ts.
 */
export function categoryLabel(category: string, locale: Locale): string {
  const key = `cat_${category}` as TKey;
  return key in EN ? makeT(locale)(key) : category;
}
