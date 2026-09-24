import { describe, expect, it } from "vitest";
import { osFromUserAgent } from "./platform";
import { effectiveHotkey, hotkeysFor } from "./types";

/* Настоящие строки userAgent вебвью, в которых живёт программа. От ответа
   зависят подписи клавиш на вкладке диктовки — ошибка здесь показала бы
   человеку с Windows мак-символы. */
describe("osFromUserAgent", () => {
  it("recognises the three webviews", () => {
    expect(osFromUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko)",
    )).toBe("macos");
    expect(osFromUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0",
    )).toBe("windows");
    expect(osFromUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
    )).toBe("linux");
  });

  it("falls back to macOS for anything else, tests included", () => {
    expect(osFromUserAgent("")).toBe("macos");
    expect(osFromUserAgent("Node.js/22")).toBe("macos");
  });
});

/* Что записанный хоткей значит на каждой системе — зеркало `modkey::native` и
   `plugin_fallback` в Rust. Разойдутся они — вкладка покажет выбранным одно,
   а слушаться будет другое. */
describe("effectiveHotkey", () => {
  it("maps each trigger to what the system can listen to", () => {
    expect(effectiveHotkey("RightOption", "macos")).toBe("RightOption");
    expect(effectiveHotkey("CapsLock", "macos")).toBe("RightOption");
    expect(effectiveHotkey("RightOption", "windows")).toBe("RightCtrl");
    expect(effectiveHotkey("RightAlt", "windows")).toBe("RightAlt");
    expect(effectiveHotkey("RightCtrl", "linux")).toBe("Ctrl+Option+D");
    expect(effectiveHotkey("Ctrl+Option+Space", "linux")).toBe("Ctrl+Option+Space");
  });

  it("always lands on a choice the tab offers", () => {
    for (const os of ["macos", "windows", "linux"] as const) {
      const values: string[] = hotkeysFor(os).map(h => h.value);
      for (const stored of ["RightOption", "RightCommand", "RightCtrl", "RightAlt", "CapsLock"]) {
        expect(values, `${os}: ${stored}`).toContain(effectiveHotkey(stored, os));
      }
    }
  });
});
