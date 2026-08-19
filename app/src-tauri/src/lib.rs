pub mod queue;

use mediachef_core::process::CancelToken;
use mediachef_core::recipe::{Engine, Recipe};
use mediachef_core::transcribe::{WhisperFormat, WhisperJob};
use mediachef_core::{catalog, locate, models, naming, probe, template};
use queue::{Queue, TestOutcome};
use serde::Serialize;
use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use std::sync::mpsc::channel;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Manager, State};

/// Idle poll of a worker thread when its lane is empty.
const WORKER_IDLE_MS: u64 = 200;

/// How long a quit waits for the jobs it just cancelled to let go of their
/// children.
///
/// Cancelling only trips a token. The kill lands at the next turn of
/// `process::run_streaming`'s watchdog (150ms), and only *after* that does the
/// runner reap the child and — in whisper's case — drop the tempdir holding the
/// 16kHz WAV. All of it runs on worker threads, which a process exit takes down
/// where they stand: the child is reparented to launchd and keeps burning CPU,
/// and its tempdir stays in `/tmp` forever, because `Drop` does not run on exit.
/// So the quit blocks until the queue reports nothing `running` — typically under
/// 200ms — with this as the cap, on the theory that a wedged child should delay a
/// quit, not prevent it.
const SHUTDOWN_GRACE_MS: u64 = 2_000;
/// Poll of the "is anything still running?" wait. Deliberately much finer than
/// the 150ms watchdog tick it is waiting on, so the quit costs the kill's real
/// latency instead of a rounded-up multiple of it.
const SHUTDOWN_POLL_MS: u64 = 20;

/// Where whisper's `ggml-*.bin` files live. Owned by the app, not core: only
/// Tauri knows the per-platform data dir. The Models screen writes here, the
/// whisper enqueue path reads.
fn models_dir(app: &AppHandle) -> PathBuf {
    app.path().app_data_dir().unwrap().join("models")
}

/// Model downloads in flight, keyed by model id. Two jobs: it is the guard that
/// stops a second `models_download` for the same id from starting a rival thread
/// onto the same `.part` file, and it is the authority the `.part` sweep asks
/// before deleting anything.
type Downloads = Arc<Mutex<HashMap<String, CancelToken>>>;

struct AppState {
    queue: Queue,
    recipes: Vec<Recipe>,
    downloads: Downloads,
}

impl AppState {
    /// A handle the download thread can outlive the command with.
    fn downloads_arc(&self) -> Downloads {
        self.downloads.clone()
    }
}

/// Throttle between core's byte-level progress and the IPC channel.
///
/// `models::download` calls back every 64KB — ~25 000 times for the 1.6GB
/// large-v3-turbo model. Forwarding those 1:1 would flood the webview with
/// events describing states nobody can tell apart: the progress bar has about a
/// hundred of them. So a tick passes only when the *whole* percent changes,
/// which bounds one download to at most 101 progress events.
struct PercentGate(i32);

impl PercentGate {
    /// `-1` rather than `0`, so a download that opens at 0% still gets its first
    /// event through.
    fn new() -> Self {
        Self(-1)
    }

    fn admit(&mut self, percent: f32) -> bool {
        let p = percent as i32;
        if p == self.0 {
            return false;
        }
        self.0 = p;
        true
    }
}

/// Claims `id` for a new download, storing `cancel` so a later
/// `models_cancel_download` can find it. `false` means a download of that id is
/// already in flight.
///
/// The check and the claim happen inside ONE critical section: two clicks racing
/// on the same id must not both be told "go ahead" and start rival threads
/// writing the same `.part` file. Lock-then-insert, never contains-then-lock —
/// which is also why this is a function and not two lines in the command: the
/// atomicity is what the test hammers.
fn claim_download(downloads: &Downloads, id: &str, cancel: &CancelToken) -> bool {
    let mut dl = downloads.lock().unwrap();
    if dl.contains_key(id) {
        return false;
    }
    dl.insert(id.to_string(), cancel.clone());
    true
}

