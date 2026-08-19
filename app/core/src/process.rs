//! Cancellable child-process runner: spawn without a shell, stream both pipes
//! line by line, kill on cancel. Knows nothing about ffmpeg, progress or files —
//! those live in the layers above (see `runner`).

use std::collections::VecDeque;
use std::io::{BufRead, BufReader, Read};
use std::path::Path;
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

/// Poll interval of the cancel watchdog.
const CANCEL_POLL_MS: u64 = 150;
/// Poll interval of the child-exit loop. Must never block under the child mutex.
const WAIT_POLL_MS: u64 = 50;

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

/// Which pipe a streamed line came from.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Pipe {
    Stdout,
    Stderr,
}

/// How the child ended. `cancelled` reflects the token, not the exit status.
#[derive(Debug)]
pub struct Exit {
    pub success: bool,
    pub cancelled: bool,
}

/// Reads `r` line by line, tolerating invalid UTF-8 (lossy conversion).
///
/// Unlike `lines().map_while(Result::ok)` this never stops on a decode error:
/// the drain ends only at real EOF, so the pipe cannot stay full and wedge the
/// child, and the stderr tail cannot be silently truncated mid-run.
fn drain_lines(mut r: impl Read, mut sink: impl FnMut(&str)) {
    let mut reader = BufReader::new(&mut r);
    let mut buf: Vec<u8> = Vec::new();
    loop {
        buf.clear();
        match reader.read_until(b'\n', &mut buf) {
            Ok(0) => break,
            Ok(_) => {
                let line = String::from_utf8_lossy(&buf);
                sink(line.trim_end_matches(['\r', '\n']));
            }
            Err(e) if e.kind() == std::io::ErrorKind::Interrupted => continue,
            Err(_) => break,
        }
    }
}

/// Runs `bin` with `argv`, feeding every stdout/stderr line to `on_line`.
///
/// stdout is streamed live; stderr is collected by a helper thread and replayed
/// as one tail after the stdout drain ends (ordering between the two pipes is
/// not guaranteed). A watchdog kills the child once `cancel` trips. Both helper
/// threads are joined on every path.
pub fn run_streaming(
    bin: &Path,
    argv: &[String],
    cancel: &CancelToken,
    mut on_line: impl FnMut(Pipe, &str),
) -> Result<Exit, String> {
    let mut cmd = Command::new(bin);
    cmd.args(argv)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .stdin(Stdio::null());
    let mut child = cmd.spawn().map_err(|e| format!("spawn: {e}"))?;

    let stderr = child.stderr.take().unwrap();
    let stderr_buf: Arc<Mutex<VecDeque<String>>> = Arc::new(Mutex::new(VecDeque::new()));
    let sb = stderr_buf.clone();
    let stderr_thread = std::thread::spawn(move || {
        drain_lines(stderr, |line| {
            let mut g = sb.lock().unwrap();
            g.push_back(line.to_string());
        });
    });

    let child_arc = Arc::new(Mutex::new(child));
    let wc = cancel.clone();
    let wchild = child_arc.clone();
    // Kills the child on cancel. Everything that touches the child mutex must
    // release it between polls, or this kill could never land.
    let watchdog = std::thread::spawn(move || loop {
        if wc.is_cancelled() {
            let _ = wchild.lock().unwrap().kill();
            break;
        }
        let polled = wchild.lock().unwrap().try_wait();
        match polled {
            Ok(Some(_)) | Err(_) => break,
            Ok(None) => std::thread::sleep(std::time::Duration::from_millis(CANCEL_POLL_MS)),
        }
    });

    let stdout = child_arc.lock().unwrap().stdout.take().unwrap();
    drain_lines(stdout, |line| on_line(Pipe::Stdout, line));

    // Non-blocking wait: `wait()` would hold the mutex for its whole blocking
    // span and starve the watchdog, so cancel would be dead from the moment the
    // stdout drain ends until the child exits on its own.
    let waited = loop {
        let polled = child_arc.lock().unwrap().try_wait();
        match polled {
            Ok(Some(s)) => break Ok(s),
            Ok(None) => std::thread::sleep(std::time::Duration::from_millis(WAIT_POLL_MS)),
            Err(e) => break Err(format!("wait: {e}")),
        }
    };
    let _ = watchdog.join();
    let _ = stderr_thread.join();
    for line in stderr_buf.lock().unwrap().iter() {
        on_line(Pipe::Stderr, line);
    }

    let status = waited?;
    Ok(Exit {
        success: status.success(),
        cancelled: cancel.is_cancelled(),
    })
}
