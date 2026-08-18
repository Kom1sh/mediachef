use std::collections::HashMap;
use thiserror::Error;
use crate::recipe::{ParamType, Recipe};

#[derive(Debug, Error)]
pub enum TemplateError {
    #[error("unknown placeholder {{{0}}}")]
    UnknownPlaceholder(String),
    #[error("invalid param {key}: {reason}")]
    InvalidParam { key: String, reason: String },
}

pub fn resolve_params(recipe: &Recipe, provided: &HashMap<String, String>) -> Result<HashMap<String, String>, TemplateError> {
    let mut out = HashMap::new();
    for p in &recipe.params {
        let val = provided.get(&p.key).cloned().unwrap_or_else(|| p.default_str());
        match p.r#type {
            ParamType::Enum => {
                let vals = p.values.clone().unwrap_or_default();
                if !vals.contains(&val) {
                    return Err(TemplateError::InvalidParam { key: p.key.clone(), reason: format!("{val} not in {vals:?}") });
                }
            }
            ParamType::Int | ParamType::Float => {
                if !val.is_empty() {
                    let n: f64 = val.parse().map_err(|_| TemplateError::InvalidParam { key: p.key.clone(), reason: "not a number".into() })?;
                    if p.min.is_some_and(|m| n < m) || p.max.is_some_and(|m| n > m) {
                        return Err(TemplateError::InvalidParam { key: p.key.clone(), reason: "out of range".into() });
                    }
                }
            }
            _ => {}
        }
        out.insert(p.key.clone(), val);
    }
    Ok(out)
}

fn lookup<'a>(name: &str, input: &'a str, output: &'a str, params: &'a HashMap<String, String>) -> Option<String> {
    match name {
        "input" => Some(input.to_string()),
        "output" => Some(output.to_string()),
        _ => params.get(name).cloned(),
    }
}

fn substitute(token: &str, input: &str, output: &str, params: &HashMap<String, String>) -> Result<String, TemplateError> {
    let mut out = String::new();
    let mut rest = token;
    while let Some(start) = rest.find('{') {
        let end = rest[start..].find('}').map(|e| start + e).ok_or_else(|| TemplateError::UnknownPlaceholder(rest.to_string()))?;
        out.push_str(&rest[..start]);
        let name = &rest[start + 1..end];
        let val = lookup(name, input, output, params).ok_or_else(|| TemplateError::UnknownPlaceholder(name.to_string()))?;
        out.push_str(&val);
        rest = &rest[end + 1..];
    }
    out.push_str(rest);
    Ok(out)
}

