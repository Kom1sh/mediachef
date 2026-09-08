import { useState } from "react";
import { Bell, FolderOpen, Gauge, Languages, MessageSquare, Monitor, Palette, RefreshCw } from "lucide-react";
import { useT, useLocale, LOCALES, LOCALE_FLAGS, LOCALE_NAMES } from "../lib/i18n";
import { pickFolder } from "../lib/ipc";
import { openFeedback, openFeedbackForm, FEEDBACK_EMAIL } from "../lib/feedback";
import { isUnsupportedInstall } from "../lib/updater";
import type { Updater } from "../lib/useUpdater";
import type { AppSettings } from "../lib/types";
// Контролы общие с вкладкой диктовки — см. controls.tsx.
import { Row, Segmented, Switch, type Choice } from "./controls";

// The worker counts are numerals in both languages, so this one list can stay at
// module scope; the other three are built inside the component, where `t` is.
const WORKERS: readonly Choice<string>[] = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
];

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
  const locale = useLocale();
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
          <div className="flex flex-wrap items-center gap-2">
            {/* Форма в браузере — основной путь. Письмом открывалось раньше, и
                на Windows с Linux это молча не работало: почтового клиента на
                свежей системе нет. Браузер есть у всех. */}
            {([t("fbBug"), t("fbIdea")] as const).map((label) => (
              <button
                key={label}
                type="button" onClick={() => void openFeedbackForm(locale, "settings")}
                className="shrink-0 rounded-md border border-line-strong bg-card-2 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-paper"
              >
                {label}
              </button>
            ))}
            {/* Письмо осталось вторым путём — для тех, у кого клиент настроен и
                кому так привычнее. Тема письма — подпись «что-то не работает». */}
            <button
              type="button" onClick={() => void openFeedback(t("fbBug"))}
              className="shrink-0 text-xs font-semibold text-ink-2 underline decoration-dotted hover:text-ink"
            >
              {t("fbByMail")}
            </button>
          </div>
        </Row>
      </div>
    </section>
  );
}
