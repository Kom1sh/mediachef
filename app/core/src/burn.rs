//! «Вшить субтитры»: расшифровка, нарисованная прямо в кадре.
//!
//! Два прогона одним заданием. Сначала whisper пишет SRT во временную папку —
//! тем же [`run_whisper`], что у рецептов-расшифровок, со всеми его проверками
//! (тишина не превращается в титры). Затем ffmpeg перекодирует видео с фильтром
//! `subtitles=`, и libass рисует этот SRT поверх кадра. Отдельного .srt у
//! пользователя не появляется: кому он нужен рядом с видео, у того есть рецепт
//! «Субтитры к видео (SRT)».
//!
//! Зачем это вообще нужно, если плееры умеют показывать SRT: туда, куда видео
//! чаще всего уходит — мессенджеры, соцсети, презентация, — отдельная дорожка
//! субтитров не доезжает. Доезжает только то, что нарисовано в кадре.

use crate::process::CancelToken;
use crate::runner::{run_ffmpeg_in, Outcome, RunError};
use crate::transcribe::{run_whisper, WhisperFormat, WhisperJob};
use std::path::{Path, PathBuf};

/// Имя SRT во временной папке. Голое и латинское нарочно — см. [`burn_argv`].
pub const SUBS_FILE: &str = "subs.srt";

/// Доля прогресса, отданная расшифровке; остальное — перекодированию. Расшифровка
/// на модели small и перекодирование на veryfast идут примерно вровень, а шкала,
/// которая полминуты стоит на месте, выглядит как зависание, — отсюда не половина.
const TRANSCRIBE_SHARE: f32 = 0.6;

/// Шрифт субтитров на маке. Без него libass берёт Arial, а за иероглифами CoreText
/// отправляет его в PingFangUI из закрытого системного фреймворка, который
/// открыть нельзя, — и китайский выходит квадратиками (проверено на сайдкаре
/// 9.0.1). Arial Unicode MS лежит в Supplemental на любом маке и покрывает
/// латиницу, кириллицу, арабский и CJK одним файлом; Hiragino Sans GB рисует
/// иероглифы, но разгоняет кириллицу вразрядку. На Windows и Linux свой подбор
/// шрифтов, и этот шрифт там есть не везде, — оставлено libass.
const MAC_FONT: Option<&str> = if cfg!(target_os = "macos") {
    Some("Arial Unicode MS")
} else {
    None
};

#[derive(Debug, Clone)]
pub struct BurnJob {
    /// Расшифровка. Её `output` и `format` перезаписываются: SRT уходит во
    /// временную папку, а на месте результата оказывается видео [`BurnJob::output`].
    pub transcript: WhisperJob,
    pub output: PathBuf,
    /// Длительность исходника — для процента второго прогона.
    pub duration_s: Option<f64>,
}

/// Аргументы ffmpeg для второго прогона.
///
/// Он запускается из папки, где лежит [`SUBS_FILE`], поэтому в фильтре — имя без
/// пути: внутри filtergraph `:` и `\` — синтаксис, и путь Windows (`C:\Users\…`)
/// пришлось бы экранировать в два слоя, а имя пользователя с апострофом — в три.
/// По той же причине вход и выход — абсолютные пути: рабочая папка у ffmpeg чужая.
///
/// Видео перекодируется неизбежно — субтитры становятся частью кадра. CRF 20 на
/// обычном ролике на глаз не отличить от исходника: цель здесь не размер, как у
/// «сжать видео». `scale` до чётных сторон — потому что yuv420p нечётных не
/// бывает и x264 на них падает. Звук перекодируется в AAC, а не копируется: MP4
/// принимает не всякий кодек, и `-c:a copy` из MKV с Vorbis не собрался бы.
pub fn burn_argv(input: &Path, output: &Path) -> Vec<String> {
    let mut argv: Vec<String> = vec!["-i".into(), input.display().to_string(), "-vf".into()];
    let style = match MAC_FONT {
        Some(font) => format!(":force_style='FontName={font}'"),
        None => String::new(),
    };
    argv.push(format!(
        "subtitles={SUBS_FILE}{style},scale=trunc(iw/2)*2:trunc(ih/2)*2"
    ));
    argv.extend(
        [
            "-c:v",
            "libx264",
            "-crf",
            "20",
            "-preset",
            "veryfast",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-movflags",
            "+faststart",
        ]
        .iter()
        .map(|s| s.to_string()),
    );
    argv.push(output.display().to_string());
    argv
}

fn absolute(p: &Path) -> PathBuf {
    std::path::absolute(p).unwrap_or_else(|_| p.to_path_buf())
}

/// Второй прогон отдельно: `dir` уже содержит [`SUBS_FILE`]. Отдельная функция —
/// чтобы его можно было проверить без whisper и без модели (тест ниже и `smoke`).
pub fn burn_into(
    ffmpeg: &Path,
    dir: &Path,
    input: &Path,
    output: &Path,
    duration_s: Option<f64>,
    cancel: &CancelToken,
    on_progress: impl FnMut(f32),
) -> Result<Outcome, RunError> {
    let argv = burn_argv(&absolute(input), &absolute(output));
    run_ffmpeg_in(ffmpeg, &argv, Some(dir), duration_s, cancel, on_progress)
}

