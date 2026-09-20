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

/**
 * Автор программы и сайта. Один адрес, одно имя и один `@id` на весь сайт:
 * по нему поисковик и ассистент сшивают MediaChef с человеком, который его
 * делает, а видимая подпись в подвале говорит ровно то же, что разметка.
 *
 * Адрес — без меток в конце: метка в ссылке делает её рекламной, и связь двух
 * сайтов перестаёт читаться как настоящая.
 */
export const AUTHOR = {
  name: "Егор Протасов",
  latin: "Egor Protasov",
  url: "https://egorprotasov.ru/",
  id: "https://egorprotasov.ru/#person",
  sameAs: ["https://github.com/Kom1sh", "https://t.me/Kom1sh", "https://vk.com/kom1sh"],
};

/**
 * Написание имени для страницы: кириллица только на русской, на остальных
 * девяти — латиница. Анкор при этом один и тот же на всех страницах одной
 * локали, а в разметке обе формы стоят рядом (`name` и `alternateName`),
 * поэтому это один человек, а не два.
 */
export const authorName = (locale: string) => (locale === "ru" ? AUTHOR.name : AUTHOR.latin);

export const FACTS = {
  version: "0.8.3",
  // Дата последней правки текстов — уезжает в <lastmod> sitemap.xml.
  // Меняется вручную вместе с содержимым, а не при каждой пересборке:
  // «сегодня» в lastmod у неизменившейся страницы Google просто перестаёт верить.
  updated: "2026-09-06",
  recipeCount: 17,
  modelCount: 4,
  platformCount: 3,
  ffmpeg: "9.0.1",
  whisper: "v1.7.6",
  license: "GPL-3.0",
};
