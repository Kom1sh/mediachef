// Проверяемые факты о продукте и внешние ссылки. Вынесены в отдельный модуль,
// потому что их импортируют и content.ts, и файлы локалей в copy/ — общий
// нижний слой без циклического импорта.
//
// Цифры не выдуманы: они взяты из recipes/*.yaml, app/core/src/models.rs,
// NOTICE.md и docs/RELEASE_NOTES.md.
export const SITE = "https://mediachef.app";
const RELEASES = "https://github.com/Kom1sh/mediachef/releases/latest";
const GITHUB = "https://github.com/Kom1sh/mediachef";
const NOTICE = "https://github.com/Kom1sh/mediachef/blob/main/NOTICE.md";

export const LINKS = { releases: RELEASES, github: GITHUB, notice: NOTICE };

export const FACTS = {
  version: "0.6.1",
  // Дата последней правки текстов — уезжает в <lastmod> sitemap.xml.
  // Меняется вручную вместе с содержимым, а не при каждой пересборке:
  // «сегодня» в lastmod у неизменившейся страницы Google просто перестаёт верить.
  updated: "2026-08-24",
  recipeCount: 17,
  modelCount: 4,
  platformCount: 3,
  ffmpeg: "9.0.1",
  whisper: "v1.7.6",
  license: "GPL-3.0",
};
