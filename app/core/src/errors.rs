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
    } else if s.contains("ffmpeg not found") || s.contains("ffprobe not found") || s.contains("spawn: ") {
        "FFmpeg binary not found — install it (brew install ffmpeg on macOS)."
    } else if s.contains("no such file") {
        "Input file not found (moved or renamed?)."
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
        assert!(humanize("x Invalid data found when processing input").unwrap().contains("corrupted"));
        assert!(humanize("No space left on device").unwrap().contains("disk space"));
        assert!(humanize("does not contain any stream").unwrap().contains("streams"));
        assert!(humanize("something totally else").is_none());
        // Ruling 21: a missing binary must read as "install ffmpeg", never as a
        // moved input file. The spawn case pins the arm order — it contains
        // "No such file or directory" and would match the input-file arm below.
        assert!(humanize("ffmpeg not found (brew install ffmpeg)").unwrap().contains("install"));
        let spawned = humanize("spawn: No such file or directory").unwrap();
        assert!(spawned.contains("install"), "got: {spawned}");
        assert!(!spawned.contains("Input file"), "spawn failure blamed on the input file: {spawned}");
        // Complement: a real ffmpeg input-not-found (no "spawn: " prefix) must
        // still blame the input, so the new arm cannot swallow the old one.
        assert!(humanize("i.mp4: No such file or directory").unwrap().contains("Input file"));
    }
}
