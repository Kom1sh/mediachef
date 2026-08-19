import { useEffect, useRef, useState } from "react";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import { ChefHat, CircleAlert, Copy, FolderOpen } from "lucide-react";
import { KIND_ICON, KIND_LABEL, STATUS_ICON, STATUS_TINT } from "../lib/icons";
import { loc, useLocale, useT, type TKey } from "../lib/i18n";
import { cancelJob, listJobs, onJobUpdate, revealFile } from "../lib/ipc";
import type { JobView, Recipe } from "../lib/types";

/** The five words a job can be. Exhaustive by type: a status added on the Rust
 *  side cannot reach the card without a word for it in both languages.
 *
 *  The word is not printed on the card any more — the status icon carries it, and
 *  this is the icon's accessible name. So it is also what a screen reader reads
 *  where a sighted user sees a spinning amber ring or a basil tick. */
const STATUS_KEY: Record<JobView["status"], TKey> = {
  queued: "st_queued", running: "st_running", done: "st_done",
  error: "st_error", cancelled: "st_cancelled",
};

/** The one Rust-side failure the card says in the user's own language (Ruling
 *  W3-4 — every error gets a marker in wave 4; until then the rest stay English).
 *
 *  `run_whisper` fails a transcription with no words in it as `no_speech: …`, which
 *  `errors::humanize` turns into an English sentence for `error` while the marker
 *  itself leads `error_detail` — so both fields are tested, and either one carrying
 *  it means the same thing.
 *
 *  The marker has to be at the *head* of the text, not merely somewhere in it:
 *  `error_detail` ends in engine output that quotes the user's file name, and a
 *  clip called `no_speech.mp4` that failed to decode must not be told it has no
 *  speech in it.
 *
 *  Only the summary line is swapped: the status word stays "error" (nothing was
 *  produced) and the raw log stays one click away underneath. */
const isNoSpeech = (j: JobView) =>
  [j.error, j.error_detail].some(s => (s ?? "").startsWith("no_speech:"));

/** Waiting or working — the two states a card can still leave on its own, and what
 *  the header counter counts. */
const isActive = (j: JobView) => j.status === "queued" || j.status === "running";

const mmss = (s: number) => {
  const t = Math.max(0, Math.round(s));
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};

