import { useEffect, useRef, useState } from "react";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import { cancelJob, listJobs, onJobUpdate, revealFile } from "../lib/ipc";
import type { JobView, Recipe } from "../lib/types";

const COLOR: Record<JobView["status"], string> = {
  queued: "text-neutral-400", running: "text-blue-400", done: "text-green-400",
  error: "text-red-400", cancelled: "text-neutral-500",
};

const mmss = (s: number) => {
  const t = Math.max(0, Math.round(s));
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};

export function QueuePanel({ recipes }: { recipes: Recipe[] }) {
  const [jobs, setJobs] = useState<Map<number, JobView>>(new Map());
  const [actionError, setActionError] = useState<string>("");
  const notified = useRef(new Set<number>());
  // When each job was first seen running — the clock the ETA is measured from.
  // A ref, not state: it is written from inside the same event that re-renders
  // the card anyway, so making it state would only buy a second render. Progress
  // events arrive often enough (percent-gated, a few per second) that the
  // estimate refreshes on its own without a timer.
  const startedAt = useRef<Record<number, number>>({});

  useEffect(() => {
    listJobs().then(js => setJobs(new Map(js.map(j => [j.id, j]))));
    const un = onJobUpdate(j => {
      if (j.status === "running" && startedAt.current[j.id] === undefined) {
        startedAt.current[j.id] = Date.now();
      }
      setJobs(m => new Map(m).set(j.id, j));
      if (j.status === "done" && !notified.current.has(j.id)) {
        notified.current.add(j.id);
        isPermissionGranted().then(async ok => {
          if (!ok) ok = (await requestPermission()) === "granted";
          if (ok) sendNotification({ title: "MediaChef", body: `Done: ${j.output.split("/").pop()}` });
        }).catch(() => {});
      }
    });
    // .catch: tauri 2.11.5's unlisten script is unguarded and StrictMode double-mounts,
    // so unlisten can reject for an already-removed registry entry (upstream bug).
    return () => { un.then(f => f()).catch(() => {}); };
  }, []);

  const title = (id: string) => recipes.find(r => r.id === id)?.title.en ?? id;
  const list = [...jobs.values()].sort((a, b) => b.id - a.id);

  // Naive linear extrapolation, and deliberately so — the alternative is to model
  // per-recipe throughput, which no recipe knows. Below 3% the divisor is small
  // enough that the number would swing by minutes between two ticks, so the card
  // shows a dash instead of lying precisely.
  const eta = (j: JobView) => {
    const t0 = startedAt.current[j.id];
    if (t0 === undefined || j.percent < 3) return "—";
    const elapsed = (Date.now() - t0) / 1000;
    return `~${mmss((elapsed * (100 - j.percent)) / Math.max(j.percent, 1))} left`;
  };

  return (
    <aside className="flex min-h-0 flex-col rounded-xl border border-neutral-800 p-3">
      <h2 className="mb-2 text-sm font-medium text-neutral-300">Queue</h2>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {list.length === 0 && <p className="text-xs text-neutral-500">Jobs will appear here.</p>}
        {list.map(j => (
          <div key={j.id} className="rounded-lg border border-neutral-800 p-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate">{title(j.recipe_id)}</span>
              <span className={COLOR[j.status]}>{j.status}</span>
            </div>
            <div className="mt-1 truncate text-neutral-500">{j.input.split("/").pop()}</div>
            {(j.status === "running" || j.status === "queued") && (
              <>
                <div className="mt-1 h-1.5 w-full rounded bg-neutral-800">
                  <div className="h-1.5 rounded bg-blue-500" style={{ width: `${j.percent}%` }} />
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <button onClick={() => cancelJob(j.id)} className="text-neutral-500 hover:text-red-400">Cancel</button>
                  {j.status === "running" ? <span className="tabular-nums text-neutral-500">{eta(j)}</span> : null}
                </div>
              </>
            )}
            {j.status === "done" && (
              <button onClick={() => revealFile(j.output).then(() => setActionError("")).catch(e => setActionError(String(e)))} className="mt-1 text-blue-400 hover:underline">Show in Finder</button>
            )}
            {j.status === "error" && (
              <details className="mt-1">
                <summary className="cursor-pointer text-red-400">{j.error ?? "Failed"}</summary>
                <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap text-neutral-500">{j.error_detail}</pre>
                <button onClick={() => navigator.clipboard.writeText(j.error_detail ?? "").then(() => setActionError("")).catch(e => setActionError(String(e)))} className="mt-1 text-neutral-400">Copy log</button>
              </details>
            )}
          </div>
        ))}
      </div>
      {actionError ? <p className="mt-2 text-xs text-red-400">{actionError}</p> : null}
    </aside>
  );
}
