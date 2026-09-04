// Гайд «сжать видео», английский. Эталон формы для остальных девяти языков.
//
// Все цифры — наши измерения: два ролика 1920×1080, 30 fps, 20 с (плавные
// градиенты и мелкая деталь по всему кадру), прогнанные тем же рецептом, что
// в программе. Отдельно измерено, что бывает при пережатии уже сжатого файла.
import { FACTS } from "../../facts";

export default {
  title: "Compress video — free, offline, no size limit",
  description:
    "Make a video file smaller on your own computer: pick one of three quality levels, press start. No upload, no size cap, no watermark. Measured sizes, resulting bitrates, and the one case where compressing makes the file bigger.",
  h1: "Compress video on your own computer",
  crumb: "Compress video",

  answer:
    "Drop the video into MediaChef, pick the “Compress video” recipe, choose a quality level, then press start. The smaller file appears next to the original, which is left untouched. Each step down the scale — 23, 28, 33 — roughly halves the file: in our measurements 23 gave 5.5–10 Mbit/s, 28 gave 2.7–4.6, and 33 gave about 1.6. Nothing is uploaded, there is no size cap, and a 20-second 1080p clip re-encodes in under two seconds.",

  facts: [
    { k: "What you need", v: `MediaChef ${FACTS.version} — one download, FFmpeg is already inside` },
    { k: "Works offline", v: "Yes, completely — the network is never touched" },
    { k: "Quality levels", v: "23 (high) · 28 (default) · 33 (small file)" },
    { k: "Codec", v: `H.264 video, AAC 128 kbps audio (FFmpeg ${FACTS.ffmpeg})` },
    { k: "Output", v: "clip.compressed.mp4, next to the source; the original is kept" },
    { k: "Speed", v: "20 s of 1080p30 in 1.3–2.0 s on an Apple Silicon laptop" },
  ],

  toc: [
    { id: "how", label: "How to do it" },
    { id: "level", label: "Which quality level" },
    { id: "size", label: "What you actually get" },
    { id: "bigger", label: "When compressing makes it bigger" },
    { id: "changes", label: "What changes, what does not" },
    { id: "why", label: "Why compress locally" },
    { id: "notfor", label: "When this is the wrong recipe" },
    { id: "faq", label: "Questions" },
  ],

  stepsTitle: "How to compress a video",
  steps: [
    {
      h: "Download MediaChef",
      p: "One file for macOS, Windows or Linux. FFmpeg ships inside the download — nothing to install separately, nothing to add to PATH.",
    },
    {
      h: "Drop the video on the board",
      p: "MediaChef reads the file with ffprobe and shows only the recipes that fit it. Any video gets the compress card, whatever the source format.",
    },
    {
      h: "Pick “Compress video” and a quality level",
      p: "One setting: 23, 28 or 33, where a lower number means better picture and a larger file. 28 is the default and the right first guess for almost everything.",
    },
    {
      h: "Press start and compare",
      p: "The result lands next to the original as clip.compressed.mp4. The original file is not modified, so you can look at both and run the recipe again at a different level if you were wrong.",
    },
  ],
  shotAlt:
    "MediaChef ready to convert: the board waits for a video file, the job queue is on the right.",
  shotCaption: "The board a video goes onto. Recipes appear once MediaChef has read the file.",

  tables: [
    {
      id: "level",
      title: "Which quality level to pick",
      lead:
        "The number is a quality target, not a size target — this is the single most useful thing to understand about it. You are telling the encoder how good the picture has to look; the file size is whatever that costs for your particular footage.",
      head: ["Level", "Picture", "Pick it when"],
      rows: [
        ["23", "Hard to tell from the original at normal viewing distance", "The video matters: a portfolio piece, footage you will edit again, anything going on a big screen."],
        ["28", "Good. Softer on fine detail if you look for it", "The default. Sharing, uploading, sending — the level that is right unless you have a reason."],
        ["33", "Visibly softer; blocking shows on fast motion and dark scenes", "The file has to fit somewhere specific. Choose this deliberately, not by default."],
      ],
      note:
        "Because the target is quality, the same level gives a small file for a static screen recording and a large one for handheld footage of moving leaves. Two clips at level 28 can differ several times over.",
    },
    {
      id: "size",
      title: "What you actually get",
      lead:
        "Measured on two 20-second 1080p30 clips: one with smooth gradients and continuous movement, one with fine detail across the whole frame — roughly the easy and the hard end of what an encoder meets. The bitrate column is the number that transfers to your own footage; the megabytes are specific to these clips.",
      head: ["Level", "Smooth clip", "Detailed clip", "Resulting bitrate"],
      rows: [
        ["Source", "47.0 MB", "23.9 MB", "10–20 Mbit/s"],
        ["23", "24.1 MB", "13.2 MB", "5.5–10.1 Mbit/s"],
        ["28", "11.0 MB", "6.4 MB", "2.7–4.6 Mbit/s"],
        ["33", "4.0 MB", "3.8 MB", "1.6–1.7 Mbit/s"],
      ],
      note:
        "The pattern holds across both clips: every step down the scale roughly halves the file. Going from 23 to 33 gave 6.1× on the smooth clip and 3.5× on the detailed one — the harder the footage, the less there is to win.",
    },
    {
      id: "bigger",
      title: "When compressing makes the file bigger",
      lead:
        "This surprises people, so it is worth stating plainly: asking for a quality higher than the file already has means the encoder has to spend more bits than the file contains. We measured it by feeding the level-33 output back in.",
      head: ["Applied to a 1.66 Mbit/s file", "Result", "Effect"],
      rows: [
        ["Level 23", "10.6 MB from 4.0 MB", "2.7× bigger"],
        ["Level 28", "6.1 MB from 4.0 MB", "1.5× bigger"],
        ["Level 33", "3.4 MB from 4.0 MB", "1.2× smaller, and softer"],
      ],
      note:
        "So check what you have before you compress. A phone recording at 40 Mbit/s has a lot to give; something already downloaded from the web at 2 Mbit/s has almost nothing, and re-encoding it only loses quality.",
    },
    {
      id: "changes",
      title: "What changes and what stays as it was",
      lead:
        "The recipe re-encodes; it does not reframe. Knowing exactly what it touches saves a round of surprises.",
      head: ["Property", "After compressing", "Note"],
      rows: [
        ["Resolution", "Unchanged", "1080p in, 1080p out. Use the resize recipe if you want fewer pixels."],
        ["Frame rate", "Unchanged", "Every frame is kept; only how it is stored changes."],
        ["Duration", "Unchanged", "Use the trim recipe to make the clip shorter."],
        ["Video codec", "H.264", "Encoded with the veryfast preset — the reason 20 s takes under 2 s."],
        ["Audio", "AAC at 128 kbps", "Always re-encoded, whatever came in. Fine for speech and music in a shared clip."],
        ["The original", "Untouched", "A new file is written next to it; nothing is overwritten."],
      ],
    },
  ],

  whyTitle: "Why compress on your own computer",
  whyBullets: [
    {
      h: "Nothing is uploaded.",
      p: "The video you want to shrink is usually the one you have not published yet. It stays on your disk — no copy on a server whose retention policy you would have to trust.",
    },
    {
      h: "No size limit.",
      p: "Online compressors stop between 100 MB and 2 GB, which is exactly the range where compressing starts to matter. A four-gigabyte file is treated like a four-megabyte one.",
    },
    {
      h: "Faster than uploading.",
      p: "Twenty seconds of 1080p re-encodes in under two seconds here. On a web service the same clip has to travel there and back first.",
    },
    {
      h: "The original is kept.",
      p: "The result is a new file next to the source, so a level you picked wrong costs one more run rather than the footage.",
    },
    {
      h: "A whole folder at once.",
      p: "Drop every clip in; the queue works through them and tells you where each result landed.",
    },
  ],

  notForTitle: "When this is the wrong recipe",
  notForLead:
    "Compression is re-encoding, and re-encoding always costs something. These are the cases where another recipe does the job better or cheaper.",
  notFor: [
    {
      h: "You only need part of the clip.",
      p: "Cutting first is free: the “Trim without re-encoding” recipe copies the stream instead of recalculating it, in hundredths of a second and with no quality loss. Trim, then compress if it is still too big.",
    },
    {
      h: "The file is already heavily compressed.",
      p: "As measured above, a 1.66 Mbit/s file grew 2.7× at level 23. Check the bitrate first; if it is already low, there is nothing to win.",
    },
    {
      h: "You need fewer pixels, not fewer bits.",
      p: "This recipe keeps the resolution. If a 4K file is heavy because it is 4K, the “Resize to 720p” recipe addresses the actual cause.",
    },
    {
      h: "You are archiving a master.",
      p: "H.264 at any of these levels is lossy, and the loss accumulates on every future re-encode. Keep the master as it is and compress copies.",
    },
  ],

  faqTitle: "Questions",
  faq: [
    {
      q: "How much smaller will my file get?",
      a: "It depends on the bitrate you start from, not on the file size. In our measurements level 28 produced 2.7–4.6 Mbit/s and level 33 about 1.6 Mbit/s, whatever the source was. Divide your current bitrate by those numbers to estimate: a 40 Mbit/s phone recording drops roughly tenfold at level 28, while a 3 Mbit/s download barely moves.",
    },
    {
      q: "What does the number 23, 28 or 33 mean?",
      a: "It is the H.264 constant rate factor: a quality target where lower is better. The encoder spends whatever bitrate is needed to hit that quality on your footage. That is why the same level gives very different sizes for a static screen recording and for handheld camera work.",
    },
    {
      q: "Which level should I choose?",
      a: "Start at 28 — it is the default and it is right for sharing, sending and uploading. Use 23 when the video itself matters and you will look at it closely or edit it again. Use 33 only when the file has to fit a specific limit; the softening is visible on fast motion and in dark scenes.",
    },
    {
      q: "Why did compressing make my file bigger?",
      a: "Because you asked for a higher quality than the file already had. We measured this: a 1.66 Mbit/s file came out 2.7× bigger at level 23 and 1.5× bigger at level 28. If a file is already low-bitrate, compressing it further only removes quality — check what you have before running the recipe.",
    },
    {
      q: "Does it change the resolution?",
      a: "No. 1080p in means 1080p out; the recipe changes how the picture is stored, not how big it is. If you want fewer pixels, use the “Resize to 720p” recipe, which addresses size at its source and can be combined with this one.",
    },
    {
      q: "What happens to the sound?",
      a: "The audio is re-encoded to AAC at 128 kbps, whatever it was before. That is transparent enough for speech and for music in a clip you are sharing. If you need the original audio untouched, extract it first with “Extract audio to MP3” or keep the source file.",
    },
    {
      q: "Is the original file overwritten?",
      a: "No. The result is written next to it as clip.compressed.mp4, and the source is not modified, renamed or deleted. You can run the recipe again at another level and compare.",
    },
    {
      q: "How long does it take?",
      a: "On an Apple Silicon laptop, 20 seconds of 1080p30 took 1.3 to 2.0 seconds — roughly ten to fifteen times faster than watching it. Longer clips scale about linearly, and the queue shows the remaining time. The veryfast preset is what buys that speed.",
    },
    {
      q: "Is there a size limit?",
      a: "No. MediaChef sets none; the limit is free disk space, and the app checks it before starting. This is the main practical difference from web compressors, which usually stop somewhere between 100 MB and 2 GB.",
    },
    {
      q: "Will compressing twice make it even smaller?",
      a: "Smaller, yes, but each pass loses quality permanently, and the second pass wins far less than the first. If the result is still too heavy, go back to the original and use a higher number instead of stacking passes on the compressed copy.",
    },
    {
      q: "Which formats can I compress?",
      a: "Anything FFmpeg reads: MP4, MKV, MOV, WebM, AVI, TS, FLV, WMV and the rest. The output is always MP4 with H.264, which is the combination that plays everywhere without a plugin.",
    },
    {
      q: "Can I compress several videos at once?",
      a: "Yes. Drop them all on the board, add the recipe, and the queue runs them one after another with progress and remaining time for each.",
    },
    {
      q: "Does it work without internet?",
      a: "Yes, completely. FFmpeg travels inside the download, so compressing never touches the network. Only transcription needs a one-time model download, and that is a different recipe.",
    },
    {
      q: "Is there a watermark or a paid version?",
      a: "No. MediaChef is open source under GPL-3.0, with no paid tier, and it writes nothing into the picture beyond the re-encoding you asked for.",
    },
    {
      q: "Does it run on Windows and Linux?",
      a: "All three platforms. There is an installer for Windows, an AppImage and a .deb for Linux, and a DMG for macOS on Apple Silicon. The recipe and its levels are identical everywhere.",
    },
  ],

  ctaTitle: "Make that file smaller",
  ctaSub: `MediaChef ${FACTS.version} — free, open source, macOS · Windows · Linux.`,
  also: [
    { page: "gif", label: "Video to GIF — measured sizes for every setting" },
    { page: "mp3", label: "Convert MP4 to MP3 — free and offline" },
    { page: "catalog", label: `All ${FACTS.recipeCount} recipes, category by category` },
  ],
} as const;
