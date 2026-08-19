use std::path::PathBuf;

fn find(bin: &str, env_key: &str) -> Option<PathBuf> {
    if let Ok(p) = std::env::var(env_key) {
        let p = PathBuf::from(p);
        if p.exists() {
            return Some(p);
        }
    }
    let bin_name = if cfg!(target_os = "windows") {
        format!("{bin}.exe")
    } else {
        bin.to_string()
    };
    let triple = format!(
        "{}-{}",
        std::env::consts::ARCH,
        if cfg!(target_os = "macos") {
            "apple-darwin"
        } else if cfg!(target_os = "windows") {
            "pc-windows-msvc"
        } else {
            "unknown-linux-gnu"
        }
    );
    let repo_bin = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../..")
        .join("bin")
        .join(triple)
        .join(&bin_name);
    if repo_bin.exists() {
        return Some(repo_bin);
    }
    if let Some(p) = which_path(&bin_name) {
        return Some(p);
    }
    // GUI apps launched from Finder get launchd's minimal PATH
    // (/usr/bin:/bin:/usr/sbin:/sbin) — Homebrew never appears in it, so a
    // bundled MediaChef.app would miss a perfectly installed ffmpeg. Probe the
    // two well-known Homebrew prefixes (Apple Silicon, then Intel) directly.
    if cfg!(target_os = "macos") {
        for prefix in ["/opt/homebrew/bin", "/usr/local/bin"] {
            let p = PathBuf::from(prefix).join(&bin_name);
            if p.exists() {
                return Some(p);
            }
        }
    }
    None
}

fn which_path(bin: &str) -> Option<PathBuf> {
    let path = std::env::var_os("PATH")?;
    std::env::split_paths(&path)
        .map(|d| d.join(bin))
        .find(|c| c.exists())
}

pub fn ffmpeg() -> Option<PathBuf> {
    find("ffmpeg", "MEDIACHEF_FFMPEG")
}
pub fn ffprobe() -> Option<PathBuf> {
    find("ffprobe", "MEDIACHEF_FFPROBE")
}
/// whisper.cpp's CLI, shipped as `whisper-cli` (the old name was `main`).
pub fn whisper() -> Option<PathBuf> {
    find("whisper-cli", "MEDIACHEF_WHISPER")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn whisper_resolves_from_env() {
        let dir = tempfile::tempdir().unwrap();
        let fake = dir.path().join("whisper-cli");
        std::fs::write(&fake, b"#!/bin/sh\n").unwrap();
        std::env::set_var("MEDIACHEF_WHISPER", &fake);
        assert_eq!(whisper(), Some(fake));
        std::env::remove_var("MEDIACHEF_WHISPER");
    }
}
