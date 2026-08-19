//! whisper.cpp-specific layer over [`crate::process`]: decode anything ffmpeg
//! can read into the 16kHz mono WAV whisper insists on, run `whisper-cli` over
//! it, and land the subtitle/text file at the caller's chosen path.
//!
//! Both children write into a tempdir, so a run that dies part-way leaves nothing
//! behind. The caller's output path is never opened for writing at all — it is
//! only ever the destination of a rename from an already-finished file, so no
//! failure anywhere in the run can truncate what an earlier run put there.

use crate::process::{run_streaming, CancelToken, Pipe};
use crate::runner::{Outcome, RunError};
use std::path::{Path, PathBuf};

/// How many trailing stderr lines are kept for `RunError::stderr_tail`. Matches
/// [`crate::runner`]; whisper spends ~27 of them on backend-load chatter before
/// it ever reaches a real complaint, so the window has to be generous.
const STDERR_TAIL_LINES: usize = 60;

/// The message a run that heard no speech fails with.
///
/// A wire contract in two directions, which is why it is a constant and not a
/// literal at the `return`: [`crate::errors::humanize`] turns the `no_speech:`
/// marker into an English sentence, and the frontend's queue panel watches for the
/// same word to swap that sentence for the user's own language. The prose after the
/// colon is for the "Copy log" button.
pub const NO_SPEECH: &str = "no_speech: nothing recognisable in the audio";

/// How much of a produced transcript [`is_empty_transcript`] reads before it gives
/// up and calls the file a transcript whatever is in it.
///
/// A read *cap*, not a size gate — and that distinction is a bug that shipped. The
/// first version of this took a file longer than the window to have words in it by
/// length alone, on the measurement that whisper's no-speech output is a handful of
/// bytes. True for a tone, false for digital silence: there the model writes one
/// ` [BLANK_AUDIO]` cue per chunk, which is 48 bytes of srt for five seconds of it
/// and 288 for three minutes (both measured). Length therefore says nothing, and the
/// head is classified instead — see [`line_has_words`].
///
/// 256KiB is sized by the least generous of the four formats. A blank json segment
/// costs ~173 bytes, so the window holds ~1500 of them: about twelve hours of
/// unbroken silence, against ~45h for srt/vtt (~48 B a cue) and ~156h for txt
/// (14 B a line). Past the cap the answer is "not empty" like every other question
/// this cannot settle — the file is kept, never deleted on a guess.
const EMPTY_PROBE_BYTES: u64 = 256 * 1024;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WhisperFormat {
    Txt,
    Srt,
    Vtt,
    Json,
}

impl WhisperFormat {
    pub fn from_ext(ext: &str) -> Option<Self> {
        match ext {
            "txt" => Some(Self::Txt),
            "srt" => Some(Self::Srt),
            "vtt" => Some(Self::Vtt),
            "json" => Some(Self::Json),
            _ => None,
        }
    }
    pub fn flag(&self) -> &'static str {
        match self {
            Self::Txt => "--output-txt",
            Self::Srt => "--output-srt",
            Self::Vtt => "--output-vtt",
            Self::Json => "--output-json",
        }
    }
    pub fn ext(&self) -> &'static str {
        match self {
            Self::Txt => "txt",
            Self::Srt => "srt",
            Self::Vtt => "vtt",
            Self::Json => "json",
        }
    }
}

#[derive(Debug, Clone)]
pub struct WhisperJob {
    pub input: PathBuf,
    pub output: PathBuf,
    pub model: PathBuf,
    pub language: String,
    pub translate: bool,
    pub format: WhisperFormat,
}

/// Pulls the percentage out of whisper's progress log line, which looks like
/// `whisper_print_progress_callback: progress =  51%` — the number is right-
/// aligned to width 3, hence the `trim_start`.
///
/// Anything else — transcript lines, backend chatter — yields `None`.
pub(crate) fn parse_whisper_progress(line: &str) -> Option<f32> {
    let idx = line.find("progress")?;
    let rest = &line[idx..];
    let eq = rest.find('=')?;
    let num: String = rest[eq + 1..]
        .trim_start()
        .chars()
        .take_while(|c| c.is_ascii_digit())
        .collect();
    let v: f32 = num.parse().ok()?;
    Some(v.clamp(0.0, 100.0))
}

fn err(message: impl Into<String>, tail: &[String]) -> RunError {
    RunError {
        message: message.into(),
        stderr_tail: tail.join("\n"),
    }
}

/// Where the finished transcript is staged before it takes the caller's path.
///
/// A *sibling* of `output`, so it lands on the same volume and the final
/// [`std::fs::rename`] is an atomic swap — the caller's path is never opened for
/// writing, so no failure mid-delivery (a yanked external drive, a full disk) can
/// truncate a transcript an earlier run left there.
fn part_path(output: &Path, format: WhisperFormat) -> PathBuf {
    output.with_extension(format!("{}.part", format.ext()))
}

