import { CircleAlert } from "lucide-react";
import { basename, duration, size } from "../lib/format";
import { MEDIA_ICON } from "../lib/icons";
import { useT, type TKey } from "../lib/i18n";
import type { MediaType, ProbeInfo } from "../lib/types";

/** The accessible name of the media tile's glyph — the type word is not written
 *  out beside the icon that means it, so this is where a screen reader gets it.
 *  Exhaustive by type, so a media type added to the catalog cannot reach the card
 *  without a word for it. */
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
  const name = basename(path);
  // Unknown until ffprobe answers — and if it never does, the generic sheet is the
  // honest glyph: the card has no idea what it is holding.
  const Icon = MEDIA_ICON[info?.media_type ?? "any"];
  // Built as a list so the row is only rendered when something landed in it: a
  // probe can come back with a type and nothing else (a stream with no duration
  // and no size), and three empty pills would be worse than none.
  const chips = info
    ? [
        // A clock rather than a second count («1:30:00», not «5400 с») and
        // gigabytes rather than four thousand megabytes: `lib/format` is the one
        // place in the app either is spelled, shared with the queue's ETA and the
        // model list's sizes.
        //
        // The clock is the one chip whose number does not name itself — «01:32»
        // could be a length, a start point or a bitrate — so it carries the word
        // in its tooltip. The size chip has its unit written on it and needs none.
        {
          k: "duration",
          text: info.duration_s == null ? "" : duration(info.duration_s),
          title: info.duration_s == null ? "" : t("durationNamed", { time: duration(info.duration_s) }),
        },
        {
          k: "size",
          text: info.size_bytes == null ? "" : size(info.size_bytes, { kb: t("unitKB"), mb: t("unitMB"), gb: t("unitGB") }),
          title: "",
        },
        // The codec line is the one chip that can outgrow the row it sits in
        // (`truncate` below), so it carries the whole summary as a tooltip. The
        // other two are short by construction — a tooltip repeating them would be
        // noise.
        { k: "summary", text: info.summary, title: info.summary },
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
              {/* `text-ink`, not `ink-2`: on the `card-2` pill that pair measures
                  4.25:1 in the light theme, under the 4.5 floor small text has to
                  clear — the same reason the queue's lane badge is drawn in `ink`.
                  The pill's own wash is what makes these read as secondary. */}
              {chips.map(c => (
                <span key={c.k} title={c.title || undefined}
                  className="max-w-full truncate rounded-full bg-card-2 px-2 py-0.5 text-xs text-ink">{c.text}</span>
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
        <button onClick={onClear} aria-label={t("clearNamed", { name })}
          className="shrink-0 text-ink-2 transition hover:text-tomato">✕</button>
      </div>
    </div>
  );
}
