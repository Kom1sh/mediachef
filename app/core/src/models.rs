//! Whisper model catalogue and downloader: the fixed table of ggml models we
//! offer, plus install/remove of the `.bin` files under a caller-chosen dir.
//!
//! This is the one module in core that touches the network, and only on an
//! explicit user action (a model download). Everything else — locating models,
//! listing what is installed, deleting — is pure filesystem work.

use crate::process::CancelToken;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};

/// How long a single socket read may stall before the download errors out.
/// Not a total budget — a 1.6GB model legitimately takes minutes — just a floor
/// on progress, so a dead connection fails instead of parking the thread (which
/// would also make the cancel check below unreachable).
const READ_TIMEOUT_SECS: u64 = 30;

/// One offerable model. `approx_bytes` is for the UI's "how big is this"
/// estimate only; the real size comes from the response's Content-Length.
pub struct ModelInfo {
    pub id: &'static str,
    pub file_name: &'static str,
    pub url: &'static str,
    pub approx_bytes: u64,
    pub note_en: &'static str,
    pub note_ru: &'static str,
}

pub fn known() -> &'static [ModelInfo] {
    &[
        ModelInfo {
            id: "tiny",
            file_name: "ggml-tiny.bin",
            url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin",
            approx_bytes: 78_000_000,
            note_en: "Fastest, rough quality",
            note_ru: "Самая быстрая, черновое качество",
        },
        ModelInfo {
            id: "base",
            file_name: "ggml-base.bin",
            url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin",
            approx_bytes: 148_000_000,
            note_en: "Fast, ok quality",
            note_ru: "Быстрая, нормальное качество",
        },
        ModelInfo {
            id: "small",
            file_name: "ggml-small.bin",
            url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin",
            approx_bytes: 488_000_000,
            note_en: "Recommended balance",
            note_ru: "Рекомендуемый баланс",
        },
        ModelInfo {
            id: "large-v3-turbo",
            file_name: "ggml-large-v3-turbo.bin",
            url:
                "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin",
            approx_bytes: 1_620_000_000,
            note_en: "Best quality, Apple Silicon",
            note_ru: "Максимум качества, для Apple Silicon",
        },
    ]
}

/// Path of an installed model, or `None` when the id is unknown or the file is
/// not there.
pub fn model_path(dir: &Path, id: &str) -> Option<PathBuf> {
    let m = known().iter().find(|m| m.id == id)?;
    let p = dir.join(m.file_name);
    p.exists().then_some(p)
}

/// Every known model paired with whether its file is present in `dir`.
pub fn installed(dir: &Path) -> Vec<(&'static ModelInfo, bool)> {
    known()
        .iter()
        .map(|m| (m, dir.join(m.file_name).exists()))
        .collect()
}

