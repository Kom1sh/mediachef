export type MediaType = "video" | "audio" | "image" | "subtitle" | "any";
export type Loc = { en: string; ru: string };

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
  aliases: { en: string[]; ru: string[] };
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
