/**
 * Вкладка голосового ввода: все его настройки и состояние в одном месте.
 *
 * Отдельный экран, а не три строки внутри «Настроек», потому что настроек у
 * диктовки восемь, и половина из них — про модели и язык — на общем экране
 * читалась бы как чужие. Здесь же то, что настройкой не является, но человеку
 * нужно рядом: выдано ли разрешение «Универсальный доступ» (без него не
 * работает ни триггер, ни печать) и где лежит журнал.
 *
 * Экран не хранит настроек сам: каждое изменение уходит в `onChange`, который
 * сохраняет и принимает обратно то, что Rust действительно записал. Исключение
 * — словарь: это текстовое поле, и сохранять его на каждый символ значило бы
 * дёргать диск и переприменять хоткей на каждое нажатие. Черновик живёт в
 * состоянии компонента и уходит на сохранение, когда поле теряет фокус.
 */
import { useEffect, useState } from "react";
import {
  BookA,
  BrainCircuit,
  ClipboardPaste,
  Keyboard,
  Languages,
  Mic,
  MicVocal,
  Monitor,
  RadioTower,
  ScrollText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { LOCALES, LOCALE_FLAGS, LOCALE_NAMES, useT } from "../lib/i18n";
import { getDictationStatus, getModels, openAccessibilitySettings, openMicrophoneSettings, revealFile } from "../lib/ipc";
import { DICTATION_HOTKEYS, DICTIONARY_MAX_CHARS } from "../lib/types";
import type { AppSettings, Dictation, DictationStatus, ModelView } from "../lib/types";
import { Row, Segmented, SoftButton, Switch, type Choice } from "./controls";

export function DictationPanel({
  settings: s,
  onChange,
  error,
  onOpenModels,
}: {
  settings: AppSettings;
  onChange: (s: AppSettings) => void;
  /** A failed save, shown where the user just clicked. */
  error?: string;
  /** Переход к разделу моделей — скачать ту, которой нет на диске. */
  onOpenModels: () => void;
}) {
  const t = useT();
  const d = s.dictation;
  const set = (patch: Partial<Dictation>) => onChange({ ...s, dictation: { ...d, ...patch } });

  // Список моделей и состояние разрешения — с той стороны, по запросу при
  // открытии вкладки. Статический рендер (тесты) эффектов не гонит, и экран
  // обязан выглядеть честно и без них: «проверяю…» вместо выдуманного ответа.
  const [models, setModels] = useState<ModelView[]>([]);
  const [status, setStatus] = useState<DictationStatus | null>(null);
  useEffect(() => {
    getModels().then(setModels).catch(() => {});
    getDictationStatus().then(setStatus).catch(() => {});
  }, []);

  // Черновик словаря — см. шапку файла.
  const [draft, setDraft] = useState(d.dictionary);
  useEffect(() => setDraft(d.dictionary), [d.dictionary]);
  const commitDictionary = () => {
    if (draft !== d.dictionary) set({ dictionary: draft });
  };

  // Модели предлагаются только скачанные: выбрать нескачанную значило бы
  // получить «модель не скачана» в момент диктовки. Текущее значение остаётся
  // в списке и без файла на диске — иначе контрол показывал бы не то, что
  // записано, — но с пометкой.
  const modelChoices = (current: string): readonly Choice<string>[] => {
    const installed = models.filter(m => m.installed).map(m => m.id);
    const ids = installed.includes(current) ? installed : [...installed, current];
    return ids.map(id => ({
      value: id,
      label: installed.includes(id) ? id : `${id} · ${t("modelNotInstalled")}`,
    }));
  };

  // Язык речи: «как интерфейс» и «определять» — правила, а не языки, поэтому
  // со значками, а не с флагами; дальше те же десять языков, что и у интерфейса.
  const LANGS: readonly Choice<string>[] = [
    { value: "", label: t("optLangInterface"), icon: Monitor },
    { value: "auto", label: t("optLangAuto"), icon: Sparkles },
    ...LOCALES.map(l => ({ value: l, label: LOCALE_NAMES[l], flag: LOCALE_FLAGS[l] })),
  ];

  return (
    <section className="min-h-0 overflow-y-auto p-4">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
        <div>
          <h1 className="text-base font-bold text-ink">{t("dictTitle")}</h1>
          <p className="mt-1 text-xs text-ink-2">{t("dictBlurb")}</p>
        </div>

        {error ? (
          <p role="alert" className="rounded-lg border border-danger bg-danger-soft px-3 py-2 text-xs text-danger-ink">
            {error}
          </p>
        ) : null}

        <Row icon={Mic} label={t("setDictation")} hint={t("setDictationHint")}>
          <Switch label={t("setDictation")} on={d.enabled} onToggle={enabled => set({ enabled })} />
        </Row>

        <Row icon={Keyboard} label={t("setDictationKey")} hint={t("setDictationKeyHint")}>
          <Segmented
            name="mc-dictation-key" label={t("setDictationKey")} value={d.hotkey}
            // Закрытый список, а не поле ввода: триггер перехватывается до всех
            // приложений, и самые естественные комбинации — как раз самые негодные.
            choices={DICTATION_HOTKEYS.map(h => ({
              value: h.value,
              label: "labelKey" in h ? t(h.labelKey) : h.label,
            }))}
            onPick={hotkey => set({ hotkey })}
          />
        </Row>

        <Row
          icon={BrainCircuit} label={t("setDictationModel")} hint={t("setDictationModelHint")}
          footer={
            <div className="w-full border-t border-line pt-3">
              <SoftButton onClick={onOpenModels}>{t("openModels")}</SoftButton>
            </div>
          }
        >
          <Segmented
            name="mc-dictation-model" label={t("setDictationModel")} value={d.model}
            choices={modelChoices(d.model)} onPick={model => set({ model })}
          />
        </Row>

        <Row icon={RadioTower} label={t("setDictationPreviewModel")} hint={t("setDictationPreviewModelHint")}>
          <Segmented
            name="mc-dictation-preview-model" label={t("setDictationPreviewModel")} value={d.preview_model}
            choices={modelChoices(d.preview_model)} onPick={preview_model => set({ preview_model })}
          />
        </Row>

        <Row icon={Languages} label={t("setDictationLanguage")} hint={t("setDictationLanguageHint")}>
          <Segmented
            name="mc-dictation-language" label={t("setDictationLanguage")} value={d.language}
            choices={LANGS} onPick={language => set({ language })}
          />
        </Row>

        <Row
          icon={BookA} label={t("setDictationDictionary")} hint={t("setDictationDictionaryHint")}
          footer={
            <label className="flex w-full flex-col gap-1 border-t border-line pt-3">
              <span className="sr-only">{t("setDictationDictionary")}</span>
              <textarea
                value={draft} rows={3} maxLength={DICTIONARY_MAX_CHARS}
                onChange={e => setDraft(e.target.value)} onBlur={commitDictionary}
                className="w-full resize-y rounded-md border border-line-strong bg-card-2 px-2 py-1.5 text-sm text-ink"
              />
              <span className="text-xs text-ink-2">
                {t("dictionaryCount", { n: draft.length, max: DICTIONARY_MAX_CHARS })}
              </span>
            </label>
          }
        />

        <Row icon={ClipboardPaste} label={t("setDictationDelivery")} hint={t("setDictationDeliveryHint")}>
          <Segmented
            name="mc-dictation-delivery" label={t("setDictationDelivery")} value={d.delivery}
            // Два способа. Третьим была вставка через Cmd+V — она роняла
            // приложение, а печать доставляет текст туда же и не затирает буфер.
            choices={[
              { value: "clipboard", label: t("optDeliveryClipboard") },
              { value: "type", label: t("optDeliveryType") },
            ]}
            onPick={delivery => set({ delivery })}
          />
        </Row>

        <Row icon={ShieldCheck} label={t("setDictationPermission")} hint={t("setDictationPermissionHint")}>
          <div className="flex flex-wrap items-center gap-2">
            {/* Состояние — словом, а не цветом: цвет вспомогательный, слово читается
                и без него. Ответа ещё нет — так и говорим, а не рисуем «не выдан». */}
            <span
              className={`rounded-md px-2 py-1 text-xs font-semibold ${
                status === null ? "bg-card-2 text-ink-2" : status.accessibility ? "bg-basil text-basil-ink" : "bg-card-2 text-ink"
              }`}
            >
              {status === null ? t("permUnknown") : status.accessibility ? t("permGranted") : t("permMissing")}
            </span>
            {status?.accessibility ? null : (
              <SoftButton onClick={() => void openAccessibilitySettings()}>{t("openSystemSettings")}</SoftButton>
            )}
          </div>
        </Row>

        {/* Микрофон — рядом с «Универсальным доступом», потому что слетают они
            вместе и одинаково: после обновления переключатель горит, а звука нет.
            Без разрешения macOS отдаёт тишину, а не ошибку, и по одной записи
            этого не понять — поэтому спрашиваем систему. */}
        <Row icon={MicVocal} label={t("setDictationMic")} hint={t("setDictationMicHint")}>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-md px-2 py-1 text-xs font-semibold ${
                status === null ? "bg-card-2 text-ink-2" : status.microphone === "authorized" ? "bg-basil text-basil-ink" : "bg-card-2 text-ink"
              }`}
            >
              {status === null
                ? t("permUnknown")
                : status.microphone === "authorized"
                  ? t("micGranted")
                  : status.microphone === "undetermined"
                    ? t("micUndetermined")
                    : t("micMissing")}
            </span>
            {status && status.microphone !== "authorized" ? (
              <SoftButton onClick={() => void openMicrophoneSettings()}>{t("openSystemSettings")}</SoftButton>
            ) : null}
          </div>
        </Row>

        <Row icon={ScrollText} label={t("setDictationLog")} hint={t("setDictationLogHint")}>
          <SoftButton
            disabled={!status?.log_path}
            // Показать файл, а не открыть его: чем его открывать — дело системы,
            // а папка рядом с ним человеку и так может понадобиться.
            onClick={() => { if (status?.log_path) void revealFile(status.log_path).catch(() => {}); }}
          >
            {t("showLog")}
          </SoftButton>
        </Row>
      </div>
    </section>
  );
}
