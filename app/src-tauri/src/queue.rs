//! Job queue state machine.
//!
//! Deliberately free of `tauri` types: the queue is driven through a plain
//! `Sender<JobView>` and a runner closure, so the whole state machine is
//! unit-testable without a running app. `lib.rs` owns the wiring.

use mediachef_core::naming;
use mediachef_core::recipe::{MediaType, Recipe};
use mediachef_core::runner::CancelToken;
use mediachef_core::transcribe::{WhisperFormat, WhisperJob};
use serde::Serialize;
use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::mpsc::{channel, Receiver, Sender};
use std::sync::{Arc, Mutex};

/// The payload the frontend sees, both from `jobs()` and from `job:update`.
/// `status` ∈ `queued|running|done|error|cancelled`, `kind` ∈ `ffmpeg|whisper`
/// (mirrored in `types.ts`).
#[derive(Debug, Clone, Serialize)]
pub struct JobView {
    pub id: u64,
    pub recipe_id: String,
    pub kind: String,
    pub input: String,
    pub output: String,
    pub status: String,
    pub percent: f32,
    pub error: Option<String>,
    pub error_detail: Option<String>,
}

/// What a job actually runs. The lane follows from the variant, so a whisper job
/// can never be handed to the ffmpeg worker (nor the reverse) — the workers match
/// on it and the lane filter in `take_next` is derived from the same source.
#[derive(Debug, Clone)]
pub enum JobSpec {
    Ffmpeg {
        argv: Vec<String>,
        duration_s: Option<f64>,
    },
    Whisper {
        job: WhisperJob,
    },
}

impl JobSpec {
    /// The wire name in [`JobView::kind`].
    pub fn kind(&self) -> &'static str {
        match self {
            JobSpec::Ffmpeg { .. } => "ffmpeg",
            JobSpec::Whisper { .. } => "whisper",
        }
    }

    pub fn lane(&self) -> Lane {
        match self {
            JobSpec::Ffmpeg { .. } => Lane::Ffmpeg,
            JobSpec::Whisper { .. } => Lane::Whisper,
        }
    }
}

/// One worker's slice of the queue. Two lanes, one worker each: a transcription
/// runs for minutes, and the whole point of separating them is that the ffmpeg
/// queue keeps draining while it does.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Lane {
    Ffmpeg,
    Whisper,
}

impl Lane {
    /// Last-resort error text when [`mediachef_core::errors::humanize`] has
    /// nothing to say about a failure. Per-lane, so a failed transcription never
    /// reads as "FFmpeg failed" (whisper's own exits are not in the table).
    fn failure_fallback(self) -> &'static str {
        match self {
            Lane::Ffmpeg => "FFmpeg failed",
            Lane::Whisper => "Transcription failed",
        }
    }
}

pub struct Job {
    pub view: JobView,
    pub spec: JobSpec,
    pub cancel: CancelToken,
}

/// What a successful runner reports back. The runner cannot distinguish a
/// cancelled run from a finished one on its own — `run_next_lane` re-reads the
/// cancel token to pick the final status.
pub enum TestOutcome {
    Done,
}

/// Everything `run_next_lane` hands a runner: the job id, what to run, and the
/// job's cancel token.
pub struct RunSpec {
    pub id: u64,
    pub spec: JobSpec,
    pub cancel: CancelToken,
}

/// True when `mt` satisfies a recipe's `input.types` list. `any` in the list
/// waves every media type through (Ruling 20 / spec §8).
pub fn input_accepted(types: &[MediaType], mt: MediaType) -> bool {
    types.contains(&MediaType::Any) || types.contains(&mt)
}

#[derive(Clone)]
pub struct Queue {
    inner: Arc<Mutex<Inner>>,
    notify: Sender<JobView>,
}

struct Inner {
    jobs: Vec<Job>,
    next_id: u64,
    /// Planned output paths of every non-terminal job (queued or running).
    /// `Path::exists` cannot see these — the file appears only once ffmpeg starts
    /// writing — so without this set two identical enqueues issued back to back
    /// plan the SAME path and the second run overwrites the first's output
    /// (spec §7: never silently overwrite).
    reserved: HashSet<String>,
}

