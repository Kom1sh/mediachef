// Гайд «обрезать видео», английский. Эталон формы для остальных девяти языков.
//
// Цифры — наши измерения: обрезка 20-секундного 1080p занимала 0,026–0,04 с
// при любой длине куска, кодек не менялся. Отдельно измерена привязка к
// опорным кадрам на двух файлах с разным их интервалом — это главная
// особенность рецепта и причина, по которой люди считают такие инструменты
// сломанными.
import { FACTS } from "../../facts";

export default {
  title: "Trim a video without re-encoding — free, offline, instant",
  description:
    "Cut a piece out of a video on your own computer without touching the quality: the stream is copied, not recalculated, so it finishes in hundredths of a second whatever the length. Measured times, and the keyframe limit explained honestly.",
  h1: "Trim a video without losing quality",
  crumb: "Trim video",

  answer:
    "Drop the video into MediaChef, pick “Trim without re-encoding”, type the start and end as HH:MM:SS, then press start. The piece appears next to the original. Nothing is recalculated — the stream is copied as it is, so the picture is bit-for-bit what it was and the job finishes in hundredths of a second: in our measurements 0.03 seconds, whether the piece was five seconds or fifteen. The one catch is that cuts can only land on a keyframe, which is explained below.",

  facts: [
    { k: "What you need", v: `MediaChef ${FACTS.version} — one download, FFmpeg is already inside` },
    { k: "Works offline", v: "Yes, completely — the network is never touched" },
    { k: "Quality cost", v: "None. Nothing is re-encoded; the stream is copied" },
    { k: "Time format", v: "HH:MM:SS. Leave the end empty to cut to the end of the file" },
    { k: "Speed", v: "About 0.03 s, and it does not grow with the length of the piece" },
    { k: "Output", v: "clip.trim.mp4, next to the source; the original is kept" },
  ],

  toc: [
    { id: "how", label: "How to do it" },
    { id: "speed", label: "How fast it is" },
    { id: "keyframes", label: "Why the cut moves" },
    { id: "changes", label: "What changes, what does not" },
    { id: "format", label: "How to write the times" },
    { id: "why", label: "Why trim locally" },
    { id: "notfor", label: "When this is the wrong recipe" },
    { id: "faq", label: "Questions" },
  ],

  stepsTitle: "How to cut a piece out of a video",
  steps: [
    {
      h: "Download MediaChef",
      p: "One file for macOS, Windows or Linux. FFmpeg ships inside the download — nothing to install separately, nothing to add to PATH.",
    },
    {
      h: "Drop the video on the board",
      p: "MediaChef reads the file with ffprobe and shows only the recipes that fit it. Any video gets the trim card, whatever the source format.",
    },
    {
      h: "Pick “Trim without re-encoding” and type the times",
      p: "Start and end as HH:MM:SS — 00:01:30 is one minute thirty. Leaving the end empty cuts from the start point to the end of the file.",
    },
    {
      h: "Press start and take the piece",
      p: "The result lands next to the original as clip.trim.mp4, and the original is untouched. It is fast enough that the job is finished before you have looked away.",
    },
  ],
  shotAlt:
    "MediaChef ready to convert: the board waits for a video file, the job queue is on the right.",
  shotCaption: "The board a video goes onto. Recipes appear once MediaChef has read the file.",

  tables: [
    {
      id: "speed",
      title: "How fast it actually is",
      lead:
        "Because nothing is recalculated, the work is a file copy of the relevant bytes. The time does not depend on how long the piece is — measured on a 20-second 1080p source.",
      head: ["Piece cut", "Result", "Time taken"],
      rows: [
        ["00:00:02 → 00:00:07", "5.2 s", "0.03 s"],
        ["00:00:00 → 00:00:10", "10.1 s", "0.03 s"],
        ["00:00:05 → 00:00:20", "15.0 s", "0.04 s"],
      ],
      note:
        "Compare that with re-encoding the same source, which took 1.3 to 2.0 seconds — roughly fifty times longer, and with a quality loss on top. If all you need is a fragment, this is the recipe to reach for first.",
    },
    {
      id: "keyframes",
      title: "Why the cut sometimes moves",
      lead:
        "This is the honest limitation, and knowing it turns a confusing result into an expected one. A video does not store every frame in full: most frames only describe the difference from the one before, and the cut can only begin at a full frame — a keyframe. Ask for a point between two, and the cut starts at the keyframe before it.",
      head: ["Source", "Keyframes at", "Asked to start at", "Actually started at"],
      rows: [
        ["Sparse keyframes", "0 s, 8.33 s, 16.67 s", "5 s", "0 s — five seconds early"],
        ["Sparse keyframes", "0 s, 8.33 s, 16.67 s", "9 s", "8.33 s — 0.67 s early"],
        ["Dense keyframes", "every 1 s", "5 s", "5 s — exactly"],
        ["Dense keyframes", "every 1 s", "9 s", "9 s — exactly"],
      ],
      note:
        "How far a cut can move is a property of the file, not of MediaChef: recordings from a phone and from screen-capture tools usually place keyframes about once a second, while files exported for streaming can go eight seconds or more between them. If your cut has to be frame-exact, use a video editor, which re-encodes to get there.",
    },
    {
      id: "changes",
      title: "What changes and what stays as it was",
      lead:
        "Almost nothing changes, and that is the point of this recipe. The list is short because copying touches so little.",
      head: ["Property", "After trimming", "Note"],
      rows: [
        ["Picture quality", "Identical", "The same encoded frames are written out. No generation loss, ever."],
        ["Video codec", "Unchanged", "H.264 in, H.264 out. Whatever the source used is preserved."],
        ["Resolution", "Unchanged", "Use the resize recipe if you need fewer pixels."],
        ["Audio", "Copied, not re-encoded", "The soundtrack keeps its original codec and bitrate."],
        ["Container", "MP4", "The result is written as MP4 regardless of the source container."],
        ["The original", "Untouched", "A new file is written next to it; nothing is overwritten."],
      ],
    },
    {
      id: "format",
      title: "How to write the times",
      lead:
        "Both fields take hours, minutes and seconds separated by colons. The end field is the one people ask about most.",
      head: ["You want", "Start", "End"],
      rows: [
        ["The first thirty seconds", "00:00:00", "00:00:30"],
        ["From 1:30 to the end of the file", "00:01:30", "leave empty"],
        ["A minute in the middle of a long recording", "01:12:00", "01:13:00"],
        ["The last part, from 2:05 onward", "00:02:05", "leave empty"],
      ],
      note:
        "The end is a position on the timeline, not a duration: to get ten seconds starting at one minute, write 00:01:00 and 00:01:10, not 00:00:10.",
    },
  ],

  whyTitle: "Why trim on your own computer",
  whyBullets: [
    {
      h: "Nothing is uploaded.",
      p: "Trimming is usually the first thing you do to raw footage, which is exactly the footage you have not shown anyone. It stays on your disk.",
    },
    {
      h: "No waiting at all.",
      p: "A web tool has to receive the whole file before it can cut ten seconds out of it. Here the work is over in hundredths of a second, on a file of any size.",
    },
    {
      h: "No quality cost.",
      p: "Most online trimmers re-encode, so a cut costs you a generation of quality. Copying the stream costs nothing, and you can cut the same file as many times as you like.",
    },
    {
      h: "No size limit.",
      p: "A two-hour recording is not a problem here, and it is exactly the size that web tools refuse.",
    },
    {
      h: "Several at once.",
      p: "Drop a whole folder in; the queue works through them and tells you where each piece landed.",
    },
  ],

  notForTitle: "When this is the wrong recipe",
  notForLead:
    "Copying the stream is what makes this recipe fast and lossless, and it is also what limits it. These are the cases where something else fits better.",
  notFor: [
    {
      h: "The cut has to be on an exact frame.",
      p: "As measured above, the start snaps back to the nearest keyframe, which on some files is several seconds. A frame-exact cut requires re-encoding, which is what a video editor does.",
    },
    {
      h: "You want to remove a piece from the middle.",
      p: "This recipe takes one continuous piece out. Cutting a section out of the middle means producing two pieces and joining them, which is editing rather than trimming.",
    },
    {
      h: "You are going to compress it anyway.",
      p: "Then trim first and compress after — that order costs one re-encode instead of two, and the trim itself stays free.",
    },
    {
      h: "You need a different format at the end.",
      p: "The output is MP4 with the original streams inside. If you need WebM, a GIF or just the audio, use the recipe for that; those re-encode by nature.",
    },
  ],

  faqTitle: "Questions",
  faq: [
    {
      q: "Does trimming lose quality?",
      a: "No, none at all. The encoded frames are copied across untouched, so the picture in the piece is bit-for-bit what it was in the original. This is the difference from most online trimmers, which re-encode and cost you a generation of quality on every cut.",
    },
    {
      q: "Why did my cut start earlier than I asked?",
      a: "Because a cut can only begin at a keyframe — a frame stored in full — and your file had none at the point you asked for. We measured this: on a file with keyframes every 8.33 seconds, asking to start at 5 seconds produced a piece starting at 0. On a file with keyframes every second, the same request landed exactly. It is a property of the file, not of the app.",
    },
    {
      q: "How do I get a frame-exact cut?",
      a: "You cannot, without re-encoding — the frame you want does not exist as a complete picture in the file. If exactness matters more than speed and quality, use a video editor, which decodes and re-encodes to give you any frame you point at.",
    },
    {
      q: "How long does it take?",
      a: "About 0.03 seconds in our measurements, and it does not grow with the length of the piece: five seconds and fifteen seconds both finished in the same time. Re-encoding the same source took 1.3 to 2.0 seconds, roughly fifty times longer.",
    },
    {
      q: "How do I write the start and end?",
      a: "As HH:MM:SS — hours, minutes, seconds. 00:01:30 is one minute thirty. The end is a position, not a duration: for ten seconds starting at one minute, write 00:01:00 and 00:01:10.",
    },
    {
      q: "What if I leave the end empty?",
      a: "The piece runs from your start point to the end of the file. That is the quickest way to drop a long tail — a recording that kept going after the meeting ended, for example.",
    },
    {
      q: "Can I cut a piece out of the middle and keep the rest?",
      a: "Not in one step. This recipe produces one continuous piece. Removing a middle section means making two pieces and joining them, which is a job for an editor rather than for a trim.",
    },
    {
      q: "Is the original file changed?",
      a: "No. The piece is written next to it as clip.trim.mp4, and the source is not modified, renamed or deleted. You can cut several different pieces out of the same file one after another.",
    },
    {
      q: "What happens to the sound?",
      a: "It is copied along with the picture, keeping its original codec and bitrate. Nothing is re-encoded on either track.",
    },
    {
      q: "Is there a length or size limit?",
      a: "No. MediaChef sets none, and because the work is a copy rather than a calculation, a two-hour file is no slower to trim than a two-minute one. The limit is free disk space, which the app checks before starting.",
    },
    {
      q: "Which formats can I trim?",
      a: "Anything FFmpeg reads: MP4, MKV, MOV, WebM, AVI, TS and the rest. The result is written as MP4 with the original video and audio streams inside it.",
    },
    {
      q: "Can I trim several videos at once?",
      a: "Yes, though each one gets the same start and end. Drop them all on the board, add the recipe, and the queue runs them one after another.",
    },
    {
      q: "Does it work without internet?",
      a: "Yes, completely. FFmpeg travels inside the download, so trimming never touches the network. Only transcription needs a one-time model download, and that is a different recipe.",
    },
    {
      q: "Is there a watermark or a paid version?",
      a: "No. MediaChef is open source under GPL-3.0, with no paid tier, and since nothing is re-encoded there is nowhere for a watermark to be added even in principle.",
    },
    {
      q: "Does it run on Windows and Linux?",
      a: "All three platforms. There is an installer for Windows, an AppImage and a .deb for Linux, and a DMG for macOS on Apple Silicon. The recipe behaves identically everywhere.",
    },
  ],

  ctaTitle: "Cut that piece out",
  ctaSub: `MediaChef ${FACTS.version} — free, open source, macOS · Windows · Linux.`,
  also: [
    { page: "compress", label: "Compress video — measured sizes and bitrates" },
    { page: "gif", label: "Video to GIF — measured sizes for every setting" },
    { page: "catalog", label: `All ${FACTS.recipeCount} recipes, category by category` },
  ],
} as const;