/// The model id a `{file_name}.part` belongs to, or `None` when no model we know
/// of claims that name.
fn part_owner(part: &str) -> Option<&'static str> {
    let base = part.strip_suffix(".part")?;
    models::known()
        .iter()
        .find(|m| m.file_name == base)
        .map(|m| m.id)
}

/// Which entries of a models-dir listing are `.part` garbage.
///
/// Pure, so the decision is testable without a filesystem or a running app.
/// `names` is the directory listing; `downloading` the ids whose download thread
/// is alive right now — their `.part` files are being written to and must be left
/// alone. Everything else that ends in `.part` is garbage from a hard kill (core's
/// `PartGuard` cleans up every ordinary failure, but `Drop` does not run on
/// SIGKILL), and unreachable garbage at that: `installed()` cannot see it and
/// `delete()` cannot remove it. A `.part` naming a model we no longer offer counts
/// too — no live download can own it, and nothing but this app writes here.
fn stale_parts<'a>(names: &'a [String], downloading: &HashSet<&str>) -> Vec<&'a str> {
    names
        .iter()
        .map(|s| s.as_str())
        .filter(|n| n.ends_with(".part"))
        .filter(|n| part_owner(n).is_none_or(|id| !downloading.contains(id)))
        .collect()
}

/// Deletes the stale `.part` files in `dir`.
///
/// The downloads lock is held across the whole sweep on purpose: it makes "this
/// id is downloading" and "this `.part` may be deleted" one atomic decision, so a
/// download that starts mid-sweep cannot have its freshly created `.part` swept
/// out from under it. Nothing is locked inside, so there is no ordering hazard.
fn sweep_parts(dir: &Path, downloads: &Downloads) {
    let live = downloads.lock().unwrap();
    let Ok(rd) = std::fs::read_dir(dir) else {
        return; // no models dir yet — nothing to sweep
    };
    let names: Vec<String> = rd
        .flatten()
        .map(|e| e.file_name().to_string_lossy().into_owned())
        .collect();
    let ids: HashSet<&str> = live.keys().map(|s| s.as_str()).collect();
    for n in stale_parts(&names, &ids) {
        let _ = std::fs::remove_file(dir.join(n));
    }
}

/// One row of the Models screen. `installed` and `downloading` are the two states
/// the UI switches on; `approx_bytes` is the table's estimate, not the real
/// Content-Length.
#[derive(Serialize)]
struct ModelView {
    id: String,
    note_en: String,
    note_ru: String,
    approx_bytes: u64,
    installed: bool,
    /// True while a download thread for this id is alive. Lets the panel come
    /// back from a tab switch showing a progress row instead of a Download button
    /// that would only answer "already downloading".
    downloading: bool,
}

/// `async` for the same reason as `probe_file`: this reads the models directory
/// and sweeps stale `.part` files, so it is disk IO and has no business running
/// on the main thread.
#[tauri::command(async)]
fn models_list(app: AppHandle, state: State<AppState>) -> Vec<ModelView> {
    let dir = models_dir(&app);
    sweep_parts(&dir, &state.downloads);
    let live: HashSet<String> = state.downloads.lock().unwrap().keys().cloned().collect();
    models::installed(&dir)
        .into_iter()
        .map(|(m, inst)| ModelView {
            id: m.id.into(),
            note_en: m.note_en.into(),
            note_ru: m.note_ru.into(),
            approx_bytes: m.approx_bytes,
            installed: inst,
            downloading: live.contains(m.id),
        })
        .collect()
}

