// Markdown-версия каждой страницы: dist/<путь>/index.md рядом с index.html.
//
// Зачем: ИИ-агенты и ридеры забирают страницу, чтобы ответить человеку, и
// первым делом выбрасывают вёрстку. Проверка ai-page.py показала, что после
// такой чистки от главной и посадочных доходит 27–29% текста: остальное ридер
// принимает за обвязку. Markdown отдаёт им ровно содержимое <main>, без угадывания.
// Достаётся он двумя путями: прямым адресом …/index.md и заголовком
// `Accept: text/markdown` на обычный адрес страницы — это делает _worker.js.
//
// Источник — уже собранный HTML, а не тексты из src/copy: так в markdown
// попадает ровно то, что видит человек, и новой странице не нужен свой
// «markdown-рендер». Закрытые от индекса страницы (форма отзывов) пропускаются:
// агенту там читать нечего.
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import TurndownService from "turndown";
import gfmPkg from "turndown-plugin-gfm";

const { gfm } = gfmPkg;

/** Первое совпадение группы 1 или пустая строка. */
const pick = (html, re) => (html.match(re)?.[1] ?? "").trim();

const decode = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

function turndownFor(site) {
  const td = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "_",
  });
  td.use(gfm);
  // Декор и управление: в тексте для модели им делать нечего.
  td.remove(["script", "style", "noscript", "svg", "button", "form", "template", "iframe"]);
  td.addRule("hidden", {
    filter: (node) => node.getAttribute?.("aria-hidden") === "true" || node.hasAttribute?.("hidden"),
    replacement: () => "",
  });
  // Навигация по самой странице: хлебные крошки и оглавление из якорей. В
  // markdown это шум — заголовки и так идут по порядку. Блок «Читать дальше»
  // (nav.also) остаётся: это связи с другими страницами.
  const cls = (node) => ` ${node.getAttribute?.("class") || ""} `;
  td.addRule("pageNav", {
    filter: (node) => cls(node).includes(" crumbs ") || cls(node).includes(" toc "),
    replacement: () => "",
  });
  // Карточка фактов <dl>: «название: значение» строкой списка, а не два
  // отдельных абзаца, из которых связь уже не восстановить.
  td.addRule("dt", {
    filter: "dt",
    replacement: (content) => `\n- **${content.trim()}:** `,
  });
  td.addRule("dd", {
    filter: "dd",
    replacement: (content) => content.trim().replace(/\n+/g, " "),
  });
  td.addRule("dl", {
    filter: "dl",
    // Пары <dt>/<dd> обёрнуты в <div>, и каждая обёртка даёт пустую строку —
    // список выходит «рваным». Сжимаем до строки на пункт.
    replacement: (content) => `\n\n${content.trim().replace(/\n{2,}(?=- \*\*)/g, "\n")}\n\n`,
  });
  // Ссылки — абсолютными: markdown читают вне сайта, относительный путь там
  // ни к чему не ведёт.
  td.addRule("absoluteLinks", {
    filter: (node) => node.nodeName === "A" && node.getAttribute("href"),
    replacement: (content, node) => {
      const text = content.trim();
      if (!text) return "";
      const href = new URL(node.getAttribute("href"), site).href;
      if (!text.includes("\n")) return `[${text}](${href})`;
      // Карточка-ссылка: внутри заголовок и описание. Markdown блоков внутри
      // ссылки не допускает, поэтому — пункт списка «[название](адрес): описание».
      const parts = text
        .split(/\n+/)
        .map((s) => s.replace(/^#+\s*/, "").trim())
        .filter(Boolean);
      const rest = parts.slice(1).join(" ");
      return `\n- [${parts[0]}](${href})${rest ? `: ${rest}` : ""}\n`;
    },
  });
  // Заголовок — одна строка. В вёрстке строки бывают разбиты <br> и блочными
  // <span>, и markdown-заголовок обрывался на первом переносе, а склеенные
  // фразы теряли пробел («text.All»).
  td.addRule("heading", {
    filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
    replacement: (content, node) => {
      const level = Number(node.nodeName.charAt(1));
      const text = content
        .replace(/\s*\n\s*/g, " ")
        // Заглавная после точки — начало следующей фразы; в арабском заглавных
        // нет, там любая буква. Китайскому пробелы между фразами не нужны.
        .replace(/([.!?؟])(?=[\p{Lu}\p{Script=Arabic}])/gu, "$1 ")
        .trim();
      return text ? `\n\n${"#".repeat(level)} ${text}\n\n` : "";
    },
  });
  td.addRule("absoluteImages", {
    filter: "img",
    replacement: (_content, node) => {
      const alt = (node.getAttribute("alt") || "").trim();
      // Картинка без подписи модели ничего не скажет.
      if (!alt) return "";
      return `![${alt}](${new URL(node.getAttribute("src") || "", site).href})`;
    },
  });
  // <details>/<summary> в FAQ: вопрос — подзаголовком, ответ — абзацем.
  td.addRule("summary", {
    filter: "summary",
    replacement: (content) => `\n\n**${content.trim()}**\n\n`,
  });
  return td;
}

/** Markdown страницы или null, если её отдавать не нужно. */
export function pageToMarkdown(html, site) {
  if (/<meta name="robots" content="[^"]*noindex/i.test(html)) return null;
  const main = pick(html, /<main\b[^>]*>([\s\S]*)<\/main>/i);
  if (!main) return null;
  const title = decode(pick(html, /<title>([^<]*)<\/title>/i));
  const description = decode(pick(html, /<meta name="description" content="([^"]*)"/i));
  const url = pick(html, /<link rel="canonical" href="([^"]+)"/i);
  const lang = pick(html, /<html\b[^>]*\blang="([^"]+)"/i);

  const body = turndownFor(url || site)
    .turndown(main)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  // Шапка YAML: адрес HTML-версии — то, что модель должна цитировать.
  // JSON-строка — валидная YAML-строка в двойных кавычках.
  const front = [
    "---",
    `title: ${JSON.stringify(title)}`,
    description && `description: ${JSON.stringify(description)}`,
    url && `url: ${url}`,
    lang && `language: ${lang}`,
    "---",
  ].filter(Boolean);
  return `${front.join("\n")}\n\n${body}\n`;
}

export default function markdownPages() {
  return {
    name: "mediachef-markdown-pages",
    hooks: {
      "astro:config:done": ({ config }) => {
        markdownPages.site = config.site;
      },
      "astro:build:done": async ({ dir, pages, logger }) => {
        const root = fileURLToPath(dir);
        let written = 0;
        for (const { pathname } of pages) {
          const file = join(root, pathname, "index.html");
          let html;
          try {
            html = await readFile(file, "utf8");
          } catch {
            continue; // не страница, а файл вроде llms.txt или sitemap.xml
          }
          const md = pageToMarkdown(html, markdownPages.site);
          if (!md) continue;
          await writeFile(join(root, pathname, "index.md"), md);
          written++;
        }
        logger.info(`markdown-версии: ${written} страниц`);
      },
    },
  };
}
