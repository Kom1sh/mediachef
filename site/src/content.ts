// Весь текст сайта в одном месте, две локали. Ключи зеркальны — как в приложении.
// Цифры и названия рецептов здесь не выдуманы: они взяты из recipes/*.yaml,
// app/core/src/models.rs, NOTICE.md и docs/RELEASE_NOTES.md.
export type Locale = "en" | "ru";
export type PageId = "home" | "mp3" | "transcribe";

export const SITE = "https://mediachef.app";
const RELEASES = "https://github.com/Kom1sh/mediachef/releases/latest";
const GITHUB = "https://github.com/Kom1sh/mediachef";
const NOTICE = "https://github.com/Kom1sh/mediachef/blob/main/NOTICE.md";

export const LINKS = { releases: RELEASES, github: GITHUB, notice: NOTICE };

/** Проверяемые факты о продукте — единственный источник для текста и разметки. */
export const FACTS = {
  version: "0.4.0",
  // Дата последней правки текстов — уезжает в <lastmod> sitemap.xml.
  // Меняется вручную вместе с содержимым, а не при каждой пересборке:
  // «сегодня» в lastmod у неизменившейся страницы Google просто перестаёт верить.
  updated: "2026-08-20",
  recipeCount: 17,
  modelCount: 4,
  platformCount: 3,
  ffmpeg: "9.0.1",
  whisper: "v1.7.6",
  license: "GPL-3.0",
};

/** Слаги по локалям: переключатель языка бьёт страницу в страницу, а не в главную. */
export const ROUTES: Record<PageId, Record<Locale, string>> = {
  home: { en: "", ru: "" },
  mp3: { en: "convert-mp4-to-mp3", ru: "mp4-v-mp3" },
  transcribe: { en: "transcribe-audio-to-text", ru: "transkribaciya-audio-v-tekst" },
};

/** Путь страницы внутри локали, всегда со слешем на конце. */
export function pathFor(page: PageId, locale: Locale): string {
  const slug = ROUTES[page][locale];
  return `/${locale}/${slug ? slug + "/" : ""}`;
}

/** Модели Whisper — id, файл и размер ровно как в app/core/src/models.rs. */
export const MODELS = [
  { id: "tiny", size: { en: "78 MB", ru: "78 МБ" } },
  { id: "base", size: { en: "148 MB", ru: "148 МБ" } },
  { id: "small", size: { en: "488 MB", ru: "488 МБ" }, isDefault: true },
  { id: "large-v3-turbo", size: { en: "1.62 GB", ru: "1,62 ГБ" } },
] as const;

export type ModelId = (typeof MODELS)[number]["id"];

/** Скриншот приложения. Размеры — атрибуты img, чтобы не было сдвига вёрстки. */
export const SHOT = { src: "/screenshots/app-main-dark.png", w: 2360, h: 1520 };

