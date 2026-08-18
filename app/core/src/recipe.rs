use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum RecipeError {
    #[error("yaml error in {file}: {src}")]
    Yaml { file: String, src: String },
    #[error("duplicate {kind}: {value} (in {file})")]
    Duplicate {
        kind: &'static str,
        value: String,
        file: String,
    },
}

// `deny_unknown_fields` everywhere is deliberate: a typo'd or hopeful key in a
// recipe YAML (`out_ext`, `sufix`, …) must fail the load instead of being
// silently ignored, which would leave a param that looks wired but does nothing.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct LocStr {
    pub en: String,
    pub ru: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct LocList {
    pub en: Vec<String>,
    pub ru: Vec<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MediaType {
    Video,
    Audio,
    Image,
    Subtitle,
    Any,
}

impl MediaType {
    /// Lowercase wire name — the same spelling `serde(rename_all)` emits.
    /// User-facing strings must use this, never `{:?}` (which would shout
    /// "Video" at the user in a sentence).
    pub fn as_str(&self) -> &'static str {
        match self {
            MediaType::Video => "video",
            MediaType::Audio => "audio",
            MediaType::Image => "image",
            MediaType::Subtitle => "subtitle",
            MediaType::Any => "any",
        }
    }
}

impl std::fmt::Display for MediaType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.as_str())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct InputSpec {
    pub types: Vec<MediaType>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ParamType {
    Enum,
    Int,
    Float,
    Bool,
    String,
    Path,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Param {
    pub key: String,
    #[serde(rename = "type")]
    pub r#type: ParamType,
    #[serde(default)]
    pub values: Option<Vec<String>>,
    pub default: serde_yaml::Value,
    pub label: LocStr,
    #[serde(default)]
    pub min: Option<f64>,
    #[serde(default)]
    pub max: Option<f64>,
    #[serde(default)]
    pub unit: Option<String>,
    #[serde(default)]
    pub advanced: bool,
}

impl Param {
    pub fn default_str(&self) -> String {
        match &self.default {
            serde_yaml::Value::String(s) => s.clone(),
            v => serde_yaml::to_string(v)
                .unwrap_or_default()
                .trim()
                .to_string(),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Engine {
    Ffmpeg,
    Whisper,
    Pipeline,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct OutputSpec {
    pub ext: String,
    #[serde(default)]
    pub suffix: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Seo {
    pub slug: String,
    #[serde(default)]
    pub priority: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Recipe {
    pub id: String,
    pub category: String,
    pub title: LocStr,
    pub aliases: LocList,
    pub description: LocStr,
    pub input: InputSpec,
    #[serde(default)]
    pub params: Vec<Param>,
    pub engine: Engine,
    #[serde(default)]
    pub args: Vec<String>,
    pub output: OutputSpec,
    #[serde(default)]
    pub seo: Option<Seo>,
}

impl Recipe {
    pub fn from_yaml(s: &str) -> Result<Recipe, RecipeError> {
        serde_yaml::from_str(s).map_err(|e| RecipeError::Yaml {
            file: "<inline>".into(),
            src: e.to_string(),
        })
    }
}

pub fn load_all(pairs: &[(String, String)]) -> Result<Vec<Recipe>, RecipeError> {
    let mut out: Vec<Recipe> = Vec::new();
    for (file, content) in pairs {
        let r: Recipe = serde_yaml::from_str(content).map_err(|e| RecipeError::Yaml {
            file: file.clone(),
            src: e.to_string(),
        })?;
        if out.iter().any(|x| x.id == r.id) {
            return Err(RecipeError::Duplicate {
                kind: "id",
                value: r.id,
                file: file.clone(),
            });
        }
        if let Some(s) = &r.seo {
            if out
                .iter()
                .any(|x| x.seo.as_ref().is_some_and(|xs| xs.slug == s.slug))
            {
                return Err(RecipeError::Duplicate {
                    kind: "slug",
                    value: s.slug.clone(),
                    file: file.clone(),
                });
            }
        }
        out.push(r);
    }
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE: &str = r#"
id: extract-audio-mp3
category: extract
title: {en: "Extract audio to MP3", ru: "Извлечь аудио в MP3"}
aliases:
  en: [video to mp3, rip audio]
  ru: [видео в мп3, вытащить звук]
description: {en: "Takes the audio track", ru: "Достаёт звуковую дорожку"}
input: {types: [video]}
params:
  - key: bitrate
    type: enum
    values: ["128k", "192k", "320k"]
    default: "192k"
    label: {en: "Bitrate", ru: "Битрейт"}
engine: ffmpeg
args: ["-i", "{input}", "-vn", "-b:a", "{bitrate}", "{output}"]
output: {ext: mp3}
seo: {slug: video-to-mp3, priority: high}
"#;

    #[test]
    fn parses_sample() {
        let r = Recipe::from_yaml(SAMPLE).unwrap();
        assert_eq!(r.id, "extract-audio-mp3");
        assert_eq!(r.title.ru, "Извлечь аудио в MP3");
        assert_eq!(r.input.types, vec![MediaType::Video]);
        assert_eq!(r.params[0].default_str(), "192k");
        assert!(matches!(r.engine, Engine::Ffmpeg));
        assert_eq!(r.output.ext, "mp3");
    }

    #[test]
    fn duplicate_ids_rejected() {
        let e = load_all(&[
            ("a.yaml".into(), SAMPLE.into()),
            ("b.yaml".into(), SAMPLE.into()),
        ])
        .unwrap_err();
        assert!(e.to_string().contains("duplicate"));
    }

    #[test]
    fn numeric_default_becomes_string() {
        let y = SAMPLE.replace("default: \"192k\"", "default: 192");
        let r = Recipe::from_yaml(&y).unwrap();
        assert_eq!(r.params[0].default_str(), "192");
    }

    // An unknown key is a bug, not a comment: a param that reads as wired
    // (`out_ext`) but is never consumed must not load. Covers the nested structs
    // too, so a typo inside `output:`/`params:`/`seo:` fails just as loudly.
    #[test]
    fn unknown_fields_rejected() {
        for (what, yaml) in [
            (
                "top level",
                SAMPLE.replace("engine: ffmpeg", "engine: ffmpeg\nbogus: 1"),
            ),
            (
                "output",
                SAMPLE.replace("output: {ext: mp3}", "output: {ext: mp3, out_ext: mp4}"),
            ),
            (
                "param",
                SAMPLE.replace("    type: enum", "    type: enum\n    bogus: 1"),
            ),
            (
                "seo",
                SAMPLE.replace(
                    "seo: {slug: video-to-mp3",
                    "seo: {slug: video-to-mp3, bogus: 1",
                ),
            ),
            (
                "input",
                SAMPLE.replace(
                    "input: {types: [video]}",
                    "input: {types: [video], kinds: [audio]}",
                ),
            ),
            (
                "title",
                SAMPLE.replace(
                    r#"ru: "Извлечь аудио в MP3"}"#,
                    r#"ru: "Извлечь аудио в MP3", de: "x"}"#,
                ),
            ),
        ] {
            let e = Recipe::from_yaml(&yaml)
                .expect_err(&format!("unknown {what} field must be rejected"));
            assert!(
                e.to_string().contains("unknown field"),
                "unexpected {what} error: {e}"
            );
        }
        // Sanity: the untouched sample still parses, so the cases above fail for
        // the added key and not for a botched string replace.
        assert!(Recipe::from_yaml(SAMPLE).is_ok());
    }

    // Ruling 21 follow-up: user-facing text renders media types lowercase, and
    // the Display spelling must not drift from the serde wire spelling.
    #[test]
    fn media_type_display_matches_wire_name() {
        for mt in [
            MediaType::Video,
            MediaType::Audio,
            MediaType::Image,
            MediaType::Subtitle,
            MediaType::Any,
        ] {
            let wire = serde_json::to_string(&mt).unwrap();
            assert_eq!(format!("\"{mt}\""), wire, "Display drifted from serde");
            assert_eq!(mt.to_string(), mt.to_string().to_lowercase());
        }
    }
}
