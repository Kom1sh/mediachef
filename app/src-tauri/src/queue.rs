//! Job queue state machine.
//!
//! Deliberately free of `tauri` types: the queue is driven through a plain
//! `Sender<JobView>` and a runner closure, so the whole state machine is
//! unit-testable without a running app. `lib.rs` owns the wiring.

use mediachef_core::recipe::MediaType;
use mediachef_core::runner::CancelToken;
use serde::Serialize;
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
}

impl Queue {
    pub fn new(notify: Sender<JobView>) -> Self {
        Self {
            inner: Arc::new(Mutex::new(Inner {
                jobs: Vec::new(),
                next_id: 1,
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
        self.push("t".into(), "i".into(), "o".into(), vec![], Some(1.0))
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
}
