use std::path::Path;
use std::process::Command;
use serde::Serialize;
use thiserror::Error;
use crate::recipe::MediaType;

#[derive(Debug, Error)]
pub enum ProbeError {
    #[error("ffprobe failed: {0}")]
    Failed(String),
    #[error("io: {0}")]
    Io(#[from] std::io::Error),
}

#[derive(Debug, Serialize)]
pub struct ProbeInfo {
    pub duration_s: Option<f64>,
    pub media_type: MediaType,
    pub size_bytes: Option<u64>,
    pub summary: String,
    pub raw: serde_json::Value,
}

pub fn detect_media_type(raw: &serde_json::Value) -> MediaType {
    let streams = raw["streams"].as_array().cloned().unwrap_or_default();
    let has_real_video = streams.iter().any(|s| {
        s["codec_type"] == "video" && s["disposition"]["attached_pic"].as_i64().unwrap_or(0) == 0
    });
    let format_name = raw["format"]["format_name"].as_str().unwrap_or("");
    // Image formats are tested before the video branch: image containers (png_pipe etc.) carry a
    // non-attached_pic video stream, so checking video first would classify every still as Video.
    if format_name.contains("image") || format_name.ends_with("_pipe") {
        return MediaType::Image;
    }
    if has_real_video { return MediaType::Video; }
    if streams.iter().any(|s| s["codec_type"] == "audio") { return MediaType::Audio; }
    MediaType::Any
}

pub fn probe(ffprobe: &Path, file: &Path) -> Result<ProbeInfo, ProbeError> {
    let out = Command::new(ffprobe)
        .args(["-v", "error", "-print_format", "json", "-show_format", "-show_streams"])
        .arg(file)
        .output()?;
    if !out.status.success() {
        return Err(ProbeError::Failed(String::from_utf8_lossy(&out.stderr).to_string()));
    }
    let raw: serde_json::Value = serde_json::from_slice(&out.stdout).map_err(|e| ProbeError::Failed(e.to_string()))?;
    let duration_s = raw["format"]["duration"].as_str().and_then(|d| d.parse::<f64>().ok()).filter(|d| *d > 0.0);
    let size_bytes = raw["format"]["size"].as_str().and_then(|s| s.parse().ok());
    let media_type = detect_media_type(&raw);
    let codecs: Vec<String> = raw["streams"].as_array().cloned().unwrap_or_default()
        .iter().filter_map(|s| s["codec_name"].as_str().map(String::from)).collect();
    let summary = codecs.join(" + ");
    Ok(ProbeInfo { duration_s, media_type, size_bytes, summary, raw })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::locate;
    use std::path::Path;

    fn fixtures() -> std::path::PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR")).join("../../fixtures")
    }

    #[test]
    fn detect_type_from_json() {
        let video: serde_json::Value = serde_json::json!({
            "format": {"format_name": "mov,mp4"},
            "streams": [{"codec_type": "video", "disposition": {"attached_pic": 0}}, {"codec_type": "audio"}]
        });
        assert_eq!(detect_media_type(&video), crate::recipe::MediaType::Video);
        let mp3_cover: serde_json::Value = serde_json::json!({
            "format": {"format_name": "mp3"},
            "streams": [{"codec_type": "audio"}, {"codec_type": "video", "disposition": {"attached_pic": 1}}]
        });
        assert_eq!(detect_media_type(&mp3_cover), crate::recipe::MediaType::Audio);
        // Pins the image-before-video precedence: a still carries a real video stream, so flipping
        // the branch order in detect_media_type would classify every PNG as Video.
        let png: serde_json::Value = serde_json::json!({
            "format": {"format_name": "png_pipe"},
            "streams": [{"codec_type": "video", "disposition": {"attached_pic": 0}}]
        });
        assert_eq!(detect_media_type(&png), crate::recipe::MediaType::Image);
    }

    #[test]
    fn probes_fixture_mp4() {
        let fp = locate::ffprobe().expect("ffprobe in PATH for tests");
        let info = probe(&fp, &fixtures().join("tiny.mp4")).unwrap();
        assert_eq!(info.media_type, crate::recipe::MediaType::Video);
        assert!(info.duration_s.unwrap() > 1.5 && info.duration_s.unwrap() < 3.0);
    }
}
