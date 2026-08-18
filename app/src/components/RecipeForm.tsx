import { useEffect, useMemo, useState } from "react";
import { enqueueJob, previewCmd } from "../lib/ipc";
import type { Param, Recipe } from "../lib/types";

function Field({ p, value, onChange }: { p: Param; value: string; onChange: (v: string) => void }) {
  const label = <span className="text-xs text-neutral-400">{p.label.en}{p.unit ? ` (${p.unit})` : ""}</span>;
  if (p.type === "enum") {
    return (
      <label className="block">{label}
        <select value={value} onChange={e => onChange(e.target.value)}
          className="mt-1 w-full rounded border border-neutral-600 bg-transparent p-1.5 text-sm">
          {(p.values ?? []).map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </label>
    );
  }
  if (p.type === "bool") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={value === "true"} onChange={e => onChange(String(e.target.checked))} />
        {p.label.en}
      </label>
    );
  }
  return (
    <label className="block">{label}
      <input type={p.type === "int" || p.type === "float" ? "number" : "text"} value={value}
        min={p.min ?? undefined} max={p.max ?? undefined} onChange={e => onChange(e.target.value)}
        className="mt-1 w-full rounded border border-neutral-600 bg-transparent p-1.5 text-sm" />
    </label>
  );
}

export function RecipeForm({ recipe, input, onQueued, onClose }:
  { recipe: Recipe; input: string; onQueued: () => void; onClose: () => void }) {
  const initial = useMemo(() => Object.fromEntries(recipe.params.map(p => [p.key, String(p.default ?? "")])), [recipe]);
  const [params, setParams] = useState<Record<string, string>>(initial);
  const [cmd, setCmd] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const t = setTimeout(() => {
      previewCmd(recipe.id, input, params)
        .then(argv => { setError(""); setCmd("ffmpeg " + argv.map(a => (/\s/.test(a) ? `"${a}"` : a)).join(" ")); })
        .catch(e => setError(String(e)));
    }, 150);
    return () => clearTimeout(t);
  }, [recipe.id, input, params]);

  const main = recipe.params.filter(p => !p.advanced);
  const advanced = recipe.params.filter(p => p.advanced);

  return (
    <div className="rounded-xl border border-neutral-700 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{recipe.title.en}</h2>
        <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300">✕</button>
      </div>
      <div className="mt-3 space-y-3">
        {main.map(p => <Field key={p.key} p={p} value={params[p.key] ?? ""} onChange={v => setParams(s => ({ ...s, [p.key]: v }))} />)}
        {advanced.length > 0 && (
          <details><summary className="cursor-pointer text-xs text-neutral-500">Advanced</summary>
            <div className="mt-2 space-y-3">
              {advanced.map(p => <Field key={p.key} p={p} value={params[p.key] ?? ""} onChange={v => setParams(s => ({ ...s, [p.key]: v }))} />)}
            </div>
          </details>
        )}
      </div>
      <pre className="mt-3 overflow-x-auto rounded bg-neutral-900 p-2 text-xs text-neutral-400">{error || cmd}</pre>
      <button
        onClick={() => { enqueueJob(recipe.id, input, params).then(onQueued).catch(e => setError(String(e))); }}
        disabled={!!error}
        className="mt-3 w-full rounded-lg bg-blue-600 p-2 text-sm font-medium disabled:opacity-50">
        Add to queue
      </button>
    </div>
  );
}
