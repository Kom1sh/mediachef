import { MessageSquare, Star, X } from "lucide-react";
import { useT } from "../lib/i18n";

/**
 * Полоса «как вам программа» над рабочей областью — вторая, после обновления, и
 * последняя, где приложение заговаривает само.
 *
 * Когда и сколько раз её показывать, решает `lib/ask.ts`; здесь только вид. Устроена
 * так же, как `UpdateBar`, и живёт на её месте: две полосы разом сдвигали бы рабочую
 * область на полэкрана, поэтому при предложении обновления эта ждёт.
 *
 * Все три кнопки закрывают её навсегда — и «написать», и «звезда», и крестик.
 * Подпись крестика говорит это прямо («больше не спрашивать»), а не «позже»: позже
 * не будет.
 */
export function AskBar({ onFeedback, onStar, onDismiss }: {
  onFeedback: () => void;
  onStar: () => void;
  onDismiss: () => void;
}) {
  const t = useT();
  return (
    <div
      // Как у полосы обновления: диктор сообщит о появлении, но не перебьёт.
      role="status"
      className="flex shrink-0 flex-wrap items-center gap-3 border-b border-line bg-card px-4 py-2.5"
    >
      <MessageSquare className="size-4 shrink-0 text-basil" aria-hidden />

      <span className="min-w-0 flex-1 text-sm text-ink">{t("askText")}</span>

      <button
        type="button" onClick={onFeedback}
        className="shrink-0 rounded-md bg-basil px-3 py-1.5 text-xs font-semibold text-basil-ink transition hover:opacity-95"
      >
        {t("askFeedback")}
      </button>

      {/* Вторичная: рамка вместо заливки. Главная просьба — рассказать, звезда —
          для тех, кому рассказывать нечего, а помочь хочется. */}
      <button
        type="button" onClick={onStar}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-line-strong px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-card-2"
      >
        <Star className="size-3.5" aria-hidden />
        {t("askStar")}
      </button>

      <button
        type="button" onClick={onDismiss} aria-label={t("askDismiss")} title={t("askDismiss")}
        className="shrink-0 rounded-md p-1 text-ink-2 hover:bg-card-2 hover:text-ink"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
