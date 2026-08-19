use crate::recipe::{load_all, Recipe};
use include_dir::{include_dir, Dir};

static RECIPES_DIR: Dir = include_dir!("$CARGO_MANIFEST_DIR/../../recipes");

pub fn bundled() -> Vec<Recipe> {
    let pairs: Vec<(String, String)> = RECIPES_DIR
        .files()
        .filter(|f| f.path().extension().is_some_and(|e| e == "yaml"))
        .map(|f| {
            (
                f.path().display().to_string(),
                f.contents_utf8().unwrap_or_default().to_string(),
            )
        })
        .collect();
    load_all(&pairs).expect("bundled recipes must be valid")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::recipe::{Engine, ParamType};
    use std::path::{Path, PathBuf};

    /// The recipe the IPC golden file is cut from. `include_dir` sorts its
    /// entries, so `bundled()[0]` is the alphabetically first YAML on every
    /// platform — pinned by name here so a rename fails loudly, not silently.
    const GOLDEN_RECIPE_ID: &str = "compress-video-crf";

    fn golden_path() -> PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR")).join("../../fixtures/ipc-recipe.golden.json")
    }

    // The webview's `Recipe` interface (app/src/lib/types.ts) is a hand-written
    // mirror of the Rust struct; nothing at build time links the two. This golden
    // file is the contract: it pins the exact JSON `invoke("recipes")` returns —
    // field names, lowercase enum spellings, `null` for absent options — and the
    // matching vitest reads the same file back through the TS type.
    // Regenerate deliberately: UPDATE_GOLDEN=1 cargo test -p mediachef-core.
    #[test]
    fn ipc_recipe_json_matches_golden() {
        let all = bundled();
        let first = &all[0];
        assert_eq!(
            first.id, GOLDEN_RECIPE_ID,
            "bundled()[0] moved; repoint GOLDEN_RECIPE_ID and regenerate the golden"
        );
        let actual = serde_json::to_value(first).expect("Recipe must serialize to JSON");

        if std::env::var_os("UPDATE_GOLDEN").is_some() {
            let pretty = serde_json::to_string_pretty(&actual).unwrap();
            std::fs::write(golden_path(), format!("{pretty}\n")).unwrap();
        }

        let raw = std::fs::read_to_string(golden_path()).expect("golden file missing");
        let golden: serde_json::Value = serde_json::from_str(&raw).expect("golden is not JSON");
        assert_eq!(
            actual, golden,
            "IPC shape changed — update app/src/lib/types.ts to match, then rerun with UPDATE_GOLDEN=1"
        );
    }

    #[test]
    fn all_bundled_recipes_valid() {
        let all = bundled();
        assert!(all.len() >= 9, "expected >=9 recipes, got {}", all.len());
        for r in &all {
            if matches!(r.engine, Engine::Ffmpeg) && r.id != "custom-ffmpeg" {
                assert!(
                    r.args.iter().any(|a| a.contains("{input}")),
                    "{} lacks {{input}}",
                    r.id
                );
                assert!(
                    r.args.iter().any(|a| a.contains("{output}")),
                    "{} lacks {{output}}",
                    r.id
                );
            }
            assert!(
                !r.title.ru.is_empty() && !r.title.en.is_empty(),
                "{} title",
                r.id
            );
            assert!(!r.aliases.ru.is_empty(), "{} needs ru aliases", r.id);
            // `whisper: {translate: true}` on an ffmpeg recipe reads as wired and
            // does nothing — the same class of bug `deny_unknown_fields` exists for.
            assert!(
                matches!(r.engine, Engine::Whisper) || r.whisper.is_none(),
                "{}: `whisper:` on a non-whisper recipe would be ignored",
                r.id
            );
        }
    }

    // Every bundled recipe must survive its own defaults. For ffmpeg that means a
    // real argv — catches a typo'd param placeholder or an enum default outside its
    // `values` list, neither of which the placeholder grep above can see. Whisper
    // recipes carry no `args:` at all: the queue assembles that command from the
    // output extension plus the model/language params, so those are what has to
    // hold up here. Nothing external is needed either way — no ffmpeg, no models.
    #[test]
    fn all_recipes_resolve_to_argv() {
        use crate::template::{build_argv, resolve_params};
        use crate::transcribe::WhisperFormat;
        use std::collections::HashMap;

        for r in bundled() {
            let resolved = resolve_params(&r, &HashMap::new())
                .unwrap_or_else(|e| panic!("{}: resolve_params failed: {e}", r.id));
            match r.engine {
                Engine::Ffmpeg => {
                    let argv = build_argv(&r, "/tmp/in file.mp4", "/tmp/out.mp4", &resolved)
                        .unwrap_or_else(|e| panic!("{}: build_argv failed: {e}", r.id));
                    assert!(!argv.is_empty(), "{}: built an empty argv", r.id);
                }
                Engine::Whisper => {
                    // Nothing consumes `args:` for whisper, so a token written there
                    // would be dead text that looks like a flag being passed.
                    assert!(
                        r.args.is_empty(),
                        "{}: whisper builds its own command — `args:` is ignored",
                        r.id
                    );
                    assert!(
                        WhisperFormat::from_ext(&r.output.ext).is_some(),
                        "{}: whisper cannot write .{} — output.ext must be txt/srt/vtt/json",
                        r.id,
                        r.output.ext
                    );
                    // The type matters as much as the key: `type: string` would
                    // resolve fine here and then render as a free-text box instead of
                    // the model picker / language list, so pin both.
                    for (key, want) in [
                        ("model", ParamType::Model),
                        ("language", ParamType::Language),
                    ] {
                        assert!(
                            resolved.contains_key(key),
                            "{}: whisper recipe needs a `{key}` param with a default",
                            r.id
                        );
                        let p = r
                            .params
                            .iter()
                            .find(|p| p.key == key)
                            .expect("resolved key must come from a param");
                        assert_eq!(
                            p.r#type,
                            want,
                            "{}: param `{key}` must be `type: {}`",
                            r.id,
                            serde_json::to_string(&want).unwrap()
                        );
                    }
                }
                Engine::Pipeline => {}
            }
        }
    }

    // Wave 2's product surface is these eight transcription recipes; the search
    // index and the SEO slugs are cut from them, so losing one is a silent feature
    // regression rather than a broken build.
    #[test]
    fn whisper_recipes_present() {
        let n = bundled()
            .iter()
            .filter(|r| matches!(r.engine, Engine::Whisper))
            .count();
        assert!(n >= 8, "expected >=8 whisper recipes, got {n}");
    }

    // Two recipes with DISTINCT ids but the SAME seo.slug must be rejected —
    // pins the slug branch of load_all, which the id-duplicate test cannot reach.
    #[test]
    fn slug_collision_rejected() {
        const A: &str = r#"
id: recipe-a
category: c
title: {en: A, ru: А}
aliases: {en: [a], ru: [а]}
description: {en: D, ru: Д}
input: {types: [video]}
params: []
engine: ffmpeg
args: ["-i", "{input}", "{output}"]
output: {ext: mp4}
seo: {slug: same-slug, priority: high}
"#;
        const B: &str = r#"
id: recipe-b
category: c
title: {en: B, ru: Б}
aliases: {en: [b], ru: [б]}
description: {en: D, ru: Д}
input: {types: [video]}
params: []
engine: ffmpeg
args: ["-i", "{input}", "{output}"]
output: {ext: mkv}
seo: {slug: same-slug, priority: high}
"#;
        let e = load_all(&[("a.yaml".into(), A.into()), ("b.yaml".into(), B.into())]).unwrap_err();
        assert!(e.to_string().contains("duplicate"), "unexpected error: {e}");
        assert!(e.to_string().contains("same-slug"), "unexpected error: {e}");
    }
}
