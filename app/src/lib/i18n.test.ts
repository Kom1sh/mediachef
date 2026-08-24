import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CATEGORY_ICON } from "./icons";
import { DICTS, LocaleProvider, categoryLabel, loc, makeT, resolveLocale, useT, type TKey } from "./i18n";

describe("dictionaries", () => {
  /* The one failure mode of a hand-written dictionary pair: a key added to en and
     forgotten in ru, which shows up as an English word in a Russian UI — and only
     on the screen nobody opened. The typed `Record<TKey, string>` on ru already
     makes that a compile error; this is the same check at runtime, so a refactor
     that loosens the type does not quietly take the guard with it. */
  it("has the same key set in both locales", () => {
    expect(Object.keys(DICTS.ru).sort()).toEqual(Object.keys(DICTS.en).sort());
  });

  it("has no empty or whitespace-only values", () => {
    for (const [locale, dict] of Object.entries(DICTS)) {
      for (const [key, value] of Object.entries(dict)) {
        expect(value.trim(), `${locale}.${key}`).not.toBe("");
      }
    }
  });

  /* A `{name}` placeholder that exists in one locale and not the other means one
     of them drops the number (or the filename) it was written to carry. */
  it("uses the same placeholders in both locales", () => {
    const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
    for (const key of Object.keys(DICTS.en) as TKey[]) {
      expect(vars(DICTS.ru[key]), key).toEqual(vars(DICTS.en[key]));
    }
  });
});

describe("makeT", () => {
  it("answers in the locale it was made for", () => {
    expect(makeT("en")("navConvert")).toBe("Convert");
    expect(makeT("ru")("navConvert")).toBe("Конвертация");
  });

  it("substitutes {n}", () => {
    expect(makeT("en")("retryN", { n: 3 })).toBe("Retry 3");
    expect(makeT("ru")("retryN", { n: 3 })).toContain("3");
  });

  it("substitutes several named vars", () => {
    expect(makeT("en")("notifyDone", { name: "clip.mp3" })).toContain("clip.mp3");
  });

  // A placeholder with no value left as written, rather than printed as
  // "undefined" — the key's own text is the least misleading thing to show.
  it("leaves an unfilled placeholder alone", () => {
    expect(makeT("en")("retryN")).toContain("{n}");
    expect(makeT("en")("retryN", { other: 1 })).toContain("{n}");
  });
});

describe("resolveLocale", () => {
  it("takes an explicit choice as given", () => {
    expect(resolveLocale("en")).toBe("en");
    expect(resolveLocale("ru")).toBe("ru");
    expect(resolveLocale("ar")).toBe("ar");
    expect(resolveLocale("zh")).toBe("zh");
  });

  it("follows the browser for «system»", () => {
    vi.stubGlobal("navigator", { language: "ru-RU" });
    expect(resolveLocale("system")).toBe("ru");
    vi.stubGlobal("navigator", { language: "en-GB" });
    expect(resolveLocale("system")).toBe("en");
    // Match is on the primary subtag, so a regional variant lands on its language
    // rather than on English: pt-BR is Portuguese, zh-Hans is Chinese.
    vi.stubGlobal("navigator", { language: "de-DE" });
    expect(resolveLocale("system")).toBe("de");
    vi.stubGlobal("navigator", { language: "pt-BR" });
    expect(resolveLocale("system")).toBe("pt");
    vi.stubGlobal("navigator", { language: "zh-Hans-CN" });
    expect(resolveLocale("system")).toBe("zh");
    // A language this app does not ship still falls back to English.
    vi.stubGlobal("navigator", { language: "ja-JP" });
    expect(resolveLocale("system")).toBe("en");
    vi.unstubAllGlobals();
  });

  /* Локаль от ОС важнее того, что говорит webview: на macOS WKWebView сообщает
     локаль приложения, а у нелокализованной сборки это всегда en-US. Если бы
     решал webview, «как в системе» означало бы «английский» на любой машине. */
  it("prefers the OS locale over the webview's", () => {
    vi.stubGlobal("navigator", { language: "en-US" });
    expect(resolveLocale("system", "es-ES")).toBe("es");
    expect(resolveLocale("system", "pt-BR")).toBe("pt");
    // ОС молчит — остаётся webview.
    expect(resolveLocale("system", "")).toBe("en");
    // Явный выбор в настройках сильнее и системы, и webview.
    expect(resolveLocale("de", "es-ES")).toBe("de");
    vi.unstubAllGlobals();
  });

  // A hand-edited settings.json can hold anything; Rust sanitizes, but the UI must
  // not depend on that to avoid rendering a screen full of `undefined`.
  it("falls back to english for an unknown setting", () => {
    vi.stubGlobal("navigator", { language: "en-US" });
    expect(resolveLocale("klingon")).toBe("en");
    vi.unstubAllGlobals();
  });
});

describe("loc", () => {
  it("picks the locale's side", () => {
    expect(loc({ en: "Extract audio", ru: "Вытащить звук" }, "ru")).toBe("Вытащить звук");
    expect(loc({ en: "Extract audio", ru: "Вытащить звук" }, "en")).toBe("Extract audio");
  });

  /* Recipes are YAML written by hand, so a missing or blank `ru:` is a matter of
     when, not if. English is a worse label than Russian and a far better one than
     an empty card. */
  it("falls back to english when the russian side is blank", () => {
    expect(loc({ en: "Extract audio", ru: "" }, "ru")).toBe("Extract audio");
    expect(loc({ en: "Extract audio", ru: "   " }, "ru")).toBe("Extract audio");
    expect(loc({ en: "Extract audio", ru: undefined as unknown as string }, "ru")).toBe("Extract audio");
  });
});

describe("categoryLabel", () => {
  /* The icon map is the list of categories the board can draw; a category with a
     tile and no word would render a raw slug under its own icon. */
  it("has a word for every category the icon map knows", () => {
    for (const category of Object.keys(CATEGORY_ICON)) {
      expect(categoryLabel(category, "ru"), category).not.toBe(category);
      expect(categoryLabel(category, "en"), category).not.toBe(category);
    }
  });

  it("falls back to the raw category for one this build has not heard of", () => {
    expect(categoryLabel("time-travel", "ru")).toBe("time-travel");
  });
});

/* The locale has to reach a component through context, not through a module-level
   variable: a variable would make switching the language in Settings a no-op until
   the next restart (nothing re-renders when a module's local changes), and would
   make these two renders of the same component return the same string. */
describe("LocaleProvider", () => {
  const Word = () => createElement("span", null, useT()("navConvert"));

  const render = (locale: "en" | "ru") =>
    renderToStaticMarkup(createElement(LocaleProvider, { locale, children: createElement(Word) }));

  it("feeds useT from context", () => {
    expect(render("ru")).toContain("Конвертация");
    expect(render("en")).toContain("Convert");
  });

  it("defaults to english with no provider above", () => {
    expect(renderToStaticMarkup(createElement(Word))).toContain("Convert");
  });
});
