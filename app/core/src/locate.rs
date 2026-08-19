use std::path::{Path, PathBuf};

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
    // A shipped MediaChef carries its own engines: tauri's `externalBin` copies
    // them next to the app executable (Contents/MacOS on macOS) under their
    // plain names — the host-triple suffix that the source `binaries/` dir
    // requires is stripped on the way in. This step sits above the dev chain on
    // purpose: a bundle must run the ffmpeg it was tested with rather than
    // whatever the machine happens to have on PATH or in Homebrew. In a dev tree
    // the same copies land in `target/{debug,release}/`, so binaries built there
    // (the smoke runner, `tauri dev`) take the sidecars over PATH too — that is
    // intended, and `MEDIACHEF_*` above is the way to point them elsewhere.
    if let Some(p) = std::env::current_exe()
        .ok()
        .as_deref()
        .and_then(Path::parent)
        .and_then(|dir| find_near(dir, &bin_name))
    {
        return Some(p);
    }
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

/// `dir/bin_name`, if that is a file we could actually execute.
///
/// `bin_name` arrives with the platform suffix already applied by the caller, so
/// the match is verbatim — no extension guessing here. Files only: a directory
/// of the same name passes `exists()` and would be handed to the runner as a
/// binary, which fails much later and much more confusingly.
fn find_near(dir: &Path, bin_name: &str) -> Option<PathBuf> {
    let p = dir.join(bin_name);
    p.is_file().then_some(p)
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

    /// `find_near` is the pure half of the "sidecar next to the executable"
    /// step: `current_exe` cannot be faked inside a test, so the directory is
    /// the parameter and only the thin wrapper in `find` is untested.
    #[test]
    fn find_near_picks_up_a_file_in_the_directory() {
        let dir = tempfile::tempdir().unwrap();
        let fake = dir.path().join("ffmpeg");
        std::fs::write(&fake, b"#!/bin/sh\n").unwrap();
        assert_eq!(find_near(dir.path(), "ffmpeg"), Some(fake));
    }

    #[test]
    fn find_near_is_none_when_the_binary_is_absent() {
        let dir = tempfile::tempdir().unwrap();
        assert_eq!(find_near(dir.path(), "ffmpeg"), None);
        // A same-named directory is not a binary — `exists()` would say yes and
        // hand the runner something that can never be spawned.
        std::fs::create_dir(dir.path().join("ffprobe")).unwrap();
        assert_eq!(find_near(dir.path(), "ffprobe"), None);
    }

    /// The suffix lives in the `bin_name` the caller builds (`.exe` on
    /// Windows), so the lookup must match that name exactly rather than
    /// guessing extensions of its own.
    #[test]
    fn find_near_matches_the_name_it_was_given_verbatim() {
        let dir = tempfile::tempdir().unwrap();
        let windows_style = dir.path().join("whisper-cli.exe");
        std::fs::write(&windows_style, b"MZ").unwrap();
        assert_eq!(find_near(dir.path(), "whisper-cli"), None);
        assert_eq!(
            find_near(dir.path(), "whisper-cli.exe"),
            Some(windows_style)
        );
    }

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
