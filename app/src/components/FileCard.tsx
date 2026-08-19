import { CircleAlert } from "lucide-react";
import { MEDIA_ICON } from "../lib/icons";
import { useT, type TKey } from "../lib/i18n";
import type { MediaType, ProbeInfo } from "../lib/types";

// The unit arrives as a word rather than being spelled here: "MB" is "МБ" in
// Russian, and a file card that says one and means the other is the kind of
// detail a bilingual UI is judged by.
const fmtSize = (b: number | null, mb: string) => (b == null ? "" : `${(b / 1024 / 1024).toFixed(1)} ${mb}`);
const fmtDur = (s: number | null, sec: string) => (s == null ? "" : `${Math.round(s)} ${sec}`);

/** The badge under the name. Exhaustive by type, so a media type added to the
 *  catalog cannot reach the card without a word for it. */
const MEDIA_KEY: Record<MediaType, TKey> = {
  video: "mt_video", audio: "mt_audio", image: "mt_image", subtitle: "mt_subtitle", any: "mt_any",
};

export function FileCard({ path, info, probeError, active, onSelect, onClear }: {
  path: string;
  info: ProbeInfo | null;
  probeError: string;
  /** Highlighted, and the file the recipe filter and the form are pointed at. */
  active: boolean;
  onSelect: () => void;
  onClear: () => void;
}) {
  const t = useT();
  const name = path.split("/").pop();
  // Unknown until ffprobe answers — and if it never does, the generic sheet is the
  // honest glyph: the card has no idea what it is holding.
  const Icon = MEDIA_ICON[info?.media_type ?? "any"];
  // Built as a list so the row is only rendered when something landed in it: a
  // probe can come back with a type and nothing else (a stream with no duration
  // and no size), and three empty pills would be worse than none.
  const chips = info
    ? [
        { k: "duration", text: fmtDur(info.duration_s, t("unitSeconds")) },
        { k: "size", text: fmtSize(info.size_bytes, t("unitMB")) },
        { k: "summary", text: info.summary },
      ].filter(c => c.text !== "")
    : [];
  return (
    // `ring`, not a border swap: the ring is drawn outside the box, so the active
    // card does not shift its content by a pixel as the highlight moves down the
    // list.
    <div className={`shrink-0 rounded-xl border border-line bg-card p-3 text-sm ${active ? "ring-2 ring-basil" : ""}`}>
      <div className="flex items-start gap-3">
        {/* The tile says at a glance what kind of file this is — and says it to a
            screen reader too, through the icon's own label, since the type word
            itself is no longer written out beside a glyph that means it. */}
        <span className="shrink-0 rounded-lg bg-card-2 p-2">
          <Icon className="size-5 text-ink-2"
            {...(info ? { role: "img", "aria-label": t(MEDIA_KEY[info.media_type]) } : { "aria-hidden": true })} />
        </span>
        <div className="min-w-0 flex-1">
          {/* The name is the click target rather than the whole card: a card-wide
              onClick would have to sit on a div (the ✕ inside rules out a <button>),
              and that trades a real button — keyboard and screen reader included —
              for a few more pixels of hit area. */}
          <button type="button" onClick={onSelect} className="block w-full truncate text-left font-medium">{name}</button>
          {chips.length > 0 && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {chips.map(c => (
                <span key={c.k} className="max-w-full truncate rounded-full bg-card-2 px-2 py-0.5 text-xs text-ink-2">{c.text}</span>
              ))}
            </div>
          )}
          {/* On the card, not under the list: with several files up at once, a probe
              failure floating below them would not say which one it belongs to. */}
          {probeError ? (
            <p className="mt-1.5 flex items-start gap-1 break-words text-xs text-tomato">
              <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
              <span className="min-w-0">{probeError}</span>
            </p>
          ) : null}
        </div>
        {/* The way out of a chosen file. Without it the only path back to "no
            file" was finishing a job or restarting the app. No `title` beside the
            `aria-label`: title is demoted to the description and announced after
            the name, so the button said "Убрать отпуск.mp4, Убрать файл". */}
        <button onClick={onClear} aria-label={t("clearNamed", { name: name ?? "" })}
          className="shrink-0 text-ink-2 transition hover:text-tomato">✕</button>
      </div>
    </div>
  );
}
