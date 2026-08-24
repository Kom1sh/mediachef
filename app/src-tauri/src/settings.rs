//! The user's preferences: one small JSON file in the app-data directory, and
//! the rules that keep whatever is in it from hurting the app.
//!
//! Two ideas carry the whole module. Every value is a plain `String` rather than
//! an enum, because these cross IPC to a webview and out to a file a user can
//! edit — an enum would only move the "what is this value?" question to the
//! deserializer, where the answer is "the whole file is invalid". Instead
//! [`sanitize`] is a border guard every path goes through ([`load`] on the way
//! in, `settings_set` on the way from the UI), so the rest of the app can read
//! `theme` or `ffmpeg_workers` without asking whether it is one of the values it
//! knows.

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

/// The file, inside the app-data directory (`models/` is its neighbour).
const FILE: &str = "settings.json";

/// The parallelism ceiling. Every worker runs an ffmpeg that already uses all
/// cores, so more than a few only makes them fight over the same cores while
/// costing the same total time — and an unclamped value out of a hand-edited
/// file would be a fork bomb with a progress bar.
const MAX_WORKERS: u8 = 3;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
// `default` so a file written by an older build (or by hand, partially) keeps
// every field it does have; `deny_unknown_fields` so a typo'd key is a loud
// fallback to defaults rather than a setting that silently does nothing.
#[serde(default, deny_unknown_fields)]
pub struct AppSettings {
    /// "system" | "en" | "ru" — "system" follows the OS locale, which the
    /// frontend's `resolveLocale` reads off the webview's `navigator.language`.
    pub language: String,
    /// "system" | "light" | "dark". Applied by the frontend's `applyTheme`.
    pub theme: String,
    /// "beside" (next to the input file) | "fixed" (always `output_dir`).
    pub output_mode: String,
    /// Only meaningful with `output_mode: "fixed"`; `sanitize` demotes the mode
    /// back to "beside" when it is missing.
    pub output_dir: Option<String>,
    /// Desktop notification when a job finishes. Read by the frontend, which is
    /// where the notification is sent from.
    pub notifications: bool,
    /// How many ffmpeg jobs run at once, 1..=MAX_WORKERS. Read once at boot when
    /// the lane workers are spawned, so a change lands after a restart.
    pub ffmpeg_workers: u8,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            language: "system".into(),
            theme: "system".into(),
            output_mode: "beside".into(),
            output_dir: None,
            notifications: true,
            ffmpeg_workers: 1,
        }
    }
}

/// Reads the settings file, or hands back defaults — for a first run, an
/// unreadable file, or one whose contents no longer parse. Never fails: there is
/// no useful way for an app to refuse to start over a preferences file, and the
/// next [`save`] rewrites it anyway.
///
/// Sanitizing here and not only in the IPC setter is what makes the guarantee
/// hold for a file the app did not write: an editor can put `ffmpeg_workers: 99`
/// in there, and the worker loop must still see 3.
pub fn load(dir: &Path) -> AppSettings {
    let Ok(text) = std::fs::read_to_string(dir.join(FILE)) else {
        return AppSettings::default();
    };
    sanitize(serde_json::from_str(&text).unwrap_or_default())
}

/// A scratch file name no other writer can pick: this process, a clock, and a
/// counter.
///
/// Three parts because each covers the others' blind spot — the pid tells two
/// processes apart, the counter two threads of one process (two clock reads can land
/// on the same nanosecond), and the clock a second run of a recycled pid whose
/// counter is back at zero.
fn scratch_name() -> String {
    use std::sync::atomic::{AtomicU64, Ordering};
    static SEQ: AtomicU64 = AtomicU64::new(0);
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    format!(
        "{FILE}.{}-{nanos}-{}.tmp",
        std::process::id(),
        SEQ.fetch_add(1, Ordering::Relaxed)
    )
}

