//! ffmpeg-specific layer over [`crate::process`]: the fixed argv prefix, the
//! progress parse, the stderr tail and the partial-output cleanup.

use crate::process::{run_streaming, Pipe, StreamError};
use crate::progress::ProgressParser;
use std::path::Path;

pub use crate::process::CancelToken;

/// How many trailing stderr lines are kept for `RunError::stderr_tail`.
const STDERR_TAIL_LINES: usize = 60;

#[derive(Debug)]
pub enum Outcome {
    Done,
    Cancelled,
}

#[derive(Debug)]
pub struct RunError {
    pub message: String,
    pub stderr_tail: String,
}

pub fn run_ffmpeg(
    bin: &Path,
    argv: &[String],
    total_s: Option<f64>,
    cancel: &CancelToken,
    mut on_progress: impl FnMut(f32),
) -> Result<Outcome, RunError> {
    let output_path = argv.last().cloned();
    let mut full: Vec<String> = [
        "-hide_banner",
        "-nostats",
        "-v",
        "error",
        "-progress",
        "pipe:1",
        "-y",
    ]
    .iter()
    .map(|s| s.to_string())
    .collect();
    full.extend_from_slice(argv);

    let parser = ProgressParser::new(total_s);
    let mut tail: Vec<String> = Vec::new();
    let exit = run_streaming(bin, &full, cancel, |pipe, line| match pipe {
        Pipe::Stdout => {
            if let Some(p) = parser.parse_line(line) {
                on_progress(p);
            }
        }
        Pipe::Stderr => {
            if tail.len() >= STDERR_TAIL_LINES {
                tail.remove(0);
            }
            tail.push(line.to_string());
        }
    });

    let cleanup = |p: &Option<String>| {
        if let Some(p) = p {
            let _ = std::fs::remove_file(p);
        }
    };
    let tail_text = || tail.join("\n");

    match exit {
        // Nothing ran, so nothing at the output path is ours to delete.
        Err(StreamError::Spawn(message)) => Err(RunError {
            message,
            stderr_tail: tail_text(),
        }),
        Err(StreamError::Wait(message)) => {
            cleanup(&output_path);
            Err(RunError {
                message,
                stderr_tail: tail_text(),
            })
        }
        Ok(e) if e.cancelled => {
            cleanup(&output_path);
            Ok(Outcome::Cancelled)
        }
        Ok(e) if e.success => {
            on_progress(100.0);
            Ok(Outcome::Done)
        }
        Ok(e) => {
            cleanup(&output_path);
            Err(RunError {
                message: match e.code {
                    Some(c) => format!("ffmpeg exited with code {c}"),
                    None => "ffmpeg exited on a signal".to_string(),
                },
                stderr_tail: tail_text(),
            })
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::locate;
    use std::path::Path;

    fn fx(name: &str) -> String {
        Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../fixtures")
            .join(name)
            .display()
            .to_string()
    }

    #[test]
    fn converts_fixture_and_reports_progress() {
        let ff = locate::ffmpeg().unwrap();
        let out = fx("runner_out.mp3");
        let _ = std::fs::remove_file(&out);
        let argv = vec!["-i".into(), fx("tiny.mp4"), "-vn".into(), out.clone()];
        let mut seen = Vec::new();
        let r = run_ffmpeg(&ff, &argv, Some(2.0), &CancelToken::new(), |p| seen.push(p)).unwrap();
        assert!(matches!(r, Outcome::Done));
        assert!(Path::new(&out).exists());
        assert_eq!(*seen.last().unwrap(), 100.0);
        std::fs::remove_file(&out).unwrap();
    }

    #[test]
    fn cancel_kills_and_removes_partial() {
        let ff = locate::ffmpeg().unwrap();
        let out = fx("runner_cancel.mp4");
        let _ = std::fs::remove_file(&out);
        // длинная задача: 30с testsrc котируется медленно на veryslow
        let argv = vec![
            "-f".into(),
            "lavfi".into(),
            "-i".into(),
            "testsrc2=duration=30:size=1280x720:rate=30".into(),
            "-c:v".into(),
            "libx264".into(),
            "-preset".into(),
            "veryslow".into(),
            out.clone(),
        ];
        let cancel = CancelToken::new();
        let c2 = cancel.clone();
        std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_millis(700));
            c2.cancel();
        });
        let r = run_ffmpeg(&ff, &argv, Some(30.0), &cancel, |_| {}).unwrap();
        assert!(matches!(r, Outcome::Cancelled));
        assert!(!Path::new(&out).exists(), "partial output must be deleted");
    }

    // Regression: cancel must land even once the stdout drain has ended while the
    // child is still alive. The stand-in "ffmpeg" writes one invalid-UTF-8 line to
    // stdout, then lives on; `exec` keeps the sleeper on the child's own pid so the
    // kill closes the pipes and leaves no stray process behind.
    #[cfg(unix)]
    #[test]
    fn cancel_works_after_stdout_eof() {
        use std::os::unix::fs::PermissionsExt;
        let dir = std::env::temp_dir().join(format!("mediachef_runner_{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let script = dir.join("fake_ffmpeg.sh");
        std::fs::write(&script, "#!/bin/sh\nprintf 'a\\377b\\n'\nexec sleep 30\n").unwrap();
        std::fs::set_permissions(&script, std::fs::Permissions::from_mode(0o755)).unwrap();

        let cancel = CancelToken::new();
        let c2 = cancel.clone();
        std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_millis(300));
            c2.cancel();
        });
        let t0 = std::time::Instant::now();
        let r = run_ffmpeg(&script, &["ignored".into()], None, &cancel, |_| {}).unwrap();
        let elapsed = t0.elapsed();
        let _ = std::fs::remove_dir_all(&dir);
        assert!(matches!(r, Outcome::Cancelled));
        assert!(
            elapsed < std::time::Duration::from_secs(5),
            "cancel must not wait for the child: took {elapsed:?}"
        );
    }

    #[test]
    fn error_returns_stderr_tail() {
        let ff = locate::ffmpeg().unwrap();
        let argv = vec!["-i".into(), fx("no_such_file.mp4"), "out.mp4".into()];
        let e = run_ffmpeg(&ff, &argv, None, &CancelToken::new(), |_| {}).unwrap_err();
        assert!(e.stderr_tail.to_lowercase().contains("no such file"));
    }
}
