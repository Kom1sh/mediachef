use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum RecipeError {
    #[error("yaml error in {file}: {src}")]
    Yaml { file: String, src: String },
    #[error("duplicate {kind}: {value} (in {file})")]
    Duplicate { kind: &'static str, value: String, file: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocStr { pub en: String, pub ru: String }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocList { pub en: Vec<String>, pub ru: Vec<String> }

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MediaType { Video, Audio, Image, Subtitle, Any }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InputSpec { pub types: Vec<MediaType> }

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ParamType { Enum, Int, Float, Bool, String, Path }

#[derive(Debug, Clone, Serialize, Deserialize)]
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
            v => serde_yaml::to_string(v).unwrap_or_default().trim().to_string(),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Engine { Ffmpeg, Whisper, Pipeline }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutputSpec { pub ext: String, #[serde(default)] pub suffix: Option<String> }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Seo { pub slug: String, #[serde(default)] pub priority: Option<String> }

#[derive(Debug, Clone, Serialize, Deserialize)]
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
        serde_yaml::from_str(s).map_err(|e| RecipeError::Yaml { file: "<inline>".into(), src: e.to_string() })
    }
}

pub fn load_all(pairs: &[(String, String)]) -> Result<Vec<Recipe>, RecipeError> {
    let mut out: Vec<Recipe> = Vec::new();
    for (file, content) in pairs {
        let r: Recipe = serde_yaml::from_str(content)
            .map_err(|e| RecipeError::Yaml { file: file.clone(), src: e.to_string() })?;
        if out.iter().any(|x| x.id == r.id) {
            return Err(RecipeError::Duplicate { kind: "id", value: r.id, file: file.clone() });
        }
        if let Some(s) = &r.seo {
            if out.iter().any(|x| x.seo.as_ref().is_some_and(|xs| xs.slug == s.slug)) {
                return Err(RecipeError::Duplicate { kind: "slug", value: s.slug.clone(), file: file.clone() });
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
        let e = load_all(&[("a.yaml".into(), SAMPLE.into()), ("b.yaml".into(), SAMPLE.into())]).unwrap_err();
        assert!(e.to_string().contains("duplicate"));
    }

    #[test]
    fn numeric_default_becomes_string() {
        let y = SAMPLE.replace("default: \"192k\"", "default: 192");
        let r = Recipe::from_yaml(&y).unwrap();
        assert_eq!(r.params[0].default_str(), "192");
    }
}
