pub mod queue;

use mediachef_core::recipe::{Engine, Recipe};
use mediachef_core::transcribe::{WhisperFormat, WhisperJob};
use mediachef_core::{catalog, locate, models, naming, probe, template};
use queue::{Queue, TestOutcome};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::mpsc::channel;
use tauri::{AppHandle, Emitter, Manager, State};

/// Idle poll of a worker thread when its lane is empty.
const WORKER_IDLE_MS: u64 = 200;

/// Where whisper's `ggml-*.bin` files live. Owned by the app, not core: only
/// Tauri knows the per-platform data dir. The Models screen writes here, the
/// whisper enqueue path reads.
fn models_dir(app: &AppHandle) -> PathBuf {
    app.path().app_data_dir().unwrap().join("models")
}

struct AppState {
    queue: Queue,
    recipes: Vec<Recipe>,
}

#[tauri::command]
fn recipes(state: State<AppState>) -> Vec<Recipe> {
    state.recipes.clone()
}

/// Every error string that reaches the webview goes through the humanizer first:
/// the raw ffprobe/io text survives only when the table has nothing friendlier
/// to say (spec §7 — the user should not have to read FFmpeg's stderr).
fn human(e: impl std::fmt::Display) -> String {
    let m = e.to_string();
    mediachef_core::errors::humanize(&m).unwrap_or(m)
}

/// `async` so the ffprobe spawn runs off the main thread — a slow or hung probe
/// must not freeze the window.
#[tauri::command(async)]
fn probe_file(path: String) -> Result<probe::ProbeInfo, String> {
    let fp = locate::ffprobe().ok_or("ffprobe not found (brew install ffmpeg)")?;
    probe::probe(&fp, std::path::Path::new(&path)).map_err(human)
}

fn find_recipe<'a>(recipes: &'a [Recipe], id: &str) -> Result<&'a Recipe, String> {
    recipes
        .iter()
        .find(|r| r.id == id)
        .ok_or_else(|| format!("recipe {id} not found"))
}

/// Assembles the whisper run from the recipe and the resolved params. Three
/// rules live here:
/// * the model must already be on disk — this is the only place that can tell
///   the user *why* a transcription cannot start;
/// * `language` passes through untouched: whisper owns that table, and it
///   complains loudly enough for the stderr tail to explain a bad code;
/// * the format comes strictly from the recipe's output extension, so the
///   transcript's name and whisper's `--output-*` flag can never disagree (a
///   mismatch would leave the finished file next to the expected one).
fn whisper_job(
    app: &AppHandle,
    r: &Recipe,
    input: &str,
    output: &Path,
    resolved: &HashMap<String, String>,
) -> Result<WhisperJob, String> {
    let model_id = resolved
        .get("model")
        .ok_or_else(|| format!("recipe {} declares no model param", r.id))?;
    let model = models::model_path(&models_dir(app), model_id)
        .ok_or_else(|| format!("model {model_id} is not downloaded — open Models"))?;
    let format = WhisperFormat::from_ext(&r.output.ext)
        .ok_or_else(|| format!("recipe {} cannot write .{} transcripts", r.id, r.output.ext))?;
    Ok(WhisperJob {
        input: PathBuf::from(input),
        output: output.to_path_buf(),
        model,
        // A recipe without a `language` param means "let whisper detect it".
        language: resolved
            .get("language")
            .cloned()
            .unwrap_or_else(|| "auto".into()),
        translate: r.whisper.as_ref().is_some_and(|w| w.translate),
        format,
    })
}

/// A whisper recipe's `args:` is empty by design — the queue assembles the
/// command — so `build_argv` would hand the UI an empty preview. This shows the
/// real shape of the run instead, in `run_whisper`'s own flag order. Two spots
/// read as the user's intent rather than the literal child process: `-f` names
/// the input file where whisper is really fed a 16kHz WAV decoded into a tempdir,
/// and `--output-file` names the planned transcript where whisper really writes
/// a temp prefix that is renamed into place. The rest is verbatim.
fn whisper_preview(job: &WhisperJob) -> Vec<String> {
    let mut argv = vec![
        "whisper-cli".to_string(),
        "-m".into(),
        job.model.display().to_string(),
        "-f".into(),
        job.input.display().to_string(),
        "-l".into(),
        job.language.clone(),
        "--print-progress".into(),
        job.format.flag().into(),
        "--output-file".into(),
        job.output.display().to_string(),
    ];
    if job.translate {
        argv.push("--translate".into());
    }
    argv
}

#[tauri::command]
fn preview(
    app: AppHandle,
    state: State<AppState>,
    recipe_id: String,
    input: String,
    params: HashMap<String, String>,
) -> Result<Vec<String>, String> {
    let r = find_recipe(&state.recipes, &recipe_id)?;
    let resolved = template::resolve_params(r, &params).map_err(|e| e.to_string())?;
    let output = naming::plan_output(r, std::path::Path::new(&input));
    if matches!(r.engine, Engine::Whisper) {
        // Surfaces the missing-model error on purpose: the preview pane is where
        // the user should learn the job cannot run, before clicking Add.
        let job = whisper_job(&app, r, &input, &output, &resolved).map_err(human)?;
        return Ok(whisper_preview(&job));
    }
    template::build_argv(r, &input, &output.display().to_string(), &resolved)
        .map_err(|e| e.to_string())
}

