// Навигация и футер: один источник для шапки, бургера и подвала. Добавили
// посадочную — дописали строку сюда, и она появилась во всех трёх местах.
// Сам список страниц для sitemap.xml берётся из ROUTES в content.ts.
import { FACTS, LINKS, pathFor, type Locale, type PageId } from "./content";

/** Прямая ссылка на файл релиза: качается сразу, без похода на страницу GitHub. */
const REL = `https://github.com/Kom1sh/mediachef/releases/download/v${FACTS.version}`;

export interface DownloadFile {
  os: "mac" | "win" | "linux";
  href: string;
  label: Record<Locale, string>;
  size: string;
  /** Развёрнутая подпись — для списков в меню и подвале. */
  note: Record<Locale, string>;
  /** Короткая подпись для кнопки: там помещается только платформа. */
  sub?: Record<Locale, string>;
}

/** Имена файлов — ровно те, что публикует .github/workflows/release.yml. */
export const DOWNLOADS: readonly DownloadFile[] = [
  {
    os: "mac",
    href: `${REL}/MediaChef_${FACTS.version}_aarch64.dmg`,
    label: { en: "macOS · DMG", ru: "macOS · DMG" },
    size: "66 MB",
    note: { en: "Apple Silicon", ru: "Apple Silicon" },
  },
  {
    os: "mac",
    href: `${REL}/MediaChef-${FACTS.version}-macos-arm64.zip`,
    label: { en: "macOS · ZIP", ru: "macOS · ZIP" },
    size: "60 MB",
    note: { en: "Apple Silicon, no installer", ru: "Apple Silicon, без установщика" },
  },
  {
    os: "win",
    href: `${REL}/MediaChef_${FACTS.version}_x64-setup.exe`,
    label: { en: "Windows · installer", ru: "Windows · установщик" },
    size: "82 MB",
    note: { en: "64-bit", ru: "64-разрядная" },
  },
  {
    os: "linux",
    href: `${REL}/MediaChef_${FACTS.version}_amd64.AppImage`,
    label: { en: "Linux · AppImage", ru: "Linux · AppImage" },
    size: "181 MB",
    note: { en: "x86_64, runs as is", ru: "x86_64, запускается как есть" },
    sub: { en: "x86_64", ru: "x86_64" },
  },
  {
    os: "linux",
    href: `${REL}/MediaChef_${FACTS.version}_amd64.deb`,
    label: { en: "Linux · DEB", ru: "Linux · DEB" },
    size: "118 MB",
    note: { en: "x86_64, Debian and Ubuntu", ru: "x86_64, Debian и Ubuntu" },
  },
];

export const byOs = (os: DownloadFile["os"]) => DOWNLOADS.filter((d) => d.os === os);

/** Подписи навигации. Тексты страниц живут в content.ts, обвязка — здесь. */
const M = {
  en: {
    navLabel: "Site",
    menu: "Menu",
    features: "Features",
    guides: "Guides",
    download: "Download",
    faq: "FAQ",
    gConvert: "Converting",
    gTranscribe: "Transcription",
    gTrust: "Privacy and code",
    gMac: "macOS",
    gWin: "Windows",
    gLinux: "Linux",
    allFiles: "All files and release notes",
    onThisPage: "On this page",
    footProduct: "Product",
    footGuides: "Guides",
    footDownload: "Download",
    footProject: "Project",
    footBlurb: `A free media kitchen for macOS, Windows and Linux. FFmpeg ${FACTS.ffmpeg} and whisper.cpp ${FACTS.whisper} ship inside the download — nothing to install separately.`,
    license: "License GPL-3.0",
    notice: "What is bundled — NOTICE.md",
    sourceCode: "Source code on GitHub",
    releases: "All releases",
    // Разделы главной — короткие подписи для меню, содержания и футера.
    sHow: "How it works",
    sRecipes: "Recipes",
    sOut: "What it does out of the box",
    sTranscribe: "Transcription",
    sModels: "Whisper models",
    sPrivacy: "Offline and private",
    sOss: "Open source",
    sFaq: "FAQ",
    // Названия посадочных в меню — короче, чем их H1.
    pMp3: "MP4 to MP3",
    pTranscribe: "Audio to text",
  },
  ru: {
    navLabel: "Сайт",
    menu: "Меню",
    features: "Возможности",
    guides: "Гайды",
    download: "Скачать",
    faq: "Вопросы",
    gConvert: "Конвертация",
    gTranscribe: "Транскрибация",
    gTrust: "Приватность и код",
    gMac: "macOS",
    gWin: "Windows",
    gLinux: "Linux",
    allFiles: "Все файлы и заметки о релизе",
    onThisPage: "На этой странице",
    footProduct: "Продукт",
    footGuides: "Гайды",
    footDownload: "Скачать",
    footProject: "Проект",
    footBlurb: `Свободная медиа-кухня для macOS, Windows и Linux. FFmpeg ${FACTS.ffmpeg} и whisper.cpp ${FACTS.whisper} едут внутри загрузки — ставить отдельно нечего.`,
    license: "Лицензия GPL-3.0",
    notice: "Что внутри — NOTICE.md",
    sourceCode: "Исходный код на GitHub",
    releases: "Все релизы",
    sHow: "Как это устроено",
    sRecipes: "Рецепты",
    sOut: "Что умеет из коробки",
    sTranscribe: "Транскрибация",
    sModels: "Модели Whisper",
    sPrivacy: "Офлайн и приватность",
    sOss: "Открытый код",
    sFaq: "Вопросы",
    pMp3: "MP4 в MP3",
    pTranscribe: "Аудио в текст",
  },
} as const;

export const UI = (locale: Locale) => M[locale];

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
    label: d.label[locale],
    href: d.href,
    note: `${d.size} · ${d.note[locale]}`,
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
      { label: u.pMp3, href: pathFor("mp3", locale) },
      { label: u.pTranscribe, href: pathFor("transcribe", locale) },
    ] },
    { label: u.footDownload, items: [
      ...DOWNLOADS.map((d) => ({ label: d.label[locale], href: d.href, note: d.size, ext: true })),
      { label: u.releases, href: LINKS.releases, ext: true },
    ] },
    { label: u.footProject, items: [
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
