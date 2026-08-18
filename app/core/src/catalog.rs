use include_dir::{include_dir, Dir};
use crate::recipe::{load_all, Recipe};

static RECIPES_DIR: Dir = include_dir!("$CARGO_MANIFEST_DIR/../../recipes");

pub fn bundled() -> Vec<Recipe> {
    let pairs: Vec<(String, String)> = RECIPES_DIR
        .files()
        .filter(|f| f.path().extension().is_some_and(|e| e == "yaml"))
        .map(|f| (f.path().display().to_string(), f.contents_utf8().unwrap_or_default().to_string()))
        .collect();
    load_all(&pairs).expect("bundled recipes must be valid")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::recipe::Engine;

    #[test]
    fn all_bundled_recipes_valid() {
        let all = bundled();
        assert!(all.len() >= 9, "expected >=9 recipes, got {}", all.len());
        for r in &all {
            if matches!(r.engine, Engine::Ffmpeg) && r.id != "custom-ffmpeg" {
                assert!(r.args.iter().any(|a| a.contains("{input}")), "{} lacks {{input}}", r.id);
                assert!(r.args.iter().any(|a| a.contains("{output}")), "{} lacks {{output}}", r.id);
            }
            assert!(!r.title.ru.is_empty() && !r.title.en.is_empty(), "{} title", r.id);
            assert!(!r.aliases.ru.is_empty(), "{} needs ru aliases", r.id);
        }
    }

    // Every bundled ffmpeg recipe must build a real argv from its own defaults.
    // Catches a typo'd param placeholder or an enum default outside its `values`
    // list — neither of which the placeholder grep above can see. No ffmpeg needed.
    #[test]
    fn all_recipes_resolve_to_argv() {
        use crate::template::{build_argv, resolve_params};
        use std::collections::HashMap;

        for r in bundled() {
            if !matches!(r.engine, Engine::Ffmpeg) {
                continue;
            }
            let resolved = resolve_params(&r, &HashMap::new())
                .unwrap_or_else(|e| panic!("{}: resolve_params failed: {e}", r.id));
            let argv = build_argv(&r, "/tmp/in file.mp4", "/tmp/out.mp4", &resolved)
                .unwrap_or_else(|e| panic!("{}: build_argv failed: {e}", r.id));
            assert!(!argv.is_empty(), "{}: built an empty argv", r.id);
        }
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
