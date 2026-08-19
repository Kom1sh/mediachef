/**
 * The one place that knows what a category, a media type or a job status looks
 * like. Components ask for an icon and a tint by name; the hue families live in
 * `index.css` as `--tint-*` pairs, so a card never learns that "cut" is red — it
 * only learns that "cut" has a tile class.
 */
import {
  AudioLines,
  BrainCircuit,
  Captions,
  ChefHat,
  CircleAlert,
  CircleCheck,
  CircleOff,
  Clapperboard,
  Clock4,
  CookingPot,
  Crop,
  Disc3,
  File,
  FileAudio2,
  FileImage,
  FileVideo2,
  Gauge,
  ImagePlay,
  Languages,
  LoaderCircle,
  Mic,
  PackageOpen,
  Scissors,
  ScrollText,
  Settings2,
  Sparkles,
  SquareTerminal,
  Volume2,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import type { JobView, MediaType } from "./types";

/** Tile classes, one per hue family. Written out in full because Tailwind reads
 *  these as literal strings — a template built from a hue name would compile to
 *  no CSS at all. */
const TINT = {
  green: "bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]",
  ochre: "bg-[var(--tint-ochre-bg)] text-[var(--tint-ochre-fg)]",
  tomato: "bg-[var(--tint-tomato-bg)] text-[var(--tint-tomato-fg)]",
  blue: "bg-[var(--tint-blue-bg)] text-[var(--tint-blue-fg)]",
  purple: "bg-[var(--tint-purple-bg)] text-[var(--tint-purple-fg)]",
  neutral: "bg-[var(--tint-neutral-bg)] text-[var(--tint-neutral-fg)]",
} as const;

/** Recipe categories come from the YAML catalog, so this map is open by type:
 *  a category added to `recipes/` without a line here still renders (see
 *  `categoryIcon`) rather than crashing the board. */
export const CATEGORY_ICON: Record<string, LucideIcon> = {
  "convert-video": Clapperboard,
  "convert-audio": AudioLines,
  extract: Disc3,
  compress: PackageOpen,
  cut: Scissors,
  geometry: Crop,
  gif: ImagePlay,
  "audio-in-video": Volume2,
  "mux-subs": Captions,
  speed: Gauge,
  transcribe: ScrollText,
  translate: Languages,
  advanced: SquareTerminal,
};

export const CATEGORY_TINT: Record<string, string> = {
  "convert-video": TINT.green,
  "convert-audio": TINT.ochre,
  extract: TINT.ochre,
  compress: TINT.green,
  cut: TINT.tomato,
  geometry: TINT.blue,
  gif: TINT.purple,
  "audio-in-video": TINT.ochre,
  "mux-subs": TINT.blue,
  speed: TINT.tomato,
  transcribe: TINT.green,
  translate: TINT.blue,
  advanced: TINT.neutral,
};

/** Icon for a category, `Sparkles` for one this build has never heard of. */
export function categoryIcon(category: string): LucideIcon {
  return CATEGORY_ICON[category] ?? Sparkles;
}

/** Tile classes for a category, falling back to the neutral pair. */
export function categoryTint(category: string): string {
  return CATEGORY_TINT[category] ?? TINT.neutral;
}

/** What kind of file a dropped item turned out to be. Subtitles and the
 *  catch-all "any" share the generic sheet — there is no glyph that says
 *  "whatever this is" better than a plain file. */
export const MEDIA_ICON: Record<MediaType, LucideIcon> = {
  video: FileVideo2,
  audio: FileAudio2,
  image: FileImage,
  subtitle: File,
  any: File,
};

/** The shell's screens. Owned here so the icon map and `Sidebar`'s `Tab` cannot
 *  drift apart, and so importing the map never pulls a component in. */
export type NavKey = "main" | "models" | "settings";

export const NAV: Record<NavKey, LucideIcon> = {
  main: CookingPot,
  models: BrainCircuit,
  settings: Settings2,
};

/** The wordmark's glyph. */
export const APP_ICON: LucideIcon = ChefHat;

/** Queue statuses. `running` is `LoaderCircle` — the ring that reads as motion
 *  once the caller adds `animate-spin`; the spin stays in the component so
 *  `prefers-reduced-motion` and static uses (a legend, a test) are free to skip
 *  it. */
export const STATUS_ICON: Record<JobView["status"], LucideIcon> = {
  queued: Clock4,
  running: LoaderCircle,
  done: CircleCheck,
  error: CircleAlert,
  cancelled: CircleOff,
};

/** Colour that goes with each status icon — amber is "working", basil "done",
 *  tomato "failed", and both waiting states stay quiet. */
export const STATUS_TINT: Record<JobView["status"], string> = {
  queued: "text-ink-2",
  running: "text-amber",
  done: "text-basil",
  error: "text-tomato",
  cancelled: "text-ink-2",
};

/** Which worker lane a job ran on. The two lanes drain independently, so a queue
 *  showing a running conversion *and* a running transcription is correct rather
 *  than a bug — the badge is what says so at a glance. Exhaustive by type: a lane
 *  added on the Rust side cannot reach a card without a glyph here. */
export const KIND_ICON: Record<JobView["kind"], LucideIcon> = {
  ffmpeg: Wand2,
  whisper: Mic,
};

/** The word beside that glyph. Not in the dictionary and not meant to be: these
 *  are the two tools' own names, the same in both languages (i18n.tsx rule 1
 *  exempts brand, format and codec names) — and keeping them here rather than
 *  inline in the card is what makes that exemption a decision instead of a
 *  literal someone forgot to translate. */
export const KIND_LABEL: Record<JobView["kind"], string> = {
  ffmpeg: "ffmpeg",
  whisper: "Whisper",
};
