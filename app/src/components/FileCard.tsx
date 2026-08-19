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
  return (
    <div className={`rounded-lg border p-3 text-sm ${active ? "border-blue-500 bg-blue-500/5" : "border-neutral-700"}`}>
      <div className="flex items-start justify-between gap-2">
        {/* The name is the click target rather than the whole card: a card-wide
            onClick would have to sit on a div (the ✕ inside rules out a <button>),
            and that trades a real button — keyboard and screen reader included —
            for a few more pixels of hit area. */}
        <button type="button" onClick={onSelect} className="min-w-0 flex-1 truncate text-left font-medium">{name}</button>
        {/* The way out of a chosen file. Without it the only path back to "no
            file" was finishing a job or restarting the app. No `title` beside the
            `aria-label`: title is demoted to the description and announced after
            the name, so the button said "Убрать отпуск.mp4, Убрать файл". */}
        <button onClick={onClear} aria-label={t("clearNamed", { name: name ?? "" })}
          className="shrink-0 text-neutral-500 hover:text-neutral-300">✕</button>
      </div>
      {info && (
        <div className="mt-1 flex gap-2 text-xs text-neutral-400">
          <span className="rounded bg-neutral-700 px-1.5 py-0.5 uppercase">{t(MEDIA_KEY[info.media_type])}</span>
          <span>{fmtDur(info.duration_s, t("unitSeconds"))}</span>
          <span>{fmtSize(info.size_bytes, t("unitMB"))}</span>
          <span className="truncate">{info.summary}</span>
        </div>
      )}
      {/* On the card, not under the list: with several files up at once, a probe
          failure floating below them would not say which one it belongs to. */}
      {probeError ? <p className="mt-1 break-words text-xs text-red-400">{probeError}</p> : null}
    </div>
  );
}
