// Тексты локали «en». Структура зеркальна остальным локалям: тип UiCopy
// выведен из английского файла, поэтому пропущенное поле не соберётся.
import { FACTS } from "../facts";


export const ui = {
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
    "MediaChef main screen: sidebar with Convert, Models and Settings, a drop board for files, and the task queue on the right.",
  shotCaption:
    "The real window, shown in the theme you are reading in. Drop board in the middle, queue on the right, engines already inside.",
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
  // Размер файла модели. Живёт в текстах языка, а не в MODELS: единицы и
  // десятичный разделитель у языков разные.
  modelSizes: {
    tiny: "78 MB",
    base: "148 MB",
    small: "488 MB",
    "large-v3-turbo": "1.62 GB",
  },
  modelNotes: {
    tiny: "Fastest, rough quality. A draft of clear speech in a fraction of the time.",
    base: "Fast, ok quality. Good enough to search a recording for the bit you need.",
    small: "Recommended balance — the default in every transcription recipe.",
    "large-v3-turbo": "Best quality, tuned for Apple Silicon. For text you intend to publish.",
  },
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
  catalogLink: `All ${FACTS.recipeCount} recipes, category by category →`,
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
  tocLabel: "On this page",
  breadcrumbHome: "Home",
  alsoLabel: "Read next",
  footNavLabel: "Project links",

  // Подписи навигации: шапка, бургер, подвал. Лежат здесь же, чтобы язык
  // добавлялся одним файлом, а не правкой в двух местах.
  menu: {
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
    footProduct: "Product",
    footGuides: "Guides",
    footDownload: "Download",
    footProject: "Project",
    footBlurb: `A free media kitchen for macOS, Windows and Linux. FFmpeg ${FACTS.ffmpeg} and whisper.cpp ${FACTS.whisper} ship inside the download — nothing to install separately.`,
    license: "License GPL-3.0",
    notice: "What is bundled — NOTICE.md",
    sourceCode: "Source code on GitHub",
    feedback: "Report a problem or ask for a feature",
    releases: "All releases",
    langLabel: "Language",
    // Подпись на схеме окна приложения в hero.
    dropHere: "Drop files here",
    // Подписи файлов загрузки: переводится только то, что не является
    // названием платформы или формата.
    dlWin: "Windows · installer",
    nApple: "Apple Silicon",
    nZip: "Apple Silicon, no installer",
    nWin: "64-bit",
    nAppimage: "x86_64, runs as is",
    nDeb: "x86_64, Debian and Ubuntu",
    sHow: "How it works",
    sRecipes: "Recipes",
    sOut: "What it does out of the box",
    sTranscribe: "Transcription",
    sModels: "Whisper models",
    sPrivacy: "Offline and private",
    sOss: "Open source",
    sFaq: "FAQ",
    pMp3: "MP4 to MP3",
    pTranscribe: "Audio to text",
  },
};