impl Queue {
    pub fn new(notify: Sender<JobView>) -> Self {
        Self {
            inner: Arc::new(Mutex::new(Inner {
                jobs: Vec::new(),
                next_id: 1,
                reserved: HashSet::new(),
            })),
            notify,
        }
    }

    pub fn new_for_test() -> (Self, Receiver<JobView>) {
        let (tx, rx) = channel();
        (Self::new(tx), rx)
    }

    fn emit(&self, v: JobView) {
        let _ = self.notify.send(v);
    }

    /// Plan an output path that collides with neither the filesystem NOR any
    /// still-pending job, and reserve it inside the same critical section — so
    /// two concurrent `enqueue` calls for the same input+recipe cannot both be
    /// handed the same path.
    ///
    /// Mirrors `naming::plan_output`'s rule (`{stem}.{suffix}.{ext}`, then a
    /// ` (N)` suffix on collision), but tests every candidate against both
    /// worlds; `naming::dedupe` knows about the filesystem only.
    ///
    /// The reservation is handed over to `push`. A caller that bails out between
    /// the two (e.g. `build_argv` fails) MUST call `unreserve`, or the path stays
    /// blocked for the rest of the session.
    pub fn plan_unique(&self, recipe: &Recipe, input: &Path) -> PathBuf {
        let suffix = recipe
            .output
            .suffix
            .clone()
            .unwrap_or_else(|| recipe.id.clone());
        let base = naming::output_path(input, &suffix, &recipe.output.ext);
        let stem = base
            .file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_default();
        let ext = base
            .extension()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_default();
        let dir = base.parent().unwrap_or(Path::new(".")).to_path_buf();

        let mut g = self.inner.lock().unwrap();
        let mut cand = base;
        let mut n = 0u32;
        while cand.exists() || g.reserved.contains(&cand.display().to_string()) {
            n += 1;
            cand = dir.join(format!("{stem} ({n}).{ext}"));
        }
        g.reserved.insert(cand.display().to_string());
        cand
    }

    /// Drop a reservation taken by `plan_unique` for a job that never got pushed.
    pub fn unreserve(&self, output: &str) {
        self.inner.lock().unwrap().reserved.remove(output);
    }

    pub fn push_spec(
        &self,
        recipe_id: String,
        input: String,
        output: String,
        spec: JobSpec,
    ) -> u64 {
        let mut g = self.inner.lock().unwrap();
        let id = g.next_id;
        g.next_id += 1;
        // Idempotent when `plan_unique` already reserved this path; the insert
        // matters for callers that plan an output some other way.
        g.reserved.insert(output.clone());
        let view = JobView {
            id,
            recipe_id,
            kind: spec.kind().into(),
            input,
            output,
            status: "queued".into(),
            percent: 0.0,
            error: None,
            error_detail: None,
        };
        // This emit fires while `g` is still held, so the send MUST stay non-blocking:
        // `notify` is an unbounded `Sender`. Swapping it for a bounded `SyncSender`
        // would deadlock here as soon as the relay thread falls behind.
        self.emit(view.clone());
        g.jobs.push(Job {
            view,
            spec,
            cancel: CancelToken::new(),
        });
        id
    }

    /// ffmpeg-flavoured [`Self::push_spec`]: argv plus the media duration the
    /// progress parser needs.
    pub fn push(
        &self,
        recipe_id: String,
        input: String,
        output: String,
        argv: Vec<String>,
        duration_s: Option<f64>,
    ) -> u64 {
        self.push_spec(
            recipe_id,
            input,
            output,
            JobSpec::Ffmpeg { argv, duration_s },
        )
    }

