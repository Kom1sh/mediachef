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

    const MIN_RECIPE: &str = r#"
id: extract-audio-mp3
category: extract
title: {en: "Extract audio", ru: "Извлечь аудио"}
aliases: {en: [], ru: []}
description: {en: "d", ru: "д"}
input: {types: [video]}
engine: ffmpeg
output: {OUTPUT}
"#;

    fn recipe_with_output(output: &str) -> Recipe {
        Recipe::from_yaml(&MIN_RECIPE.replace("{OUTPUT}", output)).unwrap()
    }

    #[test]
    fn plan_output_falls_back_to_recipe_id() {
        let r = recipe_with_output("{ext: mp3}");
        assert!(r.output.suffix.is_none());
        let p = plan_output(&r, Path::new("/dir/in.mp4"));
        assert_eq!(p.file_name().unwrap().to_string_lossy(), "in.extract-audio-mp3.mp3");
    }

    #[test]
    fn plan_output_uses_output_suffix() {
        let r = recipe_with_output("{ext: mp3, suffix: audio}");
        assert_eq!(r.output.suffix.as_deref(), Some("audio"));
        let p = plan_output(&r, Path::new("/dir/in.mp4"));
        assert_eq!(p.file_name().unwrap().to_string_lossy(), "in.audio.mp3");
    }
}
