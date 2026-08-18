//! Job queue state machine.
//!
//! Deliberately free of `tauri` types: the queue is driven through a plain
//! `Sender<JobView>` and a runner closure, so the whole state machine is
//! unit-testable without a running app. `lib.rs` owns the wiring.

use mediachef_core::naming;
use mediachef_core::recipe::{MediaType, Recipe};
use mediachef_core::runner::CancelToken;
use serde::Serialize;
use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::mpsc::{channel, Receiver, Sender};
use std::sync::{Arc, Mutex};

/// The payload the frontend sees, both from `jobs()` and from `job:update`.
/// `status` ∈ `queued|running|done|error|cancelled`.
#[derive(Debug, Clone, Serialize)]
pub struct JobView {
    pub id: u64,
    pub recipe_id: String,
    pub input: String,
    pub output: String,
    pub status: String,
    pub percent: f32,
    pub error: Option<String>,
    pub error_detail: Option<String>,
}

pub struct Job {
    pub view: JobView,
    pub argv: Vec<String>,
    pub duration_s: Option<f64>,
    pub cancel: CancelToken,
}

/// What a successful runner reports back. The runner cannot distinguish a
/// cancelled run from a finished one on its own — `run_next` re-reads the
/// cancel token to pick the final status.
pub enum TestOutcome {
    Done,
}

/// Everything `run_next` hands a runner: job id, argv, media duration (for
/// progress percentages) and the job's cancel token.
pub type RunSpec = (u64, Vec<String>, Option<f64>, CancelToken);

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

    pub fn push(
        &self,
        recipe_id: String,
        input: String,
        output: String,
        argv: Vec<String>,
        duration_s: Option<f64>,
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
            argv,
            duration_s,
            cancel: CancelToken::new(),
        });
        id
    }

    pub fn push_test_job(&self) -> u64 {
        // Distinct output per job, so the reservation invariant (one path is held
        // by at most one non-terminal job) holds in tests as it does in the app.
        let n = self.inner.lock().unwrap().next_id;
        self.push("t".into(), "i".into(), format!("o{n}"), vec![], Some(1.0))
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

    fn take_next(&self) -> Option<RunSpec> {
        let mut g = self.inner.lock().unwrap();
        let j = g.jobs.iter_mut().find(|j| j.view.status == "queued")?;
        j.view.status = "running".into();
        let out = (j.view.id, j.argv.clone(), j.duration_s, j.cancel.clone());
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

    /// Выполнить следующую queued-задачу переданным раннером (тестируемо).
    /// Returns false when nothing was queued, so the worker thread knows to idle.
    pub fn run_next(
        &self,
        runner: impl FnOnce(&RunSpec, &mut dyn FnMut(f32)) -> Result<TestOutcome, String>,
    ) -> bool {
        let Some(job) = self.take_next() else {
            return false;
        };
        let id = job.0;
        let cancel = job.3.clone();
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
                    Some(human.unwrap_or_else(|| "FFmpeg failed".into())),
                    Some(e),
                );
            }
        }
        true
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
