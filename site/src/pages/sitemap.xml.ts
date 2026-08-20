// sitemap.xml собирается из ROUTES — того же списка, по которому Astro строит
// страницы. Раньше файл лежал руками в public/ и его нужно было помнить: новая
// посадочная появлялась на сайте, но не в карте. Теперь забыть нечего.
import type { APIRoute } from "astro";
import { SITE, ROUTES, FACTS, pathFor, type Locale, type PageId } from "../content";

const LOCALES = ["en", "ru"] as const satisfies readonly Locale[];
const PAGES = Object.keys(ROUTES) as PageId[];

/**
 * Корень «/» в карту не попадает намеренно: он отдаёт 302 по Accept-Language,
 * а редирект в sitemap — мусор для краулера. Но x-default главной указывает
 * именно на него: так Google документирует автоперенаправляющую главную.
 */
function urlNode(page: PageId, locale: Locale): string {
  const loc = SITE + pathFor(page, locale);
  const xDefault = page === "home" ? `${SITE}/` : SITE + pathFor(page, "en");
  const alts = LOCALES.map(
    (l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE + pathFor(page, l)}"/>`,
  ).join("\n");
  return [
    "  <url>",
    `    <loc>${loc}</loc>`,
    `    <lastmod>${FACTS.updated}</lastmod>`,
    alts,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${xDefault}"/>`,
    "  </url>",
  ].join("\n");
}

export const GET: APIRoute = () => {
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...PAGES.flatMap((page) => LOCALES.map((locale) => urlNode(page, locale))),
    "</urlset>",
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
};
