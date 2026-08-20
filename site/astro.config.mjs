import { defineConfig } from "astro/config";

// Все локали живут в подпапках (/en/, /ru/); корень отдаёт 302 по Accept-Language
// в public/_worker.js. Поэтому «directory» + always: каталоги с index.html.
export default defineConfig({
  site: "https://mediachef.app",
  trailingSlash: "always",
  build: { format: "directory" },
});
