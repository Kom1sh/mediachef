//! Runs every bundled recipe against the media fixtures and reports one row per
//! recipe. Two lanes: ffmpeg recipes (always required to run — see the `ran`
//! guard) and whisper recipes, which need whisper-cli, a tiny model and a voice
//! fixture and legitimately skip where those are absent (ubuntu CI has no TTS,
//! so `fixtures/speech.wav` is never built there).

use mediachef_core::burn::{self, BurnJob};
use mediachef_core::recipe::{Engine, MediaType, Recipe};
use mediachef_core::runner::{CancelToken, Outcome};
use mediachef_core::transcribe::{run_whisper, WhisperFormat, WhisperJob};
use mediachef_core::{catalog, fit, locate, models, naming, probe, runner, template};
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

/// One recipe's verdict. `Skip` is deliberately not a failure: a host without
/// whisper-cli, without a model or without a TTS voice cannot exercise that
/// recipe, and saying so beats either lying green or failing red.
enum Verdict {
    Pass,
    Fail,
    Skip,
}

/// Everything the whisper lane needs, resolved once. The `Err` carries the single
/// reason the whole lane cannot run, which each whisper recipe then reports as its
/// own SKIP row — one line per recipe, so the output still accounts for all of them.
struct WhisperEnv {
    bin: PathBuf,
    model: PathBuf,
    speech: PathBuf,
}

fn whisper_env(fixtures: &Path) -> Result<WhisperEnv, String> {
    let bin = locate::whisper().ok_or("whisper-cli not found — brew install whisper-cpp")?;
    // Deliberately *not* the app's own data dir: the smoke runner must never
    // depend on where a desktop install happens to keep models, and CI points
    // this at a cached download.
    let dir = std::env::var_os("MEDIACHEF_MODELS_DIR").ok_or("MEDIACHEF_MODELS_DIR unset")?;
    let model = models::model_path(Path::new(&dir), "tiny")
        .ok_or("ggml-tiny.bin not in MEDIACHEF_MODELS_DIR")?;
    let speech = fixtures.join("speech.wav");
    if !speech.exists() {
        return Err("fixtures/speech.wav missing — no TTS on this host".into());
    }
    Ok(WhisperEnv { bin, model, speech })
}

/// Stages a copy of `input` in `out_dir` so the planned output lands there too,
/// leaving `fixtures/` itself untouched across runs.
fn stage(input: &Path, out_dir: &Path) -> PathBuf {
    let staged = out_dir.join(input.file_name().unwrap());
    if !staged.exists() {
        std::fs::copy(input, &staged).unwrap();
    }
    staged
}

fn row(ok: bool, id: &str, output: &Path) -> Verdict {
    println!(
        "{} {:<24} -> {}",
        if ok { "PASS" } else { "FAIL" },
        id,
        output.file_name().unwrap().to_string_lossy()
    );
    if ok {
        Verdict::Pass
    } else {
        Verdict::Fail
    }
}

fn ffmpeg_recipe(
    r: &Recipe,
    fixtures: &Path,
    out_dir: &Path,
    ffmpeg: &Path,
    ffprobe: &Path,
) -> Verdict {
    let Some(input) = fixture_for(&r.input.types, fixtures) else {
        println!("SKIP {:<24} (no fixture)", r.id);
        return Verdict::Skip;
    };
    let staged = stage(&input, out_dir);
    let output = naming::plan_output(r, &staged);
    let mut params = template::resolve_params(r, &HashMap::new()).unwrap();
    // A `fit_size` recipe needs the clip's length for its bitrate, exactly as in
    // the app. No size check (`None`): the fixture is far below any target.
    if r.fit_size.is_some() {
        let info = probe::probe(ffprobe, &staged).unwrap();
        if let Err(e) = fit::derive(
            r,
            &mut params,
            info.duration_s,
            None,
            probe::has_audio(&info.raw),
        ) {
            println!("FAIL {:<24} (fit: {e})", r.id);
            return Verdict::Fail;
        }
    }
    let argv = template::build_argv(
        r,
        &staged.display().to_string(),
        &output.display().to_string(),
        &params,
    )
    .unwrap();
    let res = runner::run_ffmpeg(ffmpeg, &argv, Some(2.0), &CancelToken::new(), |_| {});
    let ok = res.is_ok() && output.exists() && probe::probe(ffprobe, &output).is_ok();
    let verdict = row(ok, &r.id, &output);
    if let Err(e) = &res {
        eprintln!("  {}\n  {}", e.message, e.stderr_tail);
    }
    verdict
}

