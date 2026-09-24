import { describe, expect, it } from "vitest";
import { osFromUserAgent } from "./platform";

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
