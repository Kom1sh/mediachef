pub mod queue;
pub mod settings;

use mediachef_core::process::CancelToken;
use mediachef_core::recipe::{Engine, Recipe};
use mediachef_core::transcribe::{WhisperFormat, WhisperJob};
use mediachef_core::{catalog, locate, models, naming, probe, template};
use queue::{Queue, TestOutcome};
use serde::Serialize;
use settings::AppSettings;
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

/// The app-data directory itself, which is where `settings.json` lives (next to
/// the `models/` directory above).
fn settings_dir(app: &AppHandle) -> PathBuf {
    app.path().app_data_dir().unwrap()
}

/// Model downloads in flight, keyed by model id. Two jobs: it is the guard that
/// stops a second `models_download` for the same id from starting a rival thread
/// onto the same `.part` file, and it is the authority the `.part` sweep asks
/// before deleting anything.
type Downloads = Arc<Mutex<HashMap<String, CancelToken>>>;

/// The live settings. `settings.json` is the durable copy; this is the one
/// `enqueue` reads on every job, kept in step by `settings_set` (and primed from
/// disk in `setup`, before the lane workers it sizes are spawned).
type Settings = Arc<Mutex<AppSettings>>;

struct AppState {
    queue: Queue,
    recipes: Vec<Recipe>,
    downloads: Downloads,
    settings: Settings,
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
    /// The Russian half of the pair. The Models panel picks a side with `loc()`
    /// from the frontend's i18n module, falling back to `note_en` when this is
    /// empty — so a model shipped without a Russian note still reads.
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

/// Reads `settings.json` and refreshes the in-memory copy from it.
///
/// Disk is the authority here rather than the cache, and the reason is the boot
/// order: the webview starts loading while `setup` is still running, so a
/// `settings_get` racing the priming read would otherwise answer with defaults
/// and leave the Settings screen showing choices the user did not make. Reading
/// the file (a few hundred bytes, once per screen mount) removes the race
/// instead of arguing about how unlikely it is. `async` for the same reason as
/// every other disk-touching command here.
#[tauri::command(async)]
fn settings_get(app: AppHandle, state: State<AppState>) -> AppSettings {
    let s = settings::load(&settings_dir(&app));
    *state.settings.lock().unwrap() = s.clone();
    s
}

/// Sanitize → write the file → refresh the cache, with the settings mutex held
/// across all three.
///
/// A function of its own for the same reason as [`claim_download`]: the atomicity is
/// the whole content, and a test can hammer a function. Two saves overlapping used to
/// be able to leave the cache and the file disagreeing — each wrote the file, then
/// took the lock, so the *first* value could win the file and the second the cache,
/// after which every `enqueue` planned output paths from a folder that is not the one
/// on disk (until the next `settings_get` re-read it). Inside one critical section the
/// two are one decision, and the last writer owns both.
///
/// The lock is held across a disk write, which is fine here and nowhere near a hot
/// path: it is a few hundred bytes, once per click in Settings. `output_base` — the
/// reader on the enqueue path — deliberately does not hold it across its own stat.
fn store_settings(dir: &Path, cell: &Settings, s: AppSettings) -> Result<AppSettings, String> {
    let mut cache = cell.lock().unwrap();
    let s = settings::sanitize(s);
    settings::save(dir, &s)?;
    *cache = s.clone();
    Ok(s)
}

/// Saves what the UI sends and answers with what was actually stored — the
/// frontend adopts the returned value, so `sanitize` clamping a bad number is
/// visible in the controls rather than silently disagreeing with them.
///
/// This is also where the runtime side effects of a setting would go, and the
/// notable thing is how few there are:
/// * `output_mode`/`output_dir` need nothing — `enqueue` reads the cache below on
///   every job;
/// * `notifications` needs nothing — the frontend gates its own toast on it;
/// * `theme` is applied by the frontend's `applyTheme` (and remembered for the
///   next cold start), because only the webview owns `data-theme`;
/// * `language` needs nothing — React re-renders with the new dictionary;
/// * `ffmpeg_workers` *cannot* be applied here: the lane workers are spawned once
///   in `setup`, so the number takes effect after a restart. The Settings screen
///   says so under the control.
#[tauri::command(async)]
fn settings_set(
    app: AppHandle,
    state: State<AppState>,
    s: AppSettings,
) -> Result<AppSettings, String> {
    store_settings(&settings_dir(&app), &state.settings, s)
}

/// The folder picker behind "Choose folder" in Settings. `None` means the user
/// cancelled the dialog, which is not an error and must not clear the setting.
///
/// `async` is load-bearing and not just good manners: `blocking_pick_folder`
/// pumps the dialog on the calling thread and must never be called on the main
/// one.
/// Язык операционной системы в виде BCP-47 («ru-RU», «pt-BR»), пустая строка —
/// если система не сказала. Фронт приводит его к своему списку языков сам:
/// здесь мы ничего не решаем, только сообщаем факт.
#[tauri::command]
fn system_locale() -> String {
    sys_locale::get_locale().unwrap_or_default()
}

#[tauri::command(async)]
fn pick_folder(app: AppHandle) -> Option<String> {
    use tauri_plugin_dialog::DialogExt;
    app.dialog()
        .file()
        .blocking_pick_folder()
        // `into_path` rather than `Display`: a picker can hand back a `file://`
        // URL, and the settings file must hold a real path — `/Users/…`, not
        // `file:///Users/…`, which nothing downstream would open.
        .and_then(|p| p.into_path().ok())
        .map(|p| p.display().to_string())
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
    // `human` here too, not a bare `ok_or`: the invariant above is the whole
    // reason this function has a humanizer, and `?` on a plain &str would hand
    // the webview the raw needle instead of the sentence `errors` writes for it.
    let fp = locate::ffprobe().ok_or_else(|| human("ffprobe not found"))?;
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

/// Where a job's output would go, per the Settings screen: the fixed folder or
/// next to the input. `Err` only when a configured folder has gone away — see
/// [`settings::output_base`].
///
/// The settings are *copied* out of the lock before that function runs, because what
/// it does is an `is_dir()` — a filesystem stat, and on a folder living on a sleeping
/// external drive one that can block for seconds. This is called on every preview
/// keystroke, so holding the mutex across it would park `settings_set` (and the click
/// that is trying to point the app at a folder that is actually there) behind a stat
/// of the folder that is not. The copy is six small fields.
fn output_base(state: &State<AppState>) -> Result<Option<PathBuf>, String> {
    let s = state.settings.lock().unwrap().clone();
    settings::output_base(&s)
}

/// What the whisper lane asks for. A transcript is text — kilobytes for an hour of
/// speech — so this is not an estimate of the output but a floor against a disk
/// that is simply full: the run also decodes a 16kHz WAV (about 2MB a minute) and
/// whisper's own scratch writes go through the temp volume, and a machine with less
/// than this free has nothing to gain from being told so five minutes later.
const WHISPER_MIN_FREE: u64 = 50 * 1024 * 1024;

/// Free space a job needs in its output folder before it is allowed to start.
///
/// * ffmpeg — twice the input. A worst case rather than a prediction: most recipes
///   shrink what they are given (that is what "compress" means), but a lossless
///   remux into a bigger container, a GIF of a long clip or a WAV out of an MP3 can
///   all end up larger, and doubling covers those without pretending to know a
///   codec's bitrate. It is deliberately not a *guarantee* — a 20x GIF blowup will
///   still run out of disk, and ffmpeg's own "No space left on device" is already
///   humanized for that.
/// * whisper — a flat [`WHISPER_MIN_FREE`], because the output's size has nothing
///   to do with the input's.
///
/// `Pipeline` is sized like ffmpeg for one reason: `enqueue` runs it down the ffmpeg
/// lane, so the two must not disagree about what a pipeline job is.
fn required_bytes(engine: Engine, input_size: u64) -> u64 {
    match engine {
        Engine::Whisper => WHISPER_MIN_FREE,
        // `saturating_mul`, so a nonsense input size (a 9-exabyte file, a bad stat)
        // refuses the job instead of wrapping around into "needs nothing".
        Engine::Ffmpeg | Engine::Pipeline => input_size.saturating_mul(2),
    }
}

/// Refuses a job whose output folder plainly has no room for it (spec §8: validate
/// before launching, not after ffmpeg fails).
///
/// `dir` is the folder the finished file goes into — the Settings folder or the
/// input's own — because that, not the input's volume, is where the bytes land:
/// transcoding a clip off a full external drive onto a roomy boot disk is fine, and
/// the reverse is not.
///
/// A directory that cannot be stat'ed is waved through on purpose. This exists to
/// save the user a doomed run, not to add a new way for one to fail — and a missing
/// *fixed* folder is already refused, with a message that says what to do about it,
/// by [`settings::output_base`] before this is reached.
///
/// The message is returned to the UI as it is rather than through [`human`]: the
/// megabytes and the folder are the actionable part, and `errors::humanize` can only
/// answer with a fixed sentence (it has one for this text, for the day it travels
/// the queue's error path instead).
fn check_free_space(dir: &Path, engine: Engine, input_size: u64) -> Result<(), String> {
    let need = required_bytes(engine, input_size);
    let Ok(free) = fs2::available_space(dir) else {
        return Ok(());
    };
    if free >= need {
        return Ok(());
    }
    Err(format!(
        "not enough disk space: need ~{}MB free in {}",
        need.div_ceil(1024 * 1024),
        dir.display()
    ))
}

/// `async` because this touches the disk on a keystroke: `output_base` stats the
/// user's chosen output folder and `naming::dedupe` loops over candidate names in
/// it, once per debounce tick. On the main thread a folder on a sleeping external
/// drive would freeze the window while the user typed.
#[tauri::command(async)]
fn preview(
    app: AppHandle,
    state: State<AppState>,
    recipe_id: String,
    input: String,
    params: HashMap<String, String>,
) -> Result<Vec<String>, String> {
    let r = find_recipe(&state.recipes, &recipe_id)?;
    let resolved = template::resolve_params(r, &params).map_err(|e| e.to_string())?;
    // The same planning rule as `enqueue`, minus the reservation — a preview must
    // not claim a path — so the command shown is the command that will run, fixed
    // output folder included. It can still be one ` (N)` off by the time Add is
    // pressed, which is the nature of a preview of a future.
    let base = output_base(&state)?;
    let output = naming::dedupe(&naming::planned_path(
        r,
        std::path::Path::new(&input),
        base.as_deref(),
    ));
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
/// first's output. (Both spell the *name* the same way: `naming::planned_path`.)
/// `async` for the same reason as `probe_file`.
#[tauri::command(async)]
fn enqueue(
    app: AppHandle,
    state: State<AppState>,
    recipe_id: String,
    input: String,
    params: HashMap<String, String>,
) -> Result<u64, String> {
    let r = find_recipe(&state.recipes, &recipe_id)?;
    // Humanized for the same reason as in `probe_file`: this string goes straight
    // to the Add button's error toast, with no queue job to launder it.
    let fp = locate::ffprobe().ok_or_else(|| human("ffprobe not found"))?;
    let info = probe::probe(&fp, std::path::Path::new(&input)).map_err(human)?;
    // Ruling 20 / spec §8: validate before launching, not after ffmpeg fails.
    if !queue::input_accepted(&r.input.types, info.media_type) {
        return Err(format!(
            "recipe {recipe_id} does not accept {} input",
            info.media_type
        ));
    }
    let resolved = template::resolve_params(r, &params).map_err(human)?;
    // Settings' output folder, resolved per job rather than at boot: the user can
    // change it between two Adds, and a missing folder must stop the job here —
    // before a reservation is taken — rather than fail it in ffmpeg later.
    let base = output_base(&state)?;
    // Disk space, checked before the reservation is taken so a refusal needs no
    // cleanup. The folder measured is the one the file is going to, which is what
    // `planned_path` decides — computing it here as well as inside `plan_unique`
    // below is free: it is pure and claims nothing.
    let planned = naming::planned_path(r, std::path::Path::new(&input), base.as_deref());
    check_free_space(
        planned.parent().unwrap_or(Path::new(".")),
        r.engine,
        // `size_bytes` is `None` only when ffprobe could not stat the file, which
        // for a file it just probed successfully means something is odd about it;
        // 0 then asks for no room rather than refusing the job on a missing number.
        info.size_bytes.unwrap_or(0),
    )?;
    // Reserved from here on; release it if we bail out before `push`.
    let output = state
        .queue
        .plan_unique(r, std::path::Path::new(&input), base.as_deref());
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
    if !queue.cancel_all_active() {
        return; // the queue held no work at all: there can be no child
    }
    // Entered whenever there was ANY work, queued included — never on a count of
    // running children, which is stale the moment `cancel_all_active` releases its
    // lock (see its docs: a worker can flip a queued job to running, and spawn,
    // inside that window). An idle-but-queued app still costs only the one check
    // below.
    let deadline = std::time::Instant::now() + std::time::Duration::from_millis(SHUTDOWN_GRACE_MS);
    // A job leaves `running` only when its worker has returned from
    // `run_ffmpeg`/`run_whisper`, which happens after the child is dead and
    // reaped. That is why this waits on the queue's own live status rather than
    // sleeping a fixed span: the queue already knows.
    while queue.any_running() && std::time::Instant::now() < deadline {
        std::thread::sleep(std::time::Duration::from_millis(SHUTDOWN_POLL_MS));
    }
}

/// The ffmpeg lane's worker loop: takes the next ffmpeg job, runs it, sleeps when
/// the lane is empty. Runs forever — one of these per thread, and the Settings
/// screen decides how many threads (1..=3), which is why this is a function
/// instead of a closure inside `setup`.
///
/// Each worker resolves its own `ffmpeg` path once, at spawn: the lookup is the
/// same for all of them, and doing it here keeps a worker independent of every
/// other one.
///
/// A lookup miss here carries the bare needle and no advice: `queue::run_next_lane`
/// hands it to `errors::humanize` for the sentence the user reads, and keeps this
/// raw text as the job's `error_detail`, which the queue panel shows verbatim.
fn ffmpeg_worker(q: Queue) {
    let ffmpeg = locate::ffmpeg();
    loop {
        let ran = q.run_next_lane(queue::Lane::Ffmpeg, |job, on_p| {
            let ffmpeg = ffmpeg.as_ref().ok_or("ffmpeg not found".to_string())?;
            let queue::JobSpec::Ffmpeg { argv, duration_s } = &job.spec else {
                return Err("not an ffmpeg job".to_string());
            };
            match mediachef_core::runner::run_ffmpeg(ffmpeg, argv, *duration_s, &job.cancel, on_p) {
                Ok(_) => Ok(TestOutcome::Done),
                Err(e) => Err(format!("{}\n{}", e.message, e.stderr_tail)),
            }
        });
        if !ran {
            std::thread::sleep(std::time::Duration::from_millis(WORKER_IDLE_MS));
        }
    }
}

/// The whisper lane's worker loop. Exactly one of these, always: a transcription
/// is minutes of all-core work, and the parallelism setting deliberately does not
/// reach it (spec §7 — the ffmpeg lane is what a user with 16 cores wants
/// widened). ffmpeg is needed here too, to decode the 16kHz WAV whisper eats.
fn whisper_worker(q: Queue) {
    let ffmpeg = locate::ffmpeg();
    let whisper = locate::whisper();
    loop {
        let ran = q.run_next_lane(queue::Lane::Whisper, |job, on_p| {
            let ffmpeg = ffmpeg.as_ref().ok_or("ffmpeg not found".to_string())?;
            let whisper = whisper
                .as_ref()
                .ok_or("whisper-cli not found".to_string())?;
            let queue::JobSpec::Whisper { job: wj } = &job.spec else {
                return Err("not a whisper job".to_string());
            };
            match mediachef_core::transcribe::run_whisper(ffmpeg, whisper, wj, &job.cancel, on_p) {
                Ok(_) => Ok(TestOutcome::Done),
                Err(e) => Err(format!("{}\n{}", e.message, e.stderr_tail)),
            }
        });
        if !ran {
            std::thread::sleep(std::time::Duration::from_millis(WORKER_IDLE_MS));
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let (tx, rx) = channel::<queue::JobView>();
    let q = Queue::new(tx);
    let downloads = Downloads::default();
    // Defaults for now: the real file is read in `setup`, which is the first place
    // with an `AppHandle` to ask for the app-data directory. Nothing can observe
    // this placeholder — `settings_get` reads the file itself, and `enqueue` cannot
    // be called before there is a window.
    let settings: Settings = Settings::default();
    let state = AppState {
        queue: q.clone(),
        recipes: catalog::bundled(),
        downloads: downloads.clone(),
        settings: settings.clone(),
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
            // Настройки с диска — до спавна воркеров, число которых они задают.
            let loaded = settings::load(&settings_dir(app.handle()));
            let workers = loaded.ffmpeg_workers;
            *settings.lock().unwrap() = loaded;
            // Полосы независимы: транскрибация занимает минуты, и ffmpeg-очередь
            // всё это время обязана разбираться. Внутри ffmpeg-полосы — столько
            // одновременных задач, сколько выбрано в настройках (1..=3); значение
            // читается ровно здесь, поэтому применяется после перезапуска.
            for _ in 0..workers {
                let q = q.clone();
                std::thread::spawn(move || ffmpeg_worker(q));
            }
            let whisper_q = q.clone();
            std::thread::spawn(move || whisper_worker(whisper_q));
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
            models_delete,
            settings_get,
            settings_set,
            pick_folder,
            system_locale
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
            // The `ExitRequested` arm assumes the exit is really going to happen —
            // it does not consult `api`, and nothing here calls `prevent_exit`. A
            // plugin that ever did would leave this having killed the user's jobs
            // for an exit that never came, so that day this arm has to check the
            // decision instead of front-running it.
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

    /// The settings writer, hammered. Eight rival `settings_set`s — a user clicking
    /// through the segmented controls faster than the disk answers — must leave the
    /// file holding *one* of the eight values rather than a mixture, and the in-memory
    /// copy every `enqueue` reads must be that same value.
    ///
    /// Both halves used to be reachable: the save happened outside the lock, so the
    /// cache could end up holding a value the file does not (each writer took the lock
    /// after its own write, in whatever order they got there), and two saves shared
    /// one scratch file name, so the bytes on disk could come from a write that a
    /// rival's rename had already carried off. Only the whole critical section —
    /// sanitize, write, cache — makes the two agree.
    #[test]
    fn racing_settings_saves_agree_with_the_file() {
        let d = tempfile::tempdir().unwrap();
        let dir = d.path().join("app-data-that-does-not-exist-yet");
        let cell: Settings = Settings::default();
        // Eight distinct values, of very different sizes: a mixture of two of them is
        // only visible in the file when they are not the same length.
        let values: Vec<AppSettings> = (0..8)
            .map(|i| AppSettings {
                language: ["system", "en", "ru"][i % 3].into(),
                theme: ["system", "light", "dark"][i % 3].into(),
                output_mode: "fixed".into(),
                output_dir: Some(format!("/tmp/{}", "o".repeat(1 + i * 50))),
                notifications: i % 2 == 0,
                ffmpeg_workers: 1 + (i % 3) as u8,
            })
            .collect();

        std::thread::scope(|scope| {
            for v in &values {
                let (dir, cell) = (dir.clone(), cell.clone());
                scope.spawn(move || {
                    let stored = store_settings(&dir, &cell, v.clone()).expect("save failed");
                    // What the command answers the UI with is what the UI adopts, so
                    // it has to be this call's own value — not a rival's.
                    assert_eq!(
                        &stored, v,
                        "settings_set answered with someone else's value"
                    );
                });
            }
        });

        let on_disk = settings::load(&dir);
        assert!(
            values.contains(&on_disk),
            "the file is a mixture rather than one of the values: {on_disk:?}"
        );
        assert_eq!(
            *cell.lock().unwrap(),
            on_disk,
            "the cache enqueue reads disagrees with the file settings_get reads"
        );
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

    /// The two settings that change how a job actually runs, end to end against
    /// real ffmpeg: a `settings.json` nobody's UI wrote (two workers, a fixed
    /// output folder) is read exactly as [`run`]'s setup reads it, the ffmpeg lane
    /// is spawned from the number it names, and two conversions are queued.
    ///
    /// Two things are asserted that no unit test can see. Both jobs are `running`
    /// at the same instant — with one worker the lane would serialise them, so
    /// this is the only thing that can tell `ffmpeg_workers: 2` from a setting
    /// that is stored and then ignored. And both files land in the configured
    /// folder rather than next to their inputs, through the real
    /// `load` → `output_base` → `plan_unique` chain.
    ///
    /// Opt-in because it spawns real encoders and writes real video:
    ///
    /// ```text
    /// cargo test --manifest-path app/src-tauri/Cargo.toml -- --ignored --nocapture
    /// ```
    #[test]
    #[ignore = "spawns real ffmpeg encoders and writes video files"]
    fn two_workers_convert_into_the_fixed_output_folder() {
        let ffmpeg =
            locate::ffmpeg().expect("ffmpeg (./scripts/fetch-sidecars.sh, or one on PATH)");
        let home = tempfile::tempdir().unwrap();
        let (app_data, inputs, out) = (
            home.path().join("app-data"),
            home.path().join("in"),
            home.path().join("out"),
        );
        std::fs::create_dir_all(&inputs).unwrap();
        std::fs::create_dir_all(&out).unwrap();

        // The settings file as a user's own editor would leave it.
        std::fs::create_dir_all(&app_data).unwrap();
        std::fs::write(
            app_data.join("settings.json"),
            format!(
                r#"{{"output_mode": "fixed", "output_dir": "{}", "ffmpeg_workers": 2}}"#,
                out.display()
            ),
        )
        .unwrap();
        let settings = settings::load(&app_data);
        assert_eq!(settings.ffmpeg_workers, 2);
        let base = settings::output_base(&settings).unwrap();
        assert_eq!(base.as_deref(), Some(out.as_path()));

        // Real inputs, so the conversions read a real file: 6s of 720p, made fast
        // and re-encoded slowly below — the slow preset is what makes the two runs
        // overlap long enough to be observed at all.
        let recipe = Recipe::from_yaml(
            r#"
id: compress-video-crf
category: compress
title: {en: C, ru: С}
aliases: {en: [], ru: []}
description: {en: D, ru: Д}
input: {types: [video]}
engine: ffmpeg
args: ["-i", "{input}", "{output}"]
output: {ext: mp4, suffix: compressed}
"#,
        )
        .unwrap();
        let (q, _rx) = Queue::new_for_test();
        let mut planned = Vec::new();
        for name in ["clip-a", "clip-b"] {
            let input = inputs.join(format!("{name}.mp4"));
            let made = std::process::Command::new(&ffmpeg)
                .args([
                    "-y",
                    "-f",
                    "lavfi",
                    "-i",
                    "testsrc2=size=1280x720:rate=30:duration=6",
                    "-c:v",
                    "libx264",
                    "-preset",
                    "ultrafast",
                ])
                .arg(&input)
                .output()
                .unwrap();
            assert!(made.status.success(), "fixture encode failed");

            let output = q.plan_unique(&recipe, &input, base.as_deref());
            assert_eq!(
                output.parent(),
                Some(out.as_path()),
                "not in the fixed folder"
            );
            let argv: Vec<String> = [
                "-y",
                "-i",
                &input.display().to_string(),
                "-c:v",
                "libx264",
                "-preset",
                "veryslow",
                "-crf",
                "20",
                &output.display().to_string(),
            ]
            .iter()
            .map(|s| s.to_string())
            .collect();
            let id = q.push(
                recipe.id.clone(),
                input.display().to_string(),
                output.display().to_string(),
                argv,
                Some(6.0),
            );
            planned.push((id, input, output));
        }

        // The lane, sized by the settings file — the same loop `setup` runs.
        for _ in 0..settings.ffmpeg_workers {
            let q = q.clone();
            std::thread::spawn(move || ffmpeg_worker(q));
        }

        // Both `running` in the same snapshot: the whole point of the setting.
        let deadline = std::time::Instant::now() + std::time::Duration::from_secs(30);
        let mut seen_together = false;
        while std::time::Instant::now() < deadline && !seen_together {
            seen_together = q.views().iter().filter(|v| v.status == "running").count() == 2;
            std::thread::sleep(std::time::Duration::from_millis(20));
        }
        assert!(
            seen_together,
            "two workers never ran two jobs at once: {:?}",
            q.views()
                .iter()
                .map(|v| (v.id, v.status.clone()))
                .collect::<Vec<_>>()
        );

        // …and both finish, in the folder the settings named.
        let deadline = std::time::Instant::now() + std::time::Duration::from_secs(180);
        while q.views().iter().any(|v| v.status != "done") {
            assert!(
                std::time::Instant::now() < deadline,
                "jobs did not finish: {:?}",
                q.views()
                    .iter()
                    .map(|v| (v.id, v.status.clone(), v.error.clone()))
                    .collect::<Vec<_>>()
            );
            std::thread::sleep(std::time::Duration::from_millis(100));
        }
        for (_, input, output) in &planned {
            assert!(output.exists(), "no output at {}", output.display());
            let beside = input.with_file_name(output.file_name().unwrap());
            assert!(
                !beside.exists(),
                "the fixed folder was ignored: {} exists",
                beside.display()
            );
        }
        println!(
            "two workers -> {}",
            planned
                .iter()
                .map(|(_, _, o)| o.display().to_string())
                .collect::<Vec<_>>()
                .join(", ")
        );
    }

    /// The free-space heuristic: two lanes, two different shapes of demand.
    #[test]
    fn required_bytes_doubles_the_input_for_ffmpeg_and_floors_whisper() {
        const MB: u64 = 1024 * 1024;
        assert_eq!(required_bytes(Engine::Ffmpeg, 10 * MB), 20 * MB);
        // A pipeline recipe runs down the ffmpeg lane (see `enqueue`), so it is
        // sized the same way rather than falling into whisper's floor.
        assert_eq!(required_bytes(Engine::Pipeline, 10 * MB), 20 * MB);
        // A transcript is kilobytes whatever the input weighs: the number is a floor
        // against "the disk is full", not an estimate of the output.
        assert_eq!(required_bytes(Engine::Whisper, 10 * MB), WHISPER_MIN_FREE);
        assert_eq!(
            required_bytes(Engine::Whisper, 4_000 * MB),
            WHISPER_MIN_FREE
        );
        // The doubling must not wrap: an absurd input has to refuse the job, not
        // come back asking for nothing.
        assert_eq!(required_bytes(Engine::Ffmpeg, u64::MAX), u64::MAX);
    }

    /// The check against a real directory, which is the point of it: the number
    /// comes from the volume the file is actually going to.
    #[test]
    fn free_space_check_reads_a_real_dir_and_refuses_the_impossible() {
        let d = tempfile::tempdir().unwrap();
        // An ordinary job on a working disk has nothing to answer.
        check_free_space(d.path(), Engine::Ffmpeg, 1024).unwrap();
        check_free_space(d.path(), Engine::Whisper, 0).unwrap();

        // Half of u64::MAX fits on no disk in existence, so the SAME directory now
        // refuses — which is what proves the answer came from `available_space`
        // rather than from a constant.
        let err = check_free_space(d.path(), Engine::Ffmpeg, u64::MAX / 2).unwrap_err();
        assert!(err.contains("not enough disk space"), "got: {err}");
        // The folder is named: with a fixed output folder the boot disk can be
        // roomy while that volume is full, and the user needs to know which is which.
        assert!(
            err.contains(&d.path().display().to_string()),
            "the refusal must name the folder: {err}"
        );
        // enqueue returns this text as it is (the megabytes are the actionable
        // part), but it also has to read as a sentence if it ever travels the
        // queue's humanized error path.
        assert!(
            mediachef_core::errors::humanize(&err)
                .unwrap()
                .contains("disk space"),
            "unmapped: {err}"
        );

        // A directory that is not there is not a refusal. This check exists to save
        // the user a doomed run, not to invent a new way for one to fail — and a
        // missing *fixed* folder is already refused, with a better message, by
        // `settings::output_base` before this runs.
        check_free_space(&d.path().join("nope"), Engine::Ffmpeg, u64::MAX / 2).unwrap();
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