export const T = {
  en: {
    lang: "en",
    ogLocale: "en_US",
    title: "MediaChef — free offline video converter with transcription",
    description:
      "Free open-source app for macOS, Windows and Linux: convert video and audio on your own computer and transcribe speech to text with Whisper. No uploads, no size limits, no subscription.",
    nav: { recipes: "Recipes", transcribe: "Transcription", privacy: "Offline", faq: "FAQ" },
    skipToContent: "Skip to content",
    heroTitle1: "Any media into any.",
    heroTitle2: "Speech into text.",
    heroAccent: "All on your computer.",
    heroSub:
      "MediaChef is a free desktop app that turns FFmpeg and Whisper into recipe cards: convert video and audio, pull the sound out of a clip, transcribe a recording to text — offline, on your own machine, with nothing uploaded anywhere.",
    trust: [
      `Version ${FACTS.version}`,
      `${FACTS.recipeCount} built-in recipes`,
      `${FACTS.modelCount} Whisper models`,
      "macOS · Windows · Linux",
      "Open source · GPL-3.0",
    ],
    ctaMac: "Download for macOS",
    ctaWin: "Download for Windows",
    ctaLinux: "Download for Linux",
    ctaNote: "Free and open source —",
    ctaNoteLink: "read the code on GitHub",
    howTitle: "How it works",
    steps: [
      { n: "1", h: "Drop a file", p: "Drag in a video or a recording. MediaChef probes the file and shows only the recipes that fit what it found inside." },
      { n: "2", h: "Pick a recipe", p: "Every action is a plain card: “Extract audio to MP3”, “Make SRT subtitles for a video”, “Compress video”. Defaults are already sensible; the live preview shows the exact FFmpeg command." },
      { n: "3", h: "Take the result", p: "The file lands next to the original — or in a folder you choose. The queue shows progress, time left and where the output went." },
    ],
    shotAlt:
      "MediaChef main screen in dark theme: sidebar with Convert, Models and Settings, a drop board for files, and the task queue on the right.",
    shotCaption:
      "The real window, dark theme. Drop board in the middle, queue on the right, engines already inside. Interface language follows your system — English and Russian.",
    outTitle: "What it does out of the box",
    outLead: `Seventeen recipes ship with the app. Each one is a real FFmpeg or Whisper job with the parameters already filled in, and each one writes its result next to your file as {name}.{what}.{ext}.`,
    outHead: ["Direction", "Recipe in the app", "What you get"],
    outRows: [
      ["Video → audio", "Extract audio to MP3", "<code>clip.audio.mp3</code> at 128, 192 or 320 kbps"],
      ["Video → subtitles", "Make SRT subtitles for a video", "<code>clip.subs.srt</code> with timings"],
      ["Audio → text", "Transcribe audio to text", "<code>talk.transcript.txt</code>, plain text"],
      ["Any language → English", "Translate speech to English text", "<code>talk.english.txt</code> in one pass"],
      ["MP4 → MKV", "Convert MP4 to MKV", "Repackaged, not re-encoded — seconds, no quality loss"],
      ["Video → smaller", "Compress video (quality preset)", "H.264 at CRF 23, 28 or 33"],
      ["Video → GIF", "Video to GIF", "10–24 fps, width 320–640"],
      ["Anything else", "Custom FFmpeg command", "Your own arguments, with the command preview"],
    ],
    modelsTitle: "Whisper models",
    modelsLead:
      "Transcription runs on whisper.cpp with OpenAI's Whisper models. You download a model once from the Models screen; after that everything works with the network off. Bigger model, better text, slower run.",
    modelsHead: ["Model", "Download", "What it's for"],
    modelNotes: {
      tiny: "Fastest, rough quality. A draft of clear speech in a fraction of the time.",
      base: "Fast, ok quality. Good enough to search a recording for the bit you need.",
      small: "Recommended balance — the default in every transcription recipe.",
      "large-v3-turbo": "Best quality, tuned for Apple Silicon. For text you intend to publish.",
    } as Record<ModelId, string>,
    defaultTag: "default",
    recipesTitle: "Recipes instead of commands",
    recipesLead:
      "FFmpeg can do almost anything — in the language of the terminal. MediaChef translates: you choose what to do, the parameters are already set. A live preview shows the real command, so you learn as you go.",
    recipes: [
      { tile: "tile-ochre", h: "Extract audio to MP3", p: "Pull the soundtrack out of any video." },
      { tile: "tile-green", h: "Make SRT subtitles for a video", p: "Whisper listens and writes an SRT file." },
      { tile: "tile-green", h: "Compress video", p: "Fit a clip into a messenger-friendly size." },
      { tile: "tile-purple", h: "Video to GIF", p: "A sharp looping GIF, 10 to 24 fps." },
      { tile: "tile-green", h: "Transcribe audio to text", p: "Meeting or voice memo into plain text." },
      { tile: "tile-blue", h: "Translate speech to English", p: "Whisper transcribes and translates in one pass." },
      { tile: "tile-blue", h: "Convert MP4 to MKV", p: "Repackage without re-encoding — instant." },
      { tile: "tile-red", h: "Remove audio from video", p: "Drop every audio track, keep the picture." },
    ],
    trTitle: "Transcribe audio to text without leaving your device",
    trBullets: [
      { h: "Whisper, running locally.", p: "OpenAI's speech model executes on your own processor via whisper.cpp — recordings never leave the machine." },
      { h: "Models downloaded in-app.", p: "From the 78 MB tiny to the 1.62 GB large-v3-turbo — pick per task on the Models screen." },
      { h: "Text or subtitles.", p: "Plain TXT, SRT and VTT with timestamps, or JSON with segment times for tooling." },
      { h: "Honest results.", p: "If a file has no speech, MediaChef says “No speech detected” — it never ships an empty file with a green checkmark." },
    ],
    recipesLink: "Full guide: convert MP4 to MP3 →",
    trLink: "Full guide: transcribe audio to text →",
    privTitle: "Your files never travel",
    privLead:
      "An online converter asks you to upload the file to someone else's server, wait in a queue and trust their retention policy. MediaChef works on your CPU: a gigabyte of screen recording and a private meeting audio convert the same way — with Wi-Fi switched off.",
    privChips: ["No uploads", "No size limits", "No subscriptions"],
    ossTitle: "Open source, engines included",
    ossLead:
      "GPL-3.0, with the whole development history public on GitHub. Since 0.4.0 every download carries its own engines — nothing to install in PATH, nothing to configure.",
    engineRows: [
      { k: `FFmpeg ${FACTS.ffmpeg}`, v: "conversion · GPL v3" },
      { k: `whisper.cpp ${FACTS.whisper}`, v: "speech recognition · MIT" },
      { k: "macOS · Windows · Linux", v: "dmg ~66 MB · installer ~82 MB · AppImage ~181 MB · deb ~118 MB" },
    ],
    ossNotice: "Exact versions and licenses of everything bundled — NOTICE.md",
    faqTitle: "Questions, answered",
    faq: [
      { q: "Is it really free?", a: "Yes. MediaChef is open source under GPL-3.0 — no account, no trial, no watermark. The converter and the transcription are the whole app, and the code is public on GitHub." },
      { q: "Which formats are supported?", a: "Everything FFmpeg reads: MP4, MKV, MOV, WebM, AVI, TS, MP3, WAV, FLAC, M4A, OGG and dozens more. MediaChef probes the file with ffprobe instead of trusting its extension, so the recipes you see are the ones that actually fit it." },
      { q: "Where do my files get uploaded?", a: "Nowhere. Conversion and transcription run entirely on your computer. The only thing MediaChef ever downloads is a Whisper model — once, on the Models screen." },
      { q: "How accurate is the transcription?", a: "It uses OpenAI's Whisper models through whisper.cpp v1.7.6. Accuracy scales with the model you pick: tiny is instant and rough, small is the balanced default, large-v3-turbo is near-human on clear speech. The language is detected automatically." },
      { q: "Does it work offline?", a: "Yes. FFmpeg and Whisper ship inside the download, so conversion works offline from the first launch, and transcription works offline after you fetch a model once." },
      { q: "Why not just use an online converter?", a: "For one small public file, an online converter is fine. Private recordings, multi-gigabyte videos, batches and anything under an NDA are better done locally: no upload wait, no size cap, and nothing sitting on someone else's disk." },
    ],
    finalTitle: "Put a chef in charge of your media",
    finalSub: `Free, open source, ${FACTS.platformCount} platforms. Version ${FACTS.version}.`,
    betaNote:
      "MediaChef is young: builds are not yet signed by Apple or Microsoft, so the first launch asks for confirmation — a plain-text how-to ships inside every download.",
    // ── общая обвязка ──
    footRights: "© 2026 mediachef.app · GPL-3.0",
    footTagline: "An open-source media kitchen.",
    footLinks: [
      { href: GITHUB, label: "GitHub" },
      { href: RELEASES, label: "Download" },
      { href: NOTICE, label: "NOTICE" },
    ],
    switchLabel: "Русская версия",
    tocLabel: "On this page",
    breadcrumbHome: "Home",
    alsoLabel: "Read next",
    footNavLabel: "Project links",
  },
  ru: {
    lang: "ru",
    ogLocale: "ru_RU",
    title: "MediaChef — конвертер видео и аудио офлайн + транскрибация",
    description:
      "Бесплатное приложение с открытым кодом для macOS, Windows и Linux: конвертируйте видео и аудио на своём компьютере и переводите речь в текст через Whisper. Без загрузки в облако, без лимитов и подписок.",
    nav: { recipes: "Рецепты", transcribe: "Транскрибация", privacy: "Офлайн", faq: "Вопросы" },
    skipToContent: "К содержимому",
    heroTitle1: "Любой файл — в любой.",
    heroTitle2: "Речь — в текст.",
    heroAccent: "Всё — на вашем компьютере.",
    heroSub:
      "MediaChef — бесплатное приложение, которое превращает FFmpeg и Whisper в понятные карточки-рецепты: конвертируйте видео и аудио, вытаскивайте звук из ролика, переводите запись в текст — офлайн, на своём компьютере, без загрузки файлов в облако.",
    trust: [
      `Версия ${FACTS.version}`,
      `${FACTS.recipeCount} готовых рецептов`,
      `${FACTS.modelCount} модели Whisper`,
      "macOS · Windows · Linux",
      "Открытый код · GPL-3.0",
    ],
    ctaMac: "Скачать для macOS",
    ctaWin: "Скачать для Windows",
    ctaLinux: "Скачать для Linux",
    ctaNote: "Бесплатно и с открытым кодом —",
    ctaNoteLink: "код на GitHub",
    howTitle: "Как это устроено",
    steps: [
      { n: "1", h: "Бросьте файл", p: "Перетащите видео или запись. MediaChef заглянет внутрь файла и покажет только те рецепты, которые к нему подходят." },
      { n: "2", h: "Выберите рецепт", p: "Каждое действие — простая карточка: «Извлечь аудио в MP3», «Субтитры к видео (SRT)», «Сжать видео». Параметры уже настроены, а превью показывает точную команду FFmpeg." },
      { n: "3", h: "Заберите результат", p: "Файл появится рядом с исходником — или в вашей папке. Очередь показывает прогресс, оставшееся время и путь к результату." },
    ],
    shotAlt:
      "Главный экран MediaChef в тёмной теме: боковое меню «Конвертация», «Модели», «Настройки», доска для файлов и очередь задач справа.",
    shotCaption:
      "Настоящее окно, тёмная тема. Доска для файлов посередине, очередь справа, движки уже внутри. Язык интерфейса берётся из системы — русский и английский.",
    outTitle: "Что умеет из коробки",
    outLead:
      "В приложении семнадцать рецептов. Каждый — реальная задача FFmpeg или Whisper с уже настроенными параметрами, и каждый кладёт результат рядом с вашим файлом по схеме {имя}.{что}.{расширение}.",
    outHead: ["Направление", "Рецепт в приложении", "Что получится"],
    outRows: [
      ["Видео → аудио", "Извлечь аудио в MP3", "<code>clip.audio.mp3</code>, битрейт 128, 192 или 320 kbps"],
      ["Видео → субтитры", "Субтитры к видео (SRT)", "<code>clip.subs.srt</code> с таймингами"],
      ["Аудио → текст", "Аудио в текст", "<code>talk.transcript.txt</code>, обычный текст"],
      ["Любой язык → английский", "Перевод речи в английский текст", "<code>talk.english.txt</code> за один проход"],
      ["MP4 → MKV", "Конвертировать MP4 в MKV", "Перепаковка без перекодирования — секунды, без потери качества"],
      ["Видео → меньше", "Сжать видео (пресет качества)", "H.264 с CRF 23, 28 или 33"],
      ["Видео → GIF", "Видео в GIF", "10–24 кадра/с, ширина 320–640"],
      ["Всё остальное", "Своя команда FFmpeg", "Любые аргументы, с превью команды"],
    ],
    modelsTitle: "Модели Whisper",
    modelsLead:
      "Распознавание речи работает на whisper.cpp с моделями Whisper от OpenAI. Модель скачивается один раз на экране «Модели» — дальше всё работает с выключенной сетью. Крупнее модель — точнее текст и дольше расчёт.",
    modelsHead: ["Модель", "Скачать", "Для чего"],
    modelNotes: {
      tiny: "Самая быстрая, черновое качество. Черновик по чистой речи за считаные минуты.",
      base: "Быстрая, нормальное качество. Хватает, чтобы найти в записи нужный фрагмент.",
      small: "Рекомендуемый баланс — значение по умолчанию во всех рецептах транскрибации.",
      "large-v3-turbo": "Максимум качества, оптимизирована под Apple Silicon. Для текста, который пойдёт в публикацию.",
    } as Record<ModelId, string>,
    defaultTag: "по умолчанию",
    recipesTitle: "Рецепты вместо команд",
    recipesLead:
      "FFmpeg умеет почти всё — но говорит на языке терминала. MediaChef переводит: вы выбираете, что сделать, а параметры уже настроены. Превью показывает настоящую команду — заодно учишься.",
    recipes: [
      { tile: "tile-ochre", h: "Извлечь аудио в MP3", p: "Достаньте звуковую дорожку из любого видео." },
      { tile: "tile-green", h: "Субтитры к видео (SRT)", p: "Whisper слушает и пишет SRT-файл." },
      { tile: "tile-green", h: "Сжать видео", p: "Уложите ролик в размер для мессенджера." },
      { tile: "tile-purple", h: "Видео в GIF", p: "Чёткая зацикленная гифка, 10–24 кадра/с." },
      { tile: "tile-green", h: "Аудио в текст", p: "Встреча или голосовое — в обычный текст." },
      { tile: "tile-blue", h: "Перевод речи в английский", p: "Whisper расшифровывает и переводит за один проход." },
      { tile: "tile-blue", h: "Конвертировать MP4 в MKV", p: "Перепаковка без перекодирования — мгновенно." },
      { tile: "tile-red", h: "Убрать звук из видео", p: "Удалите все аудиодорожки, оставив картинку." },
    ],
    trTitle: "Транскрибация аудио в текст — не выходя из компьютера",
    trBullets: [
      { h: "Whisper работает локально.", p: "Речевая модель OpenAI выполняется на вашем процессоре через whisper.cpp — записи не покидают компьютер." },
      { h: "Модели качаются в приложении.", p: "От tiny на 78 МБ до large-v3-turbo на 1,62 ГБ — выбирайте под задачу на экране «Модели»." },
      { h: "Текст или субтитры.", p: "Обычный TXT, SRT и VTT с таймкодами или JSON с временем каждого отрезка — для инструментов." },
      { h: "Честный результат.", p: "Если в файле нет речи, MediaChef так и скажет: «Речь не обнаружена» — вместо пустого файла с зелёной галочкой." },
    ],
    recipesLink: "Подробный разбор: MP4 в MP3 →",
    trLink: "Подробный разбор: транскрибация аудио в текст →",
    privTitle: "Ваши файлы никуда не уезжают",
    privLead:
      "Онлайн-конвертер просит загрузить файл на чужой сервер, подождать в очереди и поверить его политике хранения. MediaChef работает на вашем процессоре: гигабайтная запись экрана и приватная запись встречи конвертируются одинаково — даже с выключенным Wi-Fi.",
    privChips: ["Без загрузок", "Без лимитов размера", "Без подписок"],
    ossTitle: "Открытый код, движки в комплекте",
    ossLead:
      "GPL-3.0, вся история разработки публична на GitHub. С версии 0.4.0 движки едут внутри каждой поставки — ничего не нужно ставить в PATH и настраивать.",
    engineRows: [
      { k: `FFmpeg ${FACTS.ffmpeg}`, v: "конвертация · GPL v3" },
      { k: `whisper.cpp ${FACTS.whisper}`, v: "распознавание речи · MIT" },
      { k: "macOS · Windows · Linux", v: "dmg ~66 МБ · установщик ~82 МБ · AppImage ~181 МБ · deb ~118 МБ" },
    ],
    ossNotice: "Точные версии и лицензии всего встроенного — NOTICE.md",
    faqTitle: "Частые вопросы",
    faq: [
      { q: "Это правда бесплатно?", a: "Да. MediaChef — открытый код под GPL-3.0: без аккаунта, без пробного периода, без водяных знаков. Конвертер и транскрибация — это и есть всё приложение, исходники публичны на GitHub." },
      { q: "Какие форматы поддерживаются?", a: "Всё, что читает FFmpeg: MP4, MKV, MOV, WebM, AVI, TS, MP3, WAV, FLAC, M4A, OGG и десятки других. MediaChef смотрит внутрь файла через ffprobe, а не верит расширению, — поэтому в списке остаются только подходящие рецепты." },
      { q: "Куда загружаются мои файлы?", a: "Никуда. Конвертация и расшифровка выполняются целиком на вашем компьютере. Единственное, что MediaChef скачивает, — модель Whisper, один раз, на экране «Модели»." },
      { q: "Насколько точна расшифровка?", a: "Используются модели Whisper от OpenAI через whisper.cpp v1.7.6. Точность зависит от выбранной модели: tiny — мгновенно и черново, small — сбалансированный вариант по умолчанию, large-v3-turbo — почти как человек на чистой речи. Язык определяется автоматически." },
      { q: "Работает без интернета?", a: "Да. FFmpeg и Whisper лежат внутри дистрибутива, поэтому конвертация работает офлайн с первого запуска, а расшифровка — после разовой загрузки модели." },
      { q: "Чем это лучше онлайн-конвертера?", a: "Для одного маленького публичного файла онлайн сгодится. Приватные записи, видео на несколько гигабайт, пакетные задачи и всё под NDA лучше делать локально: без ожидания загрузки, без лимита размера и без копии файла на чужом диске." },
    ],
    finalTitle: "Поставьте шефа за свои медиафайлы",
    finalSub: `Бесплатно, открытый код, ${FACTS.platformCount} платформы. Версия ${FACTS.version}.`,
    betaNote:
      "MediaChef — молодой проект: сборки пока без подписи Apple и Microsoft, поэтому первый запуск попросит подтверждение — простая инструкция лежит внутри каждого архива.",
    // ── общая обвязка ──
    footRights: "© 2026 mediachef.app · GPL-3.0",
    footTagline: "Медиакухня с открытым кодом.",
    footLinks: [
      { href: GITHUB, label: "GitHub" },
      { href: RELEASES, label: "Скачать" },
      { href: NOTICE, label: "NOTICE" },
    ],
    switchLabel: "English version",
    tocLabel: "Содержание",
    breadcrumbHome: "Главная",
    alsoLabel: "Читать дальше",
    footNavLabel: "Ссылки проекта",
  },
} as const;