/// Всё задание: расшифровка в SRT (0–60%), затем вшивание (60–100%).
///
/// Ничего не услышал — ошибка `no_speech`, как у рецептов-расшифровок, и видео не
/// перекодируется вовсе: ролик с пустыми субтитрами — тот же ролик, только хуже.
pub fn run_burn(
    ffmpeg: &Path,
    whisper: &Path,
    job: &BurnJob,
    cancel: &CancelToken,
    mut on_progress: impl FnMut(f32),
) -> Result<Outcome, RunError> {
    let tmp = tempfile::tempdir().map_err(|e| RunError {
        message: format!("tempdir: {e}"),
        stderr_tail: String::new(),
    })?;
    let mut wj = job.transcript.clone();
    wj.output = tmp.path().join(SUBS_FILE);
    wj.format = WhisperFormat::Srt;
    if let Outcome::Cancelled = run_whisper(ffmpeg, whisper, &wj, cancel, |p| {
        on_progress(p * TRANSCRIBE_SHARE)
    })? {
        return Ok(Outcome::Cancelled);
    }
    if cancel.is_cancelled() {
        return Ok(Outcome::Cancelled);
    }
    let base = TRANSCRIBE_SHARE * 100.0;
    burn_into(
        ffmpeg,
        tmp.path(),
        &job.transcript.input,
        &job.output,
        job.duration_s,
        cancel,
        |p| on_progress(base + p * (1.0 - TRANSCRIBE_SHARE)),
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::locate;
    use std::process::Command;

    #[test]
    fn argv_names_the_srt_without_a_path() {
        let argv = burn_argv(Path::new("/in/a b.mkv"), Path::new("/out/a b.mp4"));
        assert_eq!(argv[1], "/in/a b.mkv");
        // The file is named bare — the run happens in its folder — and nothing
        // before the first filter separator is a path.
        let first = argv[3].split(',').next().unwrap();
        assert!(first.starts_with("subtitles=subs.srt"), "{}", argv[3]);
        assert!(!first.contains('/') && !first.contains('\\'), "{first}");
        assert_eq!(argv.last().unwrap(), "/out/a b.mp4");
    }

    /// Светлых пикселей в кадре на `at` секунде (серый кадр сырыми байтами).
    fn bright_pixels(ffmpeg: &Path, video: &Path, at: &str) -> usize {
        let out = Command::new(ffmpeg)
            .args(["-v", "error", "-ss", at, "-i"])
            .arg(video)
            .args(["-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "gray", "-"])
            .output()
            .unwrap();
        assert!(
            out.status.success(),
            "{}",
            String::from_utf8_lossy(&out.stderr)
        );
        out.stdout.iter().filter(|&&b| b > 200).count()
    }

    // Главное, что может сломаться на чужой машине, — не argv, а libass без
    // шрифтов: фильтр отработает молча и ничего не нарисует. Поэтому проверяется
    // сам кадр: на чёрном фоне до вшивания светлых пикселей нет, после — есть.
    #[test]
    fn burns_text_into_the_frame() {
        let ff = locate::ffmpeg().unwrap();
        // Тестовый бинарник не видит сайдкаров и берёт ffmpeg с PATH, а сборка из
        // Homebrew идёт без libass — фильтра `subtitles` в ней нет. Тогда проверять
        // нечего; на сайдкаре: MEDIACHEF_FFMPEG=app/src-tauri/binaries/ffmpeg-… .
        // В CI ffmpeg из apt собран с libass, и тест там идёт по-настоящему.
        let filters = Command::new(&ff)
            .args(["-hide_banner", "-filters"])
            .output()
            .unwrap();
        if !String::from_utf8_lossy(&filters.stdout).contains(" subtitles ") {
            eprintln!(
                "SKIP: {} has no `subtitles` filter (no libass)",
                ff.display()
            );
            return;
        }
        let dir = tempfile::tempdir().unwrap();
        let black = dir.path().join("black.mp4");
        let st = Command::new(&ff)
            .args(["-v", "error", "-y", "-f", "lavfi", "-i"])
            .arg("color=black:size=640x360:duration=2:rate=10")
            .args(["-c:v", "libx264", "-pix_fmt", "yuv420p"])
            .arg(&black)
            .status()
            .unwrap();
        assert!(st.success());
        std::fs::write(
            dir.path().join(SUBS_FILE),
            "1\n00:00:00,000 --> 00:00:02,000\nHELLO WORLD\n",
        )
        .unwrap();
        let out = dir.path().join("burned.mp4");
        let mut last = 0.0;
        let r = burn_into(
            &ff,
            dir.path(),
            &black,
            &out,
            Some(2.0),
            &CancelToken::new(),
            |p| last = p,
        )
        .unwrap();
        assert!(matches!(r, Outcome::Done));
        assert_eq!(last, 100.0);
        assert_eq!(
            bright_pixels(&ff, &black, "1"),
            0,
            "the source is not black"
        );
        let lit = bright_pixels(&ff, &out, "1");
        // Two words at libass's default size on 640×360 light a few hundred
        // pixels; the black source lights none, so the bar only has to clear noise.
        assert!(
            lit > 50,
            "no subtitle text in the frame ({lit} bright pixels)"
        );
    }
}