    /// Test fixture: a job of the given lane with a stub spec (nothing here is
    /// ever executed — the tests pass their own runner).
    pub fn push_test_job_kind(&self, kind: &str) -> u64 {
        // Distinct output per job, so the reservation invariant (one path is held
        // by at most one non-terminal job) holds in tests as it does in the app.
        let n = self.inner.lock().unwrap().next_id;
        let spec = match kind {
            "ffmpeg" => JobSpec::Ffmpeg {
                argv: vec![],
                duration_s: Some(1.0),
            },
            "whisper" => JobSpec::Whisper {
                job: WhisperJob {
                    input: PathBuf::from("i"),
                    output: PathBuf::from(format!("o{n}")),
                    model: PathBuf::from("m"),
                    language: "auto".into(),
                    translate: false,
                    format: WhisperFormat::Txt,
                },
            },
            other => panic!("unknown test job kind {other}"),
        };
        self.push_spec("t".into(), "i".into(), format!("o{n}"), spec)
    }

    pub fn push_test_job(&self) -> u64 {
        self.push_test_job_kind("ffmpeg")
    }

    /// Cancellable in any status: a queued job flips to `cancelled` right here,
    /// a running one has its token tripped and `run_next` settles the status
    /// once the child process dies.
    pub fn cancel(&self, id: u64) {
        let mut g = self.inner.lock().unwrap();
        if let Some(j) = g.jobs.iter_mut().find(|j| j.view.id == id) {
            j.cancel.cancel();
            if j.view.status == "queued" {
                j.view.status = "cancelled".into();
                let v = j.view.clone();
                // Terminal now, so the path is free for the next enqueue. A
                // *running* job releases in `finish` instead, once ffmpeg is gone.
                g.reserved.remove(&v.output);
                drop(g);
                self.emit(v);
            }
        }
    }

    /// Cancels every job that is not already terminal — the quit path's "stop
    /// everything" (see `lib.rs::shutdown`). Terminal jobs (`done`, `error`,
    /// `cancelled`) are left exactly as they are: their row is the session's
    /// history, and rewriting it would tell the user a finished job was killed.
    ///
    /// Returns whether anything was in flight at all, which is the caller's cue to
    /// wait for the queue to drain `running` (see `lib.rs::shutdown`).
    ///
    /// Deliberately a yes/no and NOT a count of running children, which is the
    /// obvious-looking thing to return and is wrong. Any count would be a snapshot
    /// taken under the lock below, while the `cancel` calls happen after releasing
    /// it — and a lane worker blocked in `take_next` gets the mutex in exactly that
    /// window, flipping a job `queued`→`running` and spawning its child. A caller
    /// keying its wait on "0 were running" would then skip the wait and exit on top
    /// of a child that had just been born: the enqueue-then-quit window.
    ///
    /// With a yes/no the wait is entered whenever there was any work, and the wait
    /// re-reads live status ([`Self::any_running`]), so it cannot miss that job:
    /// a worker can only pick up a job that is still `queued`, i.e. strictly before
    /// this call cancelled it, so the flip is already visible to the caller's first
    /// live read — which happens strictly after every `cancel` here.
    pub fn cancel_all_active(&self) -> bool {
        // Collect under the lock, cancel after releasing it: `cancel` takes the
        // same mutex, so cancelling inside the iteration would deadlock.
        let active: Vec<u64> = {
            let g = self.inner.lock().unwrap();
            g.jobs
                .iter()
                .filter(|j| matches!(j.view.status.as_str(), "queued" | "running"))
                .map(|j| j.view.id)
                .collect()
        };
        for id in &active {
            // Reused rather than reimplemented: `cancel` is the one place that
            // knows the status flip, the reservation release and the emit.
            self.cancel(*id);
        }
        !active.is_empty()
    }

    /// True while any job is `running`, i.e. while some worker still holds a live
    /// child process. The quit path polls this; nothing else needs it.
    pub fn any_running(&self) -> bool {
        self.inner
            .lock()
            .unwrap()
            .jobs
            .iter()
            .any(|j| j.view.status == "running")
    }

    pub fn view(&self, id: u64) -> Option<JobView> {
        self.inner
            .lock()
            .unwrap()
            .jobs
            .iter()
            .find(|j| j.view.id == id)
            .map(|j| j.view.clone())
    }

