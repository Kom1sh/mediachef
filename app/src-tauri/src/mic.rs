//! Захват с микрофона в WAV.
//!
//! Через `cpal` напрямую, а не запуском ffmpeg на устройство. Три довода, по
//! убыванию важности:
//!
//! 1. **Старт.** Библиотека открывает поток за десяток миллисекунд, порождение
//!    процесса ffmpeg с инициализацией avfoundation — за три-четыре сотни. При
//!    удержании клавиши это ровно первое слово фразы.
//! 2. **Индикатор микрофона.** Оранжевая точка в строке меню горит, пока
//!    устройство держит процесс. Поток открывается только на время записи, и
//!    точка гаснет вместе с ним — иначе приложение выглядело бы так, будто
//!    слушает всегда.
//! 3. **Уровень сигнала** для оверлея достаётся из тех же сэмплов бесплатно.
//!
//! Поток целиком живёт в своём потоке ОС: `cpal::Stream` не `Send`, и таскать
//! его между потоками нельзя. Наружу торчат только флаг остановки и канал с
//! результатом.
//!
//! ## Про «первое слово» и преролл
//!
//! Спека закладывала кольцевой буфер преролла, чтобы не терять начало фразы.
//! При открытии потока по нажатию хоткея кольцо этой задачи не решает: до
//! первого сэмпла звука попросту не существует, и восстанавливать нечего.
//! Настоящий преролл требует держать поток открытым **постоянно** — а это
//! ровно то, чего мы избегаем доводом 2 выше: вечно горящая оранжевая точка.
//!
//! Поэтому здесь честный минимум: пишем всё с первого доставленного сэмпла и
//! **замеряем** задержку до него ([`Recording::first_sample_delay`]). Цифра
//! нужна, чтобы решать предметно, а не спорить: если она окажется в единицы
//! миллисекунд, кольцо не нужно вовсе; если в сотни — придётся выбирать между
//! потерянным словом и постоянным индикатором.

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{ErrorKind, FromSample, Sample, SampleFormat};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::{mpsc, Arc, Mutex};
use std::time::{Duration, Instant};

/// Потолок записи. Дальше автостоп: записанное расшифровывается, а не
/// выбрасывается.
///
/// Пять минут при 48 кГц моно в `i16` — около 29 МБ в памяти. Со стерео было
/// бы вдвое больше, отсюда сведение в моно прямо на захвате.
pub const MAX_RECORDING: Duration = Duration::from_secs(5 * 60);

/// Как часто поток просыпается проверить, не пора ли останавливаться.
const TICK: Duration = Duration::from_millis(20);

#[derive(Debug)]
pub enum MicError {
    /// Устройства ввода нет вовсе.
    NoDevice,
    /// Устройство есть, но не отдаёт пригодную конфигурацию.
    NoConfig(String),
    /// Поток не открылся. На macOS это же сообщение приходит, когда доступ к
    /// микрофону не выдан: система не отличает «запрещено» от «не получилось».
    OpenFailed(String),
    /// Формат сэмплов, которого мы не умеем.
    UnsupportedFormat(String),
    /// Не удалось записать WAV.
    WriteFailed(String),
    /// Записи не получилось вовсе — ни одного сэмпла.
    Empty,
}

impl std::fmt::Display for MicError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::NoDevice => write!(f, "микрофон не найден"),
            Self::NoConfig(e) => write!(f, "устройство не отдало конфигурацию: {e}"),
            Self::OpenFailed(e) => write!(f, "не открыть поток с микрофона: {e}"),
            Self::UnsupportedFormat(s) => write!(f, "формат сэмплов не поддержан: {s}"),
            Self::WriteFailed(e) => write!(f, "не записать WAV: {e}"),
            Self::Empty => write!(f, "с микрофона не пришло ни одного сэмпла"),
        }
    }
}

/// Почему запись закончилась.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StopReason {
    /// Так и просили.
    Asked,
    /// Упёрлись в [`MAX_RECORDING`].
    MaxDuration,
    /// Устройство сменилось или отвалилось посреди записи.
    DeviceChanged,
}

