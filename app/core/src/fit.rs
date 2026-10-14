//! «Сжать до N МБ»: битрейт, при котором ролик данной длины влезает в данный размер.
//!
//! Шаблон рецепта — подстановка без арифметики, а здесь нужна именно она: битрейт
//! зависит от длительности, а её знает только ffprobe, и только в момент, когда
//! файл уже выбран. Поэтому рецепт объявляет `fit_size: {param, audio_kbps}`, а
//! очередь перед сборкой argv кладёт в параметры вычисленные значения — те, что
//! перечислены в [`KEYS`]. Ни одно из них пользователь не задаёт и не видит в форме.

use crate::recipe::{ParamType, Recipe};
use std::collections::HashMap;

/// Ключи, которые [`derive`] добавляет к параметрам. Рецепт с `fit_size` ссылается
/// на них в `args:` как на обычные `{ключ}`.
pub const KEYS: [&str; 4] = [
    "fit_video_bitrate",
    "fit_bufsize",
    "fit_audio_bitrate",
    "fit_height",
];

/// Мегабайт — десятичный: 10 МБ — это 10 000 000 байт. Лимиты сервисов считают
/// кто как (у одних МБ, у других МиБ), и меньшая из двух единиц влезает в обе.
const MB: f64 = 1_000_000.0;

/// Доля бюджета, которую получают сами дорожки. Остальное — контейнер MP4 (индекс
/// и заголовки, около процента) и запас на то, что кодировщик попадает в битрейт
/// не до бита.
const USABLE: f64 = 0.96;

/// Ниже этого на видео остаётся не картинка, а крупные квадраты. Такую цель
/// честнее отклонить с понятным минимумом, чем молча выдать кашу.
const MIN_VIDEO_KBPS: f64 = 50.0;

/// Когда на видео остаётся меньше этого, звук ужимается до [`LOW_AUDIO_KBPS`]:
/// на слух разница меньше, чем на глаз разница в картинке.
const LOW_VIDEO_KBPS: f64 = 300.0;
const LOW_AUDIO_KBPS: u32 = 64;

/// Потолок высоты кадра по битрейту видео. Мало битов на большой кадр — хуже, чем
/// честные 480p: кодировщик размазывает каждую деталь. Потолок, а не цель —
/// ролик ниже потолка не растягивается (`min(ih, …)` в рецепте).
const HEIGHTS: [(f64, u32); 5] = [
    (6000.0, 2160),
    (2500.0, 1080),
    (1200.0, 720),
    (600.0, 480),
    (0.0, 360),
];

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct FitPlan {
    pub video_kbps: u32,
    pub audio_kbps: u32,
    pub max_height: u32,
}

/// Битрейты под цель `size_mb` для ролика длиной `duration_s`.
///
/// Видео идёт с ограничением VBV: `maxrate` равен битрейту, буфер — одной секунде
/// его. Тогда за весь ролик кодировщик не может выдать больше `битрейт × (T + 1)`,
/// и это `+ 1` здесь и учтено. Без ограничения средний битрейт x264 держит, но
/// перебор на коротком ролике легко выходит за лимит, и файл не пролезает туда,
/// ради чего его сжимали.
///
/// `audio_kbps = 0` — у ролика нет звука, бюджет целиком уходит на картинку.
pub fn plan(size_mb: f64, duration_s: f64, audio_kbps: u32) -> Result<FitPlan, String> {
    // `is_finite` first: NaN compares false with everything and would slip past a
    // plain `<= 0.0` straight into the arithmetic below.
    if !size_mb.is_finite() || size_mb <= 0.0 {
        return Err("target size must be above zero".into());
    }
    if !duration_s.is_finite() || duration_s <= 0.0 {
        return Err("the video's duration is unknown, so a size cannot be planned".into());
    }
    let budget_kbit = size_mb * MB * 8.0 / 1000.0 * USABLE;
    let video_for = |audio: u32| (budget_kbit - audio as f64 * duration_s) / (duration_s + 1.0);

    let mut audio = audio_kbps;
    let mut video = video_for(audio);
    if video < LOW_VIDEO_KBPS && audio > LOW_AUDIO_KBPS {
        audio = LOW_AUDIO_KBPS;
        video = video_for(audio);
    }
    if video < MIN_VIDEO_KBPS {
        // Минимум считается при уже ужатом звуке — это наименьшее, что вообще
        // можно предложить, а не то, что получилось бы при исходном.
        let need_kbit = MIN_VIDEO_KBPS * (duration_s + 1.0) + audio as f64 * duration_s;
        let min_mb = need_kbit * 1000.0 / 8.0 / USABLE / MB;
        return Err(format!(
            "{size_mb} MB is too small for a {} video — the smallest that still makes sense is about {} MB",
            human_duration(duration_s),
            round_up_mb(min_mb)
        ));
    }
    let max_height = HEIGHTS
        .iter()
        .find(|(floor, _)| video >= *floor)
        .map(|(_, h)| *h)
        .unwrap_or(360);
    Ok(FitPlan {
        video_kbps: video.floor() as u32,
        audio_kbps: audio,
        max_height,
    })
}

