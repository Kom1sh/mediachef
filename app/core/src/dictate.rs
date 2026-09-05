//! Диктовка: короткий WAV с микрофона — в строку.
//!
//! Тонкая обёртка над [`crate::transcribe::run_whisper`], и намеренно тонкая.
//! Диктовка отличается от рецептов транскрибации только концами тракта: на
//! входе микрофон вместо файла, на выходе строка в буфер обмена вместо файла
//! на диске. Всё между ними — ресемпл в 16 кГц моно, запуск `whisper-cli`,
//! разбор отказов, проверка «в расшифровке есть слова» — уже написано и
//! обкатано на трёх платформах, и переписывать это ради второго входа было бы
//! ошибкой.
//!
//! Своего временного файла модуль не заводит: `run_whisper` пишет результат в
//! путь, который ему дали, а мы даём путь внутри своей временной папки. Она
//! уносит с собой и файл, поэтому на диске пользователя не остаётся ничего.

use crate::process::CancelToken;
use crate::runner::{Outcome, RunError};
use crate::transcribe::{run_whisper, WhisperFormat, WhisperJob, NO_SPEECH};
use std::path::{Path, PathBuf};

/// Чем закончилась попытка расшифровать надиктованное.
///
/// «Тишина» вынесена отдельным вариантом, а не пустой строкой: вызывающему
/// нужно их различать. Пустая строка в буфере обмена затёрла бы то, что человек
/// туда положил раньше, а тишина — это ровно тот случай, когда буфер трогать
/// нельзя.
#[derive(Debug)]
pub enum DictateError {
    /// Речи в записи не нашлось. Буфер обмена не трогать.
    NoSpeech,
    /// Отменено пользователем — Escape во время расшифровки.
    Cancelled,
    /// Всё остальное: whisper упал, модель битая, места нет.
    Failed(RunError),
}

impl std::fmt::Display for DictateError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::NoSpeech => write!(f, "{NO_SPEECH}"),
            Self::Cancelled => write!(f, "cancelled"),
            Self::Failed(e) => write!(f, "{}", e.message),
        }
    }
}

/// Хвост вывода whisper для кнопки «скопировать лог» — есть только у отказа.
impl DictateError {
    pub fn stderr_tail(&self) -> &str {
        match self {
            Self::Failed(e) => &e.stderr_tail,
            _ => "",
        }
    }
}

/// Расшифровывает готовый WAV в строку.
///
/// `language` — код языка либо `"auto"`. `prompt` — словарь терминов; пустая
/// строка означает «без словаря», и тогда флаг whisper-у не передаётся.
///
/// Про лимит словаря: обрезать его здесь нечем и не нужно. Потолок whisper —
/// `n_text_ctx/2`, то есть **токены**, а не знаки, и посчитать их без
/// токенизатора модели нельзя. Whisper лишнее отрезает молча — ни
/// предупреждения, ни ненулевого кода возврата, — поэтому следить за бюджетом
/// обязан тот, кто заполняет поле, а не этот слой.
pub fn transcribe_wav(
    ffmpeg: &Path,
    whisper: &Path,
    wav: &Path,
    model: &Path,
    language: &str,
    prompt: &str,
    cancel: &CancelToken,
) -> Result<String, DictateError> {
    let tmp = tempfile::tempdir().map_err(|e| {
        DictateError::Failed(RunError {
            message: format!("tempdir: {e}"),
            stderr_tail: String::new(),
        })
    })?;
    let out: PathBuf = tmp.path().join("dictation.txt");

    let job = WhisperJob {
        input: wav.to_path_buf(),
        output: out.clone(),
        model: model.to_path_buf(),
        language: language.to_string(),
        // Диктовка не переводит: для перевода есть отдельный второй хоткей.
        translate: false,
        // Текст без таймкодов — их некуда девать в буфере обмена.
        format: WhisperFormat::Txt,
        prompt: prompt.to_string(),
    };

    // Прогресс не парсим: на секундной задаче он бессмыслен, а колбэк
    // run_whisper требует всё равно.
    match run_whisper(ffmpeg, whisper, &job, cancel, |_| {}) {
        Ok(Outcome::Cancelled) => Err(DictateError::Cancelled),
        Ok(Outcome::Done) => {
            let text = std::fs::read_to_string(&out).map_err(|e| {
                DictateError::Failed(RunError {
                    message: format!("не прочитать расшифровку: {e}"),
                    stderr_tail: String::new(),
                })
            })?;
            Ok(text.trim().to_string())
        }
        Err(e) if e.message.starts_with("no_speech:") => Err(DictateError::NoSpeech),
        Err(e) => Err(DictateError::Failed(e)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Интеграционный: живой whisper на голосовой фикстуре.
    ///
    /// `#[ignore]` как у соседей в `transcribe`: тесту нужны сайдкары и
    /// скачанная модель, поэтому он гоняется явно и в macOS-полосе CI.
    /// Фикстура с 2026-09-05 лежит в репозитории, а не синтезируется на
    /// раннере, так что результат один и тот же везде.
    #[test]
    #[ignore]
    fn transcribes_fixture_to_a_string() {
        let ffmpeg = crate::locate::ffmpeg().expect("ffmpeg не найден");
        let whisper = crate::locate::whisper().expect("whisper-cli не найден");
        let models_dir = std::env::var("MEDIACHEF_MODELS_DIR")
            .map(PathBuf::from)
            .expect("нужен MEDIACHEF_MODELS_DIR с ggml-tiny.bin");
        let model = crate::models::model_path(&models_dir, "tiny").expect("нет ggml-tiny.bin");
        let wav = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../fixtures/speech.wav");

        let text = transcribe_wav(
            &ffmpeg,
            &whisper,
            &wav,
            &model,
            "auto",
            "",
            &CancelToken::new(),
        )
        .expect("расшифровка не удалась");

        let lower = text.to_lowercase();
        assert!(
            lower.contains("hello") || lower.contains("test"),
            "неожиданная расшифровка: {text}"
        );
        // Строка обрезана по краям: в буфер обмена ведущий пробел whisper-а
        // попадать не должен.
        assert_eq!(text, text.trim(), "строка не обрезана: {text:?}");
    }

    /// Тишина — это `NoSpeech`, а не пустая строка и не отказ.
    #[test]
    #[ignore]
    fn silence_is_no_speech() {
        let ffmpeg = crate::locate::ffmpeg().expect("ffmpeg не найден");
        let whisper = crate::locate::whisper().expect("whisper-cli не найден");
        let models_dir = std::env::var("MEDIACHEF_MODELS_DIR")
            .map(PathBuf::from)
            .expect("нужен MEDIACHEF_MODELS_DIR с ggml-tiny.bin");
        let model = crate::models::model_path(&models_dir, "tiny").expect("нет ggml-tiny.bin");

        let dir = tempfile::tempdir().unwrap();
        let silence = dir.path().join("silence.wav");
        let ok = std::process::Command::new(&ffmpeg)
            .args([
                "-v",
                "error",
                "-y",
                "-f",
                "lavfi",
                "-i",
                "anullsrc=r=16000:cl=mono",
                "-t",
                "3",
                "-c:a",
                "pcm_s16le",
            ])
            .arg(&silence)
            .status()
            .expect("ffmpeg не запустился")
            .success();
        assert!(ok, "не удалось сделать тишину");

        let r = transcribe_wav(
            &ffmpeg,
            &whisper,
            &silence,
            &model,
            "auto",
            "",
            &CancelToken::new(),
        );
        assert!(
            matches!(r, Err(DictateError::NoSpeech)),
            "тишина должна давать NoSpeech, получено: {r:?}"
        );
    }
}
