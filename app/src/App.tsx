import { useCallback, useEffect, useMemo, useState } from "react";
import { DropZone } from "./components/DropZone";
import { FileCard } from "./components/FileCard";
import { ModelsPanel } from "./components/ModelsPanel";
import { RecipeForm } from "./components/RecipeForm";
import { RecipeList } from "./components/RecipeList";
import { QueuePanel } from "./components/QueuePanel";
import { getRecipes, probeFile } from "./lib/ipc";
import { buildIndex, search } from "./lib/search";
import type { ProbeInfo, Recipe } from "./lib/types";
import "./index.css";

const TABS = ["main", "models"] as const;
const TAB_LABEL: Record<(typeof TABS)[number], string> = { main: "Convert", models: "Models" };

export default function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [file, setFile] = useState<string | null>(null);
  const [info, setInfo] = useState<ProbeInfo | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [probeError, setProbeError] = useState("");
  // Owned here, not in a child, so anything on the Convert side can send the user
  // to Models: T8 threads `onOpenModels={() => setTab("models")}` into RecipeForm
  // for the "no model downloaded yet" case.
  const [tab, setTab] = useState<(typeof TABS)[number]>("main");

  useEffect(() => { getRecipes().then(setRecipes); }, []);

  const onFile = useCallback((p: string) => {
    setFile(p); setInfo(null); setSelected(null); setProbeError("");
    probeFile(p)
      .then(i => { setInfo(i); setProbeError(""); })
      .catch(e => { setInfo(null); setProbeError(String(e)); });
  }, []);

  const index = useMemo(() => buildIndex(recipes), [recipes]);
  const results = useMemo(
    () => search(index, query, info?.media_type),
    [index, query, info],
  );

  return (
    // `minmax(0, 1fr)` on the content row, not plain `1fr`: the scrolling children
    // below need a row that is allowed to be shorter than its content.
    <main className="grid h-screen grid-cols-[1fr_360px] grid-rows-[auto_minmax(0,1fr)] gap-4 bg-neutral-950 p-4 text-neutral-100">
      <nav className="col-span-2 flex gap-2 text-sm">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded px-3 py-1 ${tab === t ? "bg-neutral-800 text-white" : "text-neutral-500"}`}>
            {TAB_LABEL[t]}
          </button>
        ))}
      </nav>
      {tab === "models" ? <ModelsPanel /> : (
        <section className="flex min-h-0 flex-col gap-3 overflow-y-auto">
          {file ? <FileCard path={file} info={info} /> : null}
          {probeError ? <p className="text-xs text-red-400">{probeError}</p> : null}
          <DropZone onFile={onFile} />
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search: «видео в мп3», «make gif»…"
            className="w-full rounded-lg border border-neutral-700 bg-transparent p-2 text-sm"
          />
          {selected && file
            ? <RecipeForm recipe={selected} input={file} onQueued={() => setSelected(null)} onClose={() => setSelected(null)}
                onOpenModels={() => setTab("models")} />
            : <RecipeList recipes={results} onPick={r => setSelected(r)} />}
          {!file && <p className="text-xs text-neutral-500">Drop a file to filter recipes by type.</p>}
        </section>
      )}
      {/* Always mounted: a queue that vanished on a tab switch would drop its
          `job:update` listener and lose every finished job. */}
      <QueuePanel recipes={recipes} />
    </main>
  );
}
