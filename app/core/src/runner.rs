use crate::progress::ProgressParser;
use std::collections::VecDeque;
use std::io::{BufRead, BufReader, Read};
use std::path::Path;
use std::process::{Command, ExitStatus, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

/// How many trailing stderr lines are kept for `RunError::stderr_tail`.
const STDERR_TAIL_LINES: usize = 60;
/// Poll interval of the child-exit loop. Must never block under the child mutex.
const WAIT_POLL_MS: u64 = 50;
/// Poll interval of the cancel watchdog.
const CANCEL_POLL_MS: u64 = 150;

/// Reads `r` line by line, tolerating invalid UTF-8 (lossy conversion).
///
/// Unlike `lines().map_while(Result::ok)` this never stops on a decode error:
/// the drain ends only at real EOF, so the pipe cannot stay full and wedge the
/// child, and the stderr tail cannot be silently truncated mid-run.
fn drain_lines<R: Read>(r: R, mut on_line: impl FnMut(&str)) {
    let mut reader = BufReader::new(r);
    let mut buf = Vec::new();
    loop {
        buf.clear();
        match reader.read_until(b'\n', &mut buf) {
            Ok(0) => break,
            Ok(_) => {
                while matches!(buf.last().copied(), Some(b'\n' | b'\r')) {
                    buf.pop();
                }
                on_line(&String::from_utf8_lossy(&buf));
            }
            Err(e) if e.kind() == std::io::ErrorKind::Interrupted => continue,
            Err(_) => break,
        }
    }
}

#[derive(Clone, Default)]
pub struct CancelToken(Arc<AtomicBool>);

impl CancelToken {
    pub fn new() -> Self {
        Self::default()
    }
    pub fn cancel(&self) {
        self.0.store(true, Ordering::SeqCst);
    }
    pub fn is_cancelled(&self) -> bool {
        self.0.load(Ordering::SeqCst)
    }
}

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
    let mut cmd = Command::new(bin);
    cmd.args([
        "-hide_banner",
        "-nostats",
        "-v",
        "error",
        "-progress",
        "pipe:1",
        "-y",
    ])
    .args(argv)
    .stdout(Stdio::piped())
    .stderr(Stdio::piped())
    .stdin(Stdio::null());
    let mut child = cmd.spawn().map_err(|e| RunError {
        message: format!("spawn: {e}"),
        stderr_tail: String::new(),
    })?;

    let stderr = child.stderr.take().unwrap();
    let tail: Arc<Mutex<VecDeque<String>>> = Arc::new(Mutex::new(VecDeque::new()));
    let tail2 = tail.clone();
    let stderr_thread = std::thread::spawn(move || {
        drain_lines(stderr, |line| {
            let mut t = tail2.lock().unwrap();
            if t.len() >= STDERR_TAIL_LINES {
                t.pop_front();
            }
            t.push_back(line.to_string());
        });
    });

    let child_arc = Arc::new(Mutex::new(child));
    let watch_cancel = cancel.clone();
    let watch_child = child_arc.clone();
    // Kills the child on cancel. Everything that touches the child mutex must
    // release it between polls, or this kill could never land.
    let watchdog = std::thread::spawn(move || loop {
        if watch_cancel.is_cancelled() {
            let _ = watch_child.lock().unwrap().kill();
            break;
        }
        let polled = watch_child.lock().unwrap().try_wait();
        match polled {
            Ok(Some(_)) | Err(_) => break,
            Ok(None) => std::thread::sleep(std::time::Duration::from_millis(CANCEL_POLL_MS)),
        }
    });

    let stdout = child_arc.lock().unwrap().stdout.take().unwrap();
    let parser = ProgressParser::new(total_s);
    drain_lines(stdout, |line| {
        if let Some(p) = parser.parse_line(line) {
            on_progress(p);
        }
    });

    // Non-blocking wait: `wait()` would hold the mutex for its whole blocking
    // span and starve the watchdog, so cancel would be dead from the moment the
    // stdout drain ends until the child exits on its own.
    let waited: Result<ExitStatus, std::io::Error> = loop {
        let polled = child_arc.lock().unwrap().try_wait();
        match polled {
            Ok(Some(s)) => break Ok(s),
            Err(e) => break Err(e),
            Ok(None) => std::thread::sleep(std::time::Duration::from_millis(WAIT_POLL_MS)),
        }
    };

    let _ = watchdog.join();
    let _ = stderr_thread.join();

    let cleanup = |p: &Option<String>| {
        if let Some(p) = p {
            let _ = std::fs::remove_file(p);
        }
    };
    let stderr_tail = || {
        tail.lock()
            .unwrap()
            .iter()
            .cloned()
            .collect::<Vec<_>>()
            .join("\n")
    };

    let status = match waited {
        Ok(s) => s,
        Err(e) => {
            cleanup(&output_path);
            return Err(RunError {
                message: e.to_string(),
                stderr_tail: stderr_tail(),
            });
        }
    };

    if cancel.is_cancelled() {
        cleanup(&output_path);
        return Ok(Outcome::Cancelled);
    }
    if status.success() {
        on_progress(100.0);
        Ok(Outcome::Done)
    } else {
        cleanup(&output_path);
        Err(RunError {
            message: format!("ffmpeg exited with {status}"),
            stderr_tail: stderr_tail(),
        })
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
