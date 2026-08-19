import { useCallback, useEffect, useState } from "react";
import { BrainCircuit, CircleAlert } from "lucide-react";
import { size } from "../lib/format";
import { loc, useLocale, useT } from "../lib/i18n";
import { cancelModelDownload, deleteModel, downloadModel, getModels, onModelProgress } from "../lib/ipc";
import type { ModelView } from "../lib/types";

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
    <section className="min-h-0 overflow-y-auto p-4">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
        <div>
          <h1 className="text-base font-bold text-ink">{t("modelsTitle")}</h1>
          <p className="mt-1 text-xs text-ink-2">{t("modelsBlurb")}</p>
        </div>
        {models.map(m => {
          // `downloading` covers the remount case: switching to Convert and back
          // unmounts this panel, and the map in Rust is what still knows.
          const pct = progress[m.id] ?? (m.downloading ? 0 : undefined);
          return (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-card p-3">
              <div className="flex min-w-0 items-center gap-3">
                {/* The tile turns basil once the model is on disk: "installed" is
                    otherwise only readable from which button the row is offering,
                    and that is the last thing a user looks at. */}
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-card-2">
                  <BrainCircuit className={`size-5 ${m.installed ? "text-basil" : "text-ink-2"}`} aria-hidden />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink">{m.id}</span>
                    {/* `text-ink` on the `card-2` pill for the same reason as the
                        file card's chips and the queue's lane badge: `ink-2` there
                        measures 4.25:1 in the light theme, under the small-text
                        floor of 4.5. */}
                    <span className="shrink-0 rounded-full bg-card-2 px-2 py-0.5 text-xs text-ink tabular-nums">
                      {size(m.approx_bytes, { kb: t("unitKB"), mb: t("unitMB"), gb: t("unitGB") })}
                    </span>
                  </div>
                  {/* The note is written on the Rust side in both languages. Through
                      `loc` rather than a ternary, so a model shipped without a Russian
                      note reads English instead of reading blank. */}
                  <p className="text-xs text-ink-2">{loc({ en: m.note_en, ru: m.note_ru }, locale)}</p>
                </div>
              </div>
              {pct !== undefined ? (
                <div className="flex shrink-0 items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-card-2">
                    <div className="h-full rounded-full bg-amber" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-9 text-right text-xs text-ink-2 tabular-nums">{Math.round(pct)}%</span>
                  {cancelling[m.id] ? (
                    <span className="text-xs text-ink-2 italic" title={t("cancelHint")}>{t("cancelling")}</span>
                  ) : (
                    // `aria-label`, not `title` — and the reason is the ✕ itself.
                    // A title only becomes a button's accessible name when the
                    // button has no content to take one from; this one has the
                    // glyph, so the name a screen reader announced was "✕" and the
                    // words were demoted to a description. Same shape as the other
                    // two ✕ in the app (the file card's and the form's): the glyph
                    // is text, so the name has to be an `aria-label`, and there is
                    // no `title` beside it because identical name-and-description
                    // is announced twice.
                    <button onClick={() => cancel(m.id)} aria-label={t("cancelDownload")}
                      className="text-xs text-ink-2 transition hover:text-tomato">✕</button>
                  )}
                </div>
              ) : m.installed ? (
                <button onClick={() => { setError(""); deleteModel(m.id).then(refresh).catch(e => setError(String(e))); }}
                  className="shrink-0 text-xs font-medium text-ink-2 transition hover:text-tomato">{t("deleteModel")}</button>
              ) : (
                <button onClick={() => download(m.id)}
                  className="shrink-0 rounded-lg bg-basil px-3 py-1.5 text-xs font-semibold text-basil-ink transition hover:opacity-95">
                  {t("download")}
                </button>
              )}
            </div>
          );
        })}
        {error ? (
          <p className="flex items-start gap-1.5 break-words text-xs text-tomato">
            <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
            <span className="min-w-0">{error}</span>
          </p>
        ) : null}
      </div>
    </section>
  );
}
