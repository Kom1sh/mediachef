use crate::recipe::Recipe;
use std::path::{Path, PathBuf};

pub fn output_path(input: &Path, suffix: &str, ext: &str) -> PathBuf {
    let stem = input
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "output".into());
    let dir = input.parent().unwrap_or(Path::new("."));
    dir.join(format!("{stem}.{suffix}.{ext}"))
}

pub fn dedupe(p: &Path) -> PathBuf {
    if !p.exists() {
        return p.to_path_buf();
    }
    let stem = p
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_default();
    let ext = p
        .extension()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_default();
    let dir = p.parent().unwrap_or(Path::new("."));
    for i in 1.. {
        let cand = dir.join(format!("{stem} ({i}).{ext}"));
        if !cand.exists() {
            return cand;
        }
    }
    unreachable!()
}

/// The name a finished file takes before any collision handling:
/// `{stem}.{suffix}.{ext}` — the recipe's `output.suffix`, or its id when it
/// declares none — in `base_dir` when the caller names one, next to the input
/// otherwise.
///
/// **The single source of that rule.** Everything that needs to know where a
/// recipe's output goes comes through here: the app's `Queue::plan_unique` (which
/// adds its own ` (N)` dedupe against both the filesystem and pending jobs), the
/// command preview shown before Add, the enqueue-time free-space check, and
/// [`plan_output`] below. A second copy would let the preview and the run disagree
/// about the path — which is exactly what having two of them once did.
pub fn planned_path(recipe: &Recipe, input: &Path, base_dir: Option<&Path>) -> PathBuf {
    let suffix = recipe
        .output
        .suffix
        .clone()
        .unwrap_or_else(|| recipe.id.clone());
    let beside = output_path(input, &suffix, &recipe.output.ext);
    match base_dir {
        // `file_name` is `Some` for everything `output_path` can build (it always
        // appends `stem.suffix.ext`), so the fallback is unreachable rather than
        // meaningful.
        Some(dir) => dir.join(beside.file_name().unwrap_or_default()),
        None => beside,
    }
}

/// [`planned_path`] next to the input, stepped aside from whatever is already on
/// disk.
///
/// The planner for callers whose only rival is the filesystem — the smoke runner,
/// which has no queue. The app deliberately does **not** use this: two enqueues
/// issued before the first job runs would both be handed the same free path, so
/// `Queue::plan_unique` dedupes against pending reservations as well.
pub fn plan_output(recipe: &Recipe, input: &Path) -> PathBuf {
    dedupe(&planned_path(recipe, input, None))
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
        assert_eq!(
            p.file_name().unwrap().to_string_lossy(),
            "in.extract-audio-mp3.mp3"
        );
    }

    #[test]
    fn plan_output_uses_output_suffix() {
        let r = recipe_with_output("{ext: mp3, suffix: audio}");
        assert_eq!(r.output.suffix.as_deref(), Some("audio"));
        let p = plan_output(&r, Path::new("/dir/in.mp4"));
        assert_eq!(p.file_name().unwrap().to_string_lossy(), "in.audio.mp3");
    }

    /// The half of the rule the app uses and `plan_output` does not: a fixed
    /// output folder keeps the name and changes only the directory. Pinned here
    /// because this function is the one copy of the rule — `Queue::plan_unique`
    /// and the command preview both read it, and a change that moved the name
    /// would move both without either noticing.
    #[test]
    fn planned_path_keeps_the_name_and_takes_the_base_dir() {
        let r = recipe_with_output("{ext: mp3, suffix: audio}");
        let input = Path::new("/dir/in.mp4");
        // No base dir: next to the input, byte for byte what `plan_output` plans
        // before its dedupe.
        assert_eq!(
            planned_path(&r, input, None),
            Path::new("/dir/in.audio.mp3")
        );
        // A base dir moves the file, never renames it.
        assert_eq!(
            planned_path(&r, input, Some(Path::new("/out/put"))),
            Path::new("/out/put/in.audio.mp3")
        );
        // The suffix fallback (recipe id) applies in the base dir just the same.
        let no_suffix = recipe_with_output("{ext: mp3}");
        assert_eq!(
            planned_path(&no_suffix, input, Some(Path::new("/out"))),
            Path::new("/out/in.extract-audio-mp3.mp3")
        );
    }
}
