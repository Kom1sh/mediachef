use mediachef_core::recipe::{Engine, MediaType};
use mediachef_core::{catalog, locate, naming, probe, runner, template};
use std::collections::HashMap;
use std::path::{Path, PathBuf};

fn fixture_for(types: &[MediaType], dir: &Path) -> Option<PathBuf> {
    for t in types {
        let f = match t {
            MediaType::Video | MediaType::Any => "tiny.mp4",
            MediaType::Audio => "tiny.mp3",
            MediaType::Image => "tiny.png",
            MediaType::Subtitle => continue,
        };
        let p = dir.join(f);
        if p.exists() {
            return Some(p);
        }
    }
    None
}

fn main() {
    let fixtures = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../fixtures");
    let ffmpeg = locate::ffmpeg().expect("ffmpeg not found");
    let ffprobe = locate::ffprobe().expect("ffprobe not found");
    let out_dir = fixtures.join("smoke-out");
    let _ = std::fs::remove_dir_all(&out_dir);
    std::fs::create_dir_all(&out_dir).unwrap();

    let mut failed = 0;
    // A run that skipped every recipe (missing fixtures) used to print
    // "all ffmpeg recipes passed" and exit 0 — a green CI proving nothing.
    let mut ran = 0;
    for r in catalog::bundled() {
        if !matches!(r.engine, Engine::Ffmpeg) {
            continue;
        }
        let Some(input) = fixture_for(&r.input.types, &fixtures) else {
            println!("SKIP {:<24} (no fixture)", r.id);
            continue;
        };
        // выводим в отдельную папку: подменяем input-путь копией
        let staged = out_dir.join(input.file_name().unwrap());
        if !staged.exists() {
            std::fs::copy(&input, &staged).unwrap();
        }
        let output = naming::plan_output(&r, &staged);
        let params = template::resolve_params(&r, &HashMap::new()).unwrap();
        let argv = template::build_argv(
            &r,
            &staged.display().to_string(),
            &output.display().to_string(),
            &params,
        )
        .unwrap();
        let res = runner::run_ffmpeg(
            &ffmpeg,
            &argv,
            Some(2.0),
            &runner::CancelToken::new(),
            |_| {},
        );
        ran += 1;
        let ok = res.is_ok() && output.exists() && probe::probe(&ffprobe, &output).is_ok();
        println!(
            "{} {:<24} -> {}",
            if ok { "PASS" } else { "FAIL" },
            r.id,
            output.file_name().unwrap().to_string_lossy()
        );
        if !ok {
            failed += 1;
            if let Err(e) = res {
                eprintln!("  {}\n  {}", e.message, e.stderr_tail);
            }
        }
    }
    if failed > 0 {
        eprintln!("{failed} recipe(s) failed");
        std::process::exit(1);
    }
    if ran == 0 {
        eprintln!("no recipe ran — fixtures missing? run ./fixtures/make.sh first");
        std::process::exit(1);
    }
    println!("all {ran} ffmpeg recipes passed");
}