    pub fn views(&self) -> Vec<JobView> {
        self.inner
            .lock()
            .unwrap()
            .jobs
            .iter()
            .map(|j| j.view.clone())
            .collect()
    }

    /// Oldest queued job **of this lane**. A job of the other lane is invisible
    /// here, so a long transcription cannot hold up the ffmpeg queue.
    fn take_next(&self, lane: Lane) -> Option<RunSpec> {
        let mut g = self.inner.lock().unwrap();
        let j = g
            .jobs
            .iter_mut()
            .find(|j| j.view.status == "queued" && j.spec.lane() == lane)?;
        j.view.status = "running".into();
        let out = RunSpec {
            id: j.view.id,
            spec: j.spec.clone(),
            cancel: j.cancel.clone(),
        };
        let v = j.view.clone();
        drop(g);
        self.emit(v);
        Some(out)
    }

    /// Idempotent upsert: the runner may deliver a duplicate 100.0, or a late
    /// tick after cancel — both are harmless here.
    fn set_progress(&self, id: u64, p: f32) {
        let mut g = self.inner.lock().unwrap();
        if let Some(j) = g.jobs.iter_mut().find(|j| j.view.id == id) {
            j.view.percent = p;
            let v = j.view.clone();
            drop(g);
            self.emit(v);
        }
    }

    fn finish(&self, id: u64, status: &str, error: Option<String>, detail: Option<String>) {
        let mut g = self.inner.lock().unwrap();
        if let Some(j) = g.jobs.iter_mut().find(|j| j.view.id == id) {
            j.view.status = status.into();
            j.view.error = error;
            j.view.error_detail = detail;
            if status == "done" {
                j.view.percent = 100.0;
            }
            let v = j.view.clone();
            // Every `finish` status is terminal (done/error/cancelled): the job
            // no longer owns its output path, so a later enqueue may reuse it —
            // `dedupe` will then see the finished file on disk and step aside.
            g.reserved.remove(&v.output);
            drop(g);
            self.emit(v);
        }
    }

    /// Выполнить следующую queued-задачу этой полосы переданным раннером
    /// (тестируемо). Returns false when the lane had nothing queued, so the
    /// worker thread knows to idle.
    pub fn run_next_lane(
        &self,
        lane: Lane,
        runner: impl FnOnce(&RunSpec, &mut dyn FnMut(f32)) -> Result<TestOutcome, String>,
    ) -> bool {
        let Some(job) = self.take_next(lane) else {
            return false;
        };
        let id = job.id;
        let cancel = job.cancel.clone();
        let mut on_p = |p: f32| self.set_progress(id, p);
        match runner(&job, &mut on_p) {
            Ok(TestOutcome::Done) => {
                if cancel.is_cancelled() {
                    self.finish(id, "cancelled", None, None);
                } else {
                    self.finish(id, "done", None, None);
                }
            }
            Err(e) => {
                let human = mediachef_core::errors::humanize(&e);
                self.finish(
                    id,
                    "error",
                    Some(human.unwrap_or_else(|| lane.failure_fallback().into())),
                    Some(e),
                );
            }
        }
        true
    }

