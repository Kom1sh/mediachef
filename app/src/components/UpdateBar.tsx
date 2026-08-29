import { ArrowUpCircle, X } from "lucide-react";
import { useT } from "../lib/i18n";
import type { Updater } from "../lib/useUpdater";

/**
 * Полоса над рабочей областью: единственное место, где приложение само заговаривает
 * об обновлении.
 *
 * Появляется только когда есть что ставить, и только по делу — «версия актуальна»
 * и ошибки живут в настройках, куда человек приходит сам. Крестик убирает её до
 * конца сеанса: напоминание, от которого нельзя избавиться, читается как реклама.
 *
 * Перезапуск не делается сам после установки: в очереди может идти часовая
 * расшифровка, и обрывать её ради новой версии — не наше решение.
 */
export function UpdateBar({ updater }: { updater: Updater }) {
  const t = useT();
  const { state } = updater;

  const shown =
    state.kind === "found" || state.kind === "downloading" || state.kind === "ready";
  if (!shown || (updater.dismissed && state.kind === "found")) return null;

  const percent =
    state.kind === "downloading" && state.percent !== null
      ? Math.round(state.percent * 100)
      : null;

  return (
    <div
      // role="status": о появлении полосы экранный диктор сообщает, но не
      // перебивает то, что человек делает, — это не тревога.
      role="status"
      className="flex shrink-0 flex-wrap items-center gap-3 border-b border-line bg-card px-4 py-2.5"
    >
      <ArrowUpCircle className="size-4 shrink-0 text-basil" aria-hidden />

      <span className="min-w-0 flex-1 text-sm text-ink">
        {state.kind === "found" ? t("updFound", { version: state.version }) : null}
        {state.kind === "downloading"
          ? percent === null
            ? t("updDownloading")
            : t("updDownloadingPct", { percent: String(percent) })
          : null}
        {state.kind === "ready" ? t("updReady") : null}
      </span>

      {/* Полоса прогресса — только когда размер известен. Иначе она врала бы про
          «сколько осталось», а неопределённость честнее показать словами. */}
      {state.kind === "downloading" && percent !== null ? (
        <span className="h-1.5 w-32 shrink-0 overflow-hidden rounded-full bg-card-2">
          <span className="block h-full rounded-full bg-basil" style={{ width: `${percent}%` }} />
        </span>
      ) : null}

      {state.kind === "found" ? (
        <button
          type="button" onClick={updater.install}
          className="shrink-0 rounded-md bg-basil px-3 py-1.5 text-xs font-semibold text-basil-ink transition hover:opacity-95"
        >
          {t("updInstall")}
        </button>
      ) : null}

      {state.kind === "ready" ? (
        <button
          type="button" onClick={updater.restart}
          className="shrink-0 rounded-md bg-basil px-3 py-1.5 text-xs font-semibold text-basil-ink transition hover:opacity-95"
        >
          {t("updRestart")}
        </button>
      ) : null}

      {/* Закрыть можно только предложение. Во время загрузки и перед перезапуском
          крестика нет: убирать полосу, за которой идёт работа, некуда. */}
      {state.kind === "found" ? (
        <button
          type="button" onClick={updater.dismiss} aria-label={t("updLater")}
          className="shrink-0 rounded-md p-1 text-ink-2 hover:bg-card-2 hover:text-ink"
        >
          <X className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
