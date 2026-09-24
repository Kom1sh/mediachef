/**
 * На какой системе запущена программа — для того, что на экране зависит от неё:
 * подписи клавиш, подсказки про разрешения.
 *
 * По userAgent, а не вопросом к Rust: ответ нужен к первой отрисовке, а не
 * после круга IPC, иначе вкладка диктовки на Windows успевала бы мигнуть
 * мак-подписями. Вебвью у Tauri на каждой системе своё и представляется
 * честно: WKWebView — «Macintosh», WebView2 — «Windows», WebKitGTK — «Linux»
 * или «X11».
 */
export type Os = "macos" | "windows" | "linux";

export function osFromUserAgent(ua: string): Os {
  if (/Windows/i.test(ua)) return "windows";
  if (/Linux|X11|CrOS/i.test(ua)) return "linux";
  // Всё остальное — WKWebView на маке. Сюда же попадает Node в тестах: там
  // система задаётся явно, пропсом.
  return "macos";
}

export const OS: Os = osFromUserAgent(typeof navigator === "undefined" ? "" : navigator.userAgent);
