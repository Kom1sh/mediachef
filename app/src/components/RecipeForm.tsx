import { useEffect, useMemo, useState } from "react";
import { enqueueJob, getModels, previewCmd } from "../lib/ipc";
import type { Param, Recipe } from "../lib/types";

// Whisper's own language table is ~100 codes long; this is the shortlist the spec
// asks for. `auto` is whisper's detector and stays first — it is the default of
// every transcription recipe. A code the list does not offer can still reach the
// engine through a recipe default: `language` params pass through Rust untouched.
const LANGS = ["auto", "ru", "en", "de", "es", "fr", "it", "pt", "uk", "kk"];

/** Shared by every text-ish control in the form (selects and inputs alike). */
const FIELD_CLASS = "mt-1 w-full rounded border border-neutral-600 bg-transparent p-1.5 text-sm";

function Field({ p, value, onChange }: { p: Param; value: string; onChange: (v: string) => void }) {
  const label = <span className="text-xs text-neutral-400">{p.label.en}{p.unit ? ` (${p.unit})` : ""}</span>;
  if (p.type === "language") {
    return (
      <label className="block">{label}
        <select value={value} onChange={e => onChange(e.target.value)} className={FIELD_CLASS}>
          {/* A recipe pinned to a code outside the shortlist would otherwise render
              as a select showing "auto" while the params say otherwise. */}
          {(LANGS.includes(value) ? LANGS : [value, ...LANGS]).map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </label>
    );
  }
  if (p.type === "enum") {
    return (
      <label className="block">{label}
        <select value={value} onChange={e => onChange(e.target.value)} className={FIELD_CLASS}>
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
        className={FIELD_CLASS} />
    </label>
  );
}

export function RecipeForm({ recipe, input, onQueued, onClose, onOpenModels }:
  { recipe: Recipe; input: string; onQueued: () => void; onClose: () => void; onOpenModels: () => void }) {
  const initial = useMemo(() => Object.fromEntries(recipe.params.map(p => [p.key, String(p.default ?? "")])), [recipe]);
  const [params, setParams] = useState<Record<string, string>>(initial);
  const [cmd, setCmd] = useState<string>("");
  const [error, setError] = useState<string>("");
  // Kept apart from `error` on purpose. `error` is the preview's verdict — the
  // command cannot be built, so there is nothing to queue and the button stays
  // disabled. An enqueue rejection is a different animal: the command was fine
  // and the attempt failed (input moved, ffprobe gone, disk full). That is a
  // retryable condition, so it must not disable the button that retries it.
  const [enqueueError, setEnqueueError] = useState<string>("");
  const [hint, setHint] = useState<string>("");
  // Which whisper models are on disk. `null` = the list has not answered yet, and
  // it is a state of its own: rendering the empty-state "Download a model" prompt
  // during that gap would tell the user to fetch a model they may already have.
  const [installed, setInstalled] = useState<string[] | null>(null);
  const [modelsError, setModelsError] = useState<string>("");
  // In-flight guard (spec §7 "never silently overwrite"): a double-click used to
  // fire two enqueues for one intent. The queue now hands the second job its own
  // output path, so the duplicate would produce a real second file — the user
  // asked once, so we send once.
  const [busy, setBusy] = useState(false);

  const modelParam = useMemo(() => recipe.params.find(p => p.type === "model"), [recipe]);
  const isWhisper = recipe.engine === "whisper";

  // Only whisper recipes carry a model param, so an ffmpeg form never pays for
  // this call. The list is read once per mount — which is also how a model
  // downloaded on the Models tab becomes visible here: coming back re-mounts the
  // Convert side (W2-12), and this effect runs again.
  useEffect(() => {
    if (!modelParam) return;
    let alive = true;
    getModels()
      .then(ms => { if (alive) { setInstalled(ms.filter(m => m.installed).map(m => m.id)); setModelsError(""); } })
      .catch(e => { if (alive) setModelsError(String(e)); });
    return () => { alive = false; };
  }, [modelParam]);

  // The recipes ship `small` as their default, which the user may well not have.
  // Falling back to the first installed model has to be written into `params`, not
  // just shown in the select: `params` is what the preview and the enqueue both
  // read, so a display-only fallback would show one model and run another.
  useEffect(() => {
    if (!modelParam || !installed || installed.length === 0) return;
    const key = modelParam.key;
    setParams(s => (installed.includes(s[key]) ? s : { ...s, [key]: installed[0] }));
  }, [modelParam, installed]);

  useEffect(() => {
    // Hold the first preview of a model-bearing recipe until the installed list
    // has answered. The recipes ship `small` as their default, so previewing
    // before auto-pick has rewritten `params` asks Rust about a model the user
    // very likely does not have — and flashes "model is not downloaded yet" at
    // someone who has one. A `models_list` failure lifts the gate: `installed`
    // then stays `null` forever, and a blank preview pane with a live "Add to
    // queue" button would be worse than the engine's own error.
    if (modelParam && installed === null && !modelsError) return;
    const t = setTimeout(() => {
      previewCmd(recipe.id, input, params)
        // A whisper preview already carries its own binary as argv[0] (the queue
        // assembles that command, not the recipe) — prefixing "ffmpeg" would name
        // the wrong tool. Whisper is the exception and every other engine the rule:
        // `preview` answers with a bare ffmpeg argv for anything that goes through
        // `build_argv`, which today includes `Engine::Pipeline` (it runs on the
        // ffmpeg lane, T6 note 6). Testing for the exception rather than for
        // `=== "ffmpeg"` keeps the prefix correct when that engine grows recipes.
        .then(argv => { setError(""); setHint(""); setCmd((isWhisper ? "" : "ffmpeg ") + argv.map(a => (/\s/.test(a) ? `"${a}"` : a)).join(" ")); })
        .catch(e => setError(String(e)));
    }, 150);
    return () => clearTimeout(t);
  }, [recipe.id, input, params, isWhisper, modelParam, installed, modelsError]);

  // Both the button and Retry go through here: one attempt per press, and the
  // previous failure is cleared before the new one starts so the red line always
  // describes the latest try.
  const submit = () => {
    if (busy) return;
    setBusy(true);
    setEnqueueError("");
    enqueueJob(recipe.id, input, params)
      .then(onQueued)
      .catch(e => setEnqueueError(String(e)))
      .finally(() => setBusy(false));
  };

  const copyCmd = () => {
    if (!cmd) return;
    navigator.clipboard.writeText(cmd)
      .then(() => setHint("Copied to clipboard"))
      .catch(e => setHint(String(e)));
  };

  const main = recipe.params.filter(p => !p.advanced);
  const advanced = recipe.params.filter(p => p.advanced);

  // The `model` control cannot live in `Field` with the other types: its options
  // are not in the recipe, they are whatever `models_list` says is on disk.
  const field = (p: Param) => {
    const onChange = (v: string) => setParams(s => ({ ...s, [p.key]: v }));
    if (p.type !== "model") return <Field key={p.key} p={p} value={params[p.key] ?? ""} onChange={onChange} />;
    // A `label` in every branch, like the other field types: in the select case it
    // is the implicit association, and in the empty-state case it makes the label
    // click the one button there is to click.
    return (
      <label key={p.key} className="block">
        <span className="text-xs text-neutral-400">{p.label.en}</span>
        {modelsError
          // The error alone is a dead end: the field has no select to offer and
          // no button either, and the Models screen is where a stuck model list
          // can actually be looked at. Same escape hatch as the empty state.
          ? <>
              <p className="mt-1 break-words text-xs text-red-400">{modelsError}</p>
              <button onClick={onOpenModels}
                className="mt-1 w-full rounded border border-blue-600 p-1.5 text-sm text-blue-400 hover:bg-blue-600/10">
                Open Models
              </button>
            </>
          : installed === null
            ? <p className="mt-1 text-xs text-neutral-500">Loading models…</p>
            : installed.length === 0
              // No select to offer, and no honest default either — the preview
              // pane says the same thing in the engine's words and keeps "Add to
              // queue" disabled. This is the way out of that dead end.
              ? <button onClick={onOpenModels}
                  className="mt-1 w-full rounded border border-blue-600 p-1.5 text-sm text-blue-400 hover:bg-blue-600/10">
                  Download a model → Models
                </button>
              : <select value={params[p.key] ?? ""} onChange={e => onChange(e.target.value)} className={FIELD_CLASS}>
                  {installed.map(id => <option key={id} value={id}>{id}</option>)}
                </select>}
      </label>
    );
  };

  return (
    <div className="rounded-xl border border-neutral-700 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{recipe.title.en}</h2>
        <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300">✕</button>
      </div>
      <div className="mt-3 space-y-3">
        {main.map(field)}
        {advanced.length > 0 && (
          <details><summary className="cursor-pointer text-xs text-neutral-500">Advanced</summary>
            <div className="mt-2 space-y-3">
              {advanced.map(field)}
            </div>
          </details>
        )}
      </div>
      {/* The marker line is a child of the <pre>, not part of `cmd`: click-to-copy
          copies the state, so the note never lands in the user's clipboard. */}
      <pre onClick={copyCmd}
        title={cmd ? (isWhisper ? "Click to copy — illustrative, not runnable as-is" : "Click to copy") : undefined}
        className="mt-3 overflow-x-auto rounded bg-neutral-900 p-2 text-xs text-neutral-400 [&:not(:empty)]:cursor-pointer">{error || cmd}
        {cmd && isWhisper
          ? <span className="mt-1 block text-neutral-600"># preview only — the queue decodes a 16 kHz WAV first, so this is not runnable as-is</span>
          : null}</pre>
      {hint ? <p className="mt-1 text-xs text-neutral-500">{hint}</p> : null}
      {enqueueError ? (
        <div className="mt-2 flex items-center justify-between gap-2 rounded border border-red-900 bg-red-950/40 p-2">
          <span className="break-words text-xs text-red-400">{enqueueError}</span>
          <button onClick={submit} disabled={busy} className="shrink-0 rounded bg-red-600 px-2 py-1 text-xs disabled:opacity-50">Retry</button>
        </div>
      ) : null}
      <button
        onClick={submit}
        disabled={!!error || busy}
        className="mt-3 w-full rounded-lg bg-blue-600 p-2 text-sm font-medium disabled:opacity-50">
        {busy ? "Adding…" : "Add to queue"}
      </button>
    </div>
  );
}
