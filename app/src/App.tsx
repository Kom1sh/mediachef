import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DropZone } from "./components/DropZone";
import { FileCard } from "./components/FileCard";
import { ModelsPanel } from "./components/ModelsPanel";
import { RecipeForm } from "./components/RecipeForm";
import { RecipeList } from "./components/RecipeList";
import { QueuePanel } from "./components/QueuePanel";
import { Sidebar, type Tab } from "./components/Sidebar";
import { getRecipes, onJobUpdate, probeFile } from "./lib/ipc";
import { applicable, buildIndex, search } from "./lib/search";
import type { ProbeInfo, Recipe } from "./lib/types";
import "./index.css";

/** One dropped file: its path, what ffprobe said, or why ffprobe would not say. */
interface Entry { path: string; info: ProbeInfo | null; probeError: string }

/** Keeps `active` inside a list that just got shorter; 0 when nothing is left. */
const clamp = (i: number, len: number) => Math.max(0, Math.min(i, len - 1));

export default function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [files, setFiles] = useState<Entry[]>([]);
  // Index into `files`. The active card is the one the recipe filter and the form
  // are pointed at — with several files up at once, something has to be.
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Recipe | null>(null);
  // Owned here, not in a child, so anything on the Convert side can send the user
  // to Models: T8 threads `onOpenModels={() => setTab("models")}` into RecipeForm
  // for the "no model downloaded yet" case.
  const [tab, setTab] = useState<Tab>("main");

  // A mirror of `files`, written synchronously with every state write. The
  // `job:update` listener below is registered once for the app's lifetime, so its
  // closure would otherwise only ever see the empty list from the first render;
  // the probe loop likewise needs the list as it stands now, not as it stood when
  // the drop began.
  const filesRef = useRef<Entry[]>([]);

  useEffect(() => { getRecipes().then(setRecipes); }, []);

  // The single writer for `files` — every add, removal and per-file update goes
  // through here, which is what keeps the ref from drifting from the state (the one
  // real failure mode of mirroring state in a ref). Resolving an updater against
  // the ref rather than against React's pending state is safe for the same reason:
  // the ref is already up to date when a second call lands in the same tick.
  const commitFiles = useCallback((next: Entry[] | ((prev: Entry[]) => Entry[])) => {
    const value = typeof next === "function" ? next(filesRef.current) : next;
    filesRef.current = value;
    setFiles(value);
  }, []);

  const addFiles = useCallback((paths: string[]) => {
    const prev = filesRef.current;
    // Paths already in the list are skipped rather than re-added: two cards for one
    // file would clear each other on the first `done`, and re-probing tells us
    // nothing we do not already have.
    const fresh = paths.filter((p, i) => paths.indexOf(p) === i && !prev.some(f => f.path === p));
    if (fresh.length > 0) {
      commitFiles([...prev, ...fresh.map(p => ({ path: p, info: null, probeError: "" }))]);
    }
    // The first path of the drop is the one the user was pointing at, so it takes
    // the active slot — including when it turned out to be a duplicate, where the
    // drop would otherwise look like it had done nothing at all.
    const focus = filesRef.current.findIndex(f => f.path === paths[0]);
    if (focus >= 0) setActive(focus);

    // One probe at a time, deliberately: a drop of a dozen files would otherwise
    // start a dozen ffprobe processes at once, and the probe of the card the user is
    // actually looking at would be queued behind the other eleven. A file removed
    // while its probe is in flight is simply not found by the `map` below, so a late
    // answer cannot resurrect a dismissed card.
    void (async () => {
      for (const p of fresh) {
        try {
          const info = await probeFile(p);
          commitFiles(fs => fs.map(f => (f.path === p ? { ...f, info, probeError: "" } : f)));
        } catch (e) {
          commitFiles(fs => fs.map(f => (f.path === p ? { ...f, info: null, probeError: String(e) } : f)));
        }
      }
    })();
  }, [commitFiles]);

  // Back to one fewer card: the ✕ and the auto-removal below both come through
  // here. An unknown path is a no-op, which is what makes it safe to hand every
  // finished job's input to it.
  const removeFile = useCallback((path: string) => {
    const prev = filesRef.current;
    const i = prev.findIndex(f => f.path === path);
    if (i < 0) return;
    const next = prev.filter(f => f.path !== path);
    commitFiles(next);
    // A card removed above the active one shifts it up by one; removing the active
    // card leaves the index on whatever slid into its place, which needs clamping
    // only when it was the last card in the list.
    setActive(a => clamp(i < a ? a - 1 : a, next.length));
  }, [commitFiles]);

  // The cards' own life cycle, kept apart from the queue's listener in QueuePanel:
  // once the file a card is showing has actually been converted, holding on to it
  // invites a second identical job. Only `done` removes — an `error` or a
  // `cancelled` job is exactly when the user still needs the card to retry from.
  //
  // One listener for the app's lifetime, not one per file: the life cycle belongs to
  // the list, so keying this effect on an entry would re-cross the IPC bridge on
  // every drop and every removal and leave the gap between unlisten and listen
  // deaf. `removeFile` is useCallback-stable, so the empty dep list states that
  // intent rather than merely getting away with it — the list it reads comes from
  // `filesRef`, not from this closure.
  useEffect(() => {
    const un = onJobUpdate(j => { if (j.status === "done") removeFile(j.input); });
    // .catch for the same upstream tauri bug the other unlisten cleanups guard
    // against (unguarded unlisten script + StrictMode double-mount).
    return () => { un.then(f => f()).catch(() => {}); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- removeFile is stable by construction

  const activeFile = files[active] ?? null;
  const activeInfo = activeFile?.info ?? null;

  // A picked recipe survives a card switch — that is what makes "same recipe, next
  // file" work at all, and the batch button below lives inside the open form — but
  // only while there is still a file it fits.
  useEffect(() => {
    if (!selected) return;
    // An empty list has nothing to run against, so the form is already hidden. Left
    // picked, the recipe would spring back open on the next drop — for a file the
    // user never chose it for.
    if (!activeFile) { setSelected(null); return; }
    // Dropping it on a type mismatch hands the user the recipe list already filtered
    // to the file they just clicked, instead of a form whose one possible answer is
    // the engine's "wrong input type".
    if (activeFile.info && !applicable(selected, activeFile.info.media_type)) setSelected(null);
  }, [selected, activeFile]);

  // Armed only when the recipe fits *every* card. A batch that would be rejected on
  // one file is not a batch, and that rejection would land after the queue had
  // already accepted the others. A file whose probe has not answered (or failed)
  // counts as unknown rather than as a fit: `applicable` says `true` for an unknown
  // type, which is right when filtering a list and wrong as a promise about N files.
  const batch = useMemo(() => {
    if (files.length < 2 || !selected) return undefined;
    return files.every(f => f.info && applicable(selected, f.info.media_type))
      ? files.map(f => f.path)
      : undefined;
  }, [files, selected]);

  const index = useMemo(() => buildIndex(recipes), [recipes]);
  const results = useMemo(
    () => search(index, query, activeInfo?.media_type),
    [index, query, activeInfo],
  );

  return (
    // Rail · board · queue. `minmax(0, …)` on the row and the middle column, not
    // plain `1fr`: the scrolling children below need a track that is allowed to be
    // smaller than its content.
    <main className="grid h-screen grid-cols-[72px_minmax(0,1fr)_360px] grid-rows-[minmax(0,1fr)] bg-paper text-ink">
      <Sidebar tab={tab} onTab={setTab} />
      {/* Settings is a hole in the shell until T2 lands the screen — the nav item
          is here now so the rail is not rebuilt twice. */}
      {tab === "models" ? <ModelsPanel /> : tab === "settings" ? <div /> : (
        <section className="flex min-h-0 flex-col gap-3 overflow-y-auto p-4">
          {files.map((f, i) => (
            <FileCard key={f.path} path={f.path} info={f.info} probeError={f.probeError}
              // With a single card there is nothing to choose between, so a
              // highlight would be pure decoration: it is there to answer "which of
              // these drives the filter", a question only a list can raise.
              active={files.length > 1 && i === active}
              onSelect={() => setActive(i)} onClear={() => removeFile(f.path)} />
          ))}
          <DropZone onFiles={addFiles} />
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search: «видео в мп3», «make gif»…"
            className="w-full rounded-lg border border-line bg-card p-2 text-sm"
          />
          {/* `key` on the recipe id: the form seeds its params from the recipe once,
              at mount, so a swap without a remount would run the new recipe with the
              old recipe's params — along with a stale busy flag and enqueue error. */}
          {selected && activeFile
            ? <RecipeForm key={selected.id} recipe={selected} input={activeFile.path} batch={batch}
                onQueued={() => setSelected(null)} onClose={() => setSelected(null)}
                onOpenModels={() => setTab("models")} />
            : <RecipeList recipes={results} onPick={r => setSelected(r)} />}
          {files.length === 0 && <p className="text-xs text-ink-2">Drop files to filter recipes by type.</p>}
        </section>
      )}
      {/* Always mounted: a queue that vanished on a tab switch would drop its
          `job:update` listener and lose every finished job. The `grid` wrapper is
          what gives the column its margin without reaching into the panel's own
          classes (T6 restyles it): a single-cell grid stretches its child to the
          full column height, which a padded block would not. */}
      <div className="grid min-h-0 py-4 pr-4">
        <QueuePanel recipes={recipes} />
      </div>
    </main>
  );
}