/// Достраивает параметры рецепта с `fit_size` значениями [`KEYS`]. Рецепт без
/// `fit_size` проходит как есть.
///
/// `size_bytes` — размер исходника: если он уже не больше цели, пережатие сделает
/// файл только крупнее, и об этом лучше сказать до запуска. `None` — размер
/// неизвестен, проверка пропускается (так ей пользуется и прогон `smoke`, у
/// которого фикстура заведомо меньше любой цели).
pub fn derive(
    recipe: &Recipe,
    resolved: &mut HashMap<String, String>,
    duration_s: Option<f64>,
    size_bytes: Option<u64>,
    has_audio: bool,
) -> Result<(), String> {
    let Some(fit) = &recipe.fit_size else {
        return Ok(());
    };
    let raw = resolved.get(&fit.param).ok_or_else(|| {
        format!(
            "recipe {} has no `{}` param for fit_size",
            recipe.id, fit.param
        )
    })?;
    let size_mb: f64 = raw
        .parse()
        .map_err(|_| format!("target size `{raw}` is not a number"))?;
    if let Some(bytes) = size_bytes {
        if bytes as f64 <= size_mb * MB {
            return Err(format!(
                "the file is already {} MB — within the {size_mb} MB target, there is nothing to compress",
                round_up_mb(bytes as f64 / MB)
            ));
        }
    }
    let duration =
        duration_s.ok_or("the video's duration is unknown, so a size cannot be planned")?;
    let p = plan(
        size_mb,
        duration,
        if has_audio { fit.audio_kbps } else { 0 },
    )?;
    resolved.insert("fit_video_bitrate".into(), format!("{}k", p.video_kbps));
    resolved.insert("fit_bufsize".into(), format!("{}k", p.video_kbps));
    // Без звука `-b:a` ни на что не влияет, но ffmpeg не должен получить «0k».
    resolved.insert(
        "fit_audio_bitrate".into(),
        format!("{}k", p.audio_kbps.max(LOW_AUDIO_KBPS)),
    );
    resolved.insert("fit_height".into(), p.max_height.to_string());
    Ok(())
}

