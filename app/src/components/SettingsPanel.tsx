import { useState } from "react";
import { Bell, ClipboardPaste, FolderOpen, Gauge, Keyboard, Languages, MessageSquare, Mic, Monitor, Palette, RefreshCw } from "lucide-react";
import { useT, LOCALES, LOCALE_FLAGS, LOCALE_NAMES } from "../lib/i18n";
import { Flag } from "./Flag";
import { pickFolder } from "../lib/ipc";
import { openFeedback, FEEDBACK_EMAIL } from "../lib/feedback";
import { isUnsupportedInstall } from "../lib/updater";
import type { Updater } from "../lib/useUpdater";
import { DICTATION_HOTKEYS } from "../lib/types";
import type { AppSettings } from "../lib/types";
import type { LucideIcon } from "lucide-react";

/**
 * One option of a segmented control: the stored value and the word for it.
 *
 * `flag` — код флажка (см. LOCALE_FLAGS), `icon` — значок lucide для варианта,
 * у которого флага быть не может («как в системе»). Оба необязательны: у темы
 * и у числа воркеров подписи говорят сами за себя.
 */
interface Choice<T extends string> {
  value: T;
  label: string;
  flag?: string;
  icon?: LucideIcon;
}

// The worker counts are numerals in both languages, so this one list can stay at
// module scope; the other three are built inside the component, where `t` is.
const WORKERS: readonly Choice<string>[] = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
];

/**
 * A segmented control built on real radio inputs.
 *
 * The inputs are visually hidden rather than replaced by buttons, which buys the
 * whole native contract for free: one tab stop for the group, arrow keys moving
 * between options, and a screen reader announcing "2 of 3" without a line of
 * ARIA bookkeeping. `role="radiogroup"` is here only to give the set a name —
 * the grouping itself comes from the shared `name`.
 */