/// Ruling 19 (spec §7 "never silently overwrite"): the output path comes from
/// `Queue::plan_unique`, not `naming::plan_output` — the latter dedupes against
/// the filesystem only, so two identical enqueues issued before the first job
/// runs would both plan the same path and the second run would overwrite the
/// first's output. `async` for the same reason as `probe_file`.
#[tauri::command(async)]
fn enqueue(
    app: AppHandle,
    state: State<AppState>,
    recipe_id: String,
    input: String,
    params: HashMap<String, String>,
) -> Result<u64, String> {
    let r = find_recipe(&state.recipes, &recipe_id)?;
    let fp = locate::ffprobe().ok_or("ffprobe not found (brew install ffmpeg)")?;
    let info = probe::probe(&fp, std::path::Path::new(&input)).map_err(human)?;
    // Ruling 20 / spec §8: validate before launching, not after ffmpeg fails.
    if !queue::input_accepted(&r.input.types, info.media_type) {
        return Err(format!(
            "recipe {recipe_id} does not accept {} input",
            info.media_type
        ));
    }
    let resolved = template::resolve_params(r, &params).map_err(human)?;
    // Reserved from here on; release it if we bail out before `push`.
    let output = state.queue.plan_unique(r, std::path::Path::new(&input));
    let out_s = output.display().to_string();
    if matches!(r.engine, Engine::Whisper) {
        let job = match whisper_job(&app, r, &input, &output, &resolved) {
            Ok(job) => job,
            Err(e) => {
                state.queue.unreserve(&out_s);
                return Err(human(e));
            }
        };
        return Ok(state
            .queue
            .push_spec(recipe_id, input, out_s, queue::JobSpec::Whisper { job }));
    }
    let argv = match template::build_argv(r, &input, &out_s, &resolved) {
        Ok(argv) => argv,
        Err(e) => {
            state.queue.unreserve(&out_s);
            return Err(human(e));
        }
    };
    Ok(state
        .queue
        .push(recipe_id, input, out_s, argv, info.duration_s))
}

#[tauri::command]
fn cancel(state: State<AppState>, id: u64) {
    state.queue.cancel(id);
}

#[tauri::command]
fn jobs(state: State<AppState>) -> Vec<queue::JobView> {
    state.queue.views()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let (tx, rx) = channel::<queue::JobView>();
    let q = Queue::new(tx);
    let state = AppState {
        queue: q.clone(),
        recipes: catalog::bundled(),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .manage(state)
        .setup(move |app| {
            // ретрансляция событий очереди в webview
            let handle = app.handle().clone();
            std::thread::spawn(move || {
                for view in rx {
                    let _ = handle.emit("job:update", view);
                }
            });
            // Два воркера, по одному на полосу: транскрибация занимает минуты, и
            // ffmpeg-очередь всё это время обязана разбираться. Внутри полосы
            // по-прежнему одна задача за раз — обе жгут все ядра.
            let ffmpeg_q = q.clone();
            std::thread::spawn(move || {
                let ffmpeg = locate::ffmpeg();
                loop {
                    let ran = ffmpeg_q.run_next_lane(queue::Lane::Ffmpeg, |job, on_p| {
                        let ffmpeg = ffmpeg
                            .as_ref()
                            .ok_or("ffmpeg not found (brew install ffmpeg)".to_string())?;
                        let queue::JobSpec::Ffmpeg { argv, duration_s } = &job.spec else {
                            return Err("not an ffmpeg job".to_string());
                        };
                        match mediachef_core::runner::run_ffmpeg(
                            ffmpeg,
                            argv,
                            *duration_s,
                            &job.cancel,
                            on_p,
                        ) {
                            Ok(_) => Ok(TestOutcome::Done),
                            Err(e) => Err(format!("{}\n{}", e.message, e.stderr_tail)),
                        }
                    });
                    if !ran {
                        std::thread::sleep(std::time::Duration::from_millis(WORKER_IDLE_MS));
                    }
                }
            });
            // Воркер whisper-полосы. ffmpeg тоже нужен: он готовит 16kHz WAV.
            let whisper_q = q.clone();
            std::thread::spawn(move || {
                let ffmpeg = locate::ffmpeg();
                let whisper = locate::whisper();
                loop {
                    let ran = whisper_q.run_next_lane(queue::Lane::Whisper, |job, on_p| {
                        let ffmpeg = ffmpeg
                            .as_ref()
                            .ok_or("ffmpeg not found (brew install ffmpeg)".to_string())?;
                        let whisper = whisper.as_ref().ok_or(
                            "whisper-cli not found (brew install whisper-cpp)".to_string(),
                        )?;
                        let queue::JobSpec::Whisper { job: wj } = &job.spec else {
                            return Err("not a whisper job".to_string());
                        };
                        match mediachef_core::transcribe::run_whisper(
                            ffmpeg,
                            whisper,
                            wj,
                            &job.cancel,
                            on_p,
                        ) {
                            Ok(_) => Ok(TestOutcome::Done),
                            Err(e) => Err(format!("{}\n{}", e.message, e.stderr_tail)),
                        }
                    });
                    if !ran {
                        std::thread::sleep(std::time::Duration::from_millis(WORKER_IDLE_MS));
                    }
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            recipes, probe_file, preview, enqueue, cancel, jobs
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