/// The burn recipe's second half on its own: a hand-written SRT drawn into the
/// video fixture. Needs nothing but ffmpeg, so it runs on every host — this is
/// what tells a CI image whose ffmpeg lacks libass (or fonts) from a working one.
fn burn_step(
    r: &Recipe,
    fixtures: &Path,
    out_dir: &Path,
    ffmpeg: &Path,
    ffprobe: &Path,
) -> Verdict {
    let staged = stage(&fixtures.join("tiny.mp4"), out_dir);
    let tmp = tempfile::tempdir().unwrap();
    std::fs::write(
        tmp.path().join(burn::SUBS_FILE),
        "1\n00:00:00,000 --> 00:00:02,000\nMediaChef smoke\n",
    )
    .unwrap();
    let output = out_dir.join("tiny.burn-step.mp4");
    let res = burn::burn_into(
        ffmpeg,
        tmp.path(),
        &staged,
        &output,
        Some(2.0),
        &CancelToken::new(),
        |_| {},
    );
    let ok = res.is_ok() && probe::probe(ffprobe, &output).is_ok();
    let verdict = row(ok, &format!("{} (step)", r.id), &output);
    if let Err(e) = &res {
        eprintln!("  {}\n  {}", e.message, e.stderr_tail);
    }
    verdict
}

/// The whole burn job: the voice fixture as a video, transcribed and drawn in.
fn burn_recipe(
    r: &Recipe,
    out_dir: &Path,
    ffmpeg: &Path,
    ffprobe: &Path,
    env: &WhisperEnv,
) -> Verdict {
    let video = out_dir.join("speech.mp4");
    let made = std::process::Command::new(ffmpeg)
        .args(["-v", "error", "-y", "-f", "lavfi", "-i"])
        .arg("color=c=black:s=320x240:r=10")
        .arg("-i")
        .arg(&env.speech)
        .args([
            "-shortest",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
        ])
        .arg(&video)
        .status()
        .is_ok_and(|s| s.success());
    if !made {
        println!("FAIL {:<24} (could not build speech.mp4)", r.id);
        return Verdict::Fail;
    }
    let output = naming::plan_output(r, &video);
    let job = BurnJob {
        transcript: WhisperJob {
            input: video,
            output: PathBuf::new(),
            model: env.model.clone(),
            language: "auto".into(),
            translate: false,
            format: WhisperFormat::Srt,
            prompt: String::new(),
        },
        output: output.clone(),
        duration_s: None,
    };
    let res = burn::run_burn(ffmpeg, &env.bin, &job, &CancelToken::new(), |_| {});
    let ok = matches!(res, Ok(Outcome::Done)) && probe::probe(ffprobe, &output).is_ok();
    let verdict = row(ok, &r.id, &output);
    if let Err(e) = &res {
        eprintln!("  {}\n  {}", e.message, e.stderr_tail);
    }
    verdict
}