export const landings = {
  mp3: {
    title: "Convert MP4 to MP3 free and offline — MediaChef",
    description:
      "Pull the audio out of an MP4 and save it as MP3 on your own computer: no upload, no size cap, no watermark. Free open-source app for macOS, Windows and Linux.",
    h1: "Convert MP4 to MP3 — free, offline, on your computer",
    crumb: "MP4 to MP3",
    lead:
      "MediaChef ships a recipe called “Extract audio to MP3”. Drop a video on the board, pick a bitrate, press start: the soundtrack is written next to the original as an MP3. The file never leaves your machine, there is no size limit, and the whole thing works with the network off.",
    sections: { how: "how", table: "bitrate", why: "offline", faq: "faq" },
    toc: ["How to convert MP4 to MP3", "Which bitrate to pick", "Why convert on your computer", "FAQ"],
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
      { q: "If I change an MP4 to MP3, does the original video stay?", a: "Yes. MediaChef reads the video and writes a new MP3 next to it — the MP4 is never overwritten, renamed or deleted, so you can turn the same file into audio as many times as you like. Nothing is uploaded either: the whole thing runs without internet." },
    ],
    ctaTitle: "Get the MP3 out of that video",
    ctaSub: `MediaChef ${FACTS.version} — free, open source, macOS · Windows · Linux.`,
    also: [
      { page: "catalog", label: "The full recipe catalogue, category by category" },
      { page: "transcribe", label: "Transcribe audio to text — offline, with Whisper" },
      { page: "home", label: `All ${FACTS.recipeCount} recipes and how MediaChef works` },
    ],
  },
  transcribe: {
    title: "Transcribe audio to text offline with Whisper — MediaChef",
    description:
      "Turn recordings into text on your own computer with Whisper: TXT, SRT, VTT or JSON. No upload, no per-minute fee, no length limit. Free app for macOS, Windows and Linux.",
    h1: "Transcribe audio to text — offline, on your own computer",
    crumb: "Audio to text",
    lead:
      "MediaChef runs OpenAI's Whisper locally through whisper.cpp. Download a model once, then drop a recording or a video on the board and pick what you need out: plain text, SRT or VTT subtitles with timings, or JSON with the time of every segment. The audio is never uploaded, and there is no per-minute price.",
    sections: { how: "how", table: "models", why: "offline", faq: "faq" },
    toc: ["How to transcribe a recording", "Which Whisper model to pick", "Why transcribe on your computer", "FAQ"],
    outLabel: "What you get out",
    outSample: "00:00:04  Hi everyone, let's get started…\n00:00:11  First topic — plans for the quarter.\n00:00:19  There are three scenarios, sharing now.",
    outNote: "TXT without timings, SRT and VTT with them, JSON with the start and end of every segment.",
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
      { q: "Can I turn a video into text, or only audio?", a: "Video works the same way. MediaChef pulls the sound out of the file itself, so an MP4, MKV or MOV goes straight to a transcript — there is even a separate recipe, “Get text from a video”. You never have to convert to audio first." },
    ],
    ctaTitle: "Turn that recording into text",
    ctaSub: `MediaChef ${FACTS.version} — Whisper running locally, free and open source.`,
    also: [
      { page: "catalog", label: "The full recipe catalogue, category by category" },
      { page: "mp3", label: "Convert MP4 to MP3 — free and offline" },
      { page: "home", label: `All ${FACTS.recipeCount} recipes and how MediaChef works` },
    ],
  },
};

/** Каталог рецептов: /<locale>/<slug>/. Названия рецептов, описания и алиасы
 *  берутся из recipes/*.yaml — здесь только обвязка страницы. */
export const catalog = {
  title: `All ${FACTS.recipeCount} MediaChef recipes — video, audio and transcription`,
  description: "Every recipe MediaChef ships with: convert video and audio, compress, trim, resize, pull the sound out of a clip, make a GIF, transcribe speech to text with Whisper. Free, open source, runs offline on macOS, Windows and Linux.",
  h1: `All ${FACTS.recipeCount} recipes`,
  crumb: "Recipes",
  lead: "MediaChef does not ask you to learn command-line switches. Every job is a card: drop a file, pick the card, press start. This is the whole catalogue exactly as it ships — what each recipe takes, what it gives back, and what you can type into the app's search box to find it.",
  // Разделы страницы. Категории из YAML сведены в них по смыслу
  // результата — см. BUCKET в recipes.ts.
  sections: {
    speech: "Speech, text and subtitles",
    video: "Video",
    audio: "Audio",
    advanced: "Advanced",
  },
  // Названия категорий совпадают с теми, что человек увидит в самом приложении.
  cats: {
    "extract": "Extract",
    "transcribe": "Transcribe",
    "convert-video": "Convert video",
    "convert-audio": "Convert audio",
    "compress": "Compress",
    "cut": "Cut",
    "geometry": "Size",
    "gif": "GIF",
    "audio-in-video": "Audio in video",
    "advanced": "Advanced",
  },
  accepts: "Takes",
  produces: "Gives",
  settings: "Settings",
  searchAs: "Also found by",
  types: { video: "video", audio: "audio", any: "any file" },
  noParams: "Nothing to set.",
  ctaTitle: "Get the whole set",
  ctaSub: `MediaChef ${FACTS.version} — free, open source, macOS · Windows · Linux.`,
  also: [
    { page: "mp3", label: "Convert MP4 to MP3 — free and offline" },
    { page: "transcribe", label: "Transcribe audio to text — offline, with Whisper" },
  ],
};

export default { ui, landings, catalog };