function Segmented<T extends string>({
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
function Switch({ label, on, onToggle }: { label: string; on: boolean; onToggle: (v: boolean) => void }) {
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
function Row({
  icon: Icon,
  label,
  hint,
  children,
  footer,
}: {
  icon: LucideIcon;
  label: string;
  hint: string;
  children: React.ReactNode;
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

/**
 * The Settings screen. Owns no state of its own beyond a dialog error: every
 * change is handed straight to `onChange`, which saves it and adopts whatever
 * Rust says was actually stored.
 */
export function SettingsPanel({
  settings: s,
  onChange,
  error,
  updater,
}: {
  settings: AppSettings;
  onChange: (s: AppSettings) => void;
  /** A failed save, shown where the user just clicked. */
  error?: string;
  /** Общее с полосой над рабочей областью состояние обновления. */
  updater: Updater;
}) {
  const t = useT();
  const [pickError, setPickError] = useState("");

  // The language *names* stay in their own language: a Russian speaker looking for
  // the switch is looking for "Русский", not for whatever the current UI calls it.
  // "System" is the exception — it is a word about the setting, not a language.
  const LANGUAGES: readonly Choice<AppSettings["language"]>[] = [
    // У «как в системе» флага нет и быть не может — это не язык, а правило.
    // Монитор говорит то же самое без слов, и ряд не выглядит рваным.
    { value: "system", label: t("optSystem"), icon: Monitor },
    ...LOCALES.map((l) => ({ value: l, label: LOCALE_NAMES[l], flag: LOCALE_FLAGS[l] })),
  ];
  const THEMES: readonly Choice<AppSettings["theme"]>[] = [
    { value: "system", label: t("optSystem") },
    { value: "light", label: t("themeLight") },
    { value: "dark", label: t("themeDark") },
  ];
  const MODES: readonly Choice<AppSettings["output_mode"]>[] = [
    { value: "beside", label: t("outBeside") },
    { value: "fixed", label: t("outFixed") },
  ];

  // Choosing a folder implies the fixed mode: picking a destination and then
  // having the files land somewhere else would be nonsense.
  const choose = async () => {
    try {
      const dir = await pickFolder();
      setPickError("");
      if (dir) onChange({ ...s, output_mode: "fixed", output_dir: dir });
    } catch (e) {
      setPickError(String(e));
    }
  };

  // "Fixed" with no folder is not a configuration — Rust's `sanitize` demotes it
  // back to "beside" — so the radio asks for a folder instead of flipping and
  // then springing back when the save answers.
  const pickMode = (mode: AppSettings["output_mode"]) => {
    if (mode === "beside") onChange({ ...s, output_mode: "beside" });
    else if (s.output_dir) onChange({ ...s, output_mode: "fixed" });
    else void choose();
  };

  // Строка под кнопкой проверки. Показывает только то, что человек сам вызвал:
  // найденное обновление и ход установки живут в полосе наверху, дублировать их
  // здесь незачем. Отдельно разобран случай, когда сборка поставлена способом,
  // который обновляться сам не умеет (deb, пакетный менеджер) — это не поломка,
  // а свойство установки, и звучать должно соответственно.
  const u = updater.state;
  const status =
    u.kind === "current" ? t("updCurrent")
    : u.kind === "failed" ? (isUnsupportedInstall(u.reason) ? t("updManual") : t("updFailed", { reason: u.reason }))
    : "";
  const busy = u.kind === "checking" || u.kind === "downloading";

  const notice = error || pickError;
  return (
    <section className="min-h-0 overflow-y-auto p-4">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
        <h1 className="text-base font-bold text-ink">{t("navSettings")}</h1>
        {notice ? (
          <p className="rounded-lg border border-tomato bg-card p-2 text-xs text-tomato">{notice}</p>
        ) : null}

        <Row icon={Languages} label={t("setLanguage")} hint={t("setLanguageHint")}>
          <Segmented
            name="mc-language" label={t("setLanguage")} value={s.language} choices={LANGUAGES}
            onPick={language => onChange({ ...s, language })}
          />
        </Row>

        <Row icon={Palette} label={t("setTheme")} hint={t("setThemeHint")}>
          <Segmented
            name="mc-theme" label={t("setTheme")} value={s.theme} choices={THEMES}
            onPick={theme => onChange({ ...s, theme })}
          />
        </Row>

        <Row
          icon={FolderOpen} label={t("setOutput")} hint={t("setOutputHint")}
          footer={
            s.output_mode === "fixed" ? (
              <div className="flex w-full items-center gap-2 border-t border-line pt-3">
                <span
                  className="min-w-0 flex-1 truncate font-mono text-[11px] text-ink-2"
                  title={s.output_dir ?? ""}
                >
                  {s.output_dir}
                </span>
                <button
                  type="button" onClick={() => void choose()}
                  className="shrink-0 rounded-md border border-line-strong bg-card-2 px-2 py-1 text-xs font-semibold text-ink hover:bg-paper"
                >
                  {t("change")}
                </button>
              </div>
            ) : undefined
          }
        >
          <Segmented
            name="mc-output" label={t("setOutput")} value={s.output_mode} choices={MODES}
            onPick={pickMode}
          />
        </Row>

        <Row icon={Bell} label={t("setNotifications")} hint={t("setNotificationsHint")}>
          <Switch
            label={t("setNotifications")} on={s.notifications}
            onToggle={notifications => onChange({ ...s, notifications })}
          />
        </Row>

        <Row icon={Mic} label={t("setDictation")} hint={t("setDictationHint")}>
          <Switch
            label={t("setDictation")} on={s.dictation.enabled}
            // Хоткей перерегистрируется на стороне Rust сразу после сохранения,
            // без перезапуска: переключатель, который «подействует потом»,
            // неотличим от сломанного.
            onToggle={enabled => onChange({ ...s, dictation: { ...s.dictation, enabled } })}
          />
        </Row>

        {/* Выбор комбинации показывается только при включённой диктовке: пока
            она выключена, хоткей ни на что не влияет, и строка была бы шумом. */}
        {s.dictation.enabled && (
          <Row icon={Keyboard} label={t("setDictationKey")} hint={t("setDictationKeyHint")}>
            <Segmented
              name="mc-dictation-key" label={t("setDictationKey")}
              value={s.dictation.hotkey}
              // Закрытый список, а не поле ввода: глобальный хоткей
              // перехватывается до всех приложений, и самые естественные
              // комбинации — как раз самые негодные.
              choices={DICTATION_HOTKEYS.map(h => ({ value: h.value, label: h.label }))}
              onPick={hotkey => onChange({ ...s, dictation: { ...s.dictation, hotkey } })}
            />
          </Row>
        )}

        {s.dictation.enabled && (
          <Row
            icon={ClipboardPaste} label={t("setDictationDelivery")}
            // Про разрешение сказано прямо здесь, где выбирают, а не в момент
            // отказа: человек должен понимать, во что ввязывается, до того как
            // первая вставка не сработает.
            hint={t("setDictationDeliveryHint")}
          >
            <Segmented
              name="mc-dictation-delivery" label={t("setDictationDelivery")}
              value={s.dictation.delivery}
              choices={[
                { value: "clipboard", label: t("optDeliveryClipboard") },
                { value: "paste", label: t("optDeliveryPaste") },
              ]}
              onPick={delivery => onChange({ ...s, dictation: { ...s.dictation, delivery } })}
            />
          </Row>
        )}

        <Row
          icon={Gauge} label={t("setWorkers")}
          // The one setting that is not live, and it says so where it is set
          // rather than in a release note: the workers are spawned once, at boot.
          hint={t("setWorkersHint")}
        >
          <Segmented
            name="mc-workers" label={t("setWorkers")} value={String(s.ffmpeg_workers)}
            choices={WORKERS}
            onPick={v => onChange({ ...s, ffmpeg_workers: Number(v) })}
          />
        </Row>

        <Row
          icon={RefreshCw}
          label={t("setUpdates")}
          // Версия работающей сборки стоит именно здесь: это единственное место,
          // где она человеку нужна — рядом с кнопкой «а есть ли новее».
          hint={updater.current ? t("setUpdatesHint", { version: updater.current }) : t("setUpdatesHintPlain")}
          footer={status ? <p className="w-full border-t border-line pt-3 text-xs text-ink-2">{status}</p> : undefined}
        >
          <button
            type="button" onClick={updater.checkNow} disabled={busy}
            className="shrink-0 rounded-md border border-line-strong bg-card-2 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-paper disabled:opacity-50"
          >
            {u.kind === "checking" ? t("updChecking") : t("updCheck")}
          </button>
        </Row>

        {/* Единственная внешняя ссылка в приложении. До неё человеку, у которого
            что-то не сработало, было физически некуда пойти из окна. */}
        <Row
          icon={MessageSquare}
          label={t("setFeedback")}
          // Адрес в подсказке текстом: `mailto:` молча ничего не делает, если
          // почтовый клиент в системе не настроен, и тогда написанный адрес —
          // единственное, что остаётся человеку.
          hint={t("setFeedbackHint", { email: FEEDBACK_EMAIL })}
        >
          <div className="flex flex-wrap gap-2">
            {/* Тема письма — подпись нажатой кнопки: она уже переведена и точно
                описывает то, что человек выбрал. */}
            {([t("fbBug"), t("fbIdea")] as const).map((label) => (
              <button
                key={label}
                type="button" onClick={() => void openFeedback(label)}
                className="shrink-0 rounded-md border border-line-strong bg-card-2 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-paper"
              >
                {label}
              </button>
            ))}
          </div>
        </Row>
      </div>
    </section>
  );
}