/// Writes the settings file atomically: a scratch file of this save's own next to
/// the target, then a rename over it.
///
/// The rename is the point. A plain write truncates first, so a crash (or a
/// full disk) in the middle leaves a half file — which `load` would then read as
/// junk and answer with defaults, i.e. the user's settings silently reset. With
/// a rename the file on disk is either entirely the old settings or entirely the
/// new ones. `create_dir_all` covers the first run, where the app-data directory
/// may not exist yet.
///
/// The scratch *name* is the other half of it, and it used to be a constant. Two
/// overlapping saves then wrote the same scratch file, and what that costs is worse
/// than one of the two values losing: whichever bytes landed last are what the first
/// rename carries off, and the second rename finds nothing left to rename — so a
/// save can report failure for the value that ended up on disk and success for the
/// value that did not. `settings_set` holds a mutex across its own save, but a
/// second process running the same app is not inside that lock, and neither is any
/// future caller of this function. A unique name makes each save's scratch file its
/// own, so every interleaving ends with one whole value on disk.
///
/// The one thing a unique name gives up: a hard kill between the write and the
/// rename leaves a scratch file that no later save reuses (every ordinary failure
/// still cleans up after itself below). It is a few hundred bytes in the app-data
/// directory, next to the `.part` files the models sweep exists for.
pub fn save(dir: &Path, s: &AppSettings) -> Result<(), String> {
    std::fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    let text = serde_json::to_string_pretty(s).map_err(|e| e.to_string())?;
    let tmp = dir.join(scratch_name());
    std::fs::write(&tmp, text).map_err(|e| {
        // Half a scratch file (a full disk) is as much litter as a whole one.
        let _ = std::fs::remove_file(&tmp);
        e.to_string()
    })?;
    std::fs::rename(&tmp, dir.join(FILE)).map_err(|e| {
        // A failed rename would otherwise leave the scratch file lying next to
        // the real one for good — nothing else ever looks at it again.
        let _ = std::fs::remove_file(&tmp);
        e.to_string()
    })
}

/// `v` when it is one of `allowed`, the fallback otherwise.
fn one_of(v: String, allowed: &[&str], fallback: &str) -> String {
    if allowed.contains(&v.as_str()) {
        v
    } else {
        fallback.into()
    }
}

/// Forces a settings value into the documented sets: unknown enum strings become
/// their default, the worker count is clamped, and "fixed output" without a
/// folder is demoted to "beside".
///
/// That last rule is the one with teeth: `output_mode: "fixed"` with no
/// `output_dir` is not a configuration but a half-made choice, and left standing
/// it would fail every single job at enqueue. The UI upholds the same rule from
/// the other side — picking "fixed" opens the folder dialog and commits nothing
/// if it is cancelled — so the two never disagree about what the radio shows.
pub fn sanitize(mut s: AppSettings) -> AppSettings {
    // Тот же список, что в src/lib/i18n.tsx. Незнакомое значение
    // (правка settings.json руками, откат на старую сборку) — «system».
s.language = one_of(
        s.language,
        &["system", "en", "ru", "es", "pt", "fr", "de", "pl", "it", "ar", "zh"],
        "system",
    );
    s.theme = one_of(s.theme, &["system", "light", "dark"], "system");
    s.output_mode = one_of(s.output_mode, &["beside", "fixed"], "beside");
    if s.output_mode == "fixed" && s.output_dir.as_deref().unwrap_or("").is_empty() {
        s.output_mode = "beside".into();
    }
    s.ffmpeg_workers = s.ffmpeg_workers.clamp(1, MAX_WORKERS);
    s
}

