// Словарь интерфейса, локаль «en». Набор ключей задаёт английский файл —
// он эталон; остальные типизированы по нему, поэтому забытый ключ не соберётся.
export const dict = {
  // ── Shell ────────────────────────────────────────────────────────────────
  appName: "MediaChef",
  navSections: "Sections",
  navConvert: "Convert",
  navModels: "Models",
  navSettings: "Settings",

  // ── Board: drop zone, search, recipe list ────────────────────────────────
  // The board's own two lines: the invitation, and the formats under it. The
  // invitation names both ways in (drag and click) because the board is a button
  // that does not look like one.
  dropHint: "Drop files here — or click to choose",
  dropSub: "MP4, MKV, MOV, MP3, WAV, SRT and more",
  // Both example queries stay in both locales on purpose: the Russian one shows a
  // Russian speaker that their own words work, the English one that the search is
  // not fussy about which language it is asked in.
  searchPlaceholder: "Search: «видео в мп3», «make gif»…",
  nothingFound: "Nothing found",
  clearSearch: "Clear search",
  popular: "Popular",
  // The screen with nothing on it yet. Display face, asked as a question — the
  // one place the app speaks in the first person plural, because a kitchen does.
  emptyTitle: "What are we cooking?",
  emptySub: "Put a file on the board and pick a recipe.",

  // ── File card ────────────────────────────────────────────────────────────
  clearNamed: "Clear {name}",
  // The chip that holds a bare clock, named in its tooltip: the digits alone do
  // not say which quantity they are.
  durationNamed: "Duration: {time}",
  unitKB: "KB",
  unitMB: "MB",
  unitGB: "GB",
  // What a probed file's tile glyph is called — read out, not written out (the
  // card shows the icon alone). "any" is the catalog's wildcard and never the
  // answer to "what is this file", but the map is exhaustive by type.
  mt_video: "video",
  mt_audio: "audio",
  mt_image: "image",
  mt_subtitle: "subtitle",
  mt_any: "any",

  // ── Recipe form ──────────────────────────────────────────────────────────
  advanced: "Advanced",
  close: "Close",
  addToQueue: "Add to queue",
  adding: "Adding…",
  addingN: "Adding {n}…",
  addAllN: "Add all {n} files",
  retryOne: "Retry",
  retryN: "Retry {n}",
  clickToCopy: "Click to copy",
  clickToCopyPreview: "Click to copy — illustrative, not runnable as-is",
  copied: "Copied to clipboard",
  previewOnly: "# preview only — the queue decodes a 16 kHz WAV first, so this is not runnable as-is",
  loadingModels: "Loading models…",
  openModels: "Open Models",
  downloadModelPrompt: "Download a model → Models",

  // ── Queue ────────────────────────────────────────────────────────────────
  queue: "Queue",
  // The header counter's own name. The badge itself is a bare numeral — this is
  // what it says on hover, and what a screen reader reads instead of "2".
  activeN: "{n} active",
  queueEmpty: "Jobs will appear here.",
  st_queued: "queued",
  st_running: "running",
  st_done: "done",
  st_error: "error",
  st_cancelled: "cancelled",
  cancel: "Cancel",
  // The progress bar's accessible name. Named, not bare: several cards can be in
  // flight at once, and "Progress, 40%" three times over says nothing about which
  // job is where. The percentage itself is not in the string — `aria-valuenow`
  // carries it, and a screen reader speaks the two together.
  jobProgressNamed: "Job progress: {name}",
  etaLeft: "~{time} left",
  showInFinder: "Show in Finder",
  copyLog: "Copy log",
  failed: "Failed",
  notifyDone: "Done: {name}",

  // ── Models ───────────────────────────────────────────────────────────────
  modelsTitle: "Whisper models",
  modelsBlurb: "Transcription runs locally. A model is downloaded once.",
  download: "Download",
  deleteModel: "Delete",
  // Same shape as `jobProgressNamed`, and named for the same reason: the models
  // list can have more than one row downloading.
  downloadProgressNamed: "Download progress: {name}",
  cancelling: "Cancelling…",
  cancelDownload: "Cancel download",
  cancelHint: "A cancel lands at the download's next read — up to 30s if the connection died.",
  // Whisper ran fine and heard nothing worth writing down. The one Rust-side error
  // the queue card says in the user's own language (Ruling W3-4): the failure it
  // replaces carries a `no_speech` marker, and the raw text stays one click away
  // under the summary.
  noSpeech: "No speech detected in the file",

  // ── Settings ─────────────────────────────────────────────────────────────
  loadingSettings: "Loading settings…",
  // Shared by the language and the theme control, so the Russian side has to work
  // for both — hence "как в системе" rather than an adjective that would have to
  // agree with one noun or the other.
  optSystem: "System",
  themeLight: "Light",
  themeDark: "Dark",
  setLanguage: "Language",
  setLanguageHint: "«System» follows your OS.",
  setTheme: "Theme",
  setThemeHint: "Applies immediately.",
  setOutput: "Output folder",
  setOutputHint: "Where finished files are written.",
  outBeside: "Next to input",
  outFixed: "Fixed folder",
  change: "Change…",
  setNotifications: "Notifications",
  setNotificationsHint: "A desktop alert when a job finishes.",
  setDictation: "Dictation",
  setDictationHint: "Hold the key and speak, or tap once to start and again to stop. Pressing it with Shift sends the text with Enter.",
  setDictationKey: "Dictation hotkey",
  setDictationKeyHint: "A lone modifier types nothing and clashes with nothing. Combos with Space or a letter type that character if the modifier is released first.",
  hotkeyRightOption: "Right ⌥",
  hotkeyRightCommand: "Right ⌘",
  setDictationDelivery: "Where the text goes",
  setDictationDeliveryHint: "Pasting needs the Accessibility permission; without it the text still lands in the clipboard.",
  optDeliveryClipboard: "Clipboard",
  optDeliveryType: "Type it",
  navDictation: "Dictation",
  dictTitle: "Voice input",
  dictBlurb: "Dictate into any field on your computer. The same Whisper as the recipes does the recognising — the audio never leaves the machine.",
  setDictationModel: "Recognition model",
  setDictationModelHint: "Types the final text. A bigger model gets names and jargon right more often and takes longer.",
  setDictationPreviewModel: "Live preview model",
  setDictationPreviewModelHint: "Runs every second and a half while you speak, so it is a light one. Does not affect the result.",
  setDictationLanguage: "Speech language",
  setDictationLanguageHint: "A named language is recognised more accurately than auto-detection.",
  optLangInterface: "Interface language",
  optLangAuto: "Detect",
  setDictationDictionary: "Term dictionary",
  setDictationDictionaryHint: "A hint to the model, not a replacement list: 15–25 words you say often and it keeps getting wrong.",
  dictionaryCount: "{n} of {max} characters",
  setDictationPermission: "Accessibility permission",
  setDictationPermissionHint: "Needed to hear the trigger key and to type into the field. After an update macOS treats MediaChef as a new app: it removes the old entry itself and asks again — switch it on in the list and restart.",
  permGranted: "Granted",
  permMissing: "Not granted",
  permUnknown: "Checking…",
  openSystemSettings: "Open System Settings",
  setDictationLog: "Dictation log",
  setDictationLogHint: "What was pressed, what was recognised and where it went. The dictated text itself is not written.",
  showLog: "Show file",
  modelNotInstalled: "not downloaded",
  setDictationMic: "Microphone",
  setDictationMicHint: "“System default” means the last connected headset: AirPods sitting in their case stay the default input and deliver silence. Dictating at the laptop — pick its microphone explicitly. Without the permission macOS also delivers silence, not an error.",
  micGranted: "Granted",
  micMissing: "Not granted",
  micUndetermined: "Not asked yet",
  setWorkers: "Parallel conversions",
  setWorkersHint: "How many ffmpeg jobs run at once. Takes effect after a restart.",

  // ── Updates ──────────────────────────────────────────────────────────────
  // Проверка при старте молчалива; вслух отвечает только кнопка ниже.
  setUpdates: "Updates",
  setUpdatesHint: "Version {version} is installed.",
  setUpdatesHintPlain: "Check whether a newer version is out.",
  updCheck: "Check",
  updChecking: "Checking…",
  updCurrent: "This is the latest version.",
  updFound: "Version {version} is out.",
  updInstall: "Update",
  updDownloading: "Downloading the update…",
  updDownloadingPct: "Downloading the update — {percent}%",
  updReady: "Update installed. Restart to finish.",
  updRestart: "Restart",
  updLater: "Later",
  updFailed: "Could not check: {reason}",
  updManual: "This copy was installed by a package manager — update it the same way.",

  // ── Feedback ─────────────────────────────────────────────────────────────
  // Единственная внешняя ссылка в приложении. Открывает форму в браузере,
  // само ничего не отправляет — иначе обещание «файлы не уезжают» стало бы
  // условным.
  setFeedback: "Feedback",
  setFeedbackHint: "Writes to {email} with your version and system already filled in. Nothing is sent from here.",
  fbBug: "Something is broken",
  fbIdea: "Suggest something",
  reportError: "Report this error",
  fbByMail: "by email",

  // ── Recipe categories ────────────────────────────────────────────────────
  // One per key of `CATEGORY_ICON` in icons.ts, reached through `categoryLabel`
  // so an unknown category from the YAML catalog renders its own name instead of
  // a missing key.
  "cat_convert-video": "Convert video",
  "cat_convert-audio": "Convert audio",
  cat_extract: "Extract",
  cat_compress: "Compress",
  cat_cut: "Cut",
  cat_geometry: "Size",
  cat_gif: "GIF",
  "cat_audio-in-video": "Audio in video",
  "cat_mux-subs": "Subtitles",
  cat_speed: "Speed",
  cat_transcribe: "Transcribe",
  cat_translate: "Translate",
  cat_advanced: "Advanced",
} as const;

export type Key = keyof typeof dict;
/** Форма словаря: те же ключи, но значения — обычные строки, а не литералы. */
export type Dict = Record<Key, string>;
