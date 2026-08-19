import type { ProbeInfo } from "../lib/types";

const fmtSize = (b: number | null) => (b == null ? "" : `${(b / 1024 / 1024).toFixed(1)} MB`);
const fmtDur = (s: number | null) => (s == null ? "" : `${Math.round(s)}s`);

export function FileCard({ path, info, probeError, active, onSelect, onClear }: {
  path: string;
  info: ProbeInfo | null;
  probeError: string;
  /** Highlighted, and the file the recipe filter and the form are pointed at. */
  active: boolean;
  onSelect: () => void;
  onClear: () => void;
}) {
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
            file" was finishing a job or restarting the app. */}
        <button onClick={onClear} title="Clear file" aria-label={`Clear ${name}`}
          className="shrink-0 text-neutral-500 hover:text-neutral-300">✕</button>
      </div>
      {info && (
        <div className="mt-1 flex gap-2 text-xs text-neutral-400">
          <span className="rounded bg-neutral-700 px-1.5 py-0.5 uppercase">{info.media_type}</span>
          <span>{fmtDur(info.duration_s)}</span>
          <span>{fmtSize(info.size_bytes)}</span>
          <span className="truncate">{info.summary}</span>
        </div>
      )}
      {/* On the card, not under the list: with several files up at once, a probe
          failure floating below them would not say which one it belongs to. */}
      {probeError ? <p className="mt-1 break-words text-xs text-red-400">{probeError}</p> : null}
    </div>
  );
}
