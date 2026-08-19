// Весь текст сайта в одном месте, две локали. Ключи зеркальны — как в приложении.
export type Locale = "en" | "ru";

const RELEASES = "https://github.com/Kom1sh/mediachef/releases/latest";
const GITHUB = "https://github.com/Kom1sh/mediachef";

export const LINKS = { releases: RELEASES, github: GITHUB };

export const T = {
  en: {
    lang: "en",
    title: "MediaChef — local video & audio converter with speech-to-text",
    description:
      "Free desktop app for macOS, Windows and Linux: convert video and audio with FFmpeg and transcribe speech with Whisper — locally, with no uploads, limits or subscriptions.",
    nav: { recipes: "Recipes", transcribe: "Transcription", privacy: "Privacy", faq: "FAQ", download: "Download" },
    heroTitle1: "Any media into any.",
    heroTitle2: "Speech into text.",
    heroAccent: "All on your computer.",
    heroSub:
      "MediaChef is a free desktop app that turns FFmpeg and Whisper into simple recipe cards: convert video and audio, extract sound, make subtitles — with no file uploads, no size limits, no queues.",
    trust: ["Open source · GPL-3.0", "Works offline", "English & Russian", "macOS · Windows · Linux"],
    ctaMac: "Download for macOS",
    ctaWin: "Download for Windows",
    ctaLinux: "Download for Linux",
    ctaNote: "Free and open source —",
    ctaNoteLink: "view the code on GitHub",
    howTitle: "How it works",
    steps: [
      { n: "1", h: "Drop a file", p: "Drag in a video or a recording — MediaChef reads what it is and shows only the recipes that fit." },
      { n: "2", h: "Pick a recipe", p: "Every action is a plain card: “Video → MP3”, “Subtitles for video”, “Compress to 25 MB”. Sensible defaults, no flags to learn." },
      { n: "3", h: "Take the result", p: "The file lands next to the original — or in a folder you choose. A clear queue shows progress and time left." },
    ],
    recipesTitle: "Recipes instead of commands",
    recipesLead:
      "FFmpeg can do almost anything — in the language of the terminal. MediaChef translates: you choose what to do, the parameters are already set. A live preview even shows the real command, so you learn as you go.",
    recipes: [
      { tile: "tile-ochre", h: "Extract audio to MP3", p: "Pull the soundtrack out of any video." },
      { tile: "tile-green", h: "Subtitles for a video", p: "Whisper listens and writes an SRT file." },
      { tile: "tile-green", h: "Compress a video", p: "Fit a clip into a messenger-friendly size." },
      { tile: "tile-purple", h: "Video → GIF", p: "A sharp looping GIF with tuned palette." },
      { tile: "tile-green", h: "Transcribe a recording", p: "Meeting or voice memo into plain text." },
      { tile: "tile-blue", h: "Translate speech to English", p: "Whisper transcribes and translates in one pass." },
      { tile: "tile-blue", h: "MP4 → MKV, lossless", p: "Repackage without re-encoding — instant." },
      { tile: "tile-red", h: "Mute a video", p: "Drop every audio track, keep the picture." },
    ],
    trTitle: "Speech-to-text that stays on your device",
    trBullets: [
      { h: "Whisper, running locally.", p: "OpenAI's speech model executes on your processor — recordings never leave the machine." },
      { h: "Models downloaded in-app.", p: "From the fast tiny to the accurate large-v3-turbo — pick per task on the Models screen." },
      { h: "Text or subtitles.", p: "Plain TXT, SRT and VTT with timestamps, or JSON for tooling." },
      { h: "Honest results.", p: "If a file has no speech, MediaChef says “No speech detected” — it never ships an empty green checkmark." },
    ],
    privTitle: "Your files never travel",
    privLead:
      "Online converters ask you to upload a file to someone else's server, wait in a queue and trust their retention policy. MediaChef works on your CPU: a gigabyte video or a private meeting recording converts the same way — even with Wi-Fi off.",
    privChips: ["No uploads", "No size limits", "No subscriptions"],
    ossTitle: "Open source, batteries included",
    ossLead:
      "GPL-3.0, with the full development history public on GitHub. The app ships FFmpeg and Whisper inside — download, open, use.",
    faqTitle: "Questions, answered",
    faq: [
      { q: "Is it really free?", a: "Yes. MediaChef is open source under GPL-3.0. The full converter and transcription are free; the code is public on GitHub." },
      { q: "Which formats are supported?", a: "Everything FFmpeg reads — MP4, MKV, MOV, WebM, AVI, MP3, WAV, FLAC, M4A, OGG and many more. Recipes cover the everyday conversions; an expert card accepts any FFmpeg arguments." },
      { q: "Where do my files get uploaded?", a: "Nowhere. Conversion and transcription run entirely on your computer. The only thing MediaChef ever downloads is a Whisper model — once, from the Models screen." },
      { q: "How accurate is the transcription?", a: "It uses OpenAI's Whisper models. Accuracy scales with the model you pick: tiny is instant and rough, large-v3-turbo is near-human on clear speech. Language is detected automatically." },
      { q: "Does it work offline?", a: "Yes. After you download a speech model once, everything — converting and transcribing — works with no internet at all." },
      { q: "Why not just use an online converter?", a: "For a small public file — sure. But private recordings, large videos, batches and anything confidential are better done locally: faster than uploading, no limits, nothing stored on someone's server." },
    ],
    finalTitle: "Put a chef in charge of your media",
    finalSub: "Free, open source, three platforms.",
    betaNote:
      "MediaChef is young: builds are not yet signed by Apple/Microsoft, so the first launch asks for confirmation — a plain-text how-to ships inside every download.",
    footRights: "MediaChef — an open-source media kitchen.",
    footLinks: [
      { href: GITHUB, label: "GitHub" },
      { href: RELEASES, label: "Releases" },
      { href: GITHUB + "/blob/main/LICENSE", label: "License GPL-3.0" },
    ],
    switchLabel: "Русская версия",
    switchHref: "/ru",
  },
  ru: {
    lang: "ru",
    title: "MediaChef — локальный конвертер видео и аудио с транскрибацией",
    description:
      "Бесплатное приложение для macOS, Windows и Linux: конвертация видео и аудио на FFmpeg и расшифровка речи через Whisper — локально, без загрузки файлов, лимитов и подписок.",
    nav: { recipes: "Рецепты", transcribe: "Транскрибация", privacy: "Приватность", faq: "Вопросы", download: "Скачать" },
    heroTitle1: "Любой файл — в любой.",
    heroTitle2: "Речь — в текст.",
    heroAccent: "Всё — на вашем компьютере.",
    heroSub:
      "MediaChef — бесплатное приложение, которое превращает FFmpeg и Whisper в понятные карточки-рецепты: конвертируйте видео и аудио, вытаскивайте звук, делайте субтитры — без загрузки файлов на сервер, без лимитов и очередей.",
    trust: ["Открытый код · GPL-3.0", "Работает офлайн", "Русский и английский", "macOS · Windows · Linux"],
    ctaMac: "Скачать для macOS",
    ctaWin: "Скачать для Windows",
    ctaLinux: "Скачать для Linux",
    ctaNote: "Бесплатно и с открытым кодом —",
    ctaNoteLink: "код на GitHub",
    howTitle: "Как это устроено",
    steps: [
      { n: "1", h: "Бросьте файл", p: "Перетащите видео или запись — MediaChef сам поймёт, что это, и покажет только подходящие рецепты." },
      { n: "2", h: "Выберите рецепт", p: "Каждое действие — простая карточка: «Видео → MP3», «Субтитры к видео», «Сжать до 25 МБ». Параметры уже настроены." },
      { n: "3", h: "Заберите результат", p: "Файл появится рядом с исходником — или в вашей папке. Очередь показывает прогресс и оставшееся время." },
    ],
    recipesTitle: "Рецепты вместо команд",
    recipesLead:
      "FFmpeg умеет почти всё — но говорит на языке терминала. MediaChef переводит: вы выбираете, что сделать, а параметры уже настроены. Превью показывает настоящую команду — заодно учишься.",
    recipes: [
      { tile: "tile-ochre", h: "Извлечь аудио в MP3", p: "Достаньте звуковую дорожку из любого видео." },
      { tile: "tile-green", h: "Субтитры к видео", p: "Whisper слушает и пишет SRT-файл." },
      { tile: "tile-green", h: "Сжать видео", p: "Уложите ролик в размер для мессенджера." },
      { tile: "tile-purple", h: "Видео → GIF", p: "Чёткая зацикленная гифка с подобранной палитрой." },
      { tile: "tile-green", h: "Расшифровать запись", p: "Встреча или голосовое — в обычный текст." },
      { tile: "tile-blue", h: "Перевести речь в английский", p: "Whisper расшифровывает и переводит за один проход." },
      { tile: "tile-blue", h: "MP4 → MKV без потерь", p: "Перепаковка без перекодирования — мгновенно." },
      { tile: "tile-red", h: "Убрать звук из видео", p: "Удалите все аудиодорожки, оставив картинку." },
    ],
    trTitle: "Расшифровка речи — прямо на устройстве",
    trBullets: [
      { h: "Whisper работает локально.", p: "Речевая модель OpenAI выполняется на вашем процессоре — записи не покидают компьютер." },
      { h: "Модели качаются в приложении.", p: "От быстрой tiny до точной large-v3-turbo — выбирайте под задачу на экране «Модели»." },
      { h: "Текст или субтитры.", p: "Обычный TXT, SRT и VTT с таймкодами, или JSON для инструментов." },
      { h: "Честный результат.", p: "Если в файле нет речи, MediaChef так и скажет: «Речь не обнаружена» — вместо пустого файла с зелёной галочкой." },
    ],
    privTitle: "Ваши файлы никуда не уезжают",
    privLead:
      "Онлайн-конвертеры просят загрузить файл на чужой сервер, подождать в очереди и поверить их политике хранения. MediaChef работает на вашем процессоре: гигабайтное видео или приватная запись встречи конвертируются одинаково — даже с выключенным Wi-Fi.",
    privChips: ["Без загрузок", "Без лимитов размера", "Без подписок"],
    ossTitle: "Открытый код, всё в комплекте",
    ossLead:
      "GPL-3.0, вся история разработки публична на GitHub. FFmpeg и Whisper уже внутри приложения — скачал, открыл, пользуешься.",
    faqTitle: "Частые вопросы",
    faq: [
      { q: "Это правда бесплатно?", a: "Да. MediaChef — открытый код под GPL-3.0. Конвертер и транскрибация полностью бесплатны, исходники публичны на GitHub." },
      { q: "Какие форматы поддерживаются?", a: "Всё, что читает FFmpeg: MP4, MKV, MOV, WebM, AVI, MP3, WAV, FLAC, M4A, OGG и десятки других. Рецепты закрывают повседневные задачи, а экспертная карточка принимает любые аргументы FFmpeg." },
      { q: "Куда загружаются мои файлы?", a: "Никуда. Конвертация и расшифровка выполняются целиком на вашем компьютере. Единственное, что MediaChef скачивает, — модель Whisper, один раз, на экране «Модели»." },
      { q: "Насколько точна расшифровка?", a: "Используются модели Whisper от OpenAI. Точность зависит от выбранной модели: tiny — мгновенно и черново, large-v3-turbo — почти как человек на чистой речи. Язык определяется автоматически." },
      { q: "Работает без интернета?", a: "Да. После разовой загрузки речевой модели всё — и конвертация, и расшифровка — работает совсем без сети." },
      { q: "Чем это лучше онлайн-конвертера?", a: "Для маленького публичного файла онлайн сгодится. Но приватные записи, большие видео и пакетные задачи быстрее и безопаснее делать локально: без загрузки, без лимитов, без чужого сервера." },
    ],
    finalTitle: "Поставьте шефа за свои медиафайлы",
    finalSub: "Бесплатно, открытый код, три платформы.",
    betaNote:
      "MediaChef — молодой проект: сборки пока без подписи Apple/Microsoft, поэтому первый запуск попросит подтверждение — простая инструкция лежит внутри каждого архива.",
    footRights: "MediaChef — медиакухня с открытым кодом.",
    footLinks: [
      { href: GITHUB, label: "GitHub" },
      { href: RELEASES, label: "Релизы" },
      { href: GITHUB + "/blob/main/LICENSE", label: "Лицензия GPL-3.0" },
    ],
    switchLabel: "English version",
    switchHref: "/",
  },
} as const;