/// The directory finished files go into: `None` means "next to the input", which
/// is `Queue::plan_unique`'s own default.
///
/// A configured folder that is not there any more (deleted, or on a volume that
/// has been ejected) is an `Err` on purpose. The two alternatives are both
/// worse: creating it would happily materialise a lookalike directory at an
/// unmounted volume's mount point on the boot disk, and falling back to "beside"
/// would scatter output next to the inputs while the Settings screen kept
/// claiming a folder that no longer exists.
pub fn output_base(s: &AppSettings) -> Result<Option<PathBuf>, String> {
    if s.output_mode != "fixed" {
        return Ok(None);
    }
    // Unreachable through `sanitize`, which demotes the mode instead; treated as
    // "beside" rather than as an error so a future caller cannot turn a missing
    // folder setting into a queue that refuses everything.
    let Some(dir) = s.output_dir.as_ref().map(PathBuf::from) else {
        return Ok(None);
    };
    if !dir.is_dir() {
        return Err(format!(
            "output folder {} is not there any more — pick another one in Settings",
            dir.display()
        ));
    }
    Ok(Some(dir))
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A settings file the app never wrote: the shape a user's own edit takes.
    fn write(dir: &Path, json: &str) {
        std::fs::write(dir.join("settings.json"), json).unwrap();
    }

    /// Every scratch file left in `dir`. The name carries a pid and a clock, so the
    /// tests ask for the pattern rather than for one path.
    fn scratch_files(dir: &Path) -> Vec<String> {
        std::fs::read_dir(dir)
            .unwrap()
            .flatten()
            .map(|e| e.file_name().to_string_lossy().into_owned())
            .filter(|n| n.ends_with(".tmp"))
            .collect()
    }

    /// The whole point of the store: what the user picked is still picked after a
    /// restart. Plus the two things the atomic write owes: it creates the app-data
    /// directory on a first run, and it leaves no scratch file behind.
    #[test]
    fn saved_settings_survive_a_restart() {
        let d = tempfile::tempdir().unwrap();
        let dir = d.path().join("app-data-that-does-not-exist-yet");
        // A first run has no file at all — defaults, not an error.
        assert_eq!(load(&dir), AppSettings::default());

        let s = AppSettings {
            language: "ru".into(),
            theme: "dark".into(),
            output_mode: "fixed".into(),
            output_dir: Some(d.path().display().to_string()),
            notifications: false,
            ffmpeg_workers: 3,
        };
        save(&dir, &s).unwrap();
        assert_eq!(load(&dir), s, "a restart lost the user's choices");
        assert!(
            scratch_files(&dir).is_empty(),
            "the atomic write left its scratch file behind: {:?}",
            scratch_files(&dir)
        );
    }

    /// Overlapping saves, which is what the unique scratch name is for. With one
    /// shared `settings.json.tmp` the rename of whoever got there second had nothing
    /// left to rename, so a save reported failure for a value that had in fact landed
    /// on disk — and the file could hold bytes from a write that reported success.
    ///
    /// What must hold with a name per save: every one of them succeeds, the file is
    /// *one whole value* rather than a mixture of several, and no scratch file is left
    /// behind. The payloads differ wildly in length on purpose — a garbled file is
    /// only visible when the two candidates are not the same size.
    #[test]
    fn overlapping_saves_leave_one_whole_value() {
        let d = tempfile::tempdir().unwrap();
        let dir = d.path();
        // Distinct, and deliberately of very different sizes: `beside` with no folder
        // against a fixed folder whose path is hundreds of characters long.
        let values: Vec<AppSettings> = (0..12)
            .map(|i| AppSettings {
                language: if i % 2 == 0 { "ru" } else { "en" }.into(),
                theme: "dark".into(),
                output_mode: "fixed".into(),
                output_dir: Some(format!("/tmp/{}", "d".repeat(1 + i * 40))),
                notifications: i % 3 == 0,
                ffmpeg_workers: 1 + (i % 3) as u8,
            })
            .collect();

        std::thread::scope(|scope| {
            for v in &values {
                scope.spawn(move || save(dir, v).expect("a rival save must not fail"));
            }
        });

        let stored = load(dir);
        assert!(
            values.contains(&stored),
            "the file is a mixture of two saves, not one of them: {stored:?}"
        );
        assert!(
            scratch_files(dir).is_empty(),
            "scratch files left behind: {:?}",
            scratch_files(dir)
        );
    }

    /// Half a file (a kill mid-write on some future non-atomic path), an unknown
    /// key from a newer build, or plain nonsense: none of it may keep the app from
    /// starting, and the answer is always the defaults.
    #[test]
    fn broken_json_falls_back_to_defaults() {
        let d = tempfile::tempdir().unwrap();
        for junk in [
            "{\"language\": \"ru\"",
            "",
            "null",
            "{\"from_the_future\": 1}",
        ] {
            write(d.path(), junk);
            assert_eq!(load(d.path()), AppSettings::default(), "junk: {junk:?}");
        }
        // …while a *partial* object is not junk: every missing field is a default,
        // which is what lets a new setting ship without invalidating old files.
        write(d.path(), "{\"theme\": \"light\"}");
        assert_eq!(
            load(d.path()),
            AppSettings {
                theme: "light".into(),
                ..AppSettings::default()
            }
        );
    }

    /// `sanitize` is the border guard: everything that reaches the app's state
    /// passes through it, so no value outside the documented sets can ever reach
    /// the worker loop or the theme attribute.
    #[test]
    fn sanitize_clamps_garbage_and_keeps_valid_values() {
        let junk = AppSettings {
            language: "xx".into(),
            theme: "neon".into(),
            output_mode: "wherever".into(),
            output_dir: None,
            notifications: true,
            ffmpeg_workers: 9,
        };
        let s = sanitize(junk);
        assert_eq!(s.language, "system");
        assert_eq!(s.theme, "system");
        assert_eq!(s.output_mode, "beside");
        assert_eq!(s.ffmpeg_workers, 3, "9 workers would fork-bomb the machine");
        // Zero workers is the worse half of the same bug: a queue nothing drains.
        assert_eq!(
            sanitize(AppSettings {
                ffmpeg_workers: 0,
                ..AppSettings::default()
            })
            .ffmpeg_workers,
            1
        );

        // "fixed" with nowhere to put the files is not a mode, it is a half-made
        // choice — the one that would otherwise fail every job at enqueue.
        let half = sanitize(AppSettings {
            output_mode: "fixed".into(),
            output_dir: None,
            ..AppSettings::default()
        });
        assert_eq!(half.output_mode, "beside");

        // And a legitimate configuration passes through untouched.
        let good = AppSettings {
            language: "en".into(),
            theme: "light".into(),
            output_mode: "fixed".into(),
            output_dir: Some("/tmp".into()),
            notifications: false,
            ffmpeg_workers: 2,
        };
        assert_eq!(sanitize(good.clone()), good);
    }

    /// A hand-edited file goes through the same guard: `load` sanitizes, so the
    /// worker loop below cannot be handed `ffmpeg_workers: 99` by a text editor.
    #[test]
    fn load_sanitizes_a_hand_edited_file() {
        let d = tempfile::tempdir().unwrap();
        write(
            d.path(),
            r#"{"language": "xx", "theme": "dark", "ffmpeg_workers": 99}"#,
        );
        let s = load(d.path());
        assert_eq!(s.ffmpeg_workers, 3);
        assert_eq!(s.language, "system");
        assert_eq!(s.theme, "dark", "a valid neighbour must not be reset too");
    }

    /// Where finished files land. `beside` is the absence of a base directory —
    /// the queue's own "next to the input" — and a fixed folder that has gone
    /// away (ejected volume, deleted directory) is an error the user can act on,
    /// never a silent fallback that scatters output next to the inputs.
    #[test]
    fn output_base_follows_the_mode_and_refuses_a_missing_folder() {
        let d = tempfile::tempdir().unwrap();
        assert_eq!(output_base(&AppSettings::default()).unwrap(), None);

        let fixed = AppSettings {
            output_mode: "fixed".into(),
            output_dir: Some(d.path().display().to_string()),
            ..AppSettings::default()
        };
        assert_eq!(output_base(&fixed).unwrap(), Some(d.path().to_path_buf()));

        let gone = AppSettings {
            output_dir: Some(d.path().join("ejected").display().to_string()),
            ..fixed
        };
        let err = output_base(&gone).unwrap_err();
        assert!(
            err.contains("ejected"),
            "the error must name the folder: {err}"
        );
    }
}