    /// ffmpeg-lane shorthand for the queue's own tests, whose bodies predate
    /// lanes. Not compiled into the app: production callers name their lane.
    #[cfg(test)]
    fn run_next(
        &self,
        runner: impl FnOnce(&RunSpec, &mut dyn FnMut(f32)) -> Result<TestOutcome, String>,
    ) -> bool {
        self.run_next_lane(Lane::Ffmpeg, runner)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn lifecycle_queued_running_done() {
        let (q, rx) = Queue::new_for_test();
        let id = q.push_test_job();
        q.run_next(|_job, on_progress| {
            on_progress(50.0);
            Ok(crate::queue::TestOutcome::Done)
        });
        let states: Vec<String> = rx.try_iter().map(|v| v.status).collect();
        assert_eq!(states, vec!["queued", "running", "running", "done"]);
        assert_eq!(q.view(id).unwrap().status, "done");
    }

    #[test]
    fn cancel_queued_job_never_runs() {
        let (q, _rx) = Queue::new_for_test();
        let id = q.push_test_job();
        q.cancel(id);
        assert_eq!(q.view(id).unwrap().status, "cancelled");
    }

    #[test]
    fn error_does_not_poison_queue() {
        let (q, _rx) = Queue::new_for_test();
        let a = q.push_test_job();
        let b = q.push_test_job();
        q.run_next(|_j, _p| Err("boom".to_string()));
        q.run_next(|_j, _p| Ok(crate::queue::TestOutcome::Done));
        assert_eq!(q.view(a).unwrap().status, "error");
        assert_eq!(q.view(b).unwrap().status, "done");
    }

    // Ruling 20 / spec §8: enqueue rejects an input whose probed media type the
    // recipe does not accept; `any` in the list waves everything through.
    #[test]
    fn input_accepted_matches_recipe_types() {
        use mediachef_core::recipe::MediaType;
        assert!(input_accepted(&[MediaType::Video], MediaType::Video));
        assert!(!input_accepted(&[MediaType::Video], MediaType::Audio));
        assert!(input_accepted(
            &[MediaType::Video, MediaType::Audio],
            MediaType::Audio
        ));
        for mt in [
            MediaType::Video,
            MediaType::Audio,
            MediaType::Image,
            MediaType::Subtitle,
            MediaType::Any,
        ] {
            assert!(
                input_accepted(&[MediaType::Any], mt),
                "any must accept {mt:?}"
            );
        }
        assert!(
            !input_accepted(&[], MediaType::Video),
            "empty types accept nothing"
        );
    }

    const RECIPE: &str = r#"
id: compress-video-crf
category: compress
title: {en: C, ru: С}
aliases: {en: [c], ru: [с]}
description: {en: D, ru: Д}
input: {types: [video]}
params: []
engine: ffmpeg
args: ["-i", "{input}", "{output}"]
output: {ext: mp4, suffix: compressed}
"#;

    fn recipe() -> Recipe {
        Recipe::from_yaml(RECIPE).unwrap()
    }

    // Spec §7 "never silently overwrite": queueing the same recipe twice for the
    // same input before the first job runs must NOT hand out the same path. The
    // filesystem cannot answer this — neither output exists yet.
    #[test]
    fn duplicate_plan_gets_distinct_outputs() {
        let (q, _rx) = Queue::new_for_test();
        let d = tempfile::tempdir().unwrap();
        let input = d.path().join("clip.mp4");
        std::fs::write(&input, b"x").unwrap();
        let r = recipe();

        let a = q.plan_unique(&r, &input);
        q.push(
            "compress-video-crf".into(),
            input.display().to_string(),
            a.display().to_string(),
            vec![],
            None,
        );
        let b = q.plan_unique(&r, &input);

        assert_eq!(a.file_name().unwrap(), "clip.compressed.mp4");
        assert_eq!(b.file_name().unwrap(), "clip.compressed (1).mp4");
        assert_ne!(
            a, b,
            "second enqueue would overwrite the first job's output"
        );
        assert!(
            !a.exists() && !b.exists(),
            "neither file exists yet — reservation, not fs, must separate them"
        );
    }

    // fs-dedupe and reservation compose: an existing file takes ` (1)`, so the
    // pending job's reservation must push the next plan to ` (2)`.
    #[test]
    fn plan_skips_both_existing_files_and_reservations() {
        let (q, _rx) = Queue::new_for_test();
        let d = tempfile::tempdir().unwrap();
        let input = d.path().join("clip.mp4");
        std::fs::write(&input, b"x").unwrap();
        std::fs::write(d.path().join("clip.compressed.mp4"), b"x").unwrap();
        let r = recipe();

        let a = q.plan_unique(&r, &input);
        assert_eq!(a.file_name().unwrap(), "clip.compressed (1).mp4");
        q.push(
            "compress-video-crf".into(),
            input.display().to_string(),
            a.display().to_string(),
            vec![],
            None,
        );
        let b = q.plan_unique(&r, &input);
        assert_eq!(b.file_name().unwrap(), "clip.compressed (2).mp4");
    }

    // The reservation is a lease, not a lifetime claim: once the job reaches a
    // terminal status the path is free again (the finished file on disk then
    // drives the ` (N)` suffix, which is `dedupe`'s job).
    #[test]
    fn reservation_released_on_finish_allows_reuse() {
        let (q, _rx) = Queue::new_for_test();
        let d = tempfile::tempdir().unwrap();
        let input = d.path().join("clip.mp4");
        std::fs::write(&input, b"x").unwrap();
        let r = recipe();

        let a = q.plan_unique(&r, &input);
        let id = q.push(
            "compress-video-crf".into(),
            input.display().to_string(),
            a.display().to_string(),
            vec![],
            None,
        );
        q.run_next(|_j, _p| Ok(TestOutcome::Done));
        assert_eq!(q.view(id).unwrap().status, "done");
        // The runner is a stub here, so nothing was written — the freed path is
        // planned again verbatim, proving the lease was dropped.
        assert_eq!(q.plan_unique(&r, &input), a);
    }

    #[test]
    fn reservation_released_when_queued_job_cancelled() {
        let (q, _rx) = Queue::new_for_test();
        let d = tempfile::tempdir().unwrap();
        let input = d.path().join("clip.mp4");
        std::fs::write(&input, b"x").unwrap();
        let r = recipe();

        let a = q.plan_unique(&r, &input);
        let id = q.push(
            "compress-video-crf".into(),
            input.display().to_string(),
            a.display().to_string(),
            vec![],
            None,
        );
        q.cancel(id);
        assert_eq!(q.view(id).unwrap().status, "cancelled");
        assert_eq!(q.plan_unique(&r, &input), a);
    }

    // Полосы независимы: транскрибация занимает свой воркер минутами, и всё это
    // время ffmpeg-полоса должна разбирать свою очередь — воркер не имеет права
    // взять задачу чужой полосы.
    #[test]
    fn lanes_are_independent() {
        let (q, _rx) = Queue::new_for_test();
        let f = q.push_test_job_kind("ffmpeg");
        let w = q.push_test_job_kind("whisper");
        // whisper-полоса не видит ffmpeg-задачу
        assert!(q.run_next_lane(Lane::Whisper, |_j, _p| Ok(TestOutcome::Done)));
        assert_eq!(q.view(w).unwrap().status, "done");
        assert_eq!(q.view(f).unwrap().status, "queued");
        assert!(q.run_next_lane(Lane::Ffmpeg, |_j, _p| Ok(TestOutcome::Done)));
        assert_eq!(q.view(f).unwrap().status, "done");
    }

    // Whisper's own exits ("whisper exited with code 1") are not in the
    // humanizer's ffmpeg-shaped table, so they land on the fallback — which must
    // be the lane's. A failed transcription telling the user "FFmpeg failed"
    // sends them looking in the wrong place.
    #[test]
    fn error_fallback_follows_the_lane() {
        let (q, _rx) = Queue::new_for_test();
        let w = q.push_test_job_kind("whisper");
        let f = q.push_test_job_kind("ffmpeg");
        q.run_next_lane(Lane::Whisper, |_j, _p| {
            Err("whisper exited with code 1".to_string())
        });
        q.run_next_lane(Lane::Ffmpeg, |_j, _p| Err("boom".to_string()));
        assert_eq!(q.view(w).unwrap().error.unwrap(), "Transcription failed");
        assert_eq!(q.view(f).unwrap().error.unwrap(), "FFmpeg failed");
        // The raw text is still there for the "Copy log" button.
        assert_eq!(
            q.view(w).unwrap().error_detail.unwrap(),
            "whisper exited with code 1"
        );
    }

    // `kind` — это то, по чему UI отличает транскрибацию от конвертации; поле
    // обязано доехать до вьюхи (и до `types.ts`, где оно продублировано).
    #[test]
    fn kind_serialized_in_view() {
        let (q, _rx) = Queue::new_for_test();
        let id = q.push_test_job_kind("whisper");
        assert_eq!(q.view(id).unwrap().kind, "whisper");
    }

    // The quit path (`lib.rs::shutdown`): everything still in flight is cancelled,
    // everything already finished is left alone. The distinction the return value
    // draws is what the caller waits on — a queued job is over the moment it is
    // cancelled, a running one still has a child to kill.
    #[test]
    fn cancel_all_active_takes_queued_and_running_only() {
        let (q, _rx) = Queue::new_for_test();
        let done = q.push_test_job();
        let failed = q.push_test_job();
        let running = q.push_test_job();
        let a = q.push_test_job();
        let b = q.push_test_job();
        // Two jobs into terminal states, then the third into `running` — taken
        // without a runner, so it stays there like a real job whose whisper-cli is
        // still chewing.
        q.run_next(|_j, _p| Ok(TestOutcome::Done));
        q.run_next(|_j, _p| Err("boom".to_string()));
        let taken = q
            .take_next(Lane::Ffmpeg)
            .expect("the third job must be next");
        assert_eq!(taken.id, running);
        assert_eq!(q.view(running).unwrap().status, "running");

        assert!(q.cancel_all_active(), "work was in flight");
        assert!(q.any_running(), "the taken job still holds a child");

        // Queued jobs are terminal immediately: nothing was ever spawned for them.
        assert_eq!(q.view(a).unwrap().status, "cancelled");
        assert_eq!(q.view(b).unwrap().status, "cancelled");
        // The running one keeps its status until its worker settles it — all this
        // can do is trip the token the watchdog watches.
        assert!(
            taken.cancel.is_cancelled(),
            "a running job whose token is not tripped orphans its child"
        );
        assert_eq!(q.view(running).unwrap().status, "running");
        // Terminal jobs are history, not something to cancel.
        assert_eq!(q.view(done).unwrap().status, "done");
        assert_eq!(q.view(failed).unwrap().status, "error");
        assert_eq!(q.view(failed).unwrap().error.unwrap(), "FFmpeg failed");

        // Safe to run twice, because both quit paths can reach it (ExitRequested
        // then Exit). The second pass sees the queued jobs terminal but the running
        // one still in flight, so it still says "wait" — deliberately: if that
        // child outlived the first wait, the second must wait again rather than
        // wave the exit through.
        assert!(q.cancel_all_active());
        // Once the worker has settled it, there is nothing left to wait for.
        q.finish(running, "cancelled", None, None);
        assert!(!q.cancel_all_active());
        assert!(!q.any_running());
    }

    // The window the return value must not miss (the enqueue-then-quit race): a
    // lane worker blocked in `take_next` can flip a job `queued`→`running` and
    // spawn its child in the gap between `cancel_all_active`'s snapshot and the
    // cancels that follow it. A count of "how many were running" is stale by then
    // and would read 0 for a queue that is about to hold a live child — so a queue
    // whose only job is QUEUED must still answer "yes, wait", and the wait then
    // re-reads live status.
    #[test]
    fn cancel_all_active_says_wait_even_when_nothing_is_running_yet() {
        let (q, _rx) = Queue::new_for_test();
        let id = q.push_test_job();
        assert!(!q.any_running(), "nothing has been taken yet");
        assert!(
            q.cancel_all_active(),
            "a queued job is work in flight: a worker may already be inside \
             take_next, and skipping the wait would orphan the child it spawns"
        );
        assert_eq!(q.view(id).unwrap().status, "cancelled");
        // An empty queue is the only case that may skip the wait.
        assert!(!q.cancel_all_active());
    }

    // `unreserve` is the escape hatch for enqueue failing after planning (a bad
    // custom-ffmpeg template): the path must not stay blocked for the session.
    #[test]
    fn unreserve_frees_a_path_that_was_never_pushed() {
        let (q, _rx) = Queue::new_for_test();
        let d = tempfile::tempdir().unwrap();
        let input = d.path().join("clip.mp4");
        std::fs::write(&input, b"x").unwrap();
        let r = recipe();

        let a = q.plan_unique(&r, &input);
        q.unreserve(&a.display().to_string());
        assert_eq!(q.plan_unique(&r, &input), a);
    }
}