// ────────────────────────────────────────────────────────────────────────────
// Посадочные под интенты. Шаги, таблица и вопросы у каждой свои — общего
// шаблонного текста между ними нет.
// ────────────────────────────────────────────────────────────────────────────

type Row = readonly string[];

export interface LandingCopy {
  slug: string;
  title: string;
  description: string;
  h1: string;
  crumb: string;
  lead: string;
  sections: { how: string; table: string; why: string; faq: string };
  toc: readonly string[];
  commandLabel: string;
  command: string;
  commandNote: string;
  stepsTitle: string;
  steps: readonly { h: string; p: string }[];
  shotAlt: string;
  shotCaption: string;
  tableTitle: string;
  tableLead: string;
  tableHead: Row;
  tableRows: readonly Row[];
  tableNote: string;
  whyTitle: string;
  whyBullets: readonly { h: string; p: string }[];
  faqTitle: string;
  faq: readonly { q: string; a: string }[];
  ctaTitle: string;
  ctaSub: string;
  also: readonly { page: PageId; label: string }[];
}

export const LANDINGS: Record<Exclude<PageId, "home">, Record<Locale, LandingCopy>> = {
  // ── Интент 1: видео → mp3 ────────────────────────────────────────────────
  mp3: {
    en: {
      slug: ROUTES.mp3.en,
      title: "Convert MP4 to MP3 free and offline — MediaChef",
      description:
        "Pull the audio out of an MP4 and save it as MP3 on your own computer: no upload, no size cap, no watermark. Free open-source app for macOS, Windows and Linux.",
      h1: "Convert MP4 to MP3 — free, offline, on your computer",
      crumb: "MP4 to MP3",
      lead:
        "MediaChef ships a recipe called “Extract audio to MP3”. Drop a video on the board, pick a bitrate, press start: the soundtrack is written next to the original as an MP3. The file never leaves your machine, there is no size limit, and the whole thing works with the network off.",
      sections: { how: "how", table: "bitrate", why: "offline", faq: "faq" },
      toc: ["How to convert MP4 to MP3", "Which bitrate to pick", "Why convert on your computer", "FAQ"],
      commandLabel: "What actually runs",
      command: "ffmpeg -i input.mp4 -vn -b:a 192k output.mp3",
      commandNote: "MediaChef writes this line for you and shows it before the job starts.",
      stepsTitle: "How to convert MP4 to MP3",
      steps: [
        { h: "Download MediaChef", p: "One file for macOS, Windows or Linux. FFmpeg is already inside — nothing to install separately, nothing to add to PATH." },
        { h: "Drop the MP4 on the board", p: "MediaChef reads the file with ffprobe and keeps only the recipes that suit it. A video with an audio track gets the MP3 card straight away." },
        { h: "Pick “Extract audio to MP3”", p: "Choose the bitrate: 128k for speech, 192k as the default, 320k for archiving. The command preview updates as you switch." },
        { h: "Press start and take the file", p: "The MP3 appears next to the video as clip.audio.mp3. The queue shows progress, time left and the finished path." },
      ],
      shotAlt:
        "MediaChef ready to convert MP4 to MP3: the drop board waiting for a video file, with the task queue on the right.",
      shotCaption: "The board where the MP4 goes. Recipes appear once MediaChef has read the file.",
      tableTitle: "Which bitrate to pick",
      tableLead:
        "The recipe offers three bitrates. Sizes below are for one hour of audio — arithmetic from the bitrate, so a two-hour recording is simply double.",
      tableHead: ["Bitrate", "One hour of audio", "Pick it when"],
      tableRows: [
        ["128 kbps", "≈ 58 MB", "Speech: interviews, podcasts, lectures, voice memos. Smallest file, no audible cost on a voice."],
        ["192 kbps", "≈ 86 MB", "The default. Music you actually listen to, and anything you are not sure about."],
        ["320 kbps", "≈ 144 MB", "Archiving, or audio you will edit further and re-encode again later."],
      ],
      tableNote:
        "Not only MP4: the same recipe shows up for MKV, MOV, WebM, AVI, TS and anything else FFmpeg can read, as long as the file has an audio track.",
      whyTitle: "Why convert on your computer",
      whyBullets: [
        { h: "Nothing is uploaded.", p: "A recorded call or an unreleased cut stays on your disk. There is no server copy to trust a retention policy about." },
        { h: "No size cap.", p: "Online converters stop at 100 MB to 2 GB and put you in a queue. A four-gigabyte screen recording converts the same way a four-megabyte one does." },
        { h: "Faster on real files.", p: "Extracting an existing audio track is quick. Uploading the video first is the slow part — and locally that part does not exist." },
        { h: "Free, with no account.", p: "GPL-3.0 open source: no sign-up, no trial, no watermark, no per-file limit." },
        { h: "Batches, not one at a time.", p: "Drop every clip on the board at once; the queue works through them and tells you where each MP3 landed." },
      ],
      faqTitle: "FAQ",
      faq: [
        { q: "Does converting MP4 to MP3 lose quality?", a: "MP3 is a lossy format, so the track is re-encoded once. At the default 192 kbps that is inaudible on speech and very close to it on music. If the file is a master you will work with further, take 320 kbps." },
        { q: "What is the largest file I can convert?", a: "MediaChef sets no limit — your free disk space is the limit, and the app checks it before starting. Length does not matter either: a three-hour recording is one job in the queue." },
        { q: "Does it work without internet?", a: "Yes, completely. FFmpeg ships inside the download, so conversion never touches the network. Only transcription needs a one-time model download." },
        { q: "Can I convert several videos at once?", a: "Yes. Drop them all on the board, add the recipe, and the queue runs them one after another with progress and time left for each." },
        { q: "Is there a watermark or a paid tier?", a: "No. MediaChef is GPL-3.0 open source with no paid tier at all, and it does not touch your audio beyond the conversion you asked for." },
      ],
      ctaTitle: "Get the MP3 out of that video",
      ctaSub: `MediaChef ${FACTS.version} — free, open source, macOS · Windows · Linux.`,
      also: [
        { page: "transcribe", label: "Transcribe audio to text — offline, with Whisper" },
        { page: "home", label: `All ${FACTS.recipeCount} recipes and how MediaChef works` },
      ],
    },
    ru: {
      slug: ROUTES.mp3.ru,
      title: "Перевести MP4 в MP3 бесплатно и офлайн — MediaChef",
      description:
        "Вытащите звук из MP4 и сохраните его в MP3 на своём компьютере: без загрузки в облако, без лимита размера и водяных знаков. Бесплатное приложение с открытым кодом для macOS, Windows и Linux.",
      h1: "MP4 в MP3 — бесплатно, офлайн, на вашем компьютере",
      crumb: "MP4 в MP3",
      lead:
        "В MediaChef есть рецепт «Извлечь аудио в MP3». Положите видео на доску, выберите битрейт, нажмите старт — звуковая дорожка ляжет рядом с исходником в виде MP3. Файл не уезжает с вашего компьютера, лимита размера нет, и всё это работает с выключенной сетью.",
      sections: { how: "how", table: "bitrate", why: "offline", faq: "faq" },
      toc: ["Как перевести MP4 в MP3", "Какой битрейт выбрать", "Почему офлайн лучше", "Вопросы и ответы"],
      commandLabel: "Что выполняется на самом деле",
      command: "ffmpeg -i input.mp4 -vn -b:a 192k output.mp3",
      commandNote: "MediaChef набирает эту строку за вас и показывает её до запуска задачи.",
      stepsTitle: "Как перевести MP4 в MP3",
      steps: [
        { h: "Скачайте MediaChef", p: "Один файл для macOS, Windows или Linux. FFmpeg уже внутри — ставить отдельно и прописывать в PATH ничего не нужно." },
        { h: "Перетащите MP4 на доску", p: "MediaChef читает файл через ffprobe и оставляет только подходящие рецепты. У видео со звуковой дорожкой карточка MP3 появляется сразу." },
        { h: "Выберите рецепт «Извлечь аудио в MP3»", p: "Укажите битрейт: 128k для речи, 192k по умолчанию, 320k для архива. Превью команды обновляется вместе с выбором." },
        { h: "Нажмите старт и заберите файл", p: "MP3 появится рядом с видео под именем clip.audio.mp3. Очередь покажет прогресс, оставшееся время и готовый путь." },
      ],
      shotAlt:
        "MediaChef готов перевести MP4 в MP3: доска ждёт видеофайл, справа — очередь задач.",
      shotCaption: "Доска, на которую попадает MP4. Рецепты появятся, когда MediaChef прочитает файл.",
      tableTitle: "Какой битрейт выбрать",
      tableLead:
        "Рецепт предлагает три битрейта. Размеры ниже — за один час звука; это простая арифметика от битрейта, поэтому двухчасовая запись весит ровно вдвое больше.",
      tableHead: ["Битрейт", "Час звука", "Когда брать"],
      tableRows: [
        ["128 kbps", "≈ 58 МБ", "Речь: интервью, подкасты, лекции, голосовые. Самый маленький файл, на голосе разницы не слышно."],
        ["192 kbps", "≈ 86 МБ", "Значение по умолчанию. Музыка, которую вы действительно слушаете, и все спорные случаи."],
        ["320 kbps", "≈ 144 МБ", "Архив или звук, который вы ещё будете монтировать и пережимать заново."],
      ],
      tableNote:
        "Не только MP4: тот же рецепт появляется для MKV, MOV, WebM, AVI, TS и всего остального, что читает FFmpeg, — лишь бы в файле была звуковая дорожка.",
      whyTitle: "Почему офлайн лучше",
      whyBullets: [
        { h: "Ничего не загружается.", p: "Запись созвона или несмонтированный материал остаются на вашем диске. Нет копии на сервере, политике хранения которого пришлось бы верить." },
        { h: "Нет лимита размера.", p: "Онлайн-конвертеры упираются в 100 МБ — 2 ГБ и ставят в очередь. Запись экрана на четыре гигабайта конвертируется так же, как файл на четыре мегабайта." },
        { h: "На реальных файлах быстрее.", p: "Вытащить готовую звуковую дорожку — быстро. Долго загружать видео на сервер, а локально этого шага просто нет." },
        { h: "Бесплатно и без аккаунта.", p: "Открытый код под GPL-3.0: без регистрации, пробного периода, водяных знаков и ограничений на число файлов." },
        { h: "Пакетом, а не по одному.", p: "Положите на доску сразу все ролики — очередь пройдёт по ним и скажет, куда лёг каждый MP3." },
      ],
      faqTitle: "Вопросы и ответы",
      faq: [
        { q: "Теряется ли качество при переводе MP4 в MP3?", a: "MP3 — формат с потерями, поэтому дорожка перекодируется один раз. На битрейте 192k по умолчанию разница не слышна на речи и почти не слышна на музыке. Если файл — исходник для дальнейшей работы, берите 320k." },
        { q: "Какого размера файл можно конвертировать?", a: "MediaChef не ставит лимита — ограничение только в свободном месте на диске, и приложение проверяет его перед запуском. Длина тоже не важна: трёхчасовая запись — одна задача в очереди." },
        { q: "Работает ли без интернета?", a: "Да, полностью. FFmpeg лежит внутри дистрибутива, поэтому конвертация вообще не обращается к сети. Разовая загрузка нужна только модели для расшифровки." },
        { q: "Можно ли обработать несколько видео сразу?", a: "Да. Положите их на доску, добавьте рецепт — очередь выполнит задачи одну за другой, показывая прогресс и оставшееся время по каждой." },
        { q: "Есть водяные знаки или платный тариф?", a: "Нет. MediaChef — открытый код под GPL-3.0 без платных тарифов, и со звуком не делается ничего, кроме той конвертации, которую вы запросили." },
      ],
      ctaTitle: "Достаньте MP3 из этого видео",
      ctaSub: `MediaChef ${FACTS.version} — бесплатно, открытый код, macOS · Windows · Linux.`,
      also: [
        { page: "transcribe", label: "Транскрибация аудио в текст — офлайн, через Whisper" },
        { page: "home", label: `Все ${FACTS.recipeCount} рецептов и как устроен MediaChef` },
      ],
    },
  },

  // ── Интент 2: транскрибация ──────────────────────────────────────────────
  transcribe: {
    en: {
      slug: ROUTES.transcribe.en,
      title: "Transcribe audio to text offline with Whisper — MediaChef",
      description:
        "Turn recordings into text on your own computer with Whisper: TXT, SRT, VTT or JSON. No upload, no per-minute fee, no length limit. Free app for macOS, Windows and Linux.",
      h1: "Transcribe audio to text — offline, on your own computer",
      crumb: "Audio to text",
      lead:
        "MediaChef runs OpenAI's Whisper locally through whisper.cpp. Download a model once, then drop a recording or a video on the board and pick what you need out: plain text, SRT or VTT subtitles with timings, or JSON with the time of every segment. The audio is never uploaded, and there is no per-minute price.",
      sections: { how: "how", table: "models", why: "offline", faq: "faq" },
      toc: ["How to transcribe a recording", "Which Whisper model to pick", "Why transcribe on your computer", "FAQ"],
      commandLabel: "What you get out",
      command: "00:00:04  Hi everyone, let's get started…\n00:00:11  First topic — plans for the quarter.\n00:00:19  There are three scenarios, sharing now.",
      commandNote: "TXT without timings, SRT and VTT with them, JSON with the start and end of every segment.",
      stepsTitle: "How to transcribe a recording",
      steps: [
        { h: "Download MediaChef", p: "One file for macOS, Windows or Linux. whisper.cpp v1.7.6 is already inside the download; only the model is fetched separately." },
        { h: "Pick a Whisper model", p: "Open Models and download one — small (488 MB) is the balanced default. It downloads once; after that transcription works with the network off." },
        { h: "Drop the recording or the video", p: "Audio and video both work: MediaChef reads the sound out of a video itself, so a meeting recording and an MP4 take the same path." },
        { h: "Choose the output you need", p: "“Transcribe audio to text” for TXT, “Transcribe audio to SRT subtitles” or “Transcribe audio to WebVTT” for timed captions, “Transcribe audio to JSON with timings” for tooling." },
        { h: "Press start and read the result", p: "The text lands next to the file as talk.transcript.txt. The queue shows progress; if there is no speech in the file, MediaChef says so instead of writing an empty one." },
      ],
      shotAlt:
        "MediaChef before transcription: the drop board for a recording, with Models in the sidebar where Whisper models are downloaded.",
      shotCaption: "Models live in the sidebar — download once, transcribe offline afterwards.",
      tableTitle: "Which Whisper model to pick",
      tableLead:
        "Four models ship in the catalogue, downloaded inside the app. Bigger means better text and a longer run on the same machine, so pick per task rather than once and forever.",
      tableHead: ["Model", "Download", "When to pick it"],
      tableRows: [
        ["tiny", "78 MB", "A first pass on clear speech, or when you only need to find where a topic starts."],
        ["base", "148 MB", "Notes for yourself: readable text you will skim and edit anyway."],
        ["small", "488 MB", "The default in every transcription recipe, and the one most people keep. Interviews, meetings, lectures."],
        ["large-v3-turbo", "1.62 GB", "Text going out to someone else: subtitles you publish, quotes you cite. Tuned for Apple Silicon."],
      ],
      tableNote:
        "Language is detected automatically, and you can pin it instead. Two extra recipes translate any language into English — as text or as timed subtitles — in the same single pass.",
      whyTitle: "Why transcribe on your computer",
      whyBullets: [
        { h: "Confidential audio stays confidential.", p: "Interviews, therapy notes, legal calls, anything under an NDA: the file is read by a process on your own machine and by nothing else." },
        { h: "No per-minute pricing.", p: "Cloud transcription bills by the minute. Locally, the tenth hour of audio costs what the first one did — nothing." },
        { h: "No length or size limit.", p: "A four-hour recording is one job in the queue, not a paid tier or a split-the-file workaround." },
        { h: "Works with no network at all.", p: "Once the model is on disk, transcription is offline: on a plane, in a lab, on an air-gapped machine." },
        { h: "Subtitles and text from the same run.", p: "SRT and VTT carry timings for a player, TXT is clean prose, JSON has the segment times for your own scripts." },
      ],
      faqTitle: "FAQ",
      faq: [
        { q: "How accurate is Whisper transcription?", a: "Accuracy scales with the model: tiny is a rough draft, small is the balanced default, large-v3-turbo is near-human on clear speech. Clean single-speaker audio does best; strong accents, people talking over each other and music under the voice all cost accuracy — as they do for any speech recogniser." },
        { q: "Which languages does it handle?", a: "Whisper covers around a hundred languages and detects the language on its own; you can also pin it if the guess is wrong. Two recipes translate speech in any of them into English in one pass, as text or as SRT subtitles." },
        { q: "What formats does the transcript come in?", a: "TXT for plain text, SRT and VTT with timestamps for players and video editors, and JSON with the start and end time of each segment for scripts and tooling." },
        { q: "Do I need internet?", a: "Once, to download a Whisper model on the Models screen — 78 MB to 1.62 GB depending on which one. After that transcription runs entirely offline." },
        { q: "What if the recording has no speech?", a: "MediaChef reports “No speech detected” instead of writing an empty file and marking the job green. Silence, music without vocals and a wrongly picked file all end the same honest way." },
      ],
      ctaTitle: "Turn that recording into text",
      ctaSub: `MediaChef ${FACTS.version} — Whisper running locally, free and open source.`,
      also: [
        { page: "mp3", label: "Convert MP4 to MP3 — free and offline" },
        { page: "home", label: `All ${FACTS.recipeCount} recipes and how MediaChef works` },
      ],
    },
    ru: {
      slug: ROUTES.transcribe.ru,
      title: "Транскрибация аудио в текст офлайн, Whisper — MediaChef",
      description:
        "Переводите записи в текст на своём компьютере через Whisper: TXT, SRT, VTT или JSON. Без загрузки в облако, без оплаты за минуты и лимита длины. Бесплатное приложение для macOS, Windows и Linux.",
      h1: "Транскрибация аудио в текст — офлайн, на вашем компьютере",
      crumb: "Аудио в текст",
      lead:
        "MediaChef запускает Whisper от OpenAI локально, через whisper.cpp. Скачайте модель один раз, положите запись или видео на доску и выберите, что получить на выходе: обычный текст, субтитры SRT и VTT с таймингами или JSON со временем каждого отрезка. Звук никуда не загружается, платы за минуты нет.",
      sections: { how: "how", table: "models", why: "offline", faq: "faq" },
      toc: ["Как расшифровать запись", "Какую модель Whisper выбрать", "Почему офлайн лучше", "Вопросы и ответы"],
      commandLabel: "Что получится на выходе",
      command: "00:00:04  Всем привет, начинаем встречу…\n00:00:11  Первый вопрос — планы на квартал.\n00:00:19  Есть три сценария, покажу таблицу.",
      commandNote: "TXT — без таймингов, SRT и VTT — с ними, JSON — со временем начала и конца каждого отрезка.",
      stepsTitle: "Как расшифровать запись",
      steps: [
        { h: "Скачайте MediaChef", p: "Один файл для macOS, Windows или Linux. whisper.cpp v1.7.6 уже внутри поставки — отдельно качается только модель." },
        { h: "Выберите модель Whisper", p: "Откройте экран «Модели» и скачайте одну — small на 488 МБ — сбалансированный вариант по умолчанию. Загрузка разовая, дальше расшифровка работает с выключенной сетью." },
        { h: "Перетащите запись или видео", p: "Подходит и то и другое: MediaChef сам достаёт звук из видео, поэтому запись встречи и MP4 идут одним путём." },
        { h: "Выберите нужный формат результата", p: "«Аудио в текст» — для TXT, «Аудио в субтитры SRT» или «Аудио в субтитры WebVTT» — для субтитров с таймингами, «Аудио в JSON с таймингами» — для скриптов." },
        { h: "Нажмите старт и прочитайте результат", p: "Текст ляжет рядом с файлом под именем talk.transcript.txt. Очередь покажет прогресс, а если речи в файле нет — MediaChef скажет об этом, а не запишет пустой файл." },
      ],
      shotAlt:
        "MediaChef перед транскрибацией: доска для записи и раздел «Модели» в боковом меню, где скачиваются модели Whisper.",
      shotCaption: "Модели живут в боковом меню: скачали один раз — дальше расшифровка идёт офлайн.",
      tableTitle: "Какую модель Whisper выбрать",
      tableLead:
        "В каталоге четыре модели, все качаются внутри приложения. Крупнее — точнее текст и дольше расчёт на той же машине, поэтому выбирать стоит под задачу, а не раз и навсегда.",
      tableHead: ["Модель", "Скачать", "Когда брать"],
      tableRows: [
        ["tiny", "78 МБ", "Первый проход по чистой речи или когда нужно только найти, где начинается нужная тема."],
        ["base", "148 МБ", "Заметки для себя: текст, который вы всё равно будете просматривать и править."],
        ["small", "488 МБ", "Значение по умолчанию во всех рецептах расшифровки и то, на чём большинство и остаётся. Интервью, встречи, лекции."],
        ["large-v3-turbo", "1,62 ГБ", "Текст, который уйдёт другим людям: субтитры в публикацию, цитаты в статью. Оптимизирована под Apple Silicon."],
      ],
      tableNote:
        "Язык определяется автоматически, но его можно задать вручную. Ещё два рецепта переводят речь с любого языка на английский — текстом или субтитрами — за тот же один проход.",
      whyTitle: "Почему офлайн лучше",
      whyBullets: [
        { h: "Конфиденциальная запись остаётся конфиденциальной.", p: "Интервью, приёмы, юридические созвоны, всё под NDA: файл читает процесс на вашем компьютере и больше никто." },
        { h: "Никакой оплаты за минуты.", p: "Облачная расшифровка считает деньги по минутам. Локально десятый час звука стоит столько же, сколько первый, — нисколько." },
        { h: "Нет лимита длины и размера.", p: "Четырёхчасовая запись — это одна задача в очереди, а не платный тариф и не нарезка файла на части." },
        { h: "Работает совсем без сети.", p: "Как только модель лежит на диске, расшифровка идёт офлайн: в самолёте, в лаборатории, на машине без интернета." },
        { h: "Субтитры и текст из одного прогона.", p: "SRT и VTT несут тайминги для плеера, TXT — чистый текст, JSON — время отрезков для ваших скриптов." },
      ],
      faqTitle: "Вопросы и ответы",
      faq: [
        { q: "Насколько точна расшифровка через Whisper?", a: "Точность зависит от модели: tiny — черновик, small — сбалансированный вариант по умолчанию, large-v3-turbo — почти как человек на чистой речи. Лучше всего распознаётся чистая запись одного говорящего; сильный акцент, речь вперебивку и музыка под голосом снижают точность — как и у любого распознавания речи." },
        { q: "Какие языки поддерживаются?", a: "Whisper знает около сотни языков и определяет язык сам; при неверной догадке его можно задать вручную. Два рецепта переводят речь с любого из них на английский за один проход — текстом или субтитрами SRT." },
        { q: "В каких форматах приходит расшифровка?", a: "TXT — обычный текст, SRT и VTT — с таймкодами для плееров и монтажа, JSON — со временем начала и конца каждого отрезка для скриптов и своих инструментов." },
        { q: "Нужен ли интернет?", a: "Один раз — чтобы скачать модель Whisper на экране «Модели»: от 78 МБ до 1,62 ГБ, смотря какую. После этого расшифровка работает полностью офлайн." },
        { q: "Что будет, если в записи нет речи?", a: "MediaChef напишет «Речь не обнаружена» вместо пустого файла с зелёной галочкой. Тишина, музыка без вокала и просто не тот файл заканчиваются одинаково честно." },
      ],
      ctaTitle: "Превратите эту запись в текст",
      ctaSub: `MediaChef ${FACTS.version} — Whisper работает локально, бесплатно и с открытым кодом.`,
      also: [
        { page: "mp3", label: "MP4 в MP3 — бесплатно и офлайн" },
        { page: "home", label: `Все ${FACTS.recipeCount} рецептов и как устроен MediaChef` },
      ],
    },
  },
};
