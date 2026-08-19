pub fn humanize(stderr_tail: &str) -> Option<String> {
    let s = stderr_tail.to_lowercase();
    let msg = if s.contains("invalid data found") {
        "The file looks corrupted or is not a media file."
    } else if s.contains("no space left") {
        "Not enough disk space for the output file."
    } else if s.contains("does not contain any stream") {
        "The file has no audio/video streams FFmpeg can read."
    } else if s.contains("unknown encoder") {
        "This FFmpeg build lacks the required encoder."
    // Must stay ABOVE the "no such file" arm: a failed spawn reports
    // "spawn: No such file or directory", which would otherwise be blamed on the
    // user's INPUT file instead of the missing binary.
    //
    // Two ways to learn that whisper-cli is missing, one message. `not found` is
    // the enqueue-time lookup (`locate::whisper` came back empty); `whisper spawn:`
    // is the run-time failure — `transcribe` tags its child's spawn error with the
    // binary's name precisely so it can be told apart here. Unlike the arm above,
    // THIS one's position is load-bearing: "whisper spawn: " contains "spawn: ",
    // so below the FFmpeg arm it would be answered with "brew install ffmpeg",
    // which installs the wrong thing.
    } else if s.contains("whisper-cli not found") || s.contains("whisper spawn: ") {
        // Sits next to the FFmpeg arm because it is the same kind of failure —
        // a missing binary, not a bad file — but it must never fall INTO it:
        // "brew install ffmpeg" does not put whisper-cli on the PATH.
        "whisper-cli is not installed — brew install whisper-cpp."
    } else if s.contains("ffmpeg not found")
        || s.contains("ffprobe not found")
        || s.contains("spawn: ")
    {
        "FFmpeg binary not found — install it (brew install ffmpeg on macOS)."
    } else if s.contains("no such file") {
        "Input file not found (moved or renamed?)."
    // Not an ffmpeg failure at all: the whisper enqueue refuses a job whose model
    // is not on disk. The raw text names the model id, which is no help without
    // the one place that can fix it.
    } else if s.contains("is not downloaded") {
        "The Whisper model is not downloaded yet — open the Models screen."
    } else {
        return None;
    };
    Some(msg.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maps_known_errors() {
        assert!(humanize("x Invalid data found when processing input")
            .unwrap()
            .contains("corrupted"));
        assert!(humanize("No space left on device")
            .unwrap()
            .contains("disk space"));
        assert!(humanize("does not contain any stream")
            .unwrap()
            .contains("streams"));
        assert!(humanize("something totally else").is_none());
        // Ruling 21: a missing binary must read as "install ffmpeg", never as a
        // moved input file. The spawn case pins the arm order — it contains
        // "No such file or directory" and would match the input-file arm below.
        assert!(humanize("ffmpeg not found (brew install ffmpeg)")
            .unwrap()
            .contains("install"));
        let spawned = humanize("spawn: No such file or directory").unwrap();
        assert!(spawned.contains("install"), "got: {spawned}");
        assert!(
            !spawned.contains("Input file"),
            "spawn failure blamed on the input file: {spawned}"
        );
        // Complement: a real ffmpeg input-not-found (no "spawn: " prefix) must
        // still blame the input, so the new arm cannot swallow the old one.
        assert!(humanize("i.mp4: No such file or directory")
            .unwrap()
            .contains("Input file"));
    }

    // The other half of the whisper lane's "cannot even start" pair: the model is
    // there but the binary is not. Left unmapped (T6 carry) this surfaced as the
    // lane's bare "Transcription failed" fallback, which sends the user looking at
    // their file instead of at Homebrew — and it must not borrow the FFmpeg arm's
    // text either, since installing ffmpeg would not fix it.
    #[test]
    fn maps_missing_whisper_binary() {
        let m = humanize("whisper-cli not found (brew install whisper-cpp)").unwrap();
        assert!(m.contains("whisper-cpp"), "got: {m}");
        assert!(
            !m.contains("FFmpeg"),
            "a missing whisper-cli must not read as a missing FFmpeg: {m}"
        );
    }

    // The same failure, discovered a step later: whisper-cli was on the PATH when
    // the worker thread looked it up and gone (or unreadable) by the time the job
    // ran, so it surfaces as a spawn error rather than a lookup miss. It carries
    // "spawn: " and would be swallowed by the FFmpeg arm — which is why
    // `transcribe` tags it with the binary name and this arm sits above.
    #[test]
    fn maps_failed_whisper_spawn_to_whisper_not_ffmpeg() {
        let m = humanize("whisper spawn: No such file or directory (os error 2)").unwrap();
        assert!(m.contains("whisper-cpp"), "got: {m}");
        assert!(
            !m.contains("FFmpeg"),
            "a failed whisper-cli spawn blamed on FFmpeg: {m}"
        );
        // Permission denied on a half-installed binary is the same story.
        assert!(humanize("whisper spawn: Permission denied (os error 13)")
            .unwrap()
            .contains("whisper-cpp"));
        // And the ffmpeg-side spawn (the WAV prep step, untagged) still answers
        // with ffmpeg: the tag is what separates the two, so both must hold.
        assert!(humanize("spawn: No such file or directory")
            .unwrap()
            .contains("FFmpeg"));
    }

    // The whisper lane's one enqueue-time refusal: the app cannot start a
    // transcription whose model has never been downloaded. The humanized text has
    // to point at the screen that fixes it, not repeat the model id.
    #[test]
    fn maps_missing_whisper_model() {
        let m = humanize("model small is not downloaded — open Models").unwrap();
        assert!(m.contains("Models"), "got: {m}");
        assert!(m.contains("not downloaded"), "got: {m}");
    }
}