/// Проверка рецепта, которую не делает `deny_unknown_fields`: `fit_size.param`
/// должен быть настоящим числовым параметром этого рецепта.
pub fn check_recipe(recipe: &Recipe) -> Result<(), String> {
    let Some(fit) = &recipe.fit_size else {
        return Ok(());
    };
    match recipe.params.iter().find(|p| p.key == fit.param) {
        Some(p) if matches!(p.r#type, ParamType::Int | ParamType::Float) => Ok(()),
        Some(_) => Err(format!(
            "{}: fit_size.param `{}` must be int or float",
            recipe.id, fit.param
        )),
        None => Err(format!(
            "{}: fit_size.param `{}` is not a param",
            recipe.id, fit.param
        )),
    }
}

fn round_up_mb(mb: f64) -> String {
    let r = (mb * 10.0).ceil() / 10.0;
    if r.fract() == 0.0 {
        format!("{r:.0}")
    } else {
        format!("{r:.1}")
    }
}

fn human_duration(s: f64) -> String {
    let total = s.round() as u64;
    let (m, sec) = (total / 60, total % 60);
    match (m / 60, m % 60) {
        (0, 0) => format!("{sec}-second"),
        (0, m) => format!("{m}:{sec:02}"),
        (h, m) => format!("{h}:{m:02}:{sec:02}"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Главное обещание рецепта: результат влезает. Проверяется по той же границе,
    // что гарантирует VBV, — битрейт × (T + 1) плюс звук не больше бюджета.
    #[test]
    fn plan_fits_the_budget() {
        for (mb, t) in [
            (10.0, 60.0),
            (25.0, 600.0),
            (8.0, 15.0),
            (200.0, 3600.0),
            (100.0, 2.0),
        ] {
            let p = plan(mb, t, 128).unwrap();
            let kbit = p.video_kbps as f64 * (t + 1.0) + p.audio_kbps as f64 * t;
            let bytes = kbit * 1000.0 / 8.0;
            assert!(bytes <= mb * MB * USABLE, "{mb} MB / {t} s: {bytes} bytes");
            // И не выбрасывает бюджет: хотя бы 95% того, что положено дорожкам.
            assert!(
                bytes >= mb * MB * USABLE * 0.95,
                "{mb} MB / {t} s wastes budget"
            );
        }
    }

    #[test]
    fn ten_mb_minute_is_720p_class() {
        // 10 МБ на минуту — типичный запрос «для Discord»: ~1.1 Мбит/с на видео.
        let p = plan(10.0, 60.0, 128).unwrap();
        assert_eq!(p.audio_kbps, 128);
        assert!((1000..1200).contains(&p.video_kbps), "{p:?}");
        assert_eq!(p.max_height, 480);
    }

    #[test]
    fn tight_budget_trades_audio_first() {
        // 10 МБ на 10 минут: при 128 кбит/с на звук картинке осталось бы ~0.
        let p = plan(10.0, 600.0, 128).unwrap();
        assert_eq!(p.audio_kbps, LOW_AUDIO_KBPS);
        assert_eq!(p.max_height, 360);
    }

    #[test]
    fn hopeless_target_names_a_minimum() {
        let e = plan(1.0, 3600.0, 128).unwrap_err();
        assert!(e.contains("too small"), "{e}");
        assert!(e.contains("1:00:00"), "{e}");
        // Названный минимум и правда проходит.
        let min: f64 = e
            .rsplit("about ")
            .next()
            .unwrap()
            .trim_end_matches(" MB")
            .parse()
            .unwrap();
        assert!(
            plan(min, 3600.0, 128).is_ok(),
            "minimum {min} MB itself fails"
        );
    }

    #[test]
    fn silent_video_spends_everything_on_picture() {
        let with = plan(10.0, 60.0, 128).unwrap();
        let without = plan(10.0, 60.0, 0).unwrap();
        assert!(without.video_kbps > with.video_kbps);
        assert_eq!(without.audio_kbps, 0);
    }

    #[test]
    fn rejects_nonsense() {
        assert!(plan(0.0, 60.0, 128).is_err());
        assert!(plan(-5.0, 60.0, 128).is_err());
        assert!(plan(10.0, 0.0, 128).is_err());
        assert!(plan(f64::NAN, 60.0, 128).is_err());
    }

    fn fit_recipe() -> Recipe {
        Recipe::from_yaml(
            r#"
id: t
category: compress
title: {en: T}
aliases: {en: [t]}
description: {en: D}
input: {types: [video]}
params:
  - {key: size_mb, type: int, default: 10, min: 1, label: {en: Size}, unit: MB}
engine: ffmpeg
fit_size: {param: size_mb, audio_kbps: 128}
args: ["-i", "{input}", "-b:v", "{fit_video_bitrate}", "{output}"]
output: {ext: mp4}
"#,
        )
        .unwrap()
    }

    #[test]
    fn derive_fills_every_key() {
        let r = fit_recipe();
        let mut p = crate::template::resolve_params(&r, &HashMap::new()).unwrap();
        derive(&r, &mut p, Some(60.0), Some(80_000_000), true).unwrap();
        for k in KEYS {
            assert!(p.contains_key(k), "missing {k}");
        }
        assert!(p["fit_video_bitrate"].ends_with('k'));
        assert_eq!(p["fit_video_bitrate"], p["fit_bufsize"]);
        let argv = crate::template::build_argv(&r, "in.mp4", "out.mp4", &p).unwrap();
        assert_eq!(argv[3], p["fit_video_bitrate"]);
    }

    #[test]
    fn derive_refuses_a_file_that_already_fits() {
        let r = fit_recipe();
        let mut p = crate::template::resolve_params(&r, &HashMap::new()).unwrap();
        let e = derive(&r, &mut p, Some(60.0), Some(4_200_000), true).unwrap_err();
        assert!(e.contains("already 4.2 MB"), "{e}");
        // Неизвестный размер — проверки нет, план строится.
        derive(&r, &mut p, Some(60.0), None, true).unwrap();
    }

    #[test]
    fn derive_needs_a_duration() {
        let r = fit_recipe();
        let mut p = crate::template::resolve_params(&r, &HashMap::new()).unwrap();
        assert!(derive(&r, &mut p, None, Some(80_000_000), true).is_err());
    }

    #[test]
    fn silent_video_gets_a_valid_audio_flag() {
        let r = fit_recipe();
        let mut p = crate::template::resolve_params(&r, &HashMap::new()).unwrap();
        derive(&r, &mut p, Some(60.0), None, false).unwrap();
        assert_eq!(p["fit_audio_bitrate"], "64k");
    }

    #[test]
    fn recipe_without_fit_size_is_untouched() {
        let mut r = fit_recipe();
        r.fit_size = None;
        let mut p = HashMap::new();
        derive(&r, &mut p, None, None, true).unwrap();
        assert!(p.is_empty());
    }

    // The promise end to end, on the bundled recipe and a real encoder: a clip
    // that is hard to compress (noise defeats every prediction x264 has) must
    // still come out under the target. Slow — half a minute of encoding — hence
    // ignored; run with `cargo test -p mediachef-core fit -- --ignored`.
    #[test]
    #[ignore]
    fn real_encode_lands_under_the_target() {
        use crate::runner::{run_ffmpeg, CancelToken};
        let ff = crate::locate::ffmpeg().unwrap();
        let fp = crate::locate::ffprobe().unwrap();
        let dir = tempfile::tempdir().unwrap();
        let src = dir.path().join("noisy.mp4");
        let st = std::process::Command::new(&ff)
            .args(["-v", "error", "-y", "-f", "lavfi", "-i"])
            .arg("testsrc2=size=1280x720:rate=30:duration=20,noise=alls=40:allf=t")
            .args(["-f", "lavfi", "-i", "sine=frequency=440:duration=20"])
            .args([
                "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", "-c:a", "aac",
            ])
            .arg(&src)
            .status()
            .unwrap();
        assert!(st.success());
        let r = crate::catalog::bundled()
            .into_iter()
            .find(|r| r.id == "compress-video-size")
            .unwrap();
        let info = crate::probe::probe(&fp, &src).unwrap();
        for target_mb in ["3", "8"] {
            let mut p = HashMap::from([("size_mb".to_string(), target_mb.to_string())]);
            p = crate::template::resolve_params(&r, &p).unwrap();
            derive(
                &r,
                &mut p,
                info.duration_s,
                info.size_bytes,
                crate::probe::has_audio(&info.raw),
            )
            .unwrap();
            let out = dir.path().join(format!("out-{target_mb}.mp4"));
            let argv = crate::template::build_argv(
                &r,
                &src.display().to_string(),
                &out.display().to_string(),
                &p,
            )
            .unwrap();
            run_ffmpeg(&ff, &argv, info.duration_s, &CancelToken::new(), |_| {}).unwrap();
            let got = std::fs::metadata(&out).unwrap().len() as f64;
            let limit: f64 = target_mb.parse::<f64>().unwrap() * MB;
            eprintln!(
                "{target_mb} MB target: {got} bytes ({:.0}% of the limit)",
                got / limit * 100.0
            );
            assert!(got <= limit, "{target_mb} MB target: got {got} bytes");
            // And it is not wildly under either — the budget is there to be used.
            assert!(
                got >= limit * 0.6,
                "{target_mb} MB target: only {got} bytes"
            );
        }
    }

    #[test]
    fn check_recipe_wants_a_numeric_param() {
        let mut r = fit_recipe();
        assert!(check_recipe(&r).is_ok());
        r.fit_size.as_mut().unwrap().param = "nope".into();
        assert!(check_recipe(&r).unwrap_err().contains("not a param"));
    }
}
