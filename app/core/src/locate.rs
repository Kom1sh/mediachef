use std::path::PathBuf;

fn find(bin: &str, env_key: &str) -> Option<PathBuf> {
    if let Ok(p) = std::env::var(env_key) {
        let p = PathBuf::from(p);
        if p.exists() { return Some(p); }
    }
    let bin_name = if cfg!(target_os = "windows") { format!("{bin}.exe") } else { bin.to_string() };
    let triple = format!("{}-{}", std::env::consts::ARCH, if cfg!(target_os = "macos") { "apple-darwin" } else if cfg!(target_os = "windows") { "pc-windows-msvc" } else { "unknown-linux-gnu" });
    let repo_bin = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..").join("bin").join(triple).join(&bin_name);
    if repo_bin.exists() { return Some(repo_bin); }
    which_path(&bin_name)
}

fn which_path(bin: &str) -> Option<PathBuf> {
    let path = std::env::var_os("PATH")?;
    std::env::split_paths(&path).map(|d| d.join(bin)).find(|c| c.exists())
}

pub fn ffmpeg() -> Option<PathBuf> { find("ffmpeg", "MEDIACHEF_FFMPEG") }
pub fn ffprobe() -> Option<PathBuf> { find("ffprobe", "MEDIACHEF_FFPROBE") }
