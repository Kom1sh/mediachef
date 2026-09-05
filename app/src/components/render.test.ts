/**
 * What the components actually put in the document, rendered rather than reasoned
 * about: `renderToStaticMarkup` is the whole test harness (no DOM, no jsdom, no
 * dependency this app did not already ship), the same way `i18n.test.ts` renders a
 * provider to prove the locale reaches a hook.
 *
 * A static render runs no effects, which decides what is testable here and shapes the
 * components accordingly: `JobCard` takes the one `JobView` it draws as a prop —
 * QueuePanel fills itself from an `invoke` no static render will make — so the states
 * that matter most to somebody who cannot see the screen (a failure they have to read,
 * a bar a reader has to announce) can be held still and checked.
 */
import { describe, expect, it } from "vitest";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FileCard } from "./FileCard";
import { JobCard } from "./QueuePanel";
import { SettingsPanel } from "./SettingsPanel";
import { DICTS, LocaleProvider, type Locale } from "../lib/i18n";
import { UpdateBar } from "./UpdateBar";
import type { Updater } from "../lib/useUpdater";
import type { AppSettings, JobView } from "../lib/types";

/** The component under the locale the app would give it. */
const render = (locale: Locale, node: ReactElement) =>
  renderToStaticMarkup(createElement(LocaleProvider, { locale, children: node }));

/** A finished-looking job, for tests to bend into the state they care about. */
const job = (over: Partial<JobView> = {}): JobView => ({
  id: 7,
  recipe_id: "transcribe-txt",
  kind: "whisper",
  input: "/Users/me/Videos/holiday.mp4",
  output: "/Users/me/Videos/holiday.transcript.txt",
  status: "running",
  percent: 40,
  ...over,
});

const card = (over: Partial<JobView> = {}, locale: Locale = "en") =>
  render(
    locale,
    createElement(JobCard, {
      job: job(over),
      title: "Transcribe",
      eta: "~00:30 left",
      onCancel: () => {},
      onReveal: () => {},
      onCopyLog: () => {},
    }),
  );

describe("JobCard", () => {
  /* Ruling W3-4's whole point: whisper heard nothing, and the person reading the card
     is told so in their own language. Rust answers with an English sentence plus a
     `no_speech:` marker, and the card is the only thing that can localize it — so this
     asserts the Russian words are on screen and the English ones are not. */
  it("says «no speech» in the reader's own language", () => {
    const failed = {
      status: "error" as const,
      error: "No speech detected in the file.",
      error_detail: "no_speech: nothing recognisable in the audio\nprogress = 100%",
    };
    const ru = card(failed, "ru");
    expect(ru).toContain(DICTS.ru.noSpeech);
    expect(ru).not.toContain("No speech detected in the file.");
    // …and the English UI gets the dictionary's sentence, not Rust's, so the two
    // locales are the same feature rather than a fallback.
    expect(card(failed, "en")).toContain(DICTS.en.noSpeech);
  });

  /* The marker has to *lead* the detail. `error_detail` ends in engine output that
     quotes the user's file name, so a clip called `no_speech.mp4` that failed to
     decode must keep its own error — this is the assertion that pins the anchor. */
  it("keeps the engine's own summary when the marker only appears inside the log", () => {
    const markup = card(
      {
        status: "error",
        error: "The file looks corrupted or is not a media file.",
        error_detail: "ffmpeg exited with code 1\n/x/no_speech.mp4: Invalid data found",
      },
      "ru",
    );
    expect(markup).toContain("The file looks corrupted or is not a media file.");
    expect(markup).not.toContain(DICTS.ru.noSpeech);
  });

  /* A progress bar that a screen reader can read out: the gauge is the track, its
     `aria-valuenow` is the job's own percent, and both bounds are spelled out. The
     states without a bar are the other half of the contract — a stopped run has no
     percentage that would be honest. */
  it("draws a progressbar a reader can announce, and only where there is progress", () => {
    const running = card({ status: "running", percent: 40 });
    expect(running).toContain('role="progressbar"');
    expect(running).toContain('aria-valuenow="40"');
    expect(running).toContain('aria-valuemin="0"');
    expect(running).toContain('aria-valuemax="100"');
    // The fill is the number too, or the bar and its label would disagree.
    expect(running).toContain("width:40%");
    // Named, because several cards can be in flight at once.
    expect(running).toContain("Job progress: Transcribe");

    expect(card({ status: "queued", percent: 0 })).toContain('role="progressbar"');
    expect(card({ status: "done", percent: 100 })).toContain('aria-valuenow="100"');
    for (const status of ["error", "cancelled"] as const) {
      expect(card({ status }), status).not.toContain('role="progressbar"');
    }
  });

  /* The card has room for a name, not for a path — and the badge names the lane in
     the spelling the rest of the project uses. */
  it("shows the file's own name and the lane that ran it", () => {
    const windows = card({ input: "C:\\Users\\me\\Videos\\holiday.mp4" });
    expect(windows).toContain(">holiday.mp4<");
    expect(windows).not.toContain(">C:\\Users");
    expect(card({ kind: "ffmpeg" })).toContain("FFmpeg");
  });
});

