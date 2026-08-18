import { useEffect, useRef, useState } from "react";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import { cancelJob, listJobs, onJobUpdate, revealFile } from "../lib/ipc";
import type { JobView, Recipe } from "../lib/types";

const COLOR: Record<JobView["status"], string> = {
  queued: "text-neutral-400", running: "text-blue-400", done: "text-green-400",
  error: "text-red-400", cancelled: "text-neutral-500",
};

export function QueuePanel({ recipes }: { recipes: Recipe[] }) {
  const [jobs, setJobs] = useState<Map<number, JobView>>(new Map());
  const [actionError, setActionError] = useState<string>("");
  const notified = useRef(new Set<number>());

  useEffect(() => {
    listJobs().then(js => setJobs(new Map(js.map(j => [j.id, j]))));
    const un = onJobUpdate(j => {
      setJobs(m => new Map(m).set(j.id, j));
      if (j.status === "done" && !notified.current.has(j.id)) {
        notified.current.add(j.id);
        isPermissionGranted().then(async ok => {
          if (!ok) ok = (await requestPermission()) === "granted";
          if (ok) sendNotification({ title: "MediaChef", body: `Done: ${j.output.split("/").pop()}` });
        }).catch(() => {});
      }
    });
    return () => { un.then(f => f()); };
  }, []);

  const title = (id: string) => recipes.find(r => r.id === id)?.title.en ?? id;
  const list = [...jobs.values()].sort((a, b) => b.id - a.id);

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
                <button onClick={() => cancelJob(j.id)} className="mt-1 text-neutral-500 hover:text-red-400">Cancel</button>
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
