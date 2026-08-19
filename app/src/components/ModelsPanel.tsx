import { useCallback, useEffect, useState } from "react";
import { loc, useLocale, useT } from "../lib/i18n";
import { cancelModelDownload, deleteModel, downloadModel, getModels, onModelProgress } from "../lib/ipc";
import type { ModelView } from "../lib/types";

// Units as words, not as literals: "GB" is "ГБ" in Russian.
const size = (b: number, gb: string, mb: string) =>
  (b / 1e9 >= 1 ? `${(b / 1e9).toFixed(1)} ${gb}` : `${Math.round(b / 1e6)} ${mb}`);

export function ModelsPanel() {
  const t = useT();
  const locale = useLocale();
  const [models, setModels] = useState<ModelView[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  // Ids whose cancel has been requested but whose terminal event has not landed.
  // A cancel is only noticed at the download's next socket read, so on a dead
  // connection that is up to the 30s read timeout — the row has to say so instead
  // of vanishing and pretending the download is already gone.
  const [cancelling, setCancelling] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string>("");

  const refresh = useCallback(
    () => getModels().then(setModels).catch(e => setError(String(e))),
    [],
  );

  useEffect(() => {
    // Subscribe first, list second. The other order leaves a window in which a
    // download that finishes between the two calls loses its terminal event: the
    // list would answer `downloading: true` (the claim is still held at the moment
    // it is read) and nothing would ever arrive to clear the progress row.
    const un = onModelProgress(p => {
      if (p.done) {
        // "cancelled" is the expected answer to pressing ✕, not a failure to
        // report in red.
        if (p.error && p.error !== "cancelled") setError(`${p.id}: ${p.error}`);
        setProgress(s => { const { [p.id]: _drop, ...rest } = s; return rest; });
        setCancelling(s => { const { [p.id]: _drop, ...rest } = s; return rest; });
        // Optimistic, so the row settles on this event rather than one render
        // later when `refresh` answers.
        setModels(ms => ms.map(m => (m.id === p.id ? { ...m, downloading: false } : m)));
        refresh();
      } else {
        setProgress(s => ({ ...s, [p.id]: p.percent }));
      }
    });
    refresh();
    return () => { un.then(f => f()).catch(() => {}); };
  }, [refresh]);

  // Every button here clears the error line first: it reports the outcome of the
  // user's latest action, and text left over from the previous one only misleads.
  const cancel = (id: string) => {
    setError("");
    setCancelling(s => ({ ...s, [id]: true }));
    cancelModelDownload(id).catch(e => {
      setError(String(e));
      // The request never landed, so no terminal event is coming to resolve
      // "Cancelling…" — put the ✕ back rather than leave the row wedged in a
      // state the user cannot leave.
      setCancelling(s => { const { [id]: _drop, ...rest } = s; return rest; });
    });
  };

  const download = (id: string) => {
    setError("");
    // Shows the row as in-flight before the first event arrives — a connection
    // takes a moment to open, and until then the button would stay clickable.
    // The Rust-side claim is the real defence against a rival download; this only
    // keeps the user from meeting it.
    setProgress(s => ({ ...s, [id]: 0 }));
    downloadModel(id).catch(e => {
      const msg = String(e);
      setError(msg);
      // Every rejection except this one means nothing is running, so the
      // optimistic row is a lie and has to go. "already downloading" means the
      // row is true after all — some other click owns it.
      if (!msg.includes("already downloading")) {
        setProgress(s => { const { [id]: _drop, ...rest } = s; return rest; });
      }
    });
  };

  return (
    <section className="mx-auto w-full max-w-xl space-y-2 overflow-y-auto p-2">
      <h2 className="text-sm font-medium text-neutral-300">{t("modelsTitle")}</h2>
      <p className="text-xs text-neutral-500">{t("modelsBlurb")}</p>
      {models.map(m => {
        // `downloading` covers the remount case: switching to Convert and back
        // unmounts this panel, and the map in Rust is what still knows.
        const pct = progress[m.id] ?? (m.downloading ? 0 : undefined);
        return (
          <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-neutral-700 p-3">
            <div className="min-w-0">
              <div className="text-sm font-medium">{m.id} <span className="text-xs text-neutral-500">{size(m.approx_bytes, t("unitGB"), t("unitMB"))}</span></div>
              {/* The note is written on the Rust side in both languages. Through
                  `loc` rather than a ternary, so a model shipped without a Russian
                  note reads English instead of reading blank. */}
              <div className="text-xs text-neutral-400">{loc({ en: m.note_en, ru: m.note_ru }, locale)}</div>
            </div>
            {pct !== undefined ? (
              <div className="flex shrink-0 items-center gap-2">
                <div className="h-1.5 w-24 rounded bg-neutral-800">
                  <div className="h-1.5 rounded bg-blue-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right text-xs text-neutral-500">{Math.round(pct)}%</span>
                {cancelling[m.id] ? (
                  <span className="text-xs text-neutral-500" title={t("cancelHint")}>{t("cancelling")}</span>
                ) : (
                  // `title` alone, as before: with no other labelling it is both the
                  // tooltip and the accessible name, and adding an `aria-label` of the
                  // same words would only make a screen reader say them twice.
                  <button onClick={() => cancel(m.id)} title={t("cancelDownload")}
                    className="text-xs text-neutral-500 hover:text-red-400">✕</button>
                )}
              </div>
            ) : m.installed ? (
              <button onClick={() => { setError(""); deleteModel(m.id).then(refresh).catch(e => setError(String(e))); }}
                className="shrink-0 text-xs text-neutral-500 hover:text-red-400">{t("deleteModel")}</button>
            ) : (
              <button onClick={() => download(m.id)}
                className="shrink-0 rounded bg-blue-600 px-3 py-1 text-xs font-medium">{t("download")}</button>
            )}
          </div>
        );
      })}
      {error ? <p className="break-words text-xs text-red-400">{error}</p> : null}
    </section>
  );
}
