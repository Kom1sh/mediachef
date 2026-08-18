pub mod queue;

use mediachef_core::recipe::Recipe;
use mediachef_core::{catalog, locate, naming, probe, template};
use queue::{Queue, TestOutcome};
use std::collections::HashMap;
use std::sync::mpsc::channel;
use tauri::{Emitter, State};

/// Idle poll of the single worker thread when the queue is empty.
const WORKER_IDLE_MS: u64 = 200;

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

#[tauri::command]
fn preview(
    state: State<AppState>,
    recipe_id: String,
    input: String,
    params: HashMap<String, String>,
) -> Result<Vec<String>, String> {
    let r = find_recipe(&state.recipes, &recipe_id)?;
    let resolved = template::resolve_params(r, &params).map_err(|e| e.to_string())?;
    let output = naming::plan_output(r, std::path::Path::new(&input));
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
            // воркер очереди: одна задача за раз
            let worker_q = q.clone();
            std::thread::spawn(move || {
                let ffmpeg = locate::ffmpeg();
                loop {
                    let ran = worker_q.run_next(|job, on_p| {
                        let ffmpeg = ffmpeg
                            .as_ref()
                            .ok_or("ffmpeg not found (brew install ffmpeg)".to_string())?;
                        match mediachef_core::runner::run_ffmpeg(
                            ffmpeg, &job.1, job.2, &job.3, on_p,
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