export function QueuePanel({
  recipes,
  notificationsEnabled,
}: {
  recipes: Recipe[];
  notificationsEnabled: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const [jobs, setJobs] = useState<Map<number, JobView>>(new Map());
  const [actionError, setActionError] = useState<string>("");
  const notified = useRef(new Set<number>());
  // Mirrored for the same reason as `notify` below: the desktop notification is
  // composed inside the once-registered listener, so reading `t` from this render's
  // closure would keep sending "Done: …" to someone who switched to Russian an hour
  // ago. The switch has to reach the notification, not just the window.
  const translate = useRef(t);
  useEffect(() => { translate.current = t; }, [t]);
  // Mirrored into a ref because the `job:update` listener below is registered
  // once for the panel's lifetime: read through the prop, its closure would keep
  // answering with the value from the first render and the toggle would only take
  // effect after a restart.
  const notify = useRef(notificationsEnabled);
  useEffect(() => { notify.current = notificationsEnabled; }, [notificationsEnabled]);
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
      // The gate comes before the "already notified" mark, so the set tracks
      // notifications actually sent — not jobs that finished while muted.
      if (j.status === "done" && notify.current && !notified.current.has(j.id)) {
        notified.current.add(j.id);
        isPermissionGranted().then(async ok => {
          if (!ok) ok = (await requestPermission()) === "granted";
          if (ok) {
            sendNotification({
              title: translate.current("appName"),
              body: translate.current("notifyDone", { name: j.output.split("/").pop() ?? "" }),
            });
          }
        }).catch(() => {});
      }
    });
    // .catch: tauri 2.11.5's unlisten script is unguarded and StrictMode double-mounts,
    // so unlisten can reject for an already-removed registry entry (upstream bug).
    return () => { un.then(f => f()).catch(() => {}); };
  }, []);

  // The id is the fallback for a job whose recipe is no longer in the catalog —
  // untranslatable by nature, and better than a blank row.
  const title = (id: string) => {
    const r = recipes.find(x => x.id === id);
    return r ? loc(r.title, locale) : id;
  };
  const list = [...jobs.values()].sort((a, b) => b.id - a.id);
  const active = list.filter(isActive).length;

  // Naive linear extrapolation, and deliberately so — the alternative is to model
  // per-recipe throughput, which no recipe knows. Below 3% the divisor is small
  // enough that the number would swing by minutes between two ticks, so the card
  // shows a dash instead of lying precisely.
  const eta = (j: JobView) => {
    const t0 = startedAt.current[j.id];
    if (t0 === undefined || j.percent < 3) return "—";
    const elapsed = (Date.now() - t0) / 1000;
    return t("etaLeft", { time: mmss((elapsed * (100 - j.percent)) / Math.max(j.percent, 1)) });
  };

  // Reveal and copy-log are the two things here that can fail, and they fail the
  // same way: report it under the list, and clear it the moment the next attempt
  // succeeds.
  const attempt = (p: Promise<unknown>) =>
    p.then(() => setActionError("")).catch(e => setActionError(String(e)));

  return (
    // No surface of its own: the cards are the surface, and a panel background
    // behind them would have to be `card`, which is exactly the colour the cards
    // (and their `card-2` progress tracks and badges) need to be read against.
    <aside className="flex min-h-0 flex-col">
      <div className="mb-2 flex shrink-0 items-center gap-2">
        <h2 className="text-sm font-semibold text-ink">{t("queue")}</h2>
        {/* Only while something is in flight: a zero would be a badge saying
            nothing is happening, which the empty list below already says.
            The amber wash carries the "working" colour; the numeral itself is
            `ink`, because amber-on-amber/15 measures 2.2:1 in the light theme —
            the plan's own floor for small text on amber is 4.5:1, and `ink` is
            the only token that clears it in both themes (12.7 / 10.9). */}
        {active > 0 ? (
          <span title={t("activeN", { n: active })}
            className="rounded-full bg-amber/15 px-2 py-0.5 text-xs font-semibold text-ink tabular-nums">
            {active}
          </span>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {list.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <ChefHat className="size-8 text-ink-2" aria-hidden />
            <p className="text-xs text-ink-2">{t("queueEmpty")}</p>
          </div>
        )}
        {list.map(j => {
          const Status = STATUS_ICON[j.status];
          const Kind = KIND_ICON[j.kind];
          // Both waiting states show the bar, and `done` keeps it: a full basil
          // track is the difference between "finished" and "the card stopped
          // updating". `error` and `cancelled` have no bar to be honest about —
          // the run stopped somewhere the percentage does not describe.
          const bar = isActive(j) || j.status === "done";
          return (
            <div key={j.id} className="rounded-xl border border-line bg-card p-3">
              <div className="flex items-start gap-2">
                {/* The icon *is* the status word: amber ring for running (spinning
                    where the platform allows it), basil tick for done, tomato
                    circle for a failure. `role="img"` + the word as its label is
                    what keeps that legible to a screen reader. */}
                <Status role="img" aria-label={t(STATUS_KEY[j.status])}
                  className={`mt-px size-4 shrink-0 ${STATUS_TINT[j.status]} ${j.status === "running" ? "animate-spin" : ""}`} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{title(j.recipe_id)}</span>
                {/* Which lane ran it. The lanes drain independently, so a queued
                    transcription beside a running conversion is the queue working
                    as designed — and this badge is the only place that says so.
                    `text-ink` rather than `ink-2`, because at 10px the quieter
                    pair is not enough: `ink-2` on `card-2` measures 4.25:1 in the
                    light theme, under the 4.5 floor, while `ink` clears 13:1. */}
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-card-2 px-2 py-0.5 text-[10px] font-medium text-ink">
                  <Kind className="size-3 shrink-0 text-ink-2" aria-hidden />
                  {KIND_LABEL[j.kind]}
                </span>
              </div>
              {/* Which file, until there is a result to name instead. */}
              {j.status === "done" ? null : (
                <p className="mt-1 truncate text-xs text-ink-2" title={j.input}>{j.input.split("/").pop()}</p>
              )}
              {bar && (
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-card-2">
                  {/* `percent` is 100 on done (queue.rs `finish`), so the width is
                      the job's own number in every state the bar is shown in. */}
                  <div className={`h-full rounded-full ${j.status === "done" ? "bg-basil" : "bg-amber"}`}
                    style={{ width: `${j.percent}%` }} />
                </div>
              )}
              {isActive(j) && (
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <button onClick={() => cancelJob(j.id)}
                    className="text-xs font-medium text-ink-2 transition hover:text-tomato">{t("cancel")}</button>
                  {/* tabular numerals: the estimate counts down in place, and
                      proportional digits would jiggle the whole line every tick. */}
                  {j.status === "running" ? <span className="text-xs text-ink-2 tabular-nums">{eta(j)}</span> : null}
                </div>
              )}
              {j.status === "done" && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-xs text-ink-2" title={j.output}>
                    {j.output.split("/").pop()}
                  </span>
                  {/* `title` alone: on an icon-only button it is both the tooltip
                      and the accessible name. */}
                  <button onClick={() => attempt(revealFile(j.output))} title={t("showInFinder")}
                    className="shrink-0 rounded-md p-1 text-ink-2 transition hover:bg-card-2 hover:text-ink">
                    <FolderOpen className="size-4" aria-hidden />
                  </button>
                </div>
              )}
              {/* The status word, printed only here. Every other state has a line
                  of its own that says what happened; a cancelled job has nothing
                  left to show but the fact. */}
              {j.status === "cancelled" && <p className="mt-1.5 text-xs text-ink-2">{t("st_cancelled")}</p>}
              {j.status === "error" && (
                <details className="mt-1.5">
                  <summary className="cursor-pointer text-xs font-medium text-tomato">
                    {isNoSpeech(j) ? t("noSpeech") : (j.error ?? t("failed"))}
                  </summary>
                  {/* The engine's own words, in mono because they are output and
                      not prose — `text-ink` at 11px on `card-2`, the smallest
                      size that pair carries. */}
                  <pre className="mt-1.5 max-h-32 overflow-auto rounded-lg bg-card-2 p-2 font-mono text-[11px] whitespace-pre-wrap text-ink">{j.error_detail}</pre>
                  <button onClick={() => attempt(navigator.clipboard.writeText(j.error_detail ?? ""))}
                    className="mt-1.5 flex items-center gap-1 text-xs text-ink-2 transition hover:text-ink">
                    <Copy className="size-3 shrink-0" aria-hidden />
                    {t("copyLog")}
                  </button>
                </details>
              )}
            </div>
          );
        })}
      </div>
      {actionError ? (
        <p className="mt-2 flex shrink-0 items-start gap-1.5 text-xs text-tomato">
          <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
          <span className="min-w-0 break-words">{actionError}</span>
        </p>
      ) : null}
    </aside>
  );
}