/// At most [`EMPTY_PROBE_BYTES`] from the head of `path`.
///
/// `None` for a file that cannot be opened or read, and for one whose head is not
/// UTF-8 — which includes the harmless case of the cap falling inside a multi-byte
/// character. Every `None` reaches the caller as "not empty", so a cut in the middle
/// of a Cyrillic word costs the user a delivered transcript rather than a deleted
/// one.
fn probe_head(path: &Path) -> Option<String> {
    use std::io::Read;
    let mut text = String::new();
    std::fs::File::open(path)
        .ok()?
        .take(EMPTY_PROBE_BYTES)
        .read_to_string(&mut text)
        .ok()?;
    Some(text)
}

/// `line` with every non-speech marker taken out of it: whisper writes those as a
/// shouty bracketed token — ` [BLANK_AUDIO]` on silence, `[MUSIC]`, `[INAUDIBLE]` —
/// and a line that is nothing but those is not a word the user asked for.
///
/// Only ALL-CAPS bodies count (letters, digits, `_`, spaces, hyphens, at least one
/// letter), which is deliberately narrower than every annotation a whisper model can
/// emit: a mixed-case `[Music]` is left standing and its file delivered. That is the
/// safe half of the trade — the caller *deletes* what this helps call empty, so a
/// marker table that is too eager loses somebody's transcript, while one that is too
/// shy only delivers a file with a bracket in it.
fn without_markers(line: &str) -> String {
    fn is_marker_body(s: &str) -> bool {
        !s.is_empty()
            && s.chars().any(|c| c.is_ascii_uppercase())
            && s.chars()
                .all(|c| c.is_ascii_uppercase() || c.is_ascii_digit() || " _-".contains(c))
    }
    let mut out = String::with_capacity(line.len());
    let mut rest = line;
    while let Some(open) = rest.find('[') {
        let (before, from_open) = rest.split_at(open);
        // An unclosed `[` is not a marker. `rest` is left as it was, so the tail —
        // `before` included — goes out whole in the push below the loop.
        let Some(close) = from_open[1..].find(']').map(|i| i + 1) else {
            break;
        };
        out.push_str(before);
        if !is_marker_body(&from_open[1..close]) {
            out.push_str(&from_open[..=close]);
        }
        rest = &from_open[close + 1..];
    }
    out.push_str(rest);
    out
}

/// Whether one line of a transcript carries anything the user would call speech.
///
/// Everything a format writes about *itself* is not content: a `WEBVTT` header, an
/// srt cue index, a `-->` timestamp line, blank separators. Whisper's own non-speech
/// markers are not content either ([`without_markers`]). What is left over is.
fn line_has_words(line: &str, format: WhisperFormat) -> bool {
    let line = line.trim();
    if line.is_empty() {
        return false;
    }
    if matches!(format, WhisperFormat::Srt | WhisperFormat::Vtt) {
        // The cue scaffolding of both formats: `WEBVTT` (with or without the title
        // the spec allows after it), the index, the timing line.
        if line.starts_with("WEBVTT")
            || line.contains("-->")
            || line.chars().all(|c| c.is_ascii_digit())
        {
            return false;
        }
    }
    !without_markers(line).trim().is_empty()
}

/// True when the transcript at `path` has no words in it — whisper's way of
/// reporting that it heard no speech, which it does by exiting 0 like any other
/// successful run.
///
/// The format is a parameter because "nothing" looks different in each of them, and
/// there are two shapes of it, both measured against whisper.cpp + `ggml-tiny`. On a
/// 440Hz sine the model writes no segments at all:
/// * `txt`, `srt` — zero bytes (and whitespace counts as the same nothing);
/// * `vtt` — the eight bytes of its mandatory `WEBVTT` header, nothing under it;
/// * `json` — ~700 bytes of model and system metadata with an empty
///   `transcription` array.
///
/// On digital silence (`anullsrc`) it writes a ` [BLANK_AUDIO]` segment per chunk
/// instead, which is a *file with contents* — 14 bytes of txt, a 48-byte srt cue, a
/// 54-byte vtt, a json segment whose `text` is ` [BLANK_AUDIO]` — and used to sail
/// through as a transcript, delivering a green "done" over a file with no words in
/// it. Hence the line-by-line reading rather than a whitespace test.
///
/// Anything it cannot read, cannot parse, or is too big to finish reading
/// ([`EMPTY_PROBE_BYTES`]) is reported as **not** empty. The caller deletes what this
/// calls empty and fails the job, so a guess in that direction would destroy a
/// transcript; a guess in the other only delivers a file the user can look at.
fn is_empty_transcript(path: &Path, format: WhisperFormat) -> bool {
    let Ok(meta) = std::fs::metadata(path) else {
        return false;
    };
    if meta.len() == 0 {
        return true;
    }
    if matches!(format, WhisperFormat::Json) {
        return json_has_no_speech(path);
    }
    let Some(head) = probe_head(path) else {
        return false; // unreadable, or not UTF-8: whisper did write something
    };
    if head.lines().any(|l| line_has_words(l, format)) {
        return false;
    }
    // Nothing but scaffolding and markers in what was read — which is the whole file
    // only when the whole file fits in the window. Past it this has read a head, not
    // a file, and a tail it never saw may hold the speech (see EMPTY_PROBE_BYTES).
    meta.len() <= EMPTY_PROBE_BYTES
}

