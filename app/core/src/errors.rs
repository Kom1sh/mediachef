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
    // The three engine arms below say "reinstall MediaChef", not "install ffmpeg":
    // since wave 4 every distribution carries its own ffmpeg/ffprobe/whisper-cli
    // next to the app executable (`locate`), so a lookup that comes back empty
    // means the bundle lost a file — a half-extracted zip, an antivirus quarantine,
    // a `binaries/` dir never fetched in a dev tree — and no package manager can
    // fix that. The env-variable half is the one thing a user CAN act on without a
    // reinstall, and it is the same override `locate` checks first.
    //
    // Must stay ABOVE the "no such file" arm: a failed spawn reports
    // "spawn: No such file or directory", which would otherwise be blamed on the
    // user's INPUT file instead of the missing binary.
    //
    // Two ways to learn that whisper-cli is missing, one message. `not found` is
    // the enqueue-time lookup (`locate::whisper` came back empty); `whisper spawn:`
    // is the run-time failure — `transcribe` tags its child's spawn error with the
    // binary's name precisely so it can be told apart here. Unlike the arm above,
    // THIS one's position is load-bearing: "whisper spawn: " contains "spawn: ",
    // so below the FFmpeg arm it would name the wrong engine and offer
    // MEDIACHEF_FFMPEG, which cannot make a transcription run.
    } else if s.contains("whisper-cli not found") || s.contains("whisper spawn: ") {
        "The bundled Whisper engine is missing or damaged — reinstall MediaChef \
         (advanced: the MEDIACHEF_WHISPER env variable overrides the engine path)."
    // Separate from ffmpeg only for the variable it names: ffprobe is what the
    // probe and the enqueue path resolve, and pointing that user at
    // MEDIACHEF_FFMPEG would be an override that changes nothing.
    //
    // Two needles for the same reason the whisper arm has two: `not found` is the
    // lookup miss (`locate::ffprobe` came back empty), while `ffprobe spawn: ` is
    // a sidecar that WAS found and could not be executed — a truncated download,
    // a stripped exec bit, an antivirus stub (`probe::ProbeError::Io` names it so
    // it can be recognised here). And exactly like the whisper arm, THIS one's
    // position is load-bearing: "ffprobe spawn: " contains "spawn: ", so below
    // the FFmpeg arm a damaged ffprobe would be reported as a damaged ffmpeg and
    // offer MEDIACHEF_FFMPEG, which would not fix it.
    } else if s.contains("ffprobe not found") || s.contains("ffprobe spawn: ") {
        "The bundled FFprobe engine is missing or damaged — reinstall MediaChef \
         (advanced: the MEDIACHEF_FFPROBE env variable overrides the engine path)."
    // Bare "spawn: " lands here on purpose: an untagged spawn failure comes from
    // the ffmpeg child — the converter itself, or the 16kHz WAV prep step of a
    // transcription. Both other engines tag theirs (`transcribe` writes "whisper
    // spawn: ", `probe` writes "ffprobe spawn: "), which is what leaves this arm
    // unambiguous rather than merely last.
    } else if s.contains("ffmpeg not found") || s.contains("spawn: ") {
        "The bundled FFmpeg engine is missing or damaged — reinstall MediaChef \
         (advanced: the MEDIACHEF_FFMPEG env variable overrides the engine path)."
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
        // Ruling 21: a missing binary must read as a broken engine, never as a
        // moved input file. The spawn case pins the arm order — it contains
        // "No such file or directory" and would match the input-file arm below.
        //
        // Ruling W4-4 pins the text itself: since the engines ship inside the app,
        // the sentence names the bundled engine and its override variable instead
        // of a package manager. Asserted verbatim, because "install" alone would
        // still pass on the old brew wording. The inputs here are the exact
        // strings the lookup misses in `lib.rs` produce — the advice-carrying
        // parentheticals they used to append are gone, since `error_detail` shows
        // that raw text to the user verbatim.
        assert_eq!(
            humanize("ffmpeg not found").unwrap(),
            "The bundled FFmpeg engine is missing or damaged — reinstall MediaChef \
             (advanced: the MEDIACHEF_FFMPEG env variable overrides the engine path)."
        );
        let spawned = humanize("spawn: No such file or directory").unwrap();
        assert!(spawned.contains("bundled FFmpeg engine"), "got: {spawned}");
        assert!(spawned.contains("MEDIACHEF_FFMPEG"), "got: {spawned}");
        assert!(
            !spawned.contains("Input file"),
            "spawn failure blamed on the input file: {spawned}"
        );
        // ffprobe is its own arm for one reason: the variable it offers. A user
        // told to set MEDIACHEF_FFMPEG for a missing ffprobe would override the
        // wrong engine and see the same failure again.
        let probe = humanize("ffprobe not found").unwrap();
        assert_eq!(
            probe,
            "The bundled FFprobe engine is missing or damaged — reinstall MediaChef \
             (advanced: the MEDIACHEF_FFPROBE env variable overrides the engine path)."
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
    // their file instead of at the broken engine — and it must not borrow the
    // FFmpeg arm's text either, since MEDIACHEF_FFMPEG cannot fix it.
    #[test]
    fn maps_missing_whisper_binary() {
        let m = humanize("whisper-cli not found").unwrap();
        assert_eq!(
            m,
            "The bundled Whisper engine is missing or damaged — reinstall MediaChef \
             (advanced: the MEDIACHEF_WHISPER env variable overrides the engine path)."
        );
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
        assert!(m.contains("bundled Whisper engine"), "got: {m}");
        assert!(m.contains("MEDIACHEF_WHISPER"), "got: {m}");
        assert!(
            !m.contains("FFmpeg"),
            "a failed whisper-cli spawn blamed on FFmpeg: {m}"
        );
        // Permission denied on a damaged binary is the same story.
        assert!(humanize("whisper spawn: Permission denied (os error 13)")
            .unwrap()
            .contains("MEDIACHEF_WHISPER"));
        // And the ffmpeg-side spawn (the WAV prep step, untagged) still answers
        // with ffmpeg: the tag is what separates the two, so both must hold.
        assert!(humanize("spawn: No such file or directory")
            .unwrap()
            .contains("bundled FFmpeg engine"));
    }

    // The damaged-engine case, and the reason `probe::ProbeError::Io` names the
    // binary: a sidecar that exists but cannot be executed fails with the very
    // text a deleted input file produces ("No such file or directory"), so
    // untagged it was answered with "Input file not found" and sent the user
    // hunting for a file that was never missing.
    #[test]
    fn maps_damaged_ffprobe_to_the_engine_not_the_input() {
        let m = humanize("ffprobe spawn: No such file or directory (os error 2)").unwrap();
        assert!(m.contains("bundled FFprobe engine"), "got: {m}");
        assert!(m.contains("MEDIACHEF_FFPROBE"), "got: {m}");
        // The arm order is what keeps this out of the generic FFmpeg arm below:
        // "ffprobe spawn: " contains "spawn: ".
        assert!(
            !m.contains("FFmpeg"),
            "a damaged ffprobe blamed on ffmpeg: {m}"
        );
        // A non-executable sidecar arrives as a permission error instead (and on
        // Windows as a bad-image one) — same arm, same sentence.
        assert!(humanize("ffprobe spawn: Permission denied (os error 13)")
            .unwrap()
            .contains("MEDIACHEF_FFPROBE"));
        // Complement, so the new needle cannot swallow the input-file arm: a real
        // missing input carries no engine tag and must still blame the input.
        assert!(humanize("i.mp4: No such file or directory")
            .unwrap()
            .contains("Input file"));
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
