import { useEffect, useMemo, useState } from "react";
import { loc, useLocale, useT } from "../lib/i18n";
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
  // Parameter labels ride in the recipe as an { en, ru } pair, like its title.
  // `p.unit` stays as written — the recipes spell units in symbols (kbit/s, °),
  // which are the same in both languages.
  const locale = useLocale();
  const name = loc(p.label, locale);
  const label = <span className="text-xs text-neutral-400">{name}{p.unit ? ` (${p.unit})` : ""}</span>;
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
        {name}
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

export function RecipeForm({ recipe, input, batch, onQueued, onClose, onOpenModels }:
  {
    recipe: Recipe;
    /** The active card's path — the one file "Add to queue" is about. */
    input: string;
    /**
     * Every path the batch button should queue, or `undefined` when there is no
     * batch to offer. App decides that, because deciding it means knowing each
     * file's media type and App is what holds the probes.
     */
    batch?: string[];
    onQueued: () => void;
    onClose: () => void;
    onOpenModels: () => void;
  }) {
  const t = useT();
  const locale = useLocale();
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
  // Which inputs of the last attempt did not make it into the queue. Retry re-sends
  // exactly these: re-running a whole batch after three of its four files were
  // accepted would put those three in a second time.
  const [failed, setFailed] = useState<string[]>([]);
  const [hint, setHint] = useState<string>("");
  // Which whisper models are on disk. `null` = the list has not answered yet, and
  // it is a state of its own: rendering the empty-state "Download a model" prompt
  // during that gap would tell the user to fetch a model they may already have.
  const [installed, setInstalled] = useState<string[] | null>(null);
  const [modelsError, setModelsError] = useState<string>("");
  // The in-flight attempt, held as the list of inputs it is queueing — `null` when
  // idle. It is the in-flight guard first (spec §7 "never silently overwrite": a
  // double-click used to fire two enqueues for one intent, and the queue hands the
  // second job its own output path, so the duplicate would be a real second file on
  // disk). It is a list rather than a flag because there are two submit buttons now,
  // and a flag cannot say which of them is the one working.
  const [running, setRunning] = useState<string[] | null>(null);
  const busy = running !== null;

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
    // `timer`, not `t` — that name is the translator in this component now.
    const timer = setTimeout(() => {
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
    return () => clearTimeout(timer);
  }, [recipe.id, input, params, isWhisper, modelParam, installed, modelsError]);

  // Both buttons and Retry go through here: an attempt is a list of inputs, and a
  // single "Add to queue" is the one-element case. One attempt per press, and the
  // previous failure is cleared before the new one starts so the red block always
  // describes the latest try.
  //
  // Sequential rather than Promise.all: `enqueue` is what reserves each job's output
  // name, so overlapping calls for one recipe could both find the same name free —
  // and this is the order the queue drains in anyway, so nothing is gained by
  // firing them together.
  const run = async (paths: string[]) => {
    if (busy || paths.length === 0) return;
    setRunning(paths);
    setEnqueueError("");
    const errs: string[] = [];
    const bad: string[] = [];
    for (const p of paths) {
      try {
        await enqueueJob(recipe.id, p, params);
      } catch (e) {
        bad.push(p);
        // One line per failure, named when there is more than one file in play:
        // "the input has moved" says nothing useful without saying which input.
        errs.push(paths.length > 1 ? `${p.split("/").pop()}: ${String(e)}` : String(e));
      }
    }
    setRunning(null);
    setFailed(bad);
    // A partial batch keeps the form open on purpose — the error block and its Retry
    // are the only way back to the files that did not make it.
    if (errs.length > 0) setEnqueueError(errs.join("\n"));
    else onQueued();
  };

  const copyCmd = () => {
    if (!cmd) return;
    navigator.clipboard.writeText(cmd)
      .then(() => setHint(t("copied")))
      .catch(e => setHint(String(e)));
  };

  const main = recipe.params.filter(p => !p.advanced);
  const advanced = recipe.params.filter(p => p.advanced);

  // The `model` control cannot live in `Field` with the other types: its options
  // are not in the recipe, they are whatever `models_list` says is on disk.
  const field = (p: Param) => {
    const onChange = (v: string) => {
      // A red block about an attempt made with the *previous* parameters is no longer
      // about anything the form is showing, and its Retry would re-send that stale
      // intent. The message and the retry list are one record of one attempt, so
      // they clear together. The auto-pick effect above writes `params` directly and
      // therefore does not clear anything — it is not the user changing their mind.
      setEnqueueError("");
      setFailed([]);
      setParams(s => ({ ...s, [p.key]: v }));
    };
    if (p.type !== "model") return <Field key={p.key} p={p} value={params[p.key] ?? ""} onChange={onChange} />;
    // A `label` in every branch, like the other field types: in the select case it
    // is the implicit association, and in the empty-state case it makes the label
    // click the one button there is to click.
    return (
      <label key={p.key} className="block">
        <span className="text-xs text-neutral-400">{loc(p.label, locale)}</span>
        {modelsError
          // The error alone is a dead end: the field has no select to offer and
          // no button either, and the Models screen is where a stuck model list
          // can actually be looked at. Same escape hatch as the empty state.
          ? <>
              <p className="mt-1 break-words text-xs text-red-400">{modelsError}</p>
              <button onClick={onOpenModels}
                className="mt-1 w-full rounded border border-blue-600 p-1.5 text-sm text-blue-400 hover:bg-blue-600/10">
                {t("openModels")}
              </button>
            </>
          : installed === null
            ? <p className="mt-1 text-xs text-neutral-500">{t("loadingModels")}</p>
            : installed.length === 0
              // No select to offer, and no honest default either — the preview
              // pane says the same thing in the engine's words and keeps "Add to
              // queue" disabled. This is the way out of that dead end.
              ? <button onClick={onOpenModels}
                  className="mt-1 w-full rounded border border-blue-600 p-1.5 text-sm text-blue-400 hover:bg-blue-600/10">
                  {t("downloadModelPrompt")}
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
        <h2 className="font-medium">{loc(recipe.title, locale)}</h2>
        {/* The glyph is not a name: without `aria-label` this button announces
            itself as "✕" or as nothing at all, depending on the screen reader. No
            `title` next to it — same text twice is announced twice. */}
        <button onClick={onClose} aria-label={t("close")}
          className="text-neutral-500 hover:text-neutral-300">✕</button>
      </div>
      <div className="mt-3 space-y-3">
        {main.map(field)}
        {advanced.length > 0 && (
          <details><summary className="cursor-pointer text-xs text-neutral-500">{t("advanced")}</summary>
            <div className="mt-2 space-y-3">
              {advanced.map(field)}
            </div>
          </details>
        )}
      </div>
      {/* The marker line is a child of the <pre>, not part of `cmd`: click-to-copy
          copies the state, so the note never lands in the user's clipboard. */}
      <pre onClick={copyCmd}
        title={cmd ? t(isWhisper ? "clickToCopyPreview" : "clickToCopy") : undefined}
        className="mt-3 overflow-x-auto rounded bg-neutral-900 p-2 text-xs text-neutral-400 [&:not(:empty)]:cursor-pointer">{error || cmd}
        {cmd && isWhisper
          ? <span className="mt-1 block text-neutral-600">{t("previewOnly")}</span>
          : null}</pre>
      {hint ? <p className="mt-1 text-xs text-neutral-500">{hint}</p> : null}
      {enqueueError ? (
        <div className="mt-2 flex items-center justify-between gap-2 rounded border border-red-900 bg-red-950/40 p-2">
          {/* `whitespace-pre-wrap`: a batch reports one line per failed file. */}
          <span className="whitespace-pre-wrap break-words text-xs text-red-400">{enqueueError}</span>
          {/* Also disabled on a preview error: the command can no longer be built, so
              there is nothing left to re-send. Reachable without a parameter edit —
              which would have cleared this block — when the active card changes under
              an open form, or when the model the params name leaves the disk. */}
          <button onClick={() => run(failed)} disabled={busy || !!error}
            className="shrink-0 rounded bg-red-600 px-2 py-1 text-xs disabled:opacity-50">
            {failed.length > 1 ? t("retryN", { n: failed.length }) : t("retryOne")}
          </button>
        </div>
      ) : null}
      <button
        onClick={() => run([input])}
        disabled={!!error || busy}
        className="mt-3 w-full rounded-lg bg-blue-600 p-2 text-sm font-medium disabled:opacity-50">
        {running?.length === 1 ? t("adding") : t("addToQueue")}
      </button>
      {batch && batch.length > 1 ? (
        // Secondary styling deliberately: N jobs from one press is the larger action,
        // and the wrong one if the user meant only the file they are looking at. The
        // count is in the label so the press is never a surprise.
        <button
          onClick={() => run(batch)}
          disabled={!!error || busy}
          className="mt-2 w-full rounded-lg border border-blue-600 p-2 text-sm font-medium text-blue-400 hover:bg-blue-600/10 disabled:opacity-50">
          {running && running.length > 1
            ? t("addingN", { n: running.length })
            : t("addAllN", { n: batch.length })}
        </button>
      ) : null}
    </div>
  );
}