/// Removes an installed model. Idempotent: an already-absent file is success,
/// since the caller's goal — "this model is not installed" — already holds.
pub fn delete(dir: &Path, id: &str) -> Result<(), String> {
    let m = known().iter().find(|m| m.id == id).ok_or("unknown model")?;
    match std::fs::remove_file(dir.join(m.file_name)) {
        Ok(()) => Ok(()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

/// Downloads model `id` into `dir`, reporting percent-complete as it goes.
pub fn download(
    dir: &Path,
    id: &str,
    cancel: &CancelToken,
    on_progress: impl FnMut(f32),
) -> Result<PathBuf, String> {
    let m = known().iter().find(|m| m.id == id).ok_or("unknown model")?;
    download_from(m.url, dir, m.file_name, cancel, on_progress)
}

/// Deletes the `.part` file unless the download reached a successful rename.
/// Every failure exit — cancel, read, write, flush, rename — unwinds through
/// this, because a stranded `.part` is the worst kind of garbage: up to 1.6GB,
/// invisible to `installed()` and unreachable by `delete()`.
struct PartGuard {
    path: PathBuf,
    defused: bool,
}

impl PartGuard {
    fn new(path: PathBuf) -> Self {
        Self {
            path,
            defused: false,
        }
    }
    /// Called only once the bytes live under their final name.
    fn defuse(&mut self) {
        self.defused = true;
    }
}

impl Drop for PartGuard {
    fn drop(&mut self) {
        if !self.defused {
            let _ = std::fs::remove_file(&self.path);
        }
    }
}

/// Writes to `{file_name}.part` and renames on success, so a half-finished or
/// cancelled download can never masquerade as an installed model — and, via
/// [`PartGuard`], cannot linger on disk either.
fn download_from(
    url: &str,
    dir: &Path,
    file_name: &str,
    cancel: &CancelToken,
    mut on_progress: impl FnMut(f32),
) -> Result<PathBuf, String> {
    std::fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    let dest = dir.join(file_name);
    let part = dir.join(format!("{file_name}.part"));
    let agent = ureq::AgentBuilder::new()
        .timeout_read(std::time::Duration::from_secs(READ_TIMEOUT_SECS))
        .build();
    let resp = agent
        .get(url)
        .call()
        .map_err(|e| format!("download: {e}"))?;
    let total: Option<u64> = resp.header("Content-Length").and_then(|v| v.parse().ok());
    let mut reader = resp.into_reader();
    // Declared before the file handle so it drops *after* it: an open handle
    // blocks the unlink on Windows.
    let mut guard = PartGuard::new(part.clone());
    let mut out = std::fs::File::create(&part).map_err(|e| e.to_string())?;
    let mut buf = [0u8; 64 * 1024];
    let mut done: u64 = 0;
    loop {
        if cancel.is_cancelled() {
            return Err("cancelled".into());
        }
        let n = reader
            .read(&mut buf)
            .map_err(|e| format!("download read: {e}"))?;
        if n == 0 {
            break;
        }
        out.write_all(&buf[..n]).map_err(|e| e.to_string())?;
        done += n as u64;
        if let Some(t) = total.filter(|t| *t > 0) {
            on_progress(((done as f64 / t as f64) * 100.0).clamp(0.0, 100.0) as f32);
        }
    }
    out.flush().map_err(|e| e.to_string())?;
    drop(out);
    std::fs::rename(&part, &dest).map_err(|e| e.to_string())?;
    guard.defuse();
    on_progress(100.0);
    Ok(dest)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    fn one_shot_server(body: Vec<u8>) -> String {
        let declared = body.len();
        serve_once(declared, body)
    }

    /// Serves one request, declaring `declared_len` in Content-Length while
    /// sending exactly `body` and then hanging up. A `declared_len` larger than
    /// `body` reproduces a connection that dies mid-transfer.
    fn serve_once(declared_len: usize, body: Vec<u8>) -> String {
        let l = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        let addr = l.local_addr().unwrap();
        std::thread::spawn(move || {
            let (mut s, _) = l.accept().unwrap();
            let mut buf = [0u8; 1024];
            use std::io::Read;
            let _ = s.read(&mut buf);
            let hdr = format!(
                "HTTP/1.1 200 OK\r\nContent-Length: {declared_len}\r\nConnection: close\r\n\r\n"
            );
            s.write_all(hdr.as_bytes()).unwrap();
            s.write_all(&body).unwrap();
        });
        format!("http://{addr}/model.bin")
    }

    #[test]
    fn known_models_table_sane() {
        let k = known();
        assert!(k.iter().any(|m| m.id == "large-v3-turbo"));
        for m in k {
            assert!(m
                .url
                .starts_with("https://huggingface.co/ggerganov/whisper.cpp/"));
            assert!(m.file_name.starts_with("ggml-") && m.file_name.ends_with(".bin"));
        }
    }

    #[test]
    fn download_writes_file_with_progress() {
        let dir = tempfile::tempdir().unwrap();
        let url = one_shot_server(vec![7u8; 4096]);
        let mut seen = Vec::new();
        let p = download_from(
            &url,
            dir.path(),
            "ggml-test.bin",
            &crate::process::CancelToken::new(),
            |x| seen.push(x),
        )
        .unwrap();
        assert_eq!(std::fs::read(&p).unwrap().len(), 4096);
        assert_eq!(*seen.last().unwrap(), 100.0);
        assert!(!dir.path().join("ggml-test.bin.part").exists());
    }

    /// A download that dies mid-transfer must fail loudly and take its `.part`
    /// with it — no unreachable multi-GB leftovers.
    #[test]
    fn truncated_download_errors_and_leaves_no_part() {
        let dir = tempfile::tempdir().unwrap();
        // Promises 8192 bytes, hangs up after 4096.
        let url = serve_once(8192, vec![7u8; 4096]);
        let err = download_from(
            &url,
            dir.path(),
            "ggml-test.bin",
            &crate::process::CancelToken::new(),
            |_| {},
        )
        .unwrap_err();
        assert!(err.contains("download read"), "unexpected error: {err}");
        assert!(!dir.path().join("ggml-test.bin.part").exists());
        assert_eq!(
            std::fs::read_dir(dir.path()).unwrap().count(),
            0,
            "a failed download must leave nothing behind at all"
        );
    }

    #[test]
    fn model_path_none_when_missing() {
        let dir = tempfile::tempdir().unwrap();
        assert!(model_path(dir.path(), "tiny").is_none());
        std::fs::write(dir.path().join("ggml-tiny.bin"), b"x").unwrap();
        assert!(model_path(dir.path(), "tiny").is_some());
    }
}
