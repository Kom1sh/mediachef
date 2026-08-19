pub fn humanize(stderr_tail: &str) -> Option<String> {
    let s = stderr_tail.to_lowercase();
    // First, and that position is load-bearing. What arrives here is a failure's
    // message *plus* its stderr tail — for whisper, 60 lines of backend chatter —
    // and this is the one marker the app itself writes ([`crate::transcribe::
    // NO_SPEECH`]) rather than something an engine said. It knows exactly what
    // happened, so it must not lose to a needle that engine noise happens to carry.
    //
    // Anchored rather than merely contained, and that is the other half: the app
    // writes the marker at the head of its own message, while the rest of this
    // string is engine output that quotes the user's file name. A clip called
    // `no_speech.mp4` failing to decode has to read as a corrupted file.
    //
    // Nothing about the file is broken, so the sentence says what IS true: whisper
    // ran fine and heard no speech. The frontend swaps it for the user's own
    // language by watching for the same marker.
    let msg = if s.starts_with("no_speech:") {
        "No speech detected in the file."
    } else if s.contains("invalid data found") {
        "The file looks corrupted or is not a media file."
    // Two ways to run out of room, one sentence. `no space left` is ffmpeg's own
    // complaint after it has already been writing for a while; `not enough disk
    // space` is the app's enqueue-time refusal, which never starts the job at all.
    // Neither matches the other's wording, hence both needles.
    } else if s.contains("no space left") || s.contains("not enough disk space") {
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
        // The other half of the same story: the app's own enqueue-time refusal
        // (`lib.rs::check_free_space`), which shares nothing with ffmpeg's wording.
        assert!(
            humanize("not enough disk space: need ~120MB free in /Volumes/Tiny")
                .unwrap()
                .contains("disk space")
        );
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

    // Ruling W3-3: a transcription that heard nothing is a fact about the file, not
    // a broken tool — so it gets a sentence of its own instead of the lane's
    // "Transcription failed". The marker comes from the constant rather than a
    // hand-copied string: `transcribe` writes it, this table reads it, and the
    // queue panel keys its localized text off the same word.
    #[test]
    fn maps_no_speech_marker() {
        let m = humanize(crate::transcribe::NO_SPEECH).unwrap();
        assert!(m.contains("No speech"), "got: {m}");

        // The load-bearing half: what reaches `humanize` is the message *plus*
        // whisper's 60-line stderr tail (see `queue::run_next_lane`), so any needle
        // that chatter happens to carry must lose to our own deliberate marker.
        // Hence the arm's position at the very top of the table.
        let with_tail = format!(
            "{}\nwhisper_model_load: loading model\n\
             Invalid data found when processing input\nNo space left on device",
            crate::transcribe::NO_SPEECH
        );
        let m = humanize(&with_tail).unwrap();
        assert!(m.contains("No speech"), "engine chatter won the arm: {m}");
        assert!(!m.contains("corrupted"), "got: {m}");

        // And it stays a marker, not a keyword: the words "no speech" in some
        // engine's prose must not be answered with it.
        assert!(humanize("model has no speech tokens configured").is_none());
        // The reason it is anchored to the head of the message: engine output quotes
        // the user's file name, so a clip *called* no_speech.mp4 that fails to
        // decode must still read as a corrupted file.
        let named = humanize(
            "ffmpeg exited with code 1\n/x/no_speech.mp4: Invalid data found when processing input",
        )
        .unwrap();
        assert!(named.contains("corrupted"), "got: {named}");
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
