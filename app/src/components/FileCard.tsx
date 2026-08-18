import type { ProbeInfo } from "../lib/types";

const fmtSize = (b: number | null) => (b == null ? "" : `${(b / 1024 / 1024).toFixed(1)} MB`);
const fmtDur = (s: number | null) => (s == null ? "" : `${Math.round(s)}s`);

export function FileCard({ path, info }: { path: string; info: ProbeInfo | null }) {
  const name = path.split("/").pop();
  return (
    <div className="rounded-lg border border-neutral-700 p-3 text-sm">
      <div className="truncate font-medium">{name}</div>
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