pub fn build_argv(recipe: &Recipe, input: &str, output: &str, params: &HashMap<String, String>) -> Result<Vec<String>, TemplateError> {
    // (substituted, was_lone_placeholder_now_empty)
    let mut staged: Vec<(Vec<String>, bool)> = Vec::new();
    for token in &recipe.args {
        // {key:split}
        if token.starts_with('{') && token.ends_with(":split}") {
            let name = &token[1..token.len() - ":split}".len()];
            let raw = lookup(name, input, output, params).ok_or_else(|| TemplateError::UnknownPlaceholder(name.to_string()))?;
            let pieces = shell_words::split(&raw).map_err(|e| TemplateError::InvalidParam { key: name.to_string(), reason: e.to_string() })?;
            let mut subbed = Vec::new();
            for piece in pieces {
                subbed.push(substitute(&piece, input, output, params)?);
            }
            // an empty value splits into zero tokens — collapse it with its flag,
            // same as a lone `{key}` that resolved to an empty string
            let empty = subbed.is_empty();
            staged.push((subbed, empty));
            continue;
        }
        let lone_key = token.strip_prefix('{').and_then(|t| t.strip_suffix('}')).filter(|k| !k.contains('{'));
        let val = substitute(token, input, output, params)?;
        let lone_empty = lone_key.is_some() && val.is_empty();
        staged.push((vec![val], lone_empty));
    }
    let mut argv: Vec<String> = Vec::new();
    for (tokens, lone_empty) in staged {
        if lone_empty {
            if argv.last().is_some_and(|t| t.starts_with('-')) {
                argv.pop();
            }
            continue;
        }
        argv.extend(tokens);
    }
    Ok(argv)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::recipe::Recipe;
    use std::collections::HashMap;

    fn recipe(args: &[&str], params_yaml: &str) -> Recipe {
        let y = format!(
            r#"
id: t
category: c
title: {{en: T, ru: Т}}
aliases: {{en: [], ru: []}}
description: {{en: D, ru: Д}}
input: {{types: [any]}}
params:
{params_yaml}
engine: ffmpeg
args: [{}]
output: {{ext: mp4}}
"#,
            args.iter().map(|a| format!("\"{}\"", a)).collect::<Vec<_>>().join(", "),
            params_yaml = params_yaml
        );
        Recipe::from_yaml(&y).unwrap()
    }

    const BITRATE: &str = r#"  - {key: bitrate, type: enum, values: ["128k","192k"], default: "192k", label: {en: B, ru: Б}}"#;
    const START: &str = r#"  - {key: start, type: string, default: "", label: {en: S, ru: С}, advanced: true}"#;
    const CMD: &str = r#"  - {key: cmd, type: string, default: "-i {input} -c copy {output}", label: {en: C, ru: К}}"#;

    #[test]
    fn substitutes_tokens_and_substrings() {
        let r = recipe(&["-i", "{input}", "-b:a", "{bitrate}", "-vf", "scale={bitrate}:-1", "{output}"], BITRATE);
        let v = build_argv(&r, "/in путь/a b.mp4", "/out/o.mp4", &resolve_params(&r, &HashMap::new()).unwrap()).unwrap();
        assert_eq!(v, vec!["-i", "/in путь/a b.mp4", "-b:a", "192k", "-vf", "scale=192k:-1", "/out/o.mp4"]);
    }

    #[test]
    fn empty_optional_drops_flag() {
        let r = recipe(&["-i", "{input}", "-ss", "{start}", "{output}"], START);
        let v = build_argv(&r, "i.mp4", "o.mp4", &resolve_params(&r, &HashMap::new()).unwrap()).unwrap();
        assert_eq!(v, vec!["-i", "i.mp4", "o.mp4"]);
    }

    #[test]
    fn value_stays_single_token_no_injection() {
        let r = recipe(&["-i", "{input}", "-metadata", "title={start}", "{output}"], START);
        let mut p = HashMap::new();
        p.insert("start".to_string(), "x; rm -rf / #".to_string());
        let v = build_argv(&r, "i.mp4", "o.mp4", &resolve_params(&r, &p).unwrap()).unwrap();
        assert_eq!(v[3], "title=x; rm -rf / #"); // один токен, не команда
    }

    #[test]
    fn split_modifier_uses_shell_words() {
        let r = recipe(&["{cmd:split}"], CMD);
        let v = build_argv(&r, "in file.mp4", "out.mp4", &resolve_params(&r, &HashMap::new()).unwrap()).unwrap();
        assert_eq!(v, vec!["-i", "in file.mp4", "-c", "copy", "out.mp4"]);
    }

    #[test]
    fn enum_validated() {
        let r = recipe(&["{bitrate}"], BITRATE);
        let mut p = HashMap::new();
        p.insert("bitrate".to_string(), "999k".to_string());
        assert!(resolve_params(&r, &p).is_err());
    }

    #[test]
    fn unknown_placeholder_is_error() {
        let r = recipe(&["{nope}"], BITRATE);
        assert!(build_argv(&r, "i", "o", &resolve_params(&r, &HashMap::new()).unwrap()).is_err());
    }

    #[test]
    fn empty_split_drops_preceding_flag() {
        const FILTERS: &str = r#"  - {key: filters, type: string, default: "", label: {en: F, ru: Ф}}"#;
        let r = recipe(&["-i", "{input}", "-vf", "{filters:split}", "{output}"], FILTERS);
        let v = build_argv(&r, "i.mp4", "o.mp4", &resolve_params(&r, &HashMap::new()).unwrap()).unwrap();
        assert_eq!(v, vec!["-i", "i.mp4", "o.mp4"]);
    }
}