/// Готовая запись.
#[derive(Debug)]
pub struct Recording {
    /// WAV во временной папке. Живёт, пока жив `_dir`.
    pub path: PathBuf,
    pub reason: StopReason,
    pub duration: Duration,
    /// Сколько прошло от открытия потока до первого сэмпла. Ради этой цифры
    /// и затевался замер — см. заметку про преролл в шапке модуля.
    pub first_sample_delay: Option<Duration>,
    /// Временная папка: удаляется вместе со структурой, унося WAV. На диск
    /// пользователя не попадает ничего.
    _dir: tempfile::TempDir,
}

/// Разделяемое с аудиопотоком: пиковый уровень для оверлея.
///
/// `f32` в `AtomicU32` по битам — чтобы читать уровень из UI-потока без
/// блокировки. Аудиоколбэк работает в реальном времени, и мьютекс в нём — это
/// щелчки в записи.
struct Level(AtomicU32);

impl Level {
    fn new() -> Self {
        Self(AtomicU32::new(0))
    }
    fn set(&self, v: f32) {
        self.0.store(v.to_bits(), Ordering::Relaxed);
    }
    fn get(&self) -> f32 {
        f32::from_bits(self.0.load(Ordering::Relaxed))
    }
}

/// Идущая запись.
pub struct Recorder {
    stop: Arc<AtomicBool>,
    level: Arc<Level>,
    done: mpsc::Receiver<Result<Recording, MicError>>,
}

impl Recorder {
    /// Открывает устройство по умолчанию и начинает писать.
    ///
    /// Возвращается сразу, как только поток открыт: ждать первого сэмпла здесь
    /// нельзя, иначе на это время подвиснет обработчик хоткея.
    pub fn start() -> Result<Self, MicError> {
        let stop = Arc::new(AtomicBool::new(false));
        let level = Arc::new(Level::new());
        let (done_tx, done_rx) = mpsc::channel();
        // Открытие потока сообщает об успехе отдельным каналом: конструктор
        // обязан отличить «микрофона нет» от «пишем».
        let (ready_tx, ready_rx) = mpsc::channel();

        let stop_t = stop.clone();
        let level_t = level.clone();
        std::thread::Builder::new()
            .name("dictation-mic".into())
            .spawn(move || {
                let result = record(&stop_t, level_t, &ready_tx);
                // Если поток не открылся, про это уже сказано через ready_tx.
                let _ = done_tx.send(result);
            })
            .map_err(|e| MicError::OpenFailed(e.to_string()))?;

        match ready_rx.recv() {
            Ok(Ok(())) => Ok(Self {
                stop,
                level,
                done: done_rx,
            }),
            Ok(Err(e)) => Err(e),
            // Поток умер, не сказав ни слова.
            Err(_) => Err(MicError::OpenFailed("поток захвата не запустился".into())),
        }
    }

    /// Пиковый уровень последнего блока, 0.0..=1.0. Для полоски в оверлее.
    pub fn level(&self) -> f32 {
        self.level.get()
    }

    /// Останавливает запись и отдаёт WAV.
    pub fn stop(self) -> Result<Recording, MicError> {
        self.stop.store(true, Ordering::Relaxed);
        self.done
            .recv()
            .unwrap_or(Err(MicError::OpenFailed("поток захвата пропал".into())))
    }
}

