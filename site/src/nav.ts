// Навигация и футер: один источник для шапки, бургера и подвала. Добавили
// посадочную — дописали строку сюда, и она появилась во всех трёх местах.
// Сам список страниц для sitemap.xml берётся из ROUTES в content.ts.
import { CATALOG, FACTS, FEEDBACK_EMAIL, LINKS, T, pathFor, type Locale, type PageId } from "./content";

/** Прямая ссылка на файл релиза: качается сразу, без похода на страницу GitHub. */
const REL = `https://github.com/Kom1sh/mediachef/releases/download/v${FACTS.version}`;

export interface DownloadFile {
  os: "mac" | "win" | "linux";
  href: string;
  size: string;
  /** Подпись файла. Названия платформ и форматов не переводятся, поэтому
   *  из текстов языка приходит только то, что действительно меняется. */
  label: (u: Menu) => string;
  /** Развёрнутая подпись для списков в меню и подвале. */
  note: (u: Menu) => string;
  /** Короткая подпись для кнопки: там помещается только платформа. */
  sub?: (u: Menu) => string;
}

type Menu = ReturnType<typeof UI>;

/** Имена файлов — ровно те, что публикует .github/workflows/release.yml. */
export const DOWNLOADS: readonly DownloadFile[] = [
  {
    os: "mac",
    href: `${REL}/MediaChef_${FACTS.version}_aarch64.dmg`,
    size: "66 MB",
    label: () => "macOS · DMG",
    note: (u) => u.nApple,
  },
  {
    os: "mac",
    href: `${REL}/MediaChef-${FACTS.version}-macos-arm64.zip`,
    size: "60 MB",
    label: () => "macOS · ZIP",
    note: (u) => u.nZip,
  },
  {
    os: "win",
    href: `${REL}/MediaChef_${FACTS.version}_x64-setup.exe`,
    size: "82 MB",
    label: (u) => u.dlWin,
    note: (u) => u.nWin,
  },
  {
    os: "linux",
    href: `${REL}/MediaChef_${FACTS.version}_amd64.AppImage`,
    size: "181 MB",
    label: () => "Linux · AppImage",
    note: (u) => u.nAppimage,
    sub: () => "x86_64",
  },
  {
    os: "linux",
    href: `${REL}/MediaChef_${FACTS.version}_amd64.deb`,
    size: "118 MB",
    label: () => "Linux · DEB",
    note: (u) => u.nDeb,
  },
];

export const byOs = (os: DownloadFile["os"]) => DOWNLOADS.filter((d) => d.os === os);

/** Подписи навигации живут в текстах языка — copy/<locale>.ts, поле `menu`. */
export const UI = (locale: Locale) => T[locale].menu;


export interface NavItem { label: string; href: string; note?: string; ext?: boolean }
export interface NavGroup { label: string; items: readonly NavItem[] }
export interface NavEntry { label: string; href?: string; groups?: readonly NavGroup[] }

/**
 * Якорь на раздел главной: со своей же главной — короткий «#id», с посадочной —
 * полный путь. Иначе «#faq» с посадочной прыгал бы в её собственный FAQ.
 */
export function anchorFor(locale: Locale, page: PageId) {
  const home = pathFor("home", locale);
  return (id: string) => (page === "home" ? `#${id}` : `${home}#${id}`);
}

/** Пункты меню: три категории с выпадающими списками плюс прямая ссылка. */
export function navFor(locale: Locale, page: PageId): readonly NavEntry[] {
  const u = UI(locale);
  const a = anchorFor(locale, page);
  const dl = (d: DownloadFile): NavItem => ({
    label: d.label(u),
    href: d.href,
    note: `${d.size} · ${d.note(u)}`,
    ext: true,
  });

  return [
    {
      label: u.features,
      groups: [
        { label: u.gConvert, items: [
          { label: u.sRecipes, href: a("recipes") },
          { label: u.sOut, href: a("out") },
        ] },
        { label: u.gTranscribe, items: [
          { label: u.sTranscribe, href: a("transcribe") },
          { label: u.sModels, href: a("models") },
        ] },
        { label: u.gTrust, items: [
          { label: u.sPrivacy, href: a("privacy") },
          { label: u.sOss, href: a("oss") },
        ] },
      ],
    },
    {
      label: u.guides,
      groups: [
        { label: u.gConvert, items: [
          { label: u.pMp3, href: pathFor("mp3", locale) },
        ] },
        { label: u.gTranscribe, items: [
          { label: u.pTranscribe, href: pathFor("transcribe", locale) },
        ] },
      ],
    },
    // Каталог — прямая ссылка, а не выпадающий список: внутри одна страница,
    // а подпись у неё уже переведена в блоке catalog, отдельного ключа не надо.
    { label: CATALOG[locale].crumb, href: pathFor("catalog", locale) },
    {
      label: u.download,
      groups: [
        { label: u.gMac, items: byOs("mac").map(dl) },
        { label: u.gWin, items: byOs("win").map(dl) },
        { label: u.gLinux, items: byOs("linux").map(dl) },
        { label: "GitHub", items: [
          { label: u.allFiles, href: LINKS.releases, ext: true },
        ] },
      ],
    },
    { label: u.faq, href: a("faq") },
  ];
}

/** Колонки подвала. Колонка бренда собирается в самом Footer.astro. */
export function footerFor(locale: Locale, page: PageId): readonly NavGroup[] {
  const u = UI(locale);
  const a = anchorFor(locale, page);
  return [
    { label: u.footProduct, items: [
      { label: u.sHow, href: a("how") },
      { label: u.sRecipes, href: a("recipes") },
      { label: u.sTranscribe, href: a("transcribe") },
      { label: u.sPrivacy, href: a("privacy") },
      { label: u.sFaq, href: a("faq") },
    ] },
    { label: u.footGuides, items: [
      { label: CATALOG[locale].h1, href: pathFor("catalog", locale) },
      { label: u.pMp3, href: pathFor("mp3", locale) },
      { label: u.pTranscribe, href: pathFor("transcribe", locale) },
    ] },
    { label: u.footDownload, items: [
      ...DOWNLOADS.map((d) => ({ label: d.label(u), href: d.href, note: d.size, ext: true })),
      { label: u.releases, href: LINKS.releases, ext: true },
    ] },
    { label: u.footProject, items: [
      // Сам адрес, а не фраза «сообщить о проблеме»: в подвале его читают
      // глазами и копируют руками, а приглашение написать уже стоит выше,
      // в закрывающем блоке страницы. Первой в колонке — до этой строки уйти
      // с сайта с вопросом было некуда, только в репозиторий.
      { label: FEEDBACK_EMAIL, href: LINKS.feedback, ext: true },
      { label: u.sourceCode, href: LINKS.github, ext: true },
      { label: u.notice, href: LINKS.notice, ext: true },
      { label: u.license, href: "https://www.gnu.org/licenses/gpl-3.0.html", ext: true },
    ] },
  ];
}

/** Содержание главной: те же якоря, что и в меню, но списком под H1. */
export function homeToc(locale: Locale): readonly NavItem[] {
  const u = UI(locale);
  return [
    { label: u.sHow, href: "#how" },
    { label: u.sRecipes, href: "#recipes" },
    { label: u.sTranscribe, href: "#transcribe" },
    { label: u.sPrivacy, href: "#privacy" },
    { label: u.sOss, href: "#oss" },
    { label: u.sFaq, href: "#faq" },
  ];
}
