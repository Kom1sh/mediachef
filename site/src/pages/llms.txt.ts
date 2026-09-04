// llms.txt — карта сайта для ассистентов, по спецификации llmstxt.org.
//
// Честно про пользу: рычагом это не является. Google прямо говорит, что файл
// ему не нужен, а по замерам обращений от ассистентов к нему единицы против
// сотен обращений к самим страницам. Держим его потому, что он стоит дёшево
// и не мешает, а не потому, что от него ждём трафика. Работу делают сами
// страницы: ответ в первых ста словах, таблицы с цифрами, articleBody в JSON-LD.
//
// Собирается из ROUTES и текстов локалей, а не лежит руками в public/: файл,
// который надо помнить обновлять, устаревает на второй новой странице. Здесь
// новая страница появляется сама, как и в sitemap.xml.
import type { APIRoute } from "astro";
import {
  SITE,
  ROUTES,
  FACTS,
  FEEDBACK_EMAIL,
  LINKS,
  LOCALES,
  CATALOG,
  LANDINGS,
  T,
  pathFor,
  type Locale,
  type PageId,
} from "../content";
import { GUIDES, GUIDE_IDS, type GuideId } from "../guides";

/** Английский как язык самого файла: он для машин, и один язык тут уместнее. */
const L: Locale = "en";

/** Заголовок и одно предложение на страницу — из тех же текстов, что на сайте. */
function describe(page: PageId): { title: string; note: string } | null {
  if (page === "home") return { title: T[L].title, note: T[L].description };
  if (page === "catalog") return { title: CATALOG[L].h1, note: CATALOG[L].description };
  if (GUIDE_IDS.includes(page as GuideId)) {
    const g = GUIDES[page as GuideId][L];
    return { title: g.h1, note: g.description };
  }
  const l = LANDINGS[page as "mp3" | "transcribe"]?.[L];
  return l ? { title: l.h1, note: l.description } : null;
}

export const GET: APIRoute = () => {
  const pages = Object.keys(ROUTES) as PageId[];

  const lines: string[] = [
    "# MediaChef",
    "",
    `> ${T[L].description}`,
    "",
    `Version ${FACTS.version}. Free and open source under ${FACTS.license}. `
      + `Bundles FFmpeg ${FACTS.ffmpeg} and whisper.cpp ${FACTS.whisper}, so it runs with no network access `
      + `and no file-size limit. ${FACTS.recipeCount} built-in recipes for macOS, Windows and Linux.`,
    "",
    "## Pages",
    "",
  ];

  for (const page of pages) {
    const d = describe(page);
    if (!d) continue;
    lines.push(`- [${d.title}](${SITE + pathFor(page, L)}): ${d.note}`);
  }

  lines.push(
    "",
    "## Translations",
    "",
    `Every page exists in ${LOCALES.length} languages (${LOCALES.join(", ")}), `
      + "linked to each other with hreflang. Swap the language code in the path; "
      + "the slug is translated too, so the full list lives in sitemap.xml.",
    "",
    "## Notes",
    "",
    "- Nothing on this site requires JavaScript; the HTML is complete as served.",
    "- Figures in the guides are our own measurements, and the guides say what was measured.",
    `- Source code: ${LINKS.github}`,
    `- Corrections and questions: ${FEEDBACK_EMAIL}`,
    "",
    `## Sitemap`,
    "",
    `- [All URLs](${SITE}/sitemap.xml)`,
    "",
  );

  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};
