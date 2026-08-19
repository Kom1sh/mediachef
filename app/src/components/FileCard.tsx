import type { ProbeInfo } from "../lib/types";

const fmtSize = (b: number | null) => (b == null ? "" : `${(b / 1024 / 1024).toFixed(1)} MB`);
const fmtDur = (s: number | null) => (s == null ? "" : `${Math.round(s)}s`);

export function FileCard({ path, info, onClear }: { path: string; info: ProbeInfo | null; onClear: () => void }) {
  const name = path.split("/").pop();
  return (
    <div className="rounded-lg border border-neutral-700 p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="truncate font-medium">{name}</div>
        {/* The way out of a chosen file. Without it the only path back to "no
            file" was finishing a job or restarting the app. */}
        <button onClick={onClear} title="Clear file" aria-label="Clear file"
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
    </div>
  );
}