/// Тело потока захвата: открыть, писать, закрыть, сложить WAV.
fn record(
    stop: &AtomicBool,
    level: Arc<Level>,
    ready: &mpsc::Sender<Result<(), MicError>>,
) -> Result<Recording, MicError> {
    let host = cpal::default_host();
    let Some(device) = host.default_input_device() else {
        let _ = ready.send(Err(MicError::NoDevice));
        return Err(MicError::NoDevice);
    };
    let config = match device.default_input_config() {
        Ok(c) => c,
        Err(e) => {
            let _ = ready.send(Err(MicError::NoConfig(e.to_string())));
            return Err(MicError::NoConfig(e.to_string()));
        }
    };

    let channels = config.channels() as usize;
    // В cpal 0.18 `SampleRate` — это просто `u32`, без обёртки-кортежа.
    let sample_rate = config.sample_rate();
    let format = config.sample_format();

    // Сюда аудиоколбэк складывает уже сведённое в моно.
    let samples: Arc<Mutex<Vec<f32>>> = Arc::new(Mutex::new(Vec::new()));
    let first_at: Arc<Mutex<Option<Instant>>> = Arc::new(Mutex::new(None));
    // Устройство сменилось — узнаём из колбэка ошибок, а не из воздуха.
    let device_gone = Arc::new(AtomicBool::new(false));

    let opened_at = Instant::now();
    let err_gone = device_gone.clone();
    let err_fn = move |e: cpal::Error| {
        if matches!(e.kind(), ErrorKind::DeviceChanged) {
            err_gone.store(true, Ordering::Relaxed);
        }
    };

    // Один и тот же обработчик на все форматы: приводим сэмпл к f32 и сводим
    // каналы. Дублировать тело ради типа незачем.
    macro_rules! build {
        ($t:ty) => {{
            let sink = samples.clone();
            let first = first_at.clone();
            let lvl = level.clone();
            device.build_input_stream(
                config.clone().into(),
                move |data: &[$t], _: &cpal::InputCallbackInfo| {
                    if let Ok(mut f) = first.lock() {
                        if f.is_none() {
                            *f = Some(Instant::now());
                        }
                    }
                    let mono = downmix::<$t>(data, channels);
                    lvl.set(peak(&mono));
                    if let Ok(mut s) = sink.lock() {
                        s.extend_from_slice(&mono);
                    }
                },
                err_fn.clone(),
                None,
            )
        }};
    }

    let stream = match format {
        SampleFormat::I8 => build!(i8),
        SampleFormat::I16 => build!(i16),
        SampleFormat::I32 => build!(i32),
        SampleFormat::F32 => build!(f32),
        other => {
            let e = MicError::UnsupportedFormat(other.to_string());
            let _ = ready.send(Err(MicError::UnsupportedFormat(other.to_string())));
            return Err(e);
        }
    };

    let stream = match stream {
        Ok(s) => s,
        Err(e) => {
            let _ = ready.send(Err(MicError::OpenFailed(e.to_string())));
            return Err(MicError::OpenFailed(e.to_string()));
        }
    };
    if let Err(e) = stream.play() {
        let _ = ready.send(Err(MicError::OpenFailed(e.to_string())));
        return Err(MicError::OpenFailed(e.to_string()));
    }
    // С этого мгновения вызывающий считает, что запись идёт.
    let _ = ready.send(Ok(()));

    let reason = loop {
        if stop.load(Ordering::Relaxed) {
            break StopReason::Asked;
        }
        if device_gone.load(Ordering::Relaxed) {
            break StopReason::DeviceChanged;
        }
        if opened_at.elapsed() >= MAX_RECORDING {
            break StopReason::MaxDuration;
        }
        std::thread::sleep(TICK);
    };

    // Закрываем устройство до записи файла: оранжевая точка гаснет сразу, а не
    // после того, как мы досохраним WAV.
    drop(stream);

    let mono = samples.lock().map(|s| s.clone()).unwrap_or_default();
    if mono.is_empty() {
        return Err(MicError::Empty);
    }
    let first_sample_delay = first_at
        .lock()
        .ok()
        .and_then(|f| *f)
        .map(|t| t.saturating_duration_since(opened_at));
    let duration = Duration::from_secs_f64(mono.len() as f64 / sample_rate as f64);

    let dir = tempfile::tempdir().map_err(|e| MicError::WriteFailed(e.to_string()))?;
    let path = dir.path().join("dictation.wav");
    write_wav(&path, &mono, sample_rate).map_err(|e| MicError::WriteFailed(e.to_string()))?;

    Ok(Recording {
        path,
        reason,
        duration,
        first_sample_delay,
        _dir: dir,
    })
}

/// Сводит перемежающиеся каналы в моно усреднением.
///
/// Моно и нужно распознаванию, а стерео вдвое раздувает буфер без всякой
/// пользы. Усреднение, а не «взять левый»: на многих гарнитурах полезный
/// сигнал сидит в одном канале, и выбор наугад иногда давал бы тишину.
fn downmix<T>(data: &[T], channels: usize) -> Vec<f32>
where
    T: Sample,
    f32: FromSample<T>,
{
    if channels <= 1 {
        return data.iter().map(|s| f32::from_sample(*s)).collect();
    }
    data.chunks_exact(channels)
        .map(|frame| {
            let sum: f32 = frame.iter().map(|s| f32::from_sample(*s)).sum();
            sum / channels as f32
        })
        .collect()
}