/// Transcribes the voice fixture with the tiny model. Every whisper recipe gets
/// the same `speech.wav` regardless of its declared input types — `run_whisper`
/// decodes whatever ffmpeg can read, so a video-only recipe is exercised just as
/// honestly by audio, and `plan_output`'s dedupe keeps the two recipes that share
/// a suffix from writing over each other.
fn whisper_recipe(r: &Recipe, out_dir: &Path, ffmpeg: &Path, env: &WhisperEnv) -> Verdict {
    let staged = stage(&env.speech, out_dir);
    let output = naming::plan_output(r, &staged);
    let Some(format) = WhisperFormat::from_ext(&r.output.ext) else {
        // Not a skip: a whisper recipe naming an extension whisper cannot write is
        // a broken recipe, and the app would reject the job at runtime.
        println!(
            "FAIL {:<24} (no whisper format for .{})",
            r.id, r.output.ext
        );
        return Verdict::Fail;
    };
    let job = WhisperJob {
        input: staged,
        output: output.clone(),
        model: env.model.clone(),
        language: "auto".into(),
        translate: r.whisper.as_ref().is_some_and(|w| w.translate),
        format,
        // Рецепты словаря не имеют — он есть только у диктовки.
        prompt: String::new(),
    };
    let res = run_whisper(ffmpeg, &env.bin, &job, &CancelToken::new(), |_| {});
    // Non-empty is the point: whisper exits 0 having heard nothing, and an empty
    // transcript is exactly the regression a smoke run has to catch.
    let ok =
        matches!(res, Ok(Outcome::Done)) && std::fs::metadata(&output).is_ok_and(|m| m.len() > 0);
    let verdict = row(ok, &r.id, &output);
    if let Err(e) = &res {
        eprintln!("  {}\n  {}", e.message, e.stderr_tail);
    }
    verdict
}

fn main() {
    let fixtures = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../fixtures");
    let ffmpeg = locate::ffmpeg().expect("ffmpeg not found");
    let ffprobe = locate::ffprobe().expect("ffprobe not found");
    let out_dir = fixtures.join("smoke-out");
    let _ = std::fs::remove_dir_all(&out_dir);
    std::fs::create_dir_all(&out_dir).unwrap();
    let whisper = whisper_env(&fixtures);

    let mut failed = 0;
    // A run that skipped every recipe (missing fixtures) used to print
    // "all ffmpeg recipes passed" and exit 0 — a green CI proving nothing.
    let mut ran = 0;
    // Counted apart from `ran` on purpose: a whisper-less host must not be able to
    // satisfy the ffmpeg guard below with skips.
    let mut whisper_ran = 0;
    for r in catalog::bundled() {
        let is_burn = r.whisper.as_ref().is_some_and(|w| w.burn);
        if is_burn {
            // Counted in the ffmpeg lane: it needs no whisper and must pass anywhere.
            match burn_step(&r, &fixtures, &out_dir, &ffmpeg, &ffprobe) {
                Verdict::Fail => failed += 1,
                Verdict::Pass => ran += 1,
                Verdict::Skip => {}
            }
        }
        let verdict = match r.engine {
            Engine::Ffmpeg => ffmpeg_recipe(&r, &fixtures, &out_dir, &ffmpeg, &ffprobe),
            Engine::Whisper => match &whisper {
                Ok(env) if is_burn => burn_recipe(&r, &out_dir, &ffmpeg, &ffprobe, env),
                Ok(env) => whisper_recipe(&r, &out_dir, &ffmpeg, env),
                Err(reason) => {
                    println!("SKIP {:<24} ({reason})", r.id);
                    Verdict::Skip
                }
            },
            Engine::Pipeline => {
                println!("SKIP {:<24} (pipeline engine not covered yet)", r.id);
                Verdict::Skip
            }
        };
        match verdict {
            Verdict::Fail => failed += 1,
            // Both counters count passes, one per lane. So `ran` also covers the
            // case where nothing failed because nothing ffmpeg-shaped ever ran.
            Verdict::Pass if matches!(r.engine, Engine::Whisper) => whisper_ran += 1,
            Verdict::Pass => ran += 1,
            Verdict::Skip => {}
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
    println!("all {ran} ffmpeg recipes passed; {whisper_ran} whisper recipe(s) ran");
}
