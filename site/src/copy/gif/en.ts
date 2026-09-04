// Гайд «видео в GIF», английский. Эталон формы для остальных девяти языков.
//
// Цифры в таблицах — наши измерения, не оценки: ролик 1280×720, 25 fps, 10 с
// с движением по всему кадру, прогнанный тем же рецептом, что в программе.
// Скрипты измерения — в истории задачи; повторяются одной командой ffmpeg.
import { FACTS } from "../../facts";

export default {
  title: "Video to GIF — free, offline converter for macOS, Windows, Linux",
  description:
    "Turn any video into an animated GIF on your own computer: pick frame rate and width, press start. No upload, no size limit, no watermark. Measured file sizes for every setting inside.",
  h1: "Video to GIF, on your own computer",
  crumb: "Video to GIF",

  // Прямой ответ, первые сто слов страницы. Дальше — подробности, но человек,
  // пришедший за одним фактом, получает его здесь и может уйти.
  answer:
    "Drop the video into MediaChef, pick the “Video to GIF” recipe, choose a frame rate and a width, then press start. The GIF appears next to the original file. Nothing is uploaded — FFmpeg runs on your machine, so there is no file-size cap and no queue. At the default 15 frames per second and 480 pixels wide, a GIF costs about 130 KB per second of video: ten seconds comes out at roughly 1.3 MB.",

  facts: [
    { k: "What you need", v: `MediaChef ${FACTS.version} — one download, FFmpeg is already inside` },
    { k: "Works offline", v: "Yes, completely — the network is never touched" },
    { k: "Input formats", v: "MP4, MKV, MOV, WebM, AVI, TS and anything else FFmpeg reads" },
    { k: "Settings", v: "Frame rate 10 / 15 / 24 · width 320 / 480 / 640 px" },
    { k: "Output", v: "clip.gif, written next to the source video" },
    { k: "Cost", v: "Free, open source (GPL-3.0), no account, no watermark" },
  ],

  toc: [
    { id: "how", label: "How to do it" },
    { id: "fps", label: "Which frame rate" },
    { id: "width", label: "Which width" },
    { id: "size", label: "How big the file will be" },
    { id: "duration", label: "How length changes the size" },
    { id: "why", label: "Why convert locally" },
    { id: "notfor", label: "When a GIF is the wrong answer" },
    { id: "faq", label: "Questions" },
  ],

  stepsTitle: "How to turn a video into a GIF",
  steps: [
    {
      h: "Download MediaChef",
      p: "One file for macOS, Windows or Linux. FFmpeg ships inside the download — nothing to install separately, nothing to add to PATH.",
    },
    {
      h: "Drop the video on the board",
      p: "MediaChef reads the file with ffprobe and shows only the recipes that fit it. Any video gets the GIF card; the source format does not matter.",
    },
    {
      h: "Pick “Video to GIF”",
      p: "Two settings: frames per second and width in pixels. The height follows the width so the proportions stay intact — a 16:9 clip at 480 px comes out 480×270.",
    },
    {
      h: "Press start and take the file",
      p: "The GIF lands next to the video as clip.gif. The queue shows progress and the finished path; drop several videos at once and they run one after another.",
    },
  ],
  shotAlt:
    "MediaChef ready to convert: the board waits for a video file, the job queue is on the right.",
  shotCaption: "The board a video goes onto. Recipes appear once MediaChef has read the file.",

  tables: [
    {
      id: "fps",
      title: "Which frame rate to pick",
      lead:
        "Frames per second decides how smooth the motion looks and, in direct proportion, how heavy the file is. A GIF stores every frame almost independently, so doubling the frame rate roughly doubles the size.",
      head: ["Frames/s", "Looks like", "Pick it when"],
      rows: [
        ["10", "Visibly stepped on fast motion, fine on slow", "Screen recordings, a cursor moving, text appearing. The smallest file."],
        ["15", "Smooth enough for almost anything", "The default. Reaction clips, short scenes, anything you are unsure about."],
        ["24", "Film-like, no visible stepping", "Fast motion, sport, camera pans — and only when the size is acceptable."],
      ],
      note:
        "The frame count is exact: frames = frame rate × seconds. Ten seconds at 15 fps is 150 frames, at 24 fps it is 240.",
    },
    {
      id: "width",
      title: "Which width to pick",
      lead:
        "You set the width; the height is calculated to keep the aspect ratio, and scaling uses the Lanczos filter. The numbers below are what a 16:9 video comes out as.",
      head: ["Width", "16:9 becomes", "Pick it when"],
      rows: [
        ["320 px", "320×180", "Chat and messengers, where a GIF is shown small anyway. Roughly half the size of 480."],
        ["480 px", "480×270", "The default. Readable in a post or a message, still light."],
        ["640 px", "640×360", "When detail matters — a UI demo, small text on screen. Roughly 1.5× the size of 480."],
      ],
      note:
        "Nothing is upscaled: a 320-pixel-wide source stays 320 wide even if you ask for 640.",
    },
    {
      id: "size",
      title: "How big the file will be",
      lead:
        "Measured, not estimated: ten seconds of 1280×720 footage with movement across the whole frame, run through this exact recipe. Calm footage compresses better, busy footage worse — treat these as the upper half of the range.",
      head: ["Frames/s", "320 px", "480 px", "640 px"],
      rows: [
        ["10", "0.45 MB", "0.88 MB", "1.36 MB"],
        ["15", "0.65 MB", "1.28 MB", "1.98 MB"],
        ["24", "0.98 MB", "1.96 MB", "3.05 MB"],
      ],
      note:
        "The cheapest and the most expensive setting differ by almost seven times, and both are two clicks apart. If a GIF comes out too heavy, drop the width first — it costs less in perceived quality than dropping the frame rate.",
    },
    {
      id: "duration",
      title: "How length changes the size",
      lead:
        "Growth is linear, because every second adds its own frames. At the default settings — 15 fps, 480 px — one second costs about 130 KB, and that figure barely moves with length.",
      head: ["Length", "Size at defaults", "Per second"],
      rows: [
        ["3 s", "0.37 MB", "128 KB"],
        ["5 s", "0.64 MB", "131 KB"],
        ["10 s", "1.28 MB", "131 KB"],
        ["20 s", "2.56 MB", "131 KB"],
        ["30 s", "3.82 MB", "130 KB"],
      ],
      note:
        "So the length is your strongest lever: trimming a clip from thirty seconds to eight cuts the file by roughly four times, and no setting change comes close to that.",
    },
  ],

  whyTitle: "Why convert on your own computer",
  whyBullets: [
    {
      h: "Nothing is uploaded.",
      p: "An unreleased edit, a recording of a private call, a screen capture with a client's data — none of it leaves the disk. There is no copy on a server whose retention policy you would have to trust.",
    },
    {
      h: "No size limit.",
      p: "Online converters stop between 100 MB and 2 GB and put you in a queue. A four-gigabyte screen recording converts the same way a four-megabyte one does.",
    },
    {
      h: "No waiting for an upload.",
      p: "Making the GIF is quick; on a web service the slow part is sending the video there first. Locally that step does not exist.",
    },
    {
      h: "Free, no account, no watermark.",
      p: "Open source under GPL-3.0: no sign-up, no trial, nothing stamped into the corner of your GIF.",
    },
    {
      h: "Several at once.",
      p: "Drop a whole folder of clips; the queue works through them and tells you where each GIF landed.",
    },
  ],

  notForTitle: "When a GIF is the wrong answer",
  notForLead:
    "GIF is a picture format from 1987 doing a job video formats do better. It is worth choosing deliberately, and here is when not to.",
  notFor: [
    {
      h: "You need sound.",
      p: "A GIF has no audio track at all — the format has no place to put one. If the clip needs sound, keep it a video.",
    },
    {
      h: "You need accurate colour.",
      p: "A GIF frame holds at most 256 colours. Gradients, skin tones and dark scenes visibly band. Photographic footage suffers most; flat UI and cartoons barely notice.",
    },
    {
      h: "The clip is long.",
      p: "At 130 KB per second, a two-minute GIF is around 16 MB. The same clip as MP4 is usually several times smaller and looks better.",
    },
    {
      h: "It is going somewhere that re-encodes it anyway.",
      p: "Several chat and social platforms convert an uploaded GIF into a video on their side. Where that happens you paid GIF's size penalty for nothing.",
    },
  ],

  faqTitle: "Questions",
  faq: [
    {
      q: "How long can the GIF be?",
      a: "MediaChef sets no limit — the limit is your disk, and the app checks free space before it starts. The practical limit is size: at the default settings every second costs about 130 KB, so a one-minute GIF is roughly 8 MB and a five-minute one around 39 MB. Trim the clip first if it is going into a message.",
    },
    {
      q: "Why is my GIF bigger than the video it came from?",
      a: "Because GIF stores frames almost independently, while MP4 stores the difference between them. On real footage that makes MP4 several times smaller for the same picture. It is not something MediaChef can fix — it is what the format is.",
    },
    {
      q: "Does a GIF have sound?",
      a: "No. The GIF format has no audio track, so the sound is dropped when you convert. If you need the sound as a separate file, use the “Extract audio to MP3” recipe on the original video.",
    },
    {
      q: "Why do the colours look worse than in the video?",
      a: "A GIF frame can hold at most 256 colours, and video holds millions. Smooth gradients — a sky, a fade, a dark scene — turn into visible bands. Screen recordings and flat graphics lose almost nothing, because they had few colours to begin with.",
    },
    {
      q: "Can I make a GIF out of just one part of the video?",
      a: "Yes, in two steps: run the “Trim without re-encoding” recipe to cut the fragment you want, then make the GIF from the piece. Trimming first is also the cheapest way to make the GIF smaller — length affects size more than any setting.",
    },
    {
      q: "Which frame rate and width should I choose?",
      a: "Start with the defaults, 15 fps and 480 px: readable in a post, about 1.3 MB for ten seconds. Drop to 320 px if the file must be small; go to 640 px when small text has to stay legible. Use 24 fps only for fast motion, and 10 fps for screen recordings, where stepping is hard to notice.",
    },
    {
      q: "How do I make the GIF smaller?",
      a: "In this order: shorten the clip, then reduce the width, then reduce the frame rate. Length is linear, so cutting thirty seconds to eight saves about four times. Going from 640 to 320 px saves roughly three times. Dropping 24 fps to 15 saves a third but is the most visible change.",
    },
    {
      q: "Is there a watermark or a paid version?",
      a: "No. MediaChef is open source under GPL-3.0, with no paid tier at all, and it writes nothing into the picture beyond the conversion you asked for.",
    },
    {
      q: "Does it work without internet?",
      a: "Yes, completely. FFmpeg travels inside the download, so making a GIF never touches the network. Only transcription needs a one-time model download, and that is a different recipe.",
    },
    {
      q: "Which video formats can I convert from?",
      a: "Anything FFmpeg can read: MP4, MKV, MOV, WebM, AVI, TS, FLV, WMV and the rest. MediaChef checks the file with ffprobe and offers the GIF recipe for any video that has a picture track.",
    },
    {
      q: "Can I convert several videos in one go?",
      a: "Yes. Drop them all on the board, add the recipe, and the queue runs them one after another with progress and the remaining time for each.",
    },
    {
      q: "Does the GIF loop?",
      a: "Yes — GIFs written this way loop endlessly, which is how every viewer and browser will play them.",
    },
    {
      q: "Can a GIF have a transparent background?",
      a: "The format supports one transparent colour, but converting an ordinary video gives it nothing to be transparent about: video frames are fully opaque. Transparency only makes sense for material that already had it.",
    },
    {
      q: "Does it run on Windows and Linux, or only macOS?",
      a: "All three. There is an installer for Windows, an AppImage and a .deb for Linux, and a DMG for macOS on Apple Silicon. The recipe and the settings are identical everywhere.",
    },
  ],

  ctaTitle: "Make a GIF out of that clip",
  ctaSub: `MediaChef ${FACTS.version} — free, open source, macOS · Windows · Linux.`,
  also: [
    { page: "mp3", label: "Convert MP4 to MP3 — free and offline" },
    { page: "transcribe", label: "Transcribe audio to text with Whisper, offline" },
    { page: "catalog", label: `All ${FACTS.recipeCount} recipes, category by category` },
  ],
} as const;
