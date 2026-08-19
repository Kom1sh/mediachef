//! Cancellable child-process runner: spawn without a shell, stream both pipes
//! line by line as they arrive, kill on cancel. Knows nothing about ffmpeg,
//! progress or files — those live in the layers above (see `runner`).

use std::io::{BufRead, BufReader, Read};
use std::path::Path;
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc;
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

/// How the child ended. `cancelled` reflects the token, not the exit status;
/// `code` is `None` when the child died from a signal (a cancel kill, say).
#[derive(Debug)]
pub struct Exit {
    pub success: bool,
    pub code: Option<i32>,
    pub cancelled: bool,
}

/// Why a run never produced an [`Exit`]. Typed because the two cases mean very
/// different things to a caller that cleans up output files: on `Spawn` nothing
/// ran, so nothing of the caller's may be touched.
#[derive(Debug)]
pub enum StreamError {
    Spawn(String),
    Wait(String),
}

impl std::fmt::Display for StreamError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            StreamError::Spawn(m) | StreamError::Wait(m) => f.write_str(m),
        }
    }
}

/// Reads `r` line by line, tolerating invalid UTF-8 (lossy conversion).
///
/// Unlike `lines().map_while(Result::ok)` this never stops on a decode error:
/// the drain ends only at real EOF, so the pipe cannot stay full and wedge the
/// child, and no output can be silently truncated mid-run.
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

/// Runs `bin` with `argv`, feeding every stdout/stderr line to `on_line` *as it
/// arrives* — consumers that parse progress out of either pipe (ffmpeg writes it
/// to stdout, whisper to stderr) see it live, not after the child exits.
///
/// Each pipe gets its own drain thread posting into one channel; the caller's
/// thread runs `on_line` off that channel, so ordering **within** a pipe is
/// preserved while ordering **across** the two is best-effort (whatever order
/// the channel receives them in).
///
/// A watchdog kills the child once `cancel` trips. No path can wedge: the
/// receive loop ends exactly when both drains hit EOF and drop their senders,
/// and a killed child closes both pipes, so cancel always unblocks it. All
/// threads are joined before returning.
pub fn run_streaming(
    bin: &Path,
    argv: &[String],
    cancel: &CancelToken,
    mut on_line: impl FnMut(Pipe, &str),
) -> Result<Exit, StreamError> {
    let mut cmd = Command::new(bin);
    cmd.args(argv)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .stdin(Stdio::null());
    let mut child = cmd
        .spawn()
        .map_err(|e| StreamError::Spawn(format!("spawn: {e}")))?;

    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();

    let (tx, rx) = mpsc::channel::<(Pipe, String)>();
    let tx_out = tx.clone();
    let tx_err = tx.clone();
    // The receive loop below ends when every sender is gone, so this thread must
    // not keep one of its own.
    drop(tx);

    let stdout_thread = std::thread::spawn(move || {
        drain_lines(stdout, |line| {
            let _ = tx_out.send((Pipe::Stdout, line.to_string()));
        });
    });
    let stderr_thread = std::thread::spawn(move || {
        drain_lines(stderr, |line| {
            let _ = tx_err.send((Pipe::Stderr, line.to_string()));
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

    for (pipe, line) in rx {
        on_line(pipe, &line);
    }

    // Non-blocking wait: `wait()` would hold the mutex for its whole blocking
    // span and starve the watchdog, so cancel would be dead from the moment the
    // pipes close until the child exits on its own.
    let waited = loop {
        let polled = child_arc.lock().unwrap().try_wait();
        match polled {
            Ok(Some(s)) => break Ok(s),
            Ok(None) => std::thread::sleep(std::time::Duration::from_millis(WAIT_POLL_MS)),
            Err(e) => break Err(StreamError::Wait(format!("wait: {e}"))),
        }
    };
    let _ = watchdog.join();
    let _ = stdout_thread.join();
    let _ = stderr_thread.join();

    let status = waited?;
    Ok(Exit {
        success: status.success(),
        code: status.code(),
        cancelled: cancel.is_cancelled(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Liveness: a stderr line must reach the consumer while the child is still
    /// running, not in a batch after it exits. The stand-in prints one stderr
    /// line and then sleeps for 5s; `exec` keeps the sleeper on the child's own
    /// pid, so the cancel kill closes the pipes and leaves no stray process.
    #[cfg(unix)]
    #[test]
    fn stderr_line_arrives_while_child_still_runs() {
        use std::os::unix::fs::PermissionsExt;
        let dir = std::env::temp_dir().join(format!("mediachef_process_{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let script = dir.join("live_stderr.sh");
        std::fs::write(&script, "#!/bin/sh\necho live-stderr 1>&2\nexec sleep 5\n").unwrap();
        std::fs::set_permissions(&script, std::fs::Permissions::from_mode(0o755)).unwrap();

        let cancel = CancelToken::new();
        let canceller = cancel.clone();
        let mut first: Option<(Pipe, String, std::time::Duration)> = None;
        let t0 = std::time::Instant::now();
        // Cancel from inside the callback: returning before the child's own 5s
        // exit is what proves the line was not a post-mortem replay.
        let exit = run_streaming(&script, &[], &cancel, |pipe, line| {
            if first.is_none() {
                first = Some((pipe, line.to_string(), t0.elapsed()));
                canceller.cancel();
            }
        })
        .unwrap();
        let total = t0.elapsed();
        let _ = std::fs::remove_dir_all(&dir);

        let (pipe, line, at) = first.expect("the stderr line must be delivered");
        assert_eq!(pipe, Pipe::Stderr);
        assert_eq!(line, "live-stderr");
        assert!(
            at < std::time::Duration::from_secs(2),
            "stderr must stream live: line arrived only after {at:?}"
        );
        assert!(exit.cancelled, "the token was cancelled during the run");
        assert!(
            total < std::time::Duration::from_secs(5),
            "must return on cancel, not on the child's own exit: took {total:?}"
        );
    }
}
