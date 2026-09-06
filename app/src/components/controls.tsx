/**
 * Общие контролы экранов настроек: сегментный переключатель, выключатель и
 * строка «значок — название — подсказка — контрол».
 *
 * Жили внутри SettingsPanel, пока экран настроек был один. Со вкладкой
 * голосового ввода их стало два, и один набор контролов на оба — единственный
 * способ, чтобы строки на этих экранах не разошлись при первой же правке.
 */
import type { LucideIcon } from "lucide-react";
import { Flag } from "./Flag";

/**
 * One option of a segmented control: the stored value and the word for it.
 *
 * `flag` — код флажка (см. LOCALE_FLAGS), `icon` — значок lucide для варианта,
 * у которого флага быть не может («как в системе»). Оба необязательны: у темы
 * и у числа воркеров подписи говорят сами за себя.
 */
export interface Choice<T extends string> {
  value: T;
  label: string;
  flag?: string;
  icon?: LucideIcon;
}

/**
 * A segmented control built on real radio inputs.
 *
 * The inputs are visually hidden rather than replaced by buttons, which buys the
 * whole native contract for free: one tab stop for the group, arrow keys moving
 * between options, and a screen reader announcing "2 of 3" without a line of
 * ARIA bookkeeping. `role="radiogroup"` is here only to give the set a name —
 * the grouping itself comes from the shared `name`.
 */
export function Segmented<T extends string>({
  name,
  label,
  value,
  choices,
  onPick,
}: {
  name: string;
  label: string;
  value: T;
  choices: readonly Choice<T>[];
  onPick: (v: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      // `line-strong` because this box is the control: at `line`'s 1.13:1 against
      // its own `card-2` well the group had no visible edge at all until something
      // inside it was focused (WCAG 1.4.11 wants 3:1; this pair measures 3.21 light
      // / 3.33 dark). The Row card around it stays on `line`.
      className="flex flex-wrap gap-1 rounded-lg border border-line-strong bg-card-2 p-1"
    >
      {choices.map(c => {
        const on = c.value === value;
        return (
          <label
            key={c.value}
            // The focus ring is an *outline with an offset*, matching the global
            // `:focus-visible` rule — and not a `ring`, which would draw basil
            // directly against the basil chip of the option that is already
            // selected, i.e. exactly the option keyboard focus lands on first.
            // The unpicked options are `ink` rather than `ink-2`: they sit on the
            // group's own `card-2` well, where `ink-2` measures 4.25:1 in the light
            // theme — under the 4.5 this 12px semibold text has to clear. What
            // says "picked" is the basil chip, not a difference in text weight of
            // the words beside it.
            className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${
              on ? "bg-basil text-basil-ink" : "text-ink hover:bg-card"
            }`}
          >
            <input
              type="radio" name={name} value={c.value} checked={on} className="sr-only"
              onChange={() => onPick(c.value)}
            />
            {/* Значок и подпись в одной строке: без inline-flex флажок съезжает
                с базовой линии текста, потому что это отдельный блок svg. */}
            <span className="inline-flex items-center gap-1.5">
              {c.flag ? <Flag code={c.flag} /> : null}
              {c.icon ? <c.icon size={13} className="shrink-0" aria-hidden /> : null}
              {c.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}

/** An on/off switch. `role="switch"` on a button, so Space and Enter work and the
 *  state is announced as on/off rather than as "pressed". */
export function Switch({ label, on, onToggle }: { label: string; on: boolean; onToggle: (v: boolean) => void }) {
  return (
    <button
      type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onToggle(!on)}
      // Off is the state that needs the stronger border: on, the basil fill is the
      // whole shape, while off the track is `card-2` on a `card` row and the outline
      // is all there is of it (`line` measured 1.13:1 there, `line-strong` 3.21).
      className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
        on ? "border-basil bg-basil" : "border-line-strong bg-card-2"
      }`}
    >
      {/* The knob takes `basil-ink` when on — the token that exists precisely to
          be legible on basil — and `ink-2` when off, which reads against the
          card-2 track in both themes. */}
      <span
        className={`absolute top-0.5 size-4 rounded-full transition-all ${
          on ? "left-6 bg-basil-ink" : "left-1 bg-ink-2"
        }`}
      />
    </button>
  );
}

/** One setting: icon tile, name, one-line explanation, control. `footer` is a
 *  full-width line below them, for a control that needs the room (the output
 *  path). The row wraps rather than squeezing, so a narrow window stacks it. */
export function Row({
  icon: Icon,
  label,
  hint,
  children,
  footer,
}: {
  icon: LucideIcon;
  label: string;
  hint: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-card p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card-2 text-ink-2">
          <Icon className="size-4.5" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-ink">{label}</span>
          <span className="block text-xs text-ink-2">{hint}</span>
        </span>
      </div>
      {children}
      {footer}
    </div>
  );
}

/** Кнопка второго плана — такая же, как «Изменить…» и «Проверить» в настройках. */
export function SoftButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled}
      className="shrink-0 rounded-md border border-line-strong bg-card-2 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-paper disabled:opacity-50"
    >
      {children}
    </button>
  );
}
