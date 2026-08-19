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
    let exit = exit.map_err(|e| err(e.to_string(), &tail))?;
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
}