/** Апдейтер в покое: настройки рисуются одинаково, пока никто не нажал «Проверить». */
const idleUpdater: Updater = {
  state: { kind: "idle" },
  current: "0.6.1",
  checkNow: () => {},
  install: () => {},
  restart: () => {},
  dismiss: () => {},
  dismissed: false,
};

describe("SettingsPanel", () => {
  /* Every control shows what is actually stored. The screen owns no state of its own,
     so a control bound to the wrong field (or to nothing) would show a choice the user
     never made and then save it on the next click.
     The other half — that `onChange` is handed a *whole* `AppSettings` rather than the
     one field that changed — is a type, not a runtime question: the prop's signature
     admits nothing else, and `npm run typecheck` is a gate. */
/**
 * Блок диктовки для тестовых настроек.
 *
 * Вынесен в константу, чтобы добавление поля в `Dictation` правилось в одном
 * месте, а не в каждом наборе настроек: тип общий, и разойтись они не должны.
 * Включён намеренно — выключенная диктовка прячет строку выбора хоткея, и
 * тест на «каждый контрол привязан к настройкам» её бы не увидел.
 */
const dictation = {
  enabled: true,
  hotkey: "Option+Space",
  model: "small",
  language: "",
  dictionary: "",
  delivery: "clipboard",
  history_depth: 0,
};

  it("binds every control to the settings it was handed", () => {
    const settings: AppSettings = {
      language: "ru",
      theme: "dark",
      output_mode: "fixed",
      output_dir: "/Users/me/Готовое",
      notifications: false,
      ffmpeg_workers: 3,
      dictation,
    };
    const markup = render(
      "ru",
      createElement(SettingsPanel, { settings, onChange: () => {}, error: "", updater: idleUpdater }),
    );
    // One radio group per stored choice, each with the stored value checked.
    for (const [name, value] of [
      ["mc-language", "ru"],
      ["mc-theme", "dark"],
      ["mc-output", "fixed"],
      ["mc-workers", "3"],
    ]) {
      const radio = markup.match(new RegExp(`<input[^>]*name="${name}"[^>]*value="${value}"[^>]*>`));
      expect(radio, name).not.toBeNull();
      expect(radio?.[0], name).toContain('checked=""');
    }
    // The switch is a button, so its state is an attribute rather than a `checked`.
    expect(markup).toContain('role="switch" aria-checked="false"');
    // And the fixed folder is printed, because a path the app will write into is not
    // something to keep behind a dialog.
    expect(markup).toContain("/Users/me/Готовое");
  });

  /* Диктовка настраивается только отсюда: файл настроек человек руками не
     правит, и если эти два контрола пропадут, единственным способом включить
     фичу снова станет текстовый редактор. */
  it("offers the dictation switch and hotkey, and hides the hotkey when it is off", () => {
    const on: AppSettings = {
      language: "ru", theme: "dark", output_mode: "beside",
      output_dir: null, notifications: false, ffmpeg_workers: 1, dictation,
    };
    const markup = render(
      "ru",
      createElement(SettingsPanel, { settings: on, onChange: () => {}, error: "", updater: idleUpdater }),
    );
    // Переключатель включён — значит на экране есть switch со значением true.
    expect(markup).toContain('role="switch" aria-checked="true"');
    // И выбранная комбинация отмечена, а не просто нарисована.
    const picked = markup.match(/<input[^>]*name="mc-dictation-key"[^>]*value="Option\+Space"[^>]*>/);
    expect(picked).not.toBeNull();
    expect(picked?.[0]).toContain('checked=""');
    // Запасные варианты тоже предложены: одного «правильного» мало, если он у
    // кого-то занят.
    expect(markup).toContain('value="Ctrl+Option+D"');

    // Выключенная диктовка прячет выбор хоткея: он ни на что не влияет.
    const off: AppSettings = { ...on, dictation: { ...dictation, enabled: false } };
    const offMarkup = render(
      "ru",
      createElement(SettingsPanel, { settings: off, onChange: () => {}, error: "", updater: idleUpdater }),
    );
    expect(offMarkup).not.toContain("mc-dictation-key");
  });

  /* Версия работающей сборки и ответ на нажатие «Проверить» — единственное, что
     эта строка обязана сказать. Найденное обновление и ход загрузки живут
     в полосе наверху: если бы они дублировались здесь, два места про одно и то же
     разошлись бы при первой же правке. */
  it("shows the running version and answers a check that found nothing", () => {
    const settings: AppSettings = {
      language: "ru", theme: "dark", output_mode: "beside",
      output_dir: null, notifications: false, ffmpeg_workers: 1, dictation,
    };
    const at = (state: Updater["state"]) =>
      render("ru", createElement(SettingsPanel, {
        settings, onChange: () => {}, error: "", updater: { ...idleUpdater, state },
      }));

    expect(at({ kind: "idle" })).toContain("Установлена версия 0.6.1.");
    expect(at({ kind: "current" })).toContain("Это последняя версия.");
    // Установка из пакетного менеджера — это свойство установки, а не поломка,
    // и звучать она должна не как ошибка.
    const deb = at({ kind: "failed", reason: "AppImage not supported" });
    expect(deb).toContain("пакетный менеджер");
    expect(deb).not.toContain("Не удалось проверить");
    expect(at({ kind: "failed", reason: "dns error" })).toContain("Не удалось проверить: dns error");
  });
});