/// Starts a download in its own thread and returns immediately; progress arrives
/// as `model:progress` events. The only synchronous failure is the duplicate
/// guard.
#[tauri::command(async)]
fn models_download(app: AppHandle, state: State<AppState>, id: String) -> Result<(), String> {
    let dir = models_dir(&app);
    let cancel = CancelToken::new();
    if !claim_download(&state.downloads, &id, &cancel) {
        return Err("already downloading".into());
    }
    let downloads = state.downloads_arc();
    let app2 = app.clone();
    let id2 = id.clone();
    std::thread::spawn(move || {
        let emit = |percent: f32, done: bool, error: Option<String>| {
            let _ = app2.emit(
                "model:progress",
                serde_json::json!({"id": id2, "percent": percent, "done": done, "error": error}),
            );
        };
        let mut gate = PercentGate::new();
        let res = models::download(&dir, &id2, &cancel, |p| {
            if gate.admit(p) {
                emit(p, false, None);
            }
        });
        // Release the claim BEFORE announcing the end, in that order for two
        // reasons. It cannot be earlier: the sweep trusts that while a `.part`
        // exists its id is in the map, and `download` returns only once the
        // `.part` is renamed (success) or unlinked (failure, core's `PartGuard`),
        // so this is the first safe moment. It must not be later: the panel
        // re-lists on the terminal event, and a lingering entry would answer
        // `downloading: true` for a download that is already over.
        downloads.lock().unwrap().remove(&id2);
        // The terminal event is never gated — the panel keeps its progress row
        // until this arrives, which is also what makes "Cancelling…" resolve.
        match res {
            Ok(_) => emit(100.0, true, None),
            // Humanized like every other error that reaches the webview: a full
            // disk is a real download failure and reads far better than the raw
            // `os error 28`. "cancelled" is not in the table and passes through.
            Err(e) => emit(0.0, true, Some(human(e))),
        }
    });
    Ok(())
}

/// Trips the token; the download thread notices at its next loop turn. With a
/// dead connection that is the next socket read, so up to the 30s read timeout —
/// the UI says "Cancelling…" until the terminal event lands rather than pretending
/// the download is already gone.
#[tauri::command]
fn models_cancel_download(state: State<AppState>, id: String) {
    if let Some(c) = state.downloads.lock().unwrap().get(&id) {
        c.cancel();
    }
}

