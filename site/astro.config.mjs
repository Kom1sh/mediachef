import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://mediachef.app",
  trailingSlash: "never",
  build: { format: "file" },
});
