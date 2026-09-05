//! Everything MediaChef does that does not need a window.
//!
//! The GUI crate (`app/src-tauri`) owns the window, the IPC commands and the job
//! queue; this crate owns the work. Nothing here knows that Tauri exists, which
//! is what lets the whole media pipeline be exercised from `cargo test` and from
//! the `smoke` binary.
//!
//! Roughly three layers:
//!
//! * **What can be run** — [`recipe`] (the YAML schema), [`catalog`] (the
//!   recipes bundled into the binary), [`template`] (params → argv) and
//!   [`naming`] (input path → output path).
//! * **Running it** — [`locate`] (find ffmpeg/ffprobe/whisper-cli), [`process`]
//!   (cancellable child processes), [`runner`] and [`transcribe`] (the ffmpeg and
//!   whisper lanes), [`progress`] (percent out of a child's chatter), [`probe`]
//!   (what a media file actually is) and [`models`] (whisper model downloads).
//! * **Telling the user** — [`errors`], which turns FFmpeg's stderr into a
//!   sentence a human can act on.

pub mod catalog;
/// Диктовка: короткий WAV в строку тем же движком, что и рецепты.
pub mod dictate;
pub mod errors;
pub mod locate;
pub mod models;
pub mod naming;
pub mod probe;
pub mod process;
pub mod progress;
pub mod recipe;
pub mod runner;
pub mod template;
pub mod transcribe;
