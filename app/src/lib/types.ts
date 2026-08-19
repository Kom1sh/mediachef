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
  input: string;
  output: string;
  status: "queued" | "running" | "done" | "error" | "cancelled";
  percent: number;
  error?: string | null;
  error_detail?: string | null;
}

export interface ProbeInfo {
  duration_s: number | null;
  media_type: MediaType;
  size_bytes: number | null;
  summary: string;
  raw: unknown;
}