describe("UpdateBar", () => {
  const bar = (state: Updater["state"], over: Partial<Updater> = {}) =>
    render("ru", createElement(UpdateBar, { updater: { ...idleUpdater, state, ...over } }));

  /* Полоса заговаривает сама, поэтому молчать она должна везде, где сказать
     нечего. Состояние «проверяем» и «всё актуально» сюда не относятся: о них
     человек спросил в настройках, там и ответ. */
  it("says nothing until there is something to install", () => {
    for (const state of [
      { kind: "idle" }, { kind: "checking" }, { kind: "current" },
      { kind: "failed", reason: "dns error" },
    ] as Updater["state"][]) {
      expect(bar(state), state.kind).toBe("");
    }
  });

  it("offers the found version, and goes quiet when dismissed", () => {
    const found: Updater["state"] = { kind: "found", version: "0.7.0", notes: "" };
    expect(bar(found)).toContain("Вышла версия 0.7.0.");
    expect(bar(found, { dismissed: true })).toBe("");
  });

  /* Доля рисуется полосой только когда известен размер; иначе о ходе загрузки
     говорят словами, а не врущей на глаз шкалой. */
  it("draws a bar only for a download whose size is known", () => {
    const known = bar({ kind: "downloading", percent: 0.42 });
    expect(known).toContain("Скачиваем обновление — 42%");
    expect(known).toContain("width:42%");

    const unknown = bar({ kind: "downloading", percent: null });
    expect(unknown).toContain("Скачиваем обновление…");
    expect(unknown).not.toContain("width:");
  });

  /* Крестик есть только у предложения: убирать полосу, за которой идёт работа
     или ждёт перезапуск, было бы некуда. */
  it("can only be closed while it is still an offer", () => {
    expect(bar({ kind: "found", version: "0.7.0", notes: "" })).toContain('aria-label="Позже"');
    expect(bar({ kind: "downloading", percent: 0.5 })).not.toContain('aria-label="Позже"');

    const ready = bar({ kind: "ready" });
    expect(ready).toContain("Перезапустить");
    expect(ready).not.toContain('aria-label="Позже"');
  });
});

describe("FileCard", () => {
  /* `basename` handles both separators; this is the test that says why it has to.
     The name is also the ✕ button's accessible name, so a path would be read out
     whole to somebody who cannot see the card. */
  it("names a windows path by its file, in the label and in the button", () => {
    const markup = render(
      "ru",
      createElement(FileCard, {
        path: "C:\\Users\\me\\Videos\\отпуск.mp4",
        info: null,
        probeError: "",
        active: false,
        onSelect: () => {},
        onClear: () => {},
      }),
    );
    expect(markup).toContain(">отпуск.mp4<");
    expect(markup).toContain('aria-label="Убрать отпуск.mp4"');
    expect(markup).not.toContain("C:\\Users");
  });
});
