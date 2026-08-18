use std::path::{Path, PathBuf};
use crate::recipe::Recipe;

pub fn output_path(input: &Path, suffix: &str, ext: &str) -> PathBuf {
    let stem = input.file_stem().map(|s| s.to_string_lossy().to_string()).unwrap_or_else(|| "output".into());
    let dir = input.parent().unwrap_or(Path::new("."));
    dir.join(format!("{stem}.{suffix}.{ext}"))
}

pub fn dedupe(p: &Path) -> PathBuf {
    if !p.exists() {
        return p.to_path_buf();
    }
    let stem = p.file_stem().map(|s| s.to_string_lossy().to_string()).unwrap_or_default();
    let ext = p.extension().map(|s| s.to_string_lossy().to_string()).unwrap_or_default();
    let dir = p.parent().unwrap_or(Path::new("."));
    for i in 1.. {
        let cand = dir.join(format!("{stem} ({i}).{ext}"));
        if !cand.exists() {
            return cand;
        }
    }
    unreachable!()
}

pub fn plan_output(recipe: &Recipe, input: &Path) -> PathBuf {
    let suffix = recipe.output.suffix.clone().unwrap_or_else(|| recipe.id.clone());
    dedupe(&output_path(input, &suffix, &recipe.output.ext))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::Path;

    #[test]
    fn builds_name_with_suffix() {
        let p = output_path(Path::new("/dir/видео файл.mp4"), "audio", "mp3");
        assert_eq!(p, Path::new("/dir/видео файл.audio.mp3"));
    }

    #[test]
    fn dedupes_on_collision() {
        let d = tempfile::tempdir().unwrap();
        let base = d.path().join("o.audio.mp3");
        fs::write(&base, b"x").unwrap();
        let p1 = dedupe(&base);
        assert_eq!(p1, d.path().join("o.audio (1).mp3"));
        fs::write(&p1, b"x").unwrap();
        assert_eq!(dedupe(&base), d.path().join("o.audio (2).mp3"));
    }
}
