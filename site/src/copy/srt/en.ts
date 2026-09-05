// Гайд «видео в субтитры», английский. Все цифры измерены на M5/16 ГБ,
// образец — 163 секунды речи; условия названы прямо в примечаниях к таблицам.
import { FACTS } from "../../facts";

export default {
  title: "Video to SRT subtitles — free, offline, on your own machine",
  description:
    "How to get timed SRT subtitles out of a video without uploading it anywhere. Measured on a real machine: four Whisper models timed side by side, how long each subtitle line comes out, and what the four output formats actually contain.",
  h1: "Turn a video into SRT subtitles",
  crumb: "Video to SRT",

  answer:
    "Drop the video into MediaChef, pick «Make SRT subtitles for a video», leave the model on small and the language on auto, and run it. A .srt file lands next to the video with timings already in it. Everything happens on your machine: the speech never leaves the disk, and once the model is downloaded the recipe works with the network off. On an M5 laptop, 2 minutes 43 seconds of speech took 6.2 seconds with the default model — about 26 times faster than real time — and produced 73 subtitle cues averaging 39 characters, which is short enough to read comfortably.",

  facts: [
    { k: "What you need", v: `MediaChef ${FACTS.version} plus a one-time model download` },
    { k: "Default model", v: "small — 488 MB, downloaded once and then kept" },
    { k: "Speed", v: "≈26× real time on the default model (measured, M5)" },
    { k: "Works offline", v: "Yes, after the model is on disk" },
    { k: "Formats", v: "SRT, VTT, plain TXT and JSON — one recipe each" },
    { k: "What you get", v: "clip.subs.srt next to the video, original untouched" },
  ],

  toc: [
    { id: "how", label: "How to do it" },
    { id: "models", label: "Which model to pick" },
    { id: "cues", label: "How long the lines come out" },
    { id: "formats", label: "SRT, VTT, TXT or JSON" },
    { id: "recipes", label: "Which recipe for which job" },
    { id: "why", label: "Why do it locally" },
    { id: "notfor", label: "When this is the wrong tool" },
    { id: "faq", label: "Questions" },
  ],

  stepsTitle: "How to make subtitles for a video",
  steps: [
    {
      h: "Download MediaChef",
      p: "One file for macOS, Windows or Linux. FFmpeg and the Whisper runner both travel inside the download — there is nothing to install separately and nothing to put on your PATH.",
    },
    {
      h: "Download a model, once",
      p: "The first transcription asks for a speech model. small is the default at 488 MB and the one these measurements use; tiny is 78 MB, base 148 MB, large-v3-turbo 1.62 GB. It is fetched once, stays on disk, and after that the recipe never touches the network again.",
    },
    {
      h: "Drop the video in and pick the recipe",
      p: "«Make SRT subtitles for a video» takes the video straight — you do not need to pull the audio out first. MediaChef decodes the sound to the 16 kHz mono that Whisper wants, in a temporary folder you never see.",
    },
    {
      h: "Run it and open the .srt",
      p: "The file lands next to the video as clip.subs.srt, with numbered cues and timestamps. Players, editors and video platforms all read it directly, and it is plain text, so you can fix a name or a term in any editor.",
    },
  ],
  shotAlt:
    "MediaChef ready to convert: the board waits for a video file, the job queue is on the right.",
  shotCaption: "The board the video lands on. Recipes appear once MediaChef has read the file.",

  tables: [
    {
      id: "models",
      title: "Which model to pick",
      lead:
        "Four models, the same 2 minutes 43 seconds of speech, the same machine — an M5 laptop with 16 GB, each model warmed up first and the best of two runs taken.",
      head: ["Model", "Download", "Time", "vs real time", "Words wrong"],
      rows: [
        ["tiny", "78 MB", "2.1 s", "×78", "5 of 540"],
        ["base", "148 MB", "2.6 s", "×63", "3 of 540"],
        ["small — the default", "488 MB", "6.2 s", "×26", "0 of 540"],
        ["large-v3-turbo", "1.62 GB", "11.5 s", "×14", "1 of 540"],
      ],
      note:
        "Read the last column carefully, because the test audio is a synthesised voice reading a prepared script: no accent, no background noise, nobody talking over anybody. That is why even the smallest model is almost perfect here, and it is not what a real meeting recording sounds like — on hard audio the gap between these models widens a lot. The speed column is the one that transfers directly. One more thing the raw comparison hid: most of the mismatches were numbers written as digits rather than words — large-v3-turbo wrote «70», «10», «50», «30» where the script said them in full — which is formatting, not mishearing.",
    },
    {
      id: "cues",
      title: "How long the subtitle lines come out",
      lead:
        "A subtitle that is technically correct can still be unusable if it puts twenty words on screen at once. The models chop the same speech very differently, and this is measured on the same run as above.",
      head: ["Model", "Cues", "Average length", "Average characters", "Longest"],
      rows: [
        ["tiny", "35", "4.7 s", "83", "97 characters"],
        ["base", "35", "4.7 s", "83", "100 characters"],
        ["small — the default", "73", "2.2 s", "39", "58 characters"],
        ["large-v3-turbo", "30", "5.4 s", "97", "112 characters"],
      ],
      note:
        "The common broadcast guideline is about 42 characters a line over two lines, so roughly 84 characters on screen at once. By that measure small is the only one of the four that comfortably fits, at 39 characters on average and 58 at its longest, while large-v3-turbo runs past the limit on a typical cue. So the default model is not just the balanced choice on accuracy — it also chops the speech into the most readable pieces.",
    },
    {
      id: "formats",
      title: "SRT, VTT, plain text or JSON",
      lead:
        "The same transcript written four ways. Sizes are from the same 2 minutes 43 seconds of speech, so they compare directly.",
      head: ["Format", "Size", "What is inside", "Use it when"],
      rows: [
        ["SRT", "5.5 KB", "Numbered cues, timings with a comma: 00:00:00,000", "Almost always. Players, editors and platforms all take it"],
        ["VTT", "5.3 KB", "A WEBVTT header, timings with a dot: 00:00:00.000", "Subtitles for a web player, a browser video track"],
        ["TXT", "3.0 KB", "Plain running text, no timings at all", "You want the words, not the subtitles"],
        ["JSON", "15.2 KB", "Every cue plus the model and parameters used", "Something else is going to read this, not a person"],
      ],
      note:
        "SRT and VTT differ mainly in the character between seconds and milliseconds, so if a player rejects one, the other is a one-recipe fix rather than a re-transcription. JSON is roughly three times the size of SRT because it carries the run's metadata alongside the text.",
    },
    {
      id: "recipes",
      title: "Which recipe for which job",
      lead:
        `Subtitles are not one recipe but several, and picking the right one saves a step. All of them are in the ${FACTS.recipeCount}-recipe catalogue.`,
      head: ["What you have", "What you want", "Recipe"],
      rows: [
        ["A video", "Subtitles next to it", "Make SRT subtitles for a video"],
        ["An audio file", "Subtitles", "Transcribe audio to SRT subtitles"],
        ["Speech in another language", "English subtitles, one pass", "Translate speech to English subtitles"],
        ["Anything with speech", "Just the text", "Transcribe audio to text"],
        ["Anything with speech", "A web player track", "Transcribe audio to WebVTT"],
      ],
      note:
        "The translation recipe goes straight from foreign speech to timed English subtitles in a single pass — you do not transcribe first and translate after. It only goes to English, though; that is a limit of the model, not of the app.",
    },
  ],

  whyTitle: "Why make subtitles on your own machine",
  whyBullets: [
    {
      h: "The speech never leaves your disk.",
      p: "Recordings of meetings, interviews and calls are the single most sensitive kind of file most people handle, and an online transcriber is by definition a copy of that conversation on somebody else's server. Here there is no upload to reason about.",
    },
    {
      h: "No per-minute pricing.",
      p: "Transcription services bill by the minute of audio, which turns a long archive into a real invoice. The model download is a one-off, and after that a two-hour recording costs the same as a two-minute one: nothing.",
    },
    {
      h: "It runs with the network off.",
      p: "Once the model file is on disk, nothing about this recipe touches the internet. It works on a plane, on a locked-down machine, and in a room where the wifi is the least reliable thing present.",
    },
    {
      h: "No length limit.",
      p: "Free web transcribers usually cap you at a few minutes per file, exactly when a recording is worth transcribing because it is long. There is no cap here.",
    },
    {
      h: "A whole folder at once.",
      p: "Drop in a directory of recordings and the queue works through them one at a time, telling you where each subtitle file was written.",
    },
  ],

  notForTitle: "When this is the wrong tool",
  notForLead:
    "The recipe writes a subtitle file. That is a narrower job than «putting subtitles on a video», and the difference matters in these cases.",
  notFor: [
    {
      h: "You want the subtitles burnt into the picture.",
      p: "This produces a separate .srt file that a player loads alongside the video. Burning the text permanently into the frames is a different operation — it re-encodes the video, and the words then cannot be turned off or edited.",
    },
    {
      h: "You need broadcast-grade accuracy.",
      p: "Even on the clean audio measured above the models slipped on a few words, and real recordings are harder. Anything published under a legal accessibility requirement gets read by a human before it ships, whatever produced the first draft.",
    },
    {
      h: "The audio is genuinely bad.",
      p: "Heavy crosstalk, a phone recording of a room, or music louder than the voice will defeat all four models. Fixing the audio first — even just extracting a cleaner track — does more for the result than moving up a model size.",
    },
    {
      h: "You need translation into something other than English.",
      p: "Whisper translates into English and only English. For any other target language, transcribe in the original language first and translate the resulting text with a tool built for that.",
    },
  ],

  faqTitle: "Questions",
  faq: [
    {
      q: "Is this free?",
      a: `Yes, all of it. MediaChef is open source under GPL-3.0, there is no paid tier, no per-minute charge and no cap on file length. The models are free downloads too. Version ${FACTS.version} is the current one.`,
    },
    {
      q: "Does my video get uploaded anywhere?",
      a: "No. The speech is processed by a model file on your own disk. The only thing that ever crosses the network is the one-time model download, and after that the recipe runs with the network off.",
    },
    {
      q: "How long does it take?",
      a: "About 26 times faster than real time on the default model: we measured 6.2 seconds for 2 minutes 43 seconds of speech on an M5 laptop. By that ratio an hour-long recording takes a couple of minutes. tiny ran at ×78 and large-v3-turbo at ×14 on the same audio.",
    },
    {
      q: "Which model should I choose?",
      a: "Start with small, the default. In our measurements it got every word of the test audio right and produced the most readable subtitle lines — 39 characters on average against 97 for large-v3-turbo. Move up only if your audio is difficult; move down to tiny or base if you want a rough draft in a couple of seconds.",
    },
    {
      q: "How big is the model download?",
      a: "78 MB for tiny, 148 MB for base, 488 MB for small, 1.62 GB for large-v3-turbo. It happens once. After that the file sits on your disk and every later run uses it without asking.",
    },
    {
      q: "Do I need to tell it what language the speech is in?",
      a: "No. Language is set to auto by default and the model works it out from the audio. You can still name the language explicitly, which is worth doing when a recording opens with a few words in another language.",
    },
    {
      q: "Can it translate the subtitles into English?",
      a: "Yes, with the «Translate speech to English subtitles» recipe: foreign speech in, timed English SRT out, in one pass rather than transcribe-then-translate. English is the only target language the model supports.",
    },
    {
      q: "What is the difference between SRT and VTT?",
      a: "Mostly the punctuation in the timestamps: SRT writes 00:00:00,000 with a comma and numbers its cues, VTT writes 00:00:00.000 with a dot and opens with a WEBVTT line. SRT is what players and editors expect; VTT is what a web player wants for its own subtitle track. Both come from separate recipes, so switching is a re-run, not a rewrite.",
    },
    {
      q: "Can I edit the subtitles afterwards?",
      a: "Yes — an .srt is plain text. Open it in any editor to fix a proper noun, a piece of jargon or a timing. This is the normal way to work: let the model do the ninety-something percent and correct the rest by hand.",
    },
    {
      q: "Why are some of my subtitle lines too long?",
      a: "Because the model decides where to break, and the bigger models break less often. We measured 39 characters per cue on small against 97 on large-v3-turbo, on the same audio. If your lines are running long, moving down to small usually fixes it, and it costs nothing in accuracy on clean speech.",
    },
    {
      q: "Can it tell speakers apart?",
      a: "No. Whisper writes what was said, not who said it. If you need «Speaker 1 / Speaker 2» labels, you will be adding them by hand or using a tool built specifically for that.",
    },
    {
      q: "What happens if there is no speech in the file?",
      a: "The run stops and tells you it heard nothing recognisable, rather than quietly writing an empty file. Silence produces no subtitles by design.",
    },
    {
      q: "Does it work on Windows and Linux?",
      a: "On all three platforms. Speech runs on the CPU everywhere and additionally uses the GPU on Apple Silicon, which is why the numbers above are fast — the same recipe on a modest Windows laptop will be slower, though still faster than listening to the recording.",
    },
    {
      q: "Can I subtitle several files at once?",
      a: "Yes. Drop in a whole folder, add the recipe, and the queue works through them one after another. Each subtitle file is written next to its own source.",
    },
    {
      q: "Does the video file get changed?",
      a: "No. A separate .srt is written next to it — clip.subs.srt — and the video is not modified, renamed or re-encoded. Nothing about this recipe touches the picture.",
    },
  ],

  ctaTitle: "Get subtitles for that video",
  ctaSub: `MediaChef ${FACTS.version} — free, open source, macOS · Windows · Linux.`,
  also: [
    { page: "transcribe", label: "Audio to text — the same engine, words only" },
    { page: "trim", label: "Trim a video — measured, and lossless" },
    { page: "catalog", label: `All ${FACTS.recipeCount} recipes by category` },
  ],
} as const;
