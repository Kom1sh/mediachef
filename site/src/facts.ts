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
// Почта, а не форма на GitHub: от регистрации на GitHub человек, пришедший по
// рекомендации ассистента, отказывается чаще, чем пишет письмо. Адрес живёт на
// Cloudflare Email Routing и пересылается в рабочий ящик; шаблоны issue в
// репозитории остались для тех, кто и так пришёл туда.
export const FEEDBACK_EMAIL = "hello@mediachef.app";
const FEEDBACK = `mailto:${FEEDBACK_EMAIL}`;

export const LINKS = { releases: RELEASES, github: GITHUB, notice: NOTICE, feedback: FEEDBACK };

export const FACTS = {
  version: "0.7.2",
  // Дата последней правки текстов — уезжает в <lastmod> sitemap.xml.
  // Меняется вручную вместе с содержимым, а не при каждой пересборке:
  // «сегодня» в lastmod у неизменившейся страницы Google просто перестаёт верить.
  updated: "2026-09-04",
  recipeCount: 17,
  modelCount: 4,
  platformCount: 3,
  ffmpeg: "9.0.1",
  whisper: "v1.7.6",
  license: "GPL-3.0",
};
