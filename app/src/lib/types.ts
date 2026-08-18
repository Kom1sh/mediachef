export type MediaType = "video" | "audio" | "image" | "subtitle" | "any";
export type Loc = { en: string; ru: string };

export interface Param {
  key: string;
  type: "enum" | "int" | "float" | "bool" | "string" | "path";
  values?: string[];
  default: unknown;
  label: Loc;
  min?: number;
  max?: number;
  unit?: string;
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
  output: { ext: string; suffix?: string };
  seo?: { slug: string; priority?: string };
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
