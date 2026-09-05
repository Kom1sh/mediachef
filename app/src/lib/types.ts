import type { Locale } from "./i18n";
import type { Theme } from "./theme";

export type MediaType = "video" | "audio" | "image" | "subtitle" | "any";
/**
 * Подпись из каталога на нескольких языках. Ключи — коды языков, `en` есть
 * всегда: Rust не примет рецепт без него, а `loc` откатывается именно туда.
 */
export type Loc = { en: string } & Partial<Record<Locale, string>>;
export type LocList = { en: string[] } & Partial<Record<Locale, string[]>>;

/**
 * The preferences the Settings screen edits — mirrors `AppSettings` in
 * `settings.rs`, snake_case keys included, because that struct is what crosses
 * IPC in both directions.
 *
 * Rust sanitizes everything it is handed, so a value here is always one of the
 * listed literals: the unions are a promise the border guard keeps, not a hope.
 */
export interface AppSettings {
  /** "system" follows the OS locale. */
  language: "system" | Locale;
  theme: Theme;
  /** "beside" writes next to the input file, "fixed" always into `output_dir`. */
  output_mode: "beside" | "fixed";
  /** Only meaningful with `output_mode: "fixed"` — Rust demotes the mode to
   *  "beside" when it is missing, so the two can never disagree. */
  output_dir: string | null;
  notifications: boolean;
  /** 1…3 parallel ffmpeg jobs. Read once when the app boots its workers, so a
   *  change lands after a restart. */
  ffmpeg_workers: number;
  dictation: Dictation;
}

/**
 * The dictation block — mirrors `Dictation` in `settings.rs`.
 *
 * Only `enabled` and `hotkey` have a control on the Settings screen; the rest
 * are edited by hand until the Dictation screen lands in wave 5.2. They are
 * still typed here because the whole object crosses IPC in both directions, and
 * dropping a field on the way out would reset it to its default.
 */
export interface Dictation {
  enabled: boolean;
  /** A combination, always: a lone modifier cannot be a global shortcut. */
  hotkey: string;
  model: string;
  language: string;
  dictionary: string;
  delivery: string;
  history_depth: number;
}

/**
 * The hotkeys the Settings screen offers.
 *
 * A closed list rather than a text field, and that is the point. A global
 * shortcut is grabbed before any application sees it, so the combinations that
 * feel most natural are the worst available: `Cmd`+letter is what applications
 * use for their own menus, and `Ctrl+Shift`+letter is what editors and
 * terminals use for theirs. A free-text field would invite exactly those, and
 * the damage — a shortcut that stops working everywhere — would show up far
 * from this screen.
 *
 * All three below are claimed by neither macOS nor typical applications.
 */
export const DICTATION_HOTKEYS = [
  { value: "Option+Space", label: "⌥ Space" },
  { value: "Ctrl+Option+Space", label: "⌃⌥ Space" },
  { value: "Ctrl+Option+D", label: "⌃⌥ D" },
] as const;

export interface Param {
  key: string;
  // "model" and "language" carry no `values` list — the choices are the models
  // actually downloaded and whisper's language table, both filled at render time.
  type: "enum" | "int" | "float" | "bool" | "string" | "path" | "model" | "language";
  values?: string[] | null;
  default: unknown;
  label: Loc;
  min?: number | null;
  max?: number | null;
  unit?: string | null;
  advanced?: boolean;
}

export interface Recipe {
  id: string;
  category: string;
  title: Loc;
  aliases: LocList;
  description: Loc;
  input: { types: MediaType[] };
  params: Param[];
  engine: "ffmpeg" | "whisper" | "pipeline";
  args: string[];
  // Only present for engine "whisper"; `null` on every ffmpeg recipe.
  whisper?: { translate: boolean } | null;
  output: { ext: string; suffix?: string | null };
  seo?: { slug: string; priority?: string | null } | null;
}

export interface JobView {
  id: number;
  recipe_id: string;
  // Which worker lane ran the job — the two drain independently, so a queued
  // transcription is not waiting on a running conversion.
  kind: "ffmpeg" | "whisper";
  input: string;
  output: string;
  status: "queued" | "running" | "done" | "error" | "cancelled";
  percent: number;
  error?: string | null;
  error_detail?: string | null;
}

/** One row of the Models screen (mirrors `ModelView` in lib.rs). */
export interface ModelView {
  id: string;
  note_en: string;
  note_ru: string;
  // The table's estimate, not the real Content-Length — a label, not a budget.
  approx_bytes: number;
  installed: boolean;
  // True while a download thread for this id is alive, so the panel can be
  // remounted (tab switch) mid-download without offering a Download button that
  // would only answer "already downloading".
  downloading: boolean;
}

/** Payload of the `model:progress` event. */
export interface ModelProgress {
  id: string;
  percent: number;
  // Terminal tick: the download either finished, failed or was cancelled. Sent
  // unthrottled — the panel keeps its progress row until it arrives.
  done: boolean;
  error?: string | null;
}

export interface ProbeInfo {
  duration_s: number | null;
  media_type: MediaType;
  size_bytes: number | null;
  summary: string;
  raw: unknown;
}