/// The json half of [`is_empty_transcript`]: whisper always writes its metadata, so
/// emptiness lives in the `transcription` array — either it is empty, or every
/// segment in it is nothing but non-speech markers.
///
/// A file that does not parse, or whose shape this build has never seen (no
/// `transcription` key, a segment without a string `text`), is not called empty —
/// same reasoning as above. A json past the read cap does not parse either, so it
/// lands in the same place.
fn json_has_no_speech(path: &Path) -> bool {
    let Some(text) = probe_head(path) else {
        return false;
    };
    let Ok(v) = serde_json::from_str::<serde_json::Value>(&text) else {
        return false;
    };
    let Some(serde_json::Value::Array(segments)) = v.get("transcription") else {
        return false;
    };
    // `all` over an empty array is the sine case: no segments, nothing heard.
    segments.iter().all(|s| match s.get("text") {
        Some(serde_json::Value::String(t)) => without_markers(t).trim().is_empty(),
        _ => false,
    })
}

fn push_tail(tail: &mut Vec<String>, line: &str) {
    if tail.len() >= STDERR_TAIL_LINES {
        tail.remove(0);
    }
    tail.push(line.to_string());
}

/// Transcribes `job.input` into `job.output`.
///
/// Progress is split across the two children: 0–10% is the WAV decode, 10–100%
/// is whisper's own `progress = N%`. Note that whisper reports coarsely — one
/// line per decoded chunk, so a short clip may only ever report 100%.
pub fn run_whisper(
    ffmpeg: &Path,
    whisper: &Path,
    job: &WhisperJob,
    cancel: &CancelToken,
    mut on_progress: impl FnMut(f32),
) -> Result<Outcome, RunError> {
    let tmp = tempfile::tempdir().map_err(|e| err(format!("tempdir: {e}"), &[]))?;
    let wav = tmp.path().join("audio16k.wav");

    // Шаг 1: любой вход -> WAV 16k mono (0..10%)
    let prep_argv: Vec<String> = ["-hide_banner", "-nostats", "-v", "error", "-y", "-i"]
        .iter()
        .map(|s| s.to_string())
        .chain([
            job.input.display().to_string(),
            "-ar".into(),
            "16000".into(),
            "-ac".into(),
            "1".into(),
            "-c:a".into(),
            "pcm_s16le".into(),
            wav.display().to_string(),
        ])
        .collect();
    let mut prep_tail: Vec<String> = Vec::new();
    let prep = run_streaming(ffmpeg, &prep_argv, cancel, |pipe, line| {
        if pipe == Pipe::Stderr {
            push_tail(&mut prep_tail, line);
        }
    });
    // Spawn and Wait land in the same place: neither can have written anything of
    // the caller's, and the tempdir takes any half-decoded WAV with it.
    let prep = prep.map_err(|e| err(e.to_string(), &prep_tail))?;
    if prep.cancelled {
        return Ok(Outcome::Cancelled);
    }
    if !prep.success {
        return Err(err("audio preparation failed (ffmpeg)", &prep_tail));
    }
    on_progress(10.0);

    // Шаг 2: whisper-cli (10..100%)
    let out_prefix = tmp.path().join("result");
    let mut argv: Vec<String> = vec![
        "-m".into(),
        job.model.display().to_string(),
        "-f".into(),
        wav.display().to_string(),
        "-l".into(),
        job.language.clone(),
        "--print-progress".into(),
        job.format.flag().into(),
        "--output-file".into(),
        out_prefix.display().to_string(),
    ];
    if job.translate {
        argv.push("--translate".into());
    }
    let mut tail: Vec<String> = Vec::new();
    let exit = run_streaming(whisper, &argv, cancel, |pipe, line| {
        if let Some(p) = parse_whisper_progress(line) {
            on_progress(10.0 + p * 0.9);
        }
        if pipe == Pipe::Stderr {
            push_tail(&mut tail, line);
        }
    });
    // Tagged with the binary that failed, unlike the prep step above: a bare
    // `spawn: No such file or directory` is humanized as "FFmpeg binary not
    // found", which for THIS spawn would send the user to the wrong Homebrew
    // formula. `whisper spawn: ` has its own arm in `errors`.
    let exit = exit.map_err(|e| err(format!("whisper {e}"), &tail))?;
    // No cleanup of `job.output` on either exit: whisper writes only under
    // `out_prefix` in the tempdir, so a file at the caller's path is somebody
    // else's — deleting it would destroy an earlier good transcript.
    if exit.cancelled {
        return Ok(Outcome::Cancelled);
    }
    if !exit.success {
        return Err(err(
            match exit.code {
                Some(c) => format!("whisper exited with code {c}"),
                None => "whisper exited on a signal".to_string(),
            },
            &tail,
        ));
    }

    // A cancel can land between whisper's clean exit and the delivery below. The
    // user asked for the job to stop, so it must stop — not quietly finish and
    // drop a new file at the output path.
    if cancel.is_cancelled() {
        return Ok(Outcome::Cancelled);
    }

    // Шаг 3: перенос результата на планируемый путь
    let produced = tmp.path().join(format!("result.{}", job.format.ext()));
    if !produced.exists() {
        return Err(err(
            format!("whisper produced no {} output", job.format.ext()),
            &tail,
        ));
    }
    // A run over a sine wave, a silent track or music-only audio ends exactly like
    // a good one: exit 0, a file at `out_prefix`, no words in it. Delivering that
    // would put a green "done" and a "Show in Finder" button on an empty file, so
    // the empty produce is dropped here and the job fails with a marker the UI can
    // say in the user's own language (Ruling W3-3).
    //
    // The removal is belt-and-braces — `tmp` is a tempdir and takes its contents
    // with it — but it keeps the invariant local: nothing this function decides is
    // empty is left for a later step to find and deliver.
    if is_empty_transcript(&produced, job.format) {
        let _ = std::fs::remove_file(&produced);
        return Err(err(NO_SPEECH, &tail));
    }
    if let Some(parent) = job.output.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| err(format!("create output dir: {e}"), &tail))?;
    }
    // rename может не пройти между томами (tmp -> пользовательская папка).
    if std::fs::rename(&produced, &job.output).is_err() {
        // Cross-volume, so the bytes have to be copied. They go to a sibling of
        // the output first and are renamed into place: copying straight onto
        // `job.output` would truncate it up front, and a copy that then died
        // half-way — external drive unplugged, disk full — would have destroyed
        // the transcript an earlier run left there. Only the sibling is ever
        // cleaned up; `job.output` is never touched except by the atomic rename.
        let part = part_path(&job.output, job.format);
        if let Err(e) = std::fs::copy(&produced, &part) {
            let _ = std::fs::remove_file(&part);
            return Err(err(format!("copy result: {e}"), &tail));
        }
        if let Err(e) = std::fs::rename(&part, &job.output) {
            let _ = std::fs::remove_file(&part);
            return Err(err(format!("place result: {e}"), &tail));
        }
    }
    on_progress(100.0);
    Ok(Outcome::Done)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn format_mapping() {
        assert!(matches!(
            WhisperFormat::from_ext("srt"),
            Some(WhisperFormat::Srt)
        ));
        assert!(WhisperFormat::from_ext("doc").is_none());
        assert_eq!(WhisperFormat::Txt.flag(), "--output-txt");
        assert_eq!(WhisperFormat::Json.ext(), "json");
    }

    #[test]
    fn parses_whisper_progress_lines() {
        assert_eq!(
            parse_whisper_progress("whisper_print_progress_callback: progress =  15%"),
            Some(15.0)
        );
        assert_eq!(parse_whisper_progress("progress = 100%"), Some(100.0));
        assert_eq!(
            parse_whisper_progress("[00:00:00.000 --> 00:00:02.000]  hello"),
            None
        );
    }

    /// The staging file must be a *sibling* of the output — same directory means
    /// same volume, which is what makes the final rename atomic. Pins the naming
    /// so a refactor cannot quietly move it to a tempdir and reintroduce the
    /// cross-volume truncation this pattern exists to prevent.
    #[test]
    fn part_path_is_a_sibling_of_the_output() {
        let out = Path::new("/x/a.transcript.srt");
        let part = part_path(out, WhisperFormat::Srt);
        assert_eq!(part, Path::new("/x/a.transcript.srt.part"));
        assert_eq!(part.parent(), out.parent(), "must stay on the same volume");
        assert_ne!(part, out, "must never be the output path itself");

        // Output extension need not match the format; the sibling rule still holds.
        let odd = Path::new("/x/y/note.txt");
        let part = part_path(odd, WhisperFormat::Json);
        assert_eq!(part, Path::new("/x/y/note.json.part"));
        assert_eq!(part.parent(), odd.parent());

        // No extension at all.
        assert_eq!(
            part_path(Path::new("/x/plain"), WhisperFormat::Vtt),
            Path::new("/x/plain.vtt.part")
        );
    }

    // Интеграционный: требует whisper-cli + модель tiny + fixtures/speech.wav.
    // Запускается ЯВНО (cargo test -- --ignored) локально и в macos-CI.
    #[test]
    #[ignore]
    fn transcribes_speech_fixture_end_to_end() {
        let ffmpeg = crate::locate::ffmpeg().expect("ffmpeg");
        let whisper = crate::locate::whisper().expect("whisper-cli (brew install whisper-cpp)");
        let models_dir = std::env::var("MEDIACHEF_MODELS_DIR")
            .map(std::path::PathBuf::from)
            .expect("set MEDIACHEF_MODELS_DIR with ggml-tiny.bin present");
        let model = crate::models::model_path(&models_dir, "tiny").expect("ggml-tiny.bin missing");
        let dir = tempfile::tempdir().unwrap();
        let out = dir.path().join("speech.transcript.txt");
        let job = WhisperJob {
            input: std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
                .join("../../fixtures/speech.wav"),
            output: out.clone(),
            model,
            language: "auto".into(),
            translate: false,
            format: WhisperFormat::Txt,
        };
        let mut last = 0.0f32;
        let r = run_whisper(
            &ffmpeg,
            &whisper,
            &job,
            &crate::process::CancelToken::new(),
            |p| last = p,
        )
        .unwrap();
        assert!(matches!(r, crate::runner::Outcome::Done));
        let text = std::fs::read_to_string(&out).unwrap().to_lowercase();
        assert!(!text.trim().is_empty(), "transcript empty");
        assert!(
            text.contains("test") || text.contains("hello"),
            "unexpected transcript: {text}"
        );
        assert_eq!(last, 100.0);
    }

    /// Writes `bytes` to `dir/name` and hands back the path.
    fn file(dir: &Path, name: &str, bytes: &[u8]) -> PathBuf {
        let p = dir.join(name);
        std::fs::write(&p, bytes).unwrap();
        p
    }

    /// whisper's json for a run that heard nothing: all metadata, no segments.
    /// Trimmed from a real `--output-json` of 2s of a 440Hz sine (688 bytes).
    const EMPTY_JSON: &str = r#"{
    "systeminfo": "WHISPER : COREML = 0 | OPENVINO = 0 | METAL = 1",
    "model": {"type": "tiny", "multilingual": true},
    "params": {"model": "ggml-tiny.bin", "language": "auto"},
    "result": {"language": "nn"},
    "transcription": []
}"#;

    /// The no-speech detector, against the nothing each format actually writes —
    /// measured, not assumed: whisper exits 0 having heard no words and leaves
    /// behind an empty txt/srt, a bare `WEBVTT` header, or a json skeleton with an
    /// empty `transcription`. Delivering any of those would put a green "done" on
    /// a file with no words in it.
    #[test]
    fn empty_transcript_is_the_nothing_each_format_writes() {
        let d = tempfile::tempdir().unwrap();
        let dir = d.path();
        use WhisperFormat::*;

        // txt / srt: whisper writes nothing at all.
        assert!(is_empty_transcript(&file(dir, "a.txt", b""), Txt));
        assert!(is_empty_transcript(&file(dir, "a.srt", b""), Srt));
        // …and whitespace is the same nothing, whichever shape it takes.
        assert!(is_empty_transcript(&file(dir, "n.txt", b"\n"), Txt));
        assert!(is_empty_transcript(&file(dir, "w.txt", b" \r\n\t \n"), Txt));

        // vtt is never zero bytes: the header is mandatory, so THIS is its silence.
        assert!(is_empty_transcript(&file(dir, "e.vtt", b"WEBVTT\n\n"), Vtt));

        // json is never zero bytes either — it carries the model metadata whatever
        // happened — so the segments are the question.
        assert!(is_empty_transcript(
            &file(dir, "e.json", EMPTY_JSON.as_bytes()),
            Json
        ));

        // And the other side: anything with a word in it is a transcript.
        assert!(!is_empty_transcript(
            &file(dir, "t.txt", b" Hello world test.\n"),
            Txt
        ));
        assert!(!is_empty_transcript(&file(dir, "one.txt", b"a"), Txt));
        assert!(!is_empty_transcript(
            &file(
                dir,
                "c.srt",
                b"1\n00:00:00,000 --> 00:00:02,000\n hello\n\n"
            ),
            Srt
        ));
        assert!(!is_empty_transcript(
            &file(
                dir,
                "c.vtt",
                b"WEBVTT\n\n00:00:00.000 --> 00:00:02.000\n hello\n\n"
            ),
            Vtt
        ));
        assert!(!is_empty_transcript(
            &file(
                dir,
                "t.json",
                br#"{"transcription": [{"text": " Hello world."}]}"#
            ),
            Json
        ));
    }

    /// whisper's json for digital silence: one segment per chunk whose text is the
    /// blank marker. Trimmed from a real `--output-json` of 5s of `anullsrc`
    /// (855 bytes), where the metadata above `transcription` is the same skeleton as
    /// [`EMPTY_JSON`]'s.
    const BLANK_JSON: &str = r#"{
    "systeminfo": "WHISPER : COREML = 0 | OPENVINO = 0 | METAL = 1",
    "model": {"type": "tiny", "multilingual": true},
    "result": {"language": "en"},
    "transcription": [
        {
            "timestamps": {"from": "00:00:00,000", "to": "00:00:10,000"},
            "offsets": {"from": 0, "to": 10000},
            "text": " [BLANK_AUDIO]"
        }
    ]
}"#;

    /// The *other* nothing, and the one that shipped broken: on true digital silence
    /// whisper does not write an empty file, it writes ` [BLANK_AUDIO]` — one segment
    /// per 30s chunk, exit 0, all four formats. Every byte count below is measured
    /// from whisper.cpp + `ggml-tiny` over `anullsrc` (5s, and 180s for the multi-cue
    /// shapes), which is exactly what the old whitespace test called a transcript:
    /// four green "done"s over files with no words in them.
    #[test]
    fn blank_audio_markers_are_no_speech_too() {
        let d = tempfile::tempdir().unwrap();
        let dir = d.path();
        use WhisperFormat::*;

        // 5s of silence, verbatim: txt is 14 bytes, srt one cue, vtt header + cue.
        let txt = file(dir, "b.txt", b"[BLANK_AUDIO]\n");
        assert_eq!(std::fs::metadata(&txt).unwrap().len(), 14);
        assert!(is_empty_transcript(&txt, Txt));
        assert!(is_empty_transcript(
            &file(
                dir,
                "b.srt",
                b"1\n00:00:00,000 --> 00:00:10,000\n [BLANK_AUDIO]\n\n"
            ),
            Srt
        ));
        assert!(is_empty_transcript(
            &file(
                dir,
                "b.vtt",
                b"WEBVTT\n\n00:00:00.000 --> 00:00:10.000\n [BLANK_AUDIO]\n\n"
            ),
            Vtt
        ));
        assert!(is_empty_transcript(
            &file(dir, "b.json", BLANK_JSON.as_bytes()),
            Json
        ));

        // Three minutes of it: six cues, 288 bytes of srt — four times the 64-byte
        // window the first version of this stopped reading at, which is the specific
        // way a long silent file used to ship as done.
        let cue = |i: u32| format!("{i}\n00:0{i}:00,000 --> 00:0{i}:10,000\n [BLANK_AUDIO]\n\n");
        let long_srt: String = (1..=6).map(cue).collect();
        assert!(
            long_srt.len() > 64,
            "the fixture must outgrow the old window"
        );
        assert!(is_empty_transcript(
            &file(dir, "long.srt", long_srt.as_bytes()),
            Srt
        ));
        assert!(is_empty_transcript(
            &file(dir, "long.txt", &b"[BLANK_AUDIO]\n".repeat(6)),
            Txt
        ));

        // The other markers a whisper model reaches for on non-speech audio.
        assert!(is_empty_transcript(
            &file(dir, "m.txt", b"[MUSIC]\n [SOUND]\n[INAUDIBLE]\n"),
            Txt
        ));

        // …and the line that matters most: a marker beside real words is a
        // transcript, in every format. Deleting one of these would lose the speech
        // that follows a silent opening.
        assert!(!is_empty_transcript(
            &file(dir, "mix.txt", b"[BLANK_AUDIO]\n Hello world.\n"),
            Txt
        ));
        assert!(!is_empty_transcript(
            &file(
                dir,
                "mix.srt",
                b"1\n00:00:00,000 --> 00:00:10,000\n [BLANK_AUDIO]\n\n\
                  2\n00:00:30,000 --> 00:00:33,000\n Hello world.\n\n"
            ),
            Srt
        ));
        assert!(!is_empty_transcript(
            &file(
                dir,
                "mix.vtt",
                b"WEBVTT\n\n00:00:00.000 --> 00:00:10.000\n [BLANK_AUDIO]\n\n\
                  00:00:30.000 --> 00:00:33.000\n Hello world.\n\n"
            ),
            Vtt
        ));
        assert!(!is_empty_transcript(
            &file(
                dir,
                "mix.json",
                br#"{"transcription": [{"text": " [BLANK_AUDIO]"}, {"text": " Hello world."}]}"#
            ),
            Json
        ));
        // A bracket around ordinary words is not a marker: only the shouty form is,
        // and the doubtful case has to keep the file. Same for a mixed-case
        // annotation, which this deliberately does not claim to know.
        assert!(!is_empty_transcript(
            &file(dir, "bracket.txt", b"[the tape ends here]\n"),
            Txt
        ));
        assert!(!is_empty_transcript(
            &file(dir, "mc.txt", b"[Music]\n"),
            Txt
        ));
    }

    /// The marker stripper on its own, where the awkward inputs are cheap to state.
    /// It runs on every line of every transcript the app produces, so it must not
    /// rewrite prose — and an unclosed bracket must not eat the words before it.
    #[test]
    fn without_markers_takes_only_shouty_brackets() {
        assert_eq!(without_markers(" [BLANK_AUDIO]").trim(), "");
        assert_eq!(without_markers("[MUSIC] [NO SPEECH] [SFX-2]").trim(), "");
        // Prose survives, markers around it do not.
        assert_eq!(
            without_markers("[BLANK_AUDIO] Hello [MUSIC] world.").trim(),
            "Hello  world."
        );
        // Not markers: mixed case, lowercase, no letters at all.
        assert_eq!(without_markers("[Music]"), "[Music]");
        assert_eq!(without_markers("[music]"), "[music]");
        assert_eq!(without_markers("[123]"), "[123]");
        // An unclosed bracket keeps everything, the words before it included.
        assert_eq!(without_markers("Hello [BLANK"), "Hello [BLANK");
        assert_eq!(without_markers("[MUSIC] Hello [BLANK"), " Hello [BLANK");
        // Nothing to do is the common case: a plain line comes back identical.
        assert_eq!(without_markers(" Just words."), " Just words.");
        // Multi-byte text is sliced on char boundaries or not at all.
        assert_eq!(without_markers("[MUSIC] Привет").trim(), "Привет");
        assert_eq!(without_markers("Привет [и ещё]"), "Привет [и ещё]");
    }

    /// The ways the detector must refuse to answer "empty", because the cost of
    /// being wrong is a deleted transcript and a failed job.
    #[test]
    fn empty_transcript_errs_towards_keeping_the_file() {
        let d = tempfile::tempdir().unwrap();
        let dir = d.path();

        // A file that cannot be read at all is not a file we may call empty.
        assert!(!is_empty_transcript(
            &dir.join("was-never-written.txt"),
            WhisperFormat::Txt
        ));

        // A word past a great deal of whitespace is still a word: the head is read
        // and classified line by line, not measured.
        let padded: Vec<u8> = b" ".repeat(80).into_iter().chain(*b"words").collect();
        assert!(!is_empty_transcript(
            &file(dir, "padded.txt", &padded),
            WhisperFormat::Txt
        ));

        // The documented bound: only the first EMPTY_PROBE_BYTES are read, so a file
        // of nothing but markers that outgrows the window is *kept*. Twelve hours of
        // silence to get here (the json bound; ~156h in txt), and the tail this never
        // saw could hold the speech.
        let past_the_cap = b"[BLANK_AUDIO]\n".repeat(EMPTY_PROBE_BYTES as usize / 14 + 2);
        assert!(past_the_cap.len() as u64 > EMPTY_PROBE_BYTES);
        assert!(!is_empty_transcript(
            &file(dir, "endless.txt", &past_the_cap),
            WhisperFormat::Txt
        ));

        // Json this build has never seen — no `transcription` key — is likewise
        // left alone rather than deleted on a guess.
        assert!(!is_empty_transcript(
            &file(dir, "odd.json", br#"{"from_the_future": 1}"#),
            WhisperFormat::Json
        ));
        assert!(!is_empty_transcript(
            &file(dir, "broken.json", b"{not json at all"),
            WhisperFormat::Json
        ));
        // A segment shape it has never seen either: no string `text` to judge.
        assert!(!is_empty_transcript(
            &file(dir, "shape.json", br#"{"transcription": [{"words": []}]}"#),
            WhisperFormat::Json
        ));
    }

    /// Cancel mid-transcription must kill whisper and leave nothing at the output
    /// path. Needs an input long enough that whisper is still working when the
    /// token trips — tiny on Apple Silicon chews ~80x realtime, so the fixture is
    /// looped into ~12 minutes of audio (~9s of whisper) to leave a wide margin.
    ///
    /// Ignored for the same reason as the test above: needs whisper-cli + tiny.
    #[test]
    #[ignore]
    fn cancel_stops_whisper_and_leaves_no_output() {
        let ffmpeg = crate::locate::ffmpeg().expect("ffmpeg");
        let whisper = crate::locate::whisper().expect("whisper-cli (brew install whisper-cpp)");
        let models_dir = std::env::var("MEDIACHEF_MODELS_DIR")
            .map(std::path::PathBuf::from)
            .expect("set MEDIACHEF_MODELS_DIR with ggml-tiny.bin present");
        let model = crate::models::model_path(&models_dir, "tiny").expect("ggml-tiny.bin missing");
        let dir = tempfile::tempdir().unwrap();

        let long = dir.path().join("long.wav");
        let speech =
            std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../fixtures/speech.wav");
        let st = std::process::Command::new(&ffmpeg)
            .args(["-v", "error", "-y", "-stream_loop", "400", "-i"])
            .arg(&speech)
            .args(["-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le"])
            .arg(&long)
            .status()
            .unwrap();
        assert!(st.success(), "could not build the long input");

        let out = dir.path().join("long.transcript.txt");
        let job = WhisperJob {
            input: long,
            output: out.clone(),
            model,
            language: "auto".into(),
            translate: false,
            format: WhisperFormat::Txt,
        };
        let cancel = crate::process::CancelToken::new();
        let c2 = cancel.clone();
        std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_millis(2000));
            c2.cancel();
        });
        let t0 = std::time::Instant::now();
        let r = run_whisper(&ffmpeg, &whisper, &job, &cancel, |_| {}).unwrap();
        let elapsed = t0.elapsed();

        assert!(matches!(r, crate::runner::Outcome::Cancelled), "got {r:?}");
        assert!(!out.exists(), "cancel must leave no output file");
        assert!(
            elapsed < std::time::Duration::from_secs(8),
            "cancel must not wait for whisper's own exit: took {elapsed:?}"
        );
    }

    /// The no-speech path end to end, over both audio that whisper hears nothing in —
    /// and it hears nothing in two different ways, which is the whole point of running
    /// both:
    /// * `fixtures/tiny.mp4` is two seconds of a 440Hz sine over a test pattern, and
    ///   the model writes no segments at all (empty txt, empty srt, a bare `WEBVTT`
    ///   header, a json skeleton);
    /// * five seconds of `anullsrc` is *digital silence*, and the model writes a
    ///   ` [BLANK_AUDIO]` segment per chunk — a file with contents, which the first
    ///   version of the detector delivered with a green "done" in all four formats.
    ///
    /// Both fail identically in all four formats or the fix is not a fix, hence the
    /// 2×4 loop. What must hold: the run fails with the marker, and the output path is
    /// left untouched.
    ///
    /// Ignored for the same reason as its neighbours: needs whisper-cli + tiny.
    #[test]
    #[ignore]
    fn sine_and_silence_yield_no_speech() {
        let ffmpeg = crate::locate::ffmpeg().expect("ffmpeg");
        let whisper = crate::locate::whisper().expect("whisper-cli (brew install whisper-cpp)");
        let models_dir = std::env::var("MEDIACHEF_MODELS_DIR")
            .map(std::path::PathBuf::from)
            .expect("set MEDIACHEF_MODELS_DIR with ggml-tiny.bin present");
        let model = crate::models::model_path(&models_dir, "tiny").expect("ggml-tiny.bin missing");
        let dir = tempfile::tempdir().unwrap();
        let sine = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../fixtures/tiny.mp4");

        // Not a checked-in fixture: silence is one ffmpeg call, and `fixtures/make.sh`
        // would have to grow a file whose only reader is this test.
        let silence = dir.path().join("silence.wav");
        let made = std::process::Command::new(&ffmpeg)
            .args([
                "-v",
                "error",
                "-y",
                "-f",
                "lavfi",
                "-i",
                "anullsrc=r=16000:cl=mono",
                "-t",
                "5",
                "-c:a",
                "pcm_s16le",
            ])
            .arg(&silence)
            .status()
            .unwrap();
        assert!(made.success(), "could not build the silent input");

        for (name, input) in [("sine", &sine), ("silence", &silence)] {
            for format in [
                WhisperFormat::Txt,
                WhisperFormat::Srt,
                WhisperFormat::Vtt,
                WhisperFormat::Json,
            ] {
                let out = dir
                    .path()
                    .join(format!("{name}.transcript.{}", format.ext()));
                let job = WhisperJob {
                    input: input.clone(),
                    output: out.clone(),
                    model: model.clone(),
                    language: "auto".into(),
                    translate: false,
                    format,
                };
                let e = run_whisper(
                    &ffmpeg,
                    &whisper,
                    &job,
                    &crate::process::CancelToken::new(),
                    |_| {},
                )
                .expect_err(&format!("{name} produced a .{} transcript", format.ext()));
                assert!(
                    e.message.contains("no_speech"),
                    "{name} .{}: got {}",
                    format.ext(),
                    e.message
                );
                assert!(
                    !out.exists(),
                    "{name} .{}: an empty transcript was delivered to {}",
                    format.ext(),
                    out.display()
                );
            }
        }
    }
}