/// Пик по модулю — для полоски уровня.
fn peak(samples: &[f32]) -> f32 {
    samples.iter().fold(0.0f32, |m, s| m.max(s.abs())).min(1.0)
}

/// Пишет моно-WAV в 16 битах.
///
/// 16 бит, а не 32 с плавающей точкой: распознаванию разницы нет, а файл вдвое
/// легче, и ffmpeg дальше всё равно приводит его к 16 кГц.
fn write_wav(path: &Path, mono: &[f32], sample_rate: u32) -> Result<(), hound::Error> {
    let spec = hound::WavSpec {
        channels: 1,
        sample_rate,
        bits_per_sample: 16,
        sample_format: hound::SampleFormat::Int,
    };
    let mut w = hound::WavWriter::create(path, spec)?;
    for s in mono {
        w.write_sample(to_i16(*s))?;
    }
    w.finalize()
}

/// f32 в i16 с ограничением.
///
/// Ограничение обязательно: сэмпл за пределами -1.0..=1.0 (а он бывает — гейн
/// на входе никто не гарантирует) при простом умножении переполнил бы i16 и
/// превратился бы из громкого звука в громкий треск.
fn to_i16(v: f32) -> i16 {
    (v.clamp(-1.0, 1.0) * i16::MAX as f32) as i16
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn downmix_averages_stereo_frames() {
        // Два кадра по два канала: (1.0, 0.0) и (0.5, -0.5).
        let data: Vec<f32> = vec![1.0, 0.0, 0.5, -0.5];
        let mono = downmix::<f32>(&data, 2);
        assert_eq!(mono, vec![0.5, 0.0]);
    }

    #[test]
    fn downmix_passes_mono_through() {
        let data: Vec<f32> = vec![0.25, -0.75];
        assert_eq!(downmix::<f32>(&data, 1), data);
    }

    /// Хвост, не набравший полного кадра, отбрасывается: половина кадра — это
    /// не звук, а мусор на стыке блоков.
    #[test]
    fn downmix_drops_ragged_tail() {
        let data: Vec<f32> = vec![1.0, 1.0, 0.5];
        assert_eq!(downmix::<f32>(&data, 2), vec![1.0]);
    }

    #[test]
    fn peak_is_absolute_and_capped() {
        assert_eq!(peak(&[0.1, -0.9, 0.3]), 0.9);
        assert_eq!(peak(&[]), 0.0);
        assert_eq!(peak(&[5.0]), 1.0, "пик не должен вылезать за единицу");
    }

    /// Переполнение i16 — это не тихий баг, а громкий треск в записи.
    #[test]
    fn to_i16_clamps_instead_of_wrapping() {
        assert_eq!(to_i16(0.0), 0);
        assert_eq!(to_i16(1.0), i16::MAX);
        assert_eq!(to_i16(-1.0), -i16::MAX);
        assert_eq!(to_i16(9.0), i16::MAX, "перегруз обязан упереться в потолок");
        assert_eq!(to_i16(-9.0), -i16::MAX);
    }

    /// Живой микрофон: пишем секунду и смотрим, что получился настоящий WAV.
    ///
    /// `#[ignore]` — тесту нужно железо и, на macOS, выданное разрешение.
    /// Запускать: `cargo test -p mediachef mic -- --ignored --nocapture`.
    /// Учтите, что разрешение система выдаёт бинарю, который спрашивает: из
    /// `cargo test` диалог будет про терминал, а не про MediaChef.
    #[test]
    #[ignore]
    fn records_a_second_from_the_real_microphone() {
        let rec = Recorder::start().expect("микрофон не открылся");
        std::thread::sleep(Duration::from_secs(1));
        let out = rec.stop().expect("запись не сложилась");
        println!(
            "записано {:?}, причина {:?}, до первого сэмпла {:?}",
            out.duration, out.reason, out.first_sample_delay
        );
        assert_eq!(out.reason, StopReason::Asked);
        assert!(
            out.duration >= Duration::from_millis(500),
            "слишком короткая запись: {:?}",
            out.duration
        );
        assert!(out.path.exists());
    }
}
