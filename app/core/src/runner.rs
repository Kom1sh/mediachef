use std::collections::VecDeque;
use std::io::{BufRead, BufReader};
use std::path::Path;
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use crate::progress::ProgressParser;

#[derive(Clone, Default)]
pub struct CancelToken(Arc<AtomicBool>);

impl CancelToken {
    pub fn new() -> Self { Self::default() }
    pub fn cancel(&self) { self.0.store(true, Ordering::SeqCst); }
    pub fn is_cancelled(&self) -> bool { self.0.load(Ordering::SeqCst) }
}

#[derive(Debug)]
pub enum Outcome { Done, Cancelled }

#[derive(Debug)]
pub struct RunError { pub message: String, pub stderr_tail: String }

pub fn run_ffmpeg(
    bin: &Path,
    argv: &[String],
    total_s: Option<f64>,
    cancel: &CancelToken,
    mut on_progress: impl FnMut(f32),
) -> Result<Outcome, RunError> {
    let output_path = argv.last().cloned();
    let mut cmd = Command::new(bin);
    cmd.args(["-hide_banner", "-nostats", "-v", "error", "-progress", "pipe:1", "-y"])
        .args(argv)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .stdin(Stdio::null());
    let mut child = cmd.spawn().map_err(|e| RunError { message: format!("spawn: {e}"), stderr_tail: String::new() })?;

    let stderr = child.stderr.take().unwrap();
    let tail: Arc<Mutex<VecDeque<String>>> = Arc::new(Mutex::new(VecDeque::new()));
    let tail2 = tail.clone();
    let stderr_thread = std::thread::spawn(move || {
        for line in BufReader::new(stderr).lines().map_while(Result::ok) {
            let mut t = tail2.lock().unwrap();
            if t.len() >= 60 { t.pop_front(); }
            t.push_back(line);
        }
    });

    let child_arc = Arc::new(Mutex::new(child));
    let watch_cancel = cancel.clone();
    let watch_child = child_arc.clone();
    let watchdog = std::thread::spawn(move || loop {
        if watch_cancel.is_cancelled() {
            let _ = watch_child.lock().unwrap().kill();
            break;
        }
        if let Ok(Some(_)) = watch_child.lock().unwrap().try_wait() { break }
        std::thread::sleep(std::time::Duration::from_millis(150));
    });

    let stdout = child_arc.lock().unwrap().stdout.take().unwrap();
    let parser = ProgressParser::new(total_s);
    for line in BufReader::new(stdout).lines().map_while(Result::ok) {
        if let Some(p) = parser.parse_line(&line) {
            on_progress(p);
        }
    }

    let status = child_arc.lock().unwrap().wait().map_err(|e| RunError { message: e.to_string(), stderr_tail: String::new() })?;
    let _ = watchdog.join();
    let _ = stderr_thread.join();

    let cleanup = |p: &Option<String>| {
        if let Some(p) = p { let _ = std::fs::remove_file(p); }
    };

    if cancel.is_cancelled() {
        cleanup(&output_path);
        return Ok(Outcome::Cancelled);
    }
    if status.success() {
        on_progress(100.0);
        Ok(Outcome::Done)
    } else {
        let stderr_tail = tail.lock().unwrap().iter().cloned().collect::<Vec<_>>().join("\n");
        cleanup(&output_path);
        Err(RunError { message: format!("ffmpeg exited with {status}"), stderr_tail })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::locate;
    use std::path::Path;

    fn fx(name: &str) -> String {
        Path::new(env!("CARGO_MANIFEST_DIR")).join("../../fixtures").join(name).display().to_string()
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
        let argv = vec!["-f".into(), "lavfi".into(), "-i".into(), "testsrc2=duration=30:size=1280x720:rate=30".into(),
                        "-c:v".into(), "libx264".into(), "-preset".into(), "veryslow".into(), out.clone()];
        let cancel = CancelToken::new();
        let c2 = cancel.clone();
        std::thread::spawn(move || { std::thread::sleep(std::time::Duration::from_millis(700)); c2.cancel(); });
        let r = run_ffmpeg(&ff, &argv, Some(30.0), &cancel, |_| {}).unwrap();
        assert!(matches!(r, Outcome::Cancelled));
        assert!(!Path::new(&out).exists(), "partial output must be deleted");
    }

    #[test]
    fn error_returns_stderr_tail() {
        let ff = locate::ffmpeg().unwrap();
        let argv = vec!["-i".into(), fx("no_such_file.mp4"), "out.mp4".into()];
        let e = run_ffmpeg(&ff, &argv, None, &CancelToken::new(), |_| {}).unwrap_err();
        assert!(e.stderr_tail.to_lowercase().contains("no such file"));
    }
}
