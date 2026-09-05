// Гайд «голосовой ввод», английский. Реальные запросы: «voice to text mac»,
// «dictation app», «offline speech to text».
//
// Фича ещё не в релизе — это сказано прямо в ответе и в фактах. Все цифры
// измерены на живой сборке 2026-09-05, синтетики нет.
import { FACTS } from "../../facts";

export default {
  title: "Voice to text on your Mac — offline, free, no per-minute billing",
  description:
    "Press a hotkey anywhere, speak, and the words appear where your cursor is. Recognition runs on your own machine with Whisper — nothing is uploaded, nothing is metered. Measured latency, model sizes and the one permission it needs, all inside.",
  h1: "Voice typing that never leaves your computer",
  crumb: "Voice to text",

  answer:
    "Press ⌥ Space anywhere on your Mac, say a sentence, press it again — and the text is typed straight into whatever field your cursor sits in: a terminal, a chat, a browser form. Recognition happens on your own machine with the same Whisper engine MediaChef already carries, so the audio never leaves your disk and there is no per-minute charge. In our measurement a five-second phrase came back in 780 milliseconds. This is the one feature on this site that has not shipped yet: it is finished and in daily use internally, and it arrives in the next version.",

  facts: [
    { k: "Status", v: "Not in a release yet — ships in the next version" },
    { k: "Where it runs", v: "Entirely on your machine, no account, no upload" },
    { k: "Speed", v: "780 ms from key to text on a five-second phrase (measured)" },
    { k: "Cost", v: "None. No subscription, no per-minute billing" },
    { k: "Platform", v: "macOS first; Windows and Linux after" },
    { k: "One-time download", v: "A speech model, 488 MB for the default one" },
  ],

  toc: [
    { id: "how", label: "How it works" },
    { id: "speed", label: "How fast it is" },
    { id: "models", label: "Which model to use" },
    { id: "dictionary", label: "Teaching it your words" },
    { id: "delivery", label: "Where the text goes" },
    { id: "why", label: "Why local matters here" },
    { id: "notfor", label: "When it will not help" },
    { id: "faq", label: "Questions" },
  ],

  stepsTitle: "How dictation works",
  steps: [
    {
      h: "Turn it on once",
      p: "Settings has a switch and a choice of three hotkeys. It is off until you turn it on, and until then MediaChef registers no global shortcut at all — an app that quietly claims a system-wide key combination is an app that breaks other apps.",
    },
    {
      h: "Press the hotkey anywhere",
      p: "It works while MediaChef is in the background, or its window closed. Two ways to use it: hold the key while you speak, or tap it once to start and once again to stop — whichever suits the length of the thought.",
    },
    {
      h: "Speak",
      p: "The microphone opens only while you are dictating, so the orange recording dot in the menu bar goes out the moment you stop. Nothing is listened to between presses.",
    },
    {
      h: "The text appears where your cursor is",
      p: "Typed straight into the focused field, without touching your clipboard. If you would rather it went to the clipboard instead, that is the other setting.",
    },
  ],
  shotAlt:
    "MediaChef ready to convert: the board waits for a video file, the job queue is on the right.",
  shotCaption: "MediaChef today. Dictation adds a fourth mode to the three already here.",

  tables: [
    {
      id: "speed",
      title: "How fast it actually is",
      lead:
        "Measured end to end on an M5 laptop: from releasing the key to the text being delivered, with the default model. The first row is a real dictation from the live build, the rest are a fixed fifteen-second phrase run through each model.",
      head: ["What was measured", "Model", "Time"],
      rows: [
        ["A real five-second phrase, key release to typed text", "small", "780 ms"],
        ["A fifteen-second phrase", "tiny", "not measured separately"],
        ["A fifteen-second phrase", "small", "0.66–0.75 s"],
        ["A fifteen-second phrase", "large-v3-turbo", "1.64–1.97 s"],
      ],
      note:
        "Two things these numbers hide, and both are worth knowing. The microphone takes 56 milliseconds to deliver its first sample, so a word begun in the same instant as the keypress can clip — in practice you start speaking after the key, and nobody notices. And the very first dictation after granting the microphone permission is lost: the system spends about 1.8 seconds showing its dialog. Press the hotkey again and it works.",
    },
    {
      id: "models",
      title: "Which model to use",
      lead:
        "The same four models the transcription recipes use, so if you already transcribe files with MediaChef the model is already on your disk and dictation costs you no download at all.",
      head: ["Model", "Download", "Character"],
      rows: [
        ["tiny", "78 MB", "Fastest, rough — fine for a note to yourself"],
        ["base", "148 MB", "Fast, decent"],
        ["small — the default", "488 MB", "The balance, and what the recipes already use"],
        ["large-v3-turbo", "1.62 GB", "Best quality, about twice the wait"],
      ],
      note:
        "Start with small. It is the default for a practical reason rather than a technical one: it is the same model the transcription recipes use, so an existing user gets dictation working without downloading anything. Move up to large-v3-turbo if your audio is difficult — a strong accent, a noisy room, two languages mixed in one sentence — and accept roughly twice the wait per phrase.",
    },
    {
      id: "dictionary",
      title: "Teaching it your words",
      lead:
        "Every trade has words that speech recognition mangles: product names, jargon, the surname of a colleague. You can hand the model a list of them, and it stops guessing. This is the same recording, with and without a dictionary of forty terms.",
      head: ["Without a dictionary", "With one"],
      rows: [
        ["«медиашиф»", "MediaChef"],
        ["«ходкий»", "хоткей"],
        ["«виспер»", "whisper"],
        ["«распознаванию»", "распознавание"],
      ],
      note:
        "It cost 0.04 seconds — 0.87 against 0.83 on the same clip. The limit is about 224 tokens, which is roughly 400 characters of Cyrillic or three times that in Latin script; MediaChef counts for you and trims, because Whisper itself truncates an over-long list silently. This is the feature macOS's built-in dictation has no answer to: it cannot be taught your vocabulary.",
    },
    {
      id: "delivery",
      title: "Where the text goes",
      lead:
        "Two choices, and the difference matters more than it sounds when you dictate several times an hour.",
      head: ["Setting", "What happens", "What it needs"],
      rows: [
        ["Type it", "The words appear in the focused field. Your clipboard is untouched", "The Accessibility permission, once"],
        ["Clipboard", "The text is copied and you paste it yourself with ⌘V", "Nothing beyond the microphone"],
      ],
      note:
        "Typing leaves the clipboard alone, and that is the whole point of preferring it: if every dictation overwrote your clipboard, you could not keep a link in it while you worked. macOS treats typing into another app as synthetic input and asks for the Accessibility permission — the first attempt opens the right pane of System Settings by itself. When the permission is missing the text still lands in the clipboard, so a dictation is never lost.",
    },
  ],

  whyTitle: "Why doing this locally is the point",
  whyBullets: [
    {
      h: "Your voice is not uploaded.",
      p: "Dictation is where you say things you would not paste into a web form: half-formed ideas, client names, the sentence you are about to send. Cloud dictation is by definition a copy of all of it on someone else's server.",
    },
    {
      h: "No per-minute meter.",
      p: "Services that transcribe for you bill by the minute, which makes you think before speaking. Here the model download is a one-off and the hundredth dictation of the day costs exactly what the first did.",
    },
    {
      h: "It works with the network off.",
      p: "On a plane, on a locked-down machine, in a room where the wifi is the least reliable thing present. Once the model is on disk, dictation never touches the internet.",
    },
    {
      h: "It learns your vocabulary.",
      p: "The dictionary is a plain list of your words, and it is the one thing the dictation built into macOS cannot do.",
    },
    {
      h: "Open source, no subscription.",
      p: "GPL-3.0, the whole thing readable on GitHub. The paid tools in this niche charge monthly for what is, underneath, the same open model.",
    },
  ],

  notForTitle: "When it will not help",
  notForLead:
    "Said plainly, because finding out later is worse than reading it now.",
  notFor: [
    {
      h: "You want it right now.",
      p: "This is the only page on this site describing something you cannot yet download. Dictation is finished and in daily internal use, and it ships in the next version — but today's release does not have it.",
    },
    {
      h: "You are not on a Mac.",
      p: "macOS comes first because that is where it was built and tested. Windows and Linux follow; the recognition engine is already cross-platform, it is the hotkey and the typing that need per-platform work.",
    },
    {
      h: "You need it to type as you speak.",
      p: "The text arrives when you finish, not word by word while you talk. That is a deliberate trade: recognising a whole phrase at once is both more accurate and, at these speeds, fast enough that streaming would buy nothing.",
    },
    {
      h: "You need speaker labels.",
      p: "It writes what was said, not who said it. For interviews with two voices you want a transcription tool built for that, not a dictation hotkey.",
    },
  ],

  faqTitle: "Questions",
  faq: [
    {
      q: "Is my voice sent anywhere?",
      a: "No. The audio is recognised by a model file on your own disk and is deleted with the temporary folder it lived in. The only thing that ever crosses the network is the one-time model download; after that dictation works with the network off entirely.",
    },
    {
      q: "How fast is it?",
      a: "780 milliseconds from releasing the key to the text appearing, measured on a real five-second phrase with the default model on an M5 laptop. A fifteen-second phrase took 0.66–0.75 seconds. The heavier large-v3-turbo model takes roughly twice as long.",
    },
    {
      q: "Does it work in any application?",
      a: "Yes — the hotkey is registered system-wide, so it fires in a terminal, a browser, a chat client or a text editor, with MediaChef itself in the background or its window closed.",
    },
    {
      q: "Which hotkey does it use?",
      a: "⌥ Space by default, with ⌃⌥ Space and ⌃⌥ D as alternatives. Deliberately not Cmd plus a letter: a global shortcut is grabbed before any application sees it, so claiming ⌘D would break \"duplicate\" in every app you own.",
    },
    {
      q: "Why does it need the Accessibility permission?",
      a: "Only for typing the text into another application's window, which macOS counts as synthetic input. If you would rather not grant it, switch delivery to the clipboard: that needs nothing beyond the microphone, and you paste with ⌘V yourself.",
    },
    {
      q: "What if I do not grant it?",
      a: "The text goes to your clipboard instead and a notification says why, with the right pane of System Settings opened for you. Nothing dictated is ever lost to a missing permission.",
    },
    {
      q: "How much disk does it need?",
      a: "The app plus one speech model: 488 MB for the default, 78 MB if you pick the smallest, 1.62 GB for the largest. If you already use MediaChef to transcribe files, the model is on your disk already and dictation adds nothing.",
    },
    {
      q: "Can it handle Russian, or two languages at once?",
      a: "Whisper supports 99 languages, and you can either name yours or let it detect. Mixing languages in one sentence is the case where the heavier model earns its size, and where the dictionary helps most.",
    },
    {
      q: "How long can one dictation be?",
      a: "Five minutes, after which it stops on its own and transcribes what it heard rather than discarding it. In practice people dictate in sentences, not monologues.",
    },
    {
      q: "Can I cancel mid-sentence?",
      a: "Escape while recording throws the take away and delivers nothing. It is registered only while you are dictating, so it does not interfere with Escape anywhere else.",
    },
    {
      q: "Does it replace the dictation built into macOS?",
      a: "It does the same job with two differences that matter: it can be taught your vocabulary, and the audio stays on your machine. If neither matters to you, the built-in one is already there and free.",
    },
    {
      q: "Is it really free?",
      a: `Yes. MediaChef is open source under GPL-3.0 with no paid tier and no subscription — dictation included. The current release is ${FACTS.version}; dictation arrives in the next one.`,
    },
  ],

  ctaTitle: "MediaChef today",
  ctaSub: `Version ${FACTS.version} — free, open source, macOS · Windows · Linux. Dictation ships in the next version.`,
  also: [
    { page: "transcribe", label: "Audio to text — the same engine, for files" },
    { page: "srt", label: "Video to SRT subtitles — measured, offline" },
    { page: "catalog", label: `All ${FACTS.recipeCount} recipes by category` },
  ],
} as const;
