// Гайд «сжать видео», английский. Эталон формы для остальных девяти языков.
//
// Все цифры — наши измерения: два ролика 1920×1080, 30 fps, 20 с (плавные
// градиенты и мелкая деталь по всему кадру), прогнанные тем же рецептом, что
// в программе. Отдельно измерено, что бывает при пережатии уже сжатого файла.
import { FACTS } from "../../facts";

export default {
  title: "Compress a video offline by quality or file size",
  description:
    "Compress an MP4 offline in MediaChef. Choose a quality preset for a smaller file or enter a target in MB for an attachment limit.",
  h1: "Compress a video offline in MediaChef",
  crumb: "Compress video",

  answer:
    "Drop a video into MediaChef. To make it smaller, choose “Compress video (quality preset)” and start at CRF 28. If the file has to fit a limit such as 8 MB, choose “Compress video to a file size” and enter that number as Target size. Click “Add to queue”, then check the size of the new MP4. The original stays on your computer.",

  facts: [
    { k: "What you need", v: `MediaChef ${FACTS.version} — one download, FFmpeg is already inside` },
    { k: "Works offline", v: "Yes, completely — the network is never touched" },
    { k: "Quality levels", v: "23 (high) · 28 (default) · 33 (small file)" },
    { k: "Codec", v: `CRF: H.264 video, AAC 128 kbps audio (FFmpeg ${FACTS.ffmpeg})` },
    { k: "Output", v: "clip.compressed.mp4 (CRF) · clip.small.mp4 (MB)" },
    { k: "Speed", v: "CRF: 20 s of 1080p30 in 1.3–2.0 s on an Apple Silicon laptop" },
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
      h: "Choose a quality level or a target size",
      p: "For a smaller file, choose “Compress video (quality preset)” and start at 28. For a limit in MB, choose “Compress video to a file size” and enter the cap under Target size. The app calculates the bitrate from the clip’s length and may reduce the resolution to fit the budget.",
    },
    {
      h: "Click “Add to queue”",
      p: "Check the result once the job finishes. The queue shows the output path. By default the file is saved beside the source. The quality preset writes clip.compressed.mp4. The size recipe writes clip.small.mp4. In a test on a noisy 20-second 720p clip with audio, an 8 MB target produced a 7.36 MB MP4.",
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
        ["33", "Visibly softer; blocking shows on fast motion and dark scenes", "Use 33 when you can accept more visible compression in exchange for a smaller file. For a cap in MB, use the size recipe."],
      ],
      note:
        "Because the target is quality, the same level gives a small file for a static screen recording and a large one for handheld footage of moving leaves. Two clips at level 28 can differ several times over.",
    },
    {
      id: "size",
      title: "What you actually get",
      lead:
        "These are CRF measurements on two 20-second 1080p30 clips. One has smooth gradients and the other has fine detail. Both file sizes and bitrates are specific to those clips.",
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
        "This table applies to the CRF preset. The preset re-encodes the video while keeping its resolution.",
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
      h: "No cloud uploads.",
      p: "MediaChef compresses the video on your computer. The original and the compressed file stay on your device.",
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
      p: "If you only need one part, use “Trim video without re-encoding” first. It copies the selected data without re-encoding. Compress the shorter clip if it is still too large.",
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
      a: "The size reduction depends on the source and its duration. At CRF 28, the two clips in the table came out at 11.0 and 6.4 MB. Use the target-size recipe if the result must fit a limit in MB.",
    },
    {
      q: "What does the number 23, 28 or 33 mean?",
      a: "It is the H.264 constant rate factor: a quality target where lower is better. The encoder spends whatever bitrate is needed to hit that quality on your footage. That is why the same level gives very different sizes for a static screen recording and for handheld camera work.",
    },
    {
      q: "Which level should I choose?",
      a: "Start at 28 for everyday use. Try 23 for more detail or 33 for a smaller file with more visible compression. For a fixed cap, use “Compress video to a file size”, enter the limit in MB and check the result.",
    },
    {
      q: "Why did compressing make my file bigger?",
      a: "Because you asked for a higher quality than the file already had. We measured this: a 1.66 Mbit/s file came out 2.7× bigger at level 23 and 1.5× bigger at level 28. If a file is already low-bitrate, compressing it further only removes quality — check what you have before running the recipe.",
    },
    {
      q: "Does it change the resolution?",
      a: "The quality preset keeps the resolution. When the target is in MB, MediaChef may reduce the resolution to fit the available bitrate.",
    },
    {
      q: "What happens to the sound?",
      a: "The quality preset encodes audio as AAC at 128 kbps. The target-size recipe can use a lower audio bitrate for a tight limit. Keep the source if you need its original audio.",
    },
    {
      q: "Is the original file overwritten?",
      a: "Both recipes keep the source and write a new MP4. The queue shows the output path.",
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
      a: "A second pass can make the file smaller or larger and can reduce picture quality further. If the first result is too large, run the size recipe on the original.",
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
