import { useCallback, useEffect, useMemo, useState } from "react";
import { DropZone } from "./components/DropZone";
import { FileCard } from "./components/FileCard";
import { RecipeForm } from "./components/RecipeForm";
import { RecipeList } from "./components/RecipeList";
import { QueuePanel } from "./components/QueuePanel";
import { getRecipes, probeFile } from "./lib/ipc";
import { buildIndex, search } from "./lib/search";
import type { ProbeInfo, Recipe } from "./lib/types";
import "./index.css";

export default function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [file, setFile] = useState<string | null>(null);
  const [info, setInfo] = useState<ProbeInfo | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [probeError, setProbeError] = useState("");

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
    <main className="grid h-screen grid-cols-[1fr_360px] gap-4 bg-neutral-950 p-4 text-neutral-100">
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
          ? <RecipeForm recipe={selected} input={file} onQueued={() => setSelected(null)} onClose={() => setSelected(null)} />
          : <RecipeList recipes={results} onPick={r => setSelected(r)} />}
        {!file && <p className="text-xs text-neutral-500">Drop a file to filter recipes by type.</p>}
      </section>
      <QueuePanel recipes={recipes} />
    </main>
  );
}