/// `async`: unlinking a multi-gigabyte model file is disk IO.
#[tauri::command(async)]
fn models_delete(app: AppHandle, id: String) -> Result<(), String> {
    models::delete(&models_dir(&app), &id)
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

/// Stops everything this process started, and waits for it. Registered on the
/// quit path in [`run`]; nothing else calls it.
///
/// Without this a quit mid-job orphans the child: `whisper-cli` and `ffmpeg` are
/// spawned as plain children, so they survive their parent, and a transcription
/// keeps a core busy for minutes on a file nobody is waiting for any more. Its
/// tempdir survives too — `TempDir::drop` is what unlinks it, and a worker thread
/// killed by process exit never gets there.
///
/// Downloads are tripped but **not** waited for, and that asymmetry is deliberate.
/// A download's cancel is noticed at its next socket read, which on a dead
/// connection is up to the 30s read timeout — far too long to hold a quit — and it
/// leaves behind only a `.part` file, which the next `models_list` sweeps (that is
/// exactly the "garbage from a hard kill" case `stale_parts` exists for). An
/// orphaned child process has no such janitor.
fn shutdown(queue: &Queue, downloads: &Downloads) {
    for cancel in downloads.lock().unwrap().values() {
        cancel.cancel();
    }
    if queue.cancel_all_active() == 0 {
        return; // no child was running: nothing to wait for
    }
    let deadline = std::time::Instant::now() + std::time::Duration::from_millis(SHUTDOWN_GRACE_MS);
    // A job leaves `running` only when its worker has returned from
    // `run_ffmpeg`/`run_whisper`, which happens after the child is dead and
    // reaped. That is why this waits on the queue's own status rather than
    // sleeping a fixed span: the queue already knows.
    while queue.views().iter().any(|v| v.status == "running")
        && std::time::Instant::now() < deadline
    {
        std::thread::sleep(std::time::Duration::from_millis(SHUTDOWN_POLL_MS));
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let (tx, rx) = channel::<queue::JobView>();
    let q = Queue::new(tx);
    let downloads = Downloads::default();
    let state = AppState {
        queue: q.clone(),
        recipes: catalog::bundled(),
        downloads: downloads.clone(),
    };
    // Handles for the exit hook at the bottom: `state` is about to be handed to
    // `manage`, and the setup closure below takes `q` by move.
    let (shutdown_q, shutdown_dl) = (q.clone(), downloads);

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
            recipes,
            probe_file,
            preview,
            enqueue,
            cancel,
            jobs,
            models_list,
            models_download,
            models_cancel_download,
            models_delete
        ])
        // `build` + `run(callback)` rather than plain `run(context)`, which is the
        // same thing with an empty callback — the callback is the only place a
        // Tauri app can see the quit coming.
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(move |_app, event| {
            // Both arms, because neither covers every way out on its own (tauri
            // 2.11 / tauri-runtime-wry 2.11 / tao 0.35):
            //
            // * closing the last window and `AppHandle::exit` raise
            //   `ExitRequested` first, then `Exit`;
            // * macOS Cmd+Q (and the Dock's Quit, and an Apple "quit" event) go
            //   through AppKit's `terminate:` → `applicationWillTerminate` → tao's
            //   `Event::LoopDestroyed`, which is `Exit` with NO `ExitRequested`
            //   before it.
            //
            // `Exit` alone would therefore do, but catching `ExitRequested` too
            // starts the kill a moment earlier on the paths that have it, while the
            // event loop is still up. Running twice is free: `shutdown` finds
            // nothing left the second time.
            //
            // Neither arm can help against SIGKILL or macOS "Force Quit", and this
            // app installs no signal handler, so a plain `kill`/SIGTERM does not
            // reach it either. Those are precisely the cases the `.part` sweep in
            // `models_list` is there to clean up after.
            if matches!(
                event,
                tauri::RunEvent::ExitRequested { .. } | tauri::RunEvent::Exit
            ) {
                shutdown(&shutdown_q, &shutdown_dl);
            }
        });
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The whole point of the gate: `models::download` reports every 64KB, which
    /// for the 1.6GB large-v3-turbo model is ~25 000 callbacks. A progress bar has
    /// ~100 distinguishable states, so the IPC channel must see ~100 events, not
    /// 25 000.
    #[test]
    fn percent_gate_bounds_progress_events() {
        const TICKS: usize = 25_000;
        let mut gate = PercentGate::new();
        let emitted = (0..TICKS)
            .filter(|i| gate.admit(*i as f32 * 100.0 / TICKS as f32))
            .count();
        // 0…99 — the terminal 100 is emitted outside the gate, unconditionally.
        assert_eq!(
            emitted, 100,
            "one event per whole percent expected, got {emitted} of {TICKS} ticks"
        );
    }

    /// Two properties the download thread relies on: the very first tick is never
    /// swallowed (a 0% start must show up), and a percent that has already been
    /// sent is never sent twice.
    #[test]
    fn percent_gate_admits_first_tick_and_dedupes() {
        let mut gate = PercentGate::new();
        assert!(gate.admit(0.0), "the first tick must reach the UI");
        assert!(!gate.admit(0.4), "same whole percent, no new information");
        assert!(gate.admit(1.0));
        assert!(!gate.admit(1.9));
        assert!(gate.admit(100.0));
        assert!(!gate.admit(100.0));
    }

    /// The duplicate-download guard, hammered. Two rival clicks on one Download
    /// button must not both start a thread onto the same `.part` file, and the
    /// only thing standing between them is that the check and the claim share a
    /// single critical section. Sixteen threads, exactly one winner.
    #[test]
    fn only_one_racing_claim_wins() {
        use std::sync::atomic::{AtomicUsize, Ordering};
        let downloads = Downloads::default();
        let winners = AtomicUsize::new(0);
        std::thread::scope(|s| {
            for _ in 0..16 {
                s.spawn(|| {
                    if claim_download(&downloads, "tiny", &CancelToken::new()) {
                        winners.fetch_add(1, Ordering::SeqCst);
                    }
                });
            }
        });
        assert_eq!(winners.load(Ordering::SeqCst), 1, "rival downloads started");
        // The winner's token has to be reachable, or the ✕ button cancels nothing.
        assert!(downloads.lock().unwrap().contains_key("tiny"));
        // And the claim is a lease: releasing it lets the next download in.
        downloads.lock().unwrap().remove("tiny");
        assert!(claim_download(&downloads, "tiny", &CancelToken::new()));
    }

    /// A `.part` file survives an app kill (`Drop` never runs, so core's
    /// `PartGuard` cannot clean up) and is then unreachable: `installed()` cannot
    /// see it and `delete()` cannot remove it. The sweep is the only thing that
    /// can — but it must not touch the `.part` of a download that is running right
    /// now, which is exactly what the downloads map knows.
    #[test]
    fn sweep_spares_live_downloads_and_takes_the_rest() {
        let names: Vec<String> = [
            "ggml-tiny.bin.part",
            "ggml-small.bin.part",
            "ggml-base.bin",
            "ggml-large-v3-turbo.bin.part",
        ]
        .iter()
        .map(|s| s.to_string())
        .collect();
        let live: HashSet<&str> = ["small"].into_iter().collect();

        let stale = stale_parts(&names, &live);
        assert!(
            !stale.contains(&"ggml-small.bin.part"),
            "swept a live download's .part: {stale:?}"
        );
        assert!(
            !stale.contains(&"ggml-base.bin"),
            "swept an installed model: {stale:?}"
        );
        assert_eq!(
            stale,
            vec!["ggml-tiny.bin.part", "ggml-large-v3-turbo.bin.part"]
        );
    }

    /// The whole model-manager story against the real Hugging Face endpoint, which
    /// is the only place the throttle's actual numbers can be observed: download
    /// the 78MB tiny model, sweep, delete, then re-download and cancel mid-flight.
    /// Opt-in because it needs the network and moves 156MB:
    ///
    /// ```text
    /// cargo test --manifest-path app/src-tauri/Cargo.toml -- --ignored --nocapture
    /// ```
    ///
    /// One admitted tick is exactly one `app.emit`, so the printed counts are the
    /// IPC event counts.
    #[test]
    #[ignore = "network: downloads the real 78MB tiny model twice"]
    fn real_tiny_download_sweep_delete_and_cancel() {
        let dir = tempfile::tempdir().unwrap();
        let downloads = Downloads::default();

        // 1. Download, with the production gate in the callback.
        let cancel = CancelToken::new();
        assert!(claim_download(&downloads, "tiny", &cancel));
        let (mut ticks, mut emitted) = (0usize, 0usize);
        let mut gate = PercentGate::new();
        let t0 = std::time::Instant::now();
        let installed = models::download(dir.path(), "tiny", &cancel, |p| {
            ticks += 1;
            if gate.admit(p) {
                emitted += 1;
            }
        })
        .expect("download tiny");
        println!(
            "tiny: {ticks} core ticks -> {emitted} IPC events in {:?}",
            t0.elapsed()
        );
        assert!(installed.exists());
        assert!(emitted <= 101, "throttle let {emitted} events through");
        assert!(ticks > emitted, "{ticks} ticks were not throttled at all");
        downloads.lock().unwrap().remove("tiny");

        // 2. A finished download leaves no `.part`, and the sweep does not eat the
        //    model it just installed.
        sweep_parts(dir.path(), &downloads);
        assert!(installed.exists(), "sweep deleted an installed model");
        assert!(!dir.path().join("ggml-tiny.bin.part").exists());

        // 3. Delete.
        models::delete(dir.path(), "tiny").unwrap();
        assert!(models::model_path(dir.path(), "tiny").is_none());

        // 4. Re-download, cancelled at ~5% — from inside the progress callback, so
        //    the cancel lands mid-transfer no matter how fast the link is.
        let cancel2 = CancelToken::new();
        assert!(claim_download(&downloads, "tiny", &cancel2));
        let err = models::download(dir.path(), "tiny", &cancel2, |p| {
            if p > 5.0 {
                cancel2.cancel();
            }
        })
        .unwrap_err();
        println!("cancelled mid-download -> {err:?}");
        assert_eq!(err, "cancelled");
        assert!(
            models::model_path(dir.path(), "tiny").is_none(),
            "a cancelled download must not install a truncated model"
        );
        assert_eq!(
            std::fs::read_dir(dir.path()).unwrap().count(),
            0,
            "a cancelled download must leave nothing behind"
        );
        downloads.lock().unwrap().remove("tiny");
    }

    /// The quit hook against a real child process. A transcription that is running
    /// when the user hits Cmd+Q must be *dead* before `shutdown` returns, because
    /// what follows it is the process exit — and a `whisper-cli` that survives that
    /// is reparented to launchd and keeps a core busy on a file nobody wants.
    ///
    /// `/bin/sleep` stands in for whisper-cli: a child that would far outlive the
    /// app if nothing killed it. The load-bearing assertion is the job's status —
    /// `run_next_lane` writes `cancelled` only after its runner returned, and
    /// `run_streaming` returns only once the child has been killed *and* reaped. A
    /// `shutdown` that returned a moment too early cannot produce it.
    #[cfg(unix)]
    #[test]
    fn shutdown_kills_a_running_child_and_trips_downloads() {
        use mediachef_core::process::run_streaming;

        let (q, _rx) = Queue::new_for_test();
        let running = q.push_test_job();
        let queued = q.push_test_job();
        // A model download in flight at the same time: its thread has no child to
        // kill, but its token must still be tripped.
        let downloads = Downloads::default();
        let token = CancelToken::new();
        assert!(claim_download(&downloads, "tiny", &token));

        let worker = {
            let q = q.clone();
            std::thread::spawn(move || {
                q.run_next_lane(queue::Lane::Ffmpeg, |job, _on_p| {
                    run_streaming(
                        Path::new("/bin/sleep"),
                        &["30".into()],
                        &job.cancel,
                        |_, _| {},
                    )
                    .map(|_| TestOutcome::Done)
                    .map_err(|e| e.to_string())
                })
            })
        };

        // The job has to be genuinely in flight first: cancelling it while still
        // queued would prove nothing about child processes.
        let t0 = std::time::Instant::now();
        while q.view(running).unwrap().status != "running" {
            assert!(
                t0.elapsed() < std::time::Duration::from_secs(5),
                "the worker never picked the job up"
            );
            std::thread::sleep(std::time::Duration::from_millis(5));
        }

        let t1 = std::time::Instant::now();
        shutdown(&q, &downloads);
        let waited = t1.elapsed();

        assert_eq!(
            q.view(running).unwrap().status,
            "cancelled",
            "shutdown returned while the child was still alive (waited {waited:?})"
        );
        assert_eq!(
            q.view(queued).unwrap().status,
            "cancelled",
            "a queued job left behind would be resurrected by nothing at all"
        );
        assert!(
            token.is_cancelled(),
            "a live model download survived the quit"
        );
        assert!(worker.join().unwrap(), "the worker never ran the job");
        // And it waited for the kill rather than for the cap: the grace period is
        // an upper bound, not the price of every quit.
        assert!(
            waited < std::time::Duration::from_millis(SHUTDOWN_GRACE_MS),
            "the wait ran into its cap instead of noticing the child had died: {waited:?}"
        );
    }

    /// A quit with an empty queue must not pay the grace period — the wait exists
    /// for children, and with nothing running there are none.
    #[test]
    fn shutdown_of_an_idle_app_returns_at_once() {
        let (q, _rx) = Queue::new_for_test();
        let done = q.push_test_job();
        q.run_next_lane(queue::Lane::Ffmpeg, |_j, _p| Ok(TestOutcome::Done));
        let t0 = std::time::Instant::now();
        shutdown(&q, &Downloads::default());
        assert!(
            t0.elapsed() < std::time::Duration::from_millis(SHUTDOWN_GRACE_MS / 4),
            "an idle app waited for children it does not have"
        );
        // …and a finished job is not rewritten into a cancelled one.
        assert_eq!(q.view(done).unwrap().status, "done");
    }

    /// With nothing downloading every `.part` is garbage — including one whose
    /// model id we no longer offer (an older build's leftover). No live download
    /// can own it, and nothing else writes to this directory.
    #[test]
    fn sweep_takes_unknown_and_orphaned_parts() {
        let names: Vec<String> = ["ggml-medium.bin.part", "ggml-tiny.bin.part"]
            .iter()
            .map(|s| s.to_string())
            .collect();
        assert_eq!(
            stale_parts(&names, &HashSet::new()),
            vec!["ggml-medium.bin.part", "ggml-tiny.bin.part"]
        );
        // …and an empty directory listing is not an error case.
        assert!(stale_parts(&[], &HashSet::new()).is_empty());
    }
}
