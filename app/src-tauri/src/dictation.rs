//! Диктовка: машина состояний хоткея и оркестрация.
//!
//! Машина вынесена в чистую функцию [`step`] над «состояние + событие + время»
//! намеренно. Всё, что можно сломать в этой фиче, ломается здесь: пропущенное
//! отпускание, автоповтор клавиши, нажатие во время расшифровки. Проверять
//! такое, кликая по живому приложению, — способ не проверить ничего, а чистая
//! функция накрывается таблицей тестов за минуту и без микрофона.
//!
//! Время передаётся числом миллисекунд, а не `Instant`, по той же причине:
//! `Instant` нельзя сконструировать произвольным, и тест на «отпустил через
//! 20 мс» пришлось бы писать через настоящий `sleep`.

/// Граница между коротким нажатием и удержанием.
///
/// Меньше — человек нажал и отпустил, значит включил запись переключателем и
/// сейчас будет говорить. Больше — держит клавишу и говорит прямо сейчас.
///
/// Константа, а не настройка: это порог различения намерения, а не вкусовое
/// предпочтение, и вынесение его в интерфейс только заставило бы человека
/// подбирать число, которого он не знает. Значение взято из общей практики и
/// на живых руках не проверено — единственный открытый вопрос спеки, уточняется
/// в волне 5.2.
pub const HOLD_THRESHOLD_MS: u64 = 350;

/// Что случилось.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Event {
    /// Нажата комбинация диктовки. Приходит повторно, пока клавишу держат:
    /// система шлёт автоповтор, и машина обязана его пережёвывать.
    Pressed,
    /// Отпущена комбинация диктовки.
    Released,
    /// Escape. Регистрируется глобально только на время записи и снимается
    /// сразу после — постоянно висящий глобальный Escape сломал бы его во всех
    /// остальных приложениях.
    Escape,
    /// Расшифровка закончилась, чем бы она ни закончилась.
    TranscriptionDone,
}

/// Где мы сейчас.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum State {
    /// Ничего не происходит.
    #[default]
    Idle,
    /// Клавишу держат, запись идёт. `pressed_at_ms` нужен, чтобы на отпускании
    /// отличить удержание от короткого нажатия.
    Holding { pressed_at_ms: u64 },
    /// Запись идёт сама по себе: клавишу нажали коротко и отпустили.
    /// Остановится следующим нажатием.
    Toggled,
    /// Идёт расшифровка. `swallow_release` — признак того, что ближайшее
    /// отпускание относится к нажатию, которым запись остановили, и звуком
    /// отказа на него отвечать не надо.
    Transcribing { swallow_release: bool },
}

/// Что делать снаружи.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Action {
    /// Открыть поток и начать писать.
    StartRecording,
    /// Остановить запись и отправить записанное на расшифровку.
    StopAndTranscribe,
    /// Бросить запись, ничего не доставлять.
    Cancel,
    /// Короткий звук отказа: просят то, чего сейчас нельзя.
    Reject,
    /// Ничего.
    Nothing,
}

/// Один переход. Возвращает новое состояние и то, что делать снаружи.
///
/// Разбор по состояниям, а не по событиям: так таблица из спеки читается
/// сверху вниз и видно, что ни один случай не забыт.
pub fn step(state: State, event: Event, now_ms: u64) -> (State, Action) {
    match (state, event) {
        // --- Покой ---
        (State::Idle, Event::Pressed) => (
            State::Holding {
                pressed_at_ms: now_ms,
            },
            Action::StartRecording,
        ),
        // Отпускание в покое приходит после проглоченного нажатия — молчим.
        (State::Idle, Event::Released) => (State::Idle, Action::Nothing),
        // Escape в покое не наш: он и так не зарегистрирован вне записи.
        (State::Idle, _) => (State::Idle, Action::Nothing),

        // --- Клавишу держат ---
        // Автоповтор. Именно из-за него нельзя писать «нажатие = переключить».
        (State::Holding { .. }, Event::Pressed) => (state, Action::Nothing),
        (State::Holding { pressed_at_ms }, Event::Released) => {
            if now_ms.saturating_sub(pressed_at_ms) >= HOLD_THRESHOLD_MS {
                // Держал и говорил — значит закончил.
                (
                    State::Transcribing {
                        swallow_release: false,
                    },
                    Action::StopAndTranscribe,
                )
            } else {
                // Нажал и отпустил — включил запись, говорить будет сейчас.
                (State::Toggled, Action::Nothing)
            }
        }
        (State::Holding { .. }, Event::Escape) => (State::Idle, Action::Cancel),
        (State::Holding { .. }, Event::TranscriptionDone) => (state, Action::Nothing),

        // --- Запись идёт сама (переключатель) ---
        (State::Toggled, Event::Pressed) => (
            // Отпускание, которое придёт следом за этим нажатием, — не просьба
            // о чём-то, а хвост того же движения пальцем. Звуком отказа на него
            // отвечать нельзя.
            State::Transcribing {
                swallow_release: true,
            },
            Action::StopAndTranscribe,
        ),
        (State::Toggled, Event::Released) => (State::Toggled, Action::Nothing),
        (State::Toggled, Event::Escape) => (State::Idle, Action::Cancel),
        (State::Toggled, Event::TranscriptionDone) => (State::Toggled, Action::Nothing),

        // --- Идёт расшифровка ---
        (State::Transcribing { .. }, Event::TranscriptionDone) => (State::Idle, Action::Nothing),
        (
            State::Transcribing {
                swallow_release: true,
            },
            Event::Released,
        ) => (
            State::Transcribing {
                swallow_release: false,
            },
            Action::Nothing,
        ),
        // Escape во время расшифровки отменяет её: человек уже понял, что
        // надиктовал не то, и ждать результата ему незачем.
        (State::Transcribing { .. }, Event::Escape) => (State::Idle, Action::Cancel),
        // Всё остальное — просьба о том, чего сейчас нельзя.
        (State::Transcribing { .. }, _) => (state, Action::Reject),
    }
}

// ---------------------------------------------------------------------------
// Оркестрация: всё, что вокруг машины состояний.
// ---------------------------------------------------------------------------

use crate::deliver;
use crate::mic::{MicError, Recorder, StopReason};
use crate::settings::AppSettings;
use mediachef_core::dictate::{transcribe_wav, DictateError};
use mediachef_core::process::CancelToken;
use mediachef_core::{locate, models};
use std::path::PathBuf;
use std::sync::{Arc, Mutex, OnceLock};
use std::time::Instant;
use tauri::AppHandle;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

/// Сколько знаков расшифровки показать в уведомлении.
const PREVIEW_CHARS: usize = 60;

/// Начало отсчёта. Машина состояний живёт в миллисекундах от него, а не в
/// `Instant`, чтобы её можно было тестировать произвольным временем.
fn epoch() -> &'static Instant {
    static EPOCH: OnceLock<Instant> = OnceLock::new();
    EPOCH.get_or_init(Instant::now)
}

fn now_ms() -> u64 {
    epoch().elapsed().as_millis() as u64
}

/// Живое состояние диктовки.
///
/// Синглтон: хоткей один, микрофон один, и заводить их по экземпляру на окно
/// было бы способом однажды начать две записи разом.
struct Runtime {
    state: Mutex<State>,
    recorder: Mutex<Option<Recorder>>,
    settings: Arc<Mutex<AppSettings>>,
    models_dir: PathBuf,
}

static RUNTIME: OnceLock<Arc<Runtime>> = OnceLock::new();

/// Включает диктовку: регистрирует хоткей и готовит состояние.
///
/// Зовётся из `setup` только когда `dictation.enabled` — пока диктовку не
/// включили руками, приложение не трогает ни микрофон, ни глобальные хоткеи.
pub fn register(
    app: &AppHandle,
    settings: Arc<Mutex<AppSettings>>,
    models_dir: PathBuf,
) -> Result<(), String> {
    let hotkey = settings
        .lock()
        .map_err(|_| "настройки заблокированы".to_string())?
        .dictation
        .hotkey
        .clone();

    let rt = Arc::new(Runtime {
        state: Mutex::new(State::default()),
        recorder: Mutex::new(None),
        settings,
        models_dir,
    });
    // Второй вызов register — это ошибка сборки, а не ситуация: хоткей уже
    // зарегистрирован, и молча проигнорировать её нельзя.
    RUNTIME
        .set(rt)
        .map_err(|_| "диктовка уже включена".to_string())?;

    let shortcut: Shortcut = hotkey
        .parse()
        .map_err(|e| format!("не разобрать комбинацию «{hotkey}»: {e}"))?;

    app.global_shortcut()
        .on_shortcut(shortcut, move |app, _sc, event| {
            let ev = match event.state {
                ShortcutState::Pressed => Event::Pressed,
                ShortcutState::Released => Event::Released,
            };
            handle(app, ev);
        })
        .map_err(|e| format!("комбинация «{hotkey}» занята другим приложением: {e}"))
}

/// Один шаг машины плюс исполнение того, что она велела.
fn handle(app: &AppHandle, event: Event) {
    let Some(rt) = RUNTIME.get().cloned() else {
        return;
    };
    let action = {
        let Ok(mut st) = rt.state.lock() else {
            return;
        };
        let (next, action) = step(*st, event, now_ms());
        *st = next;
        action
    };
    perform(app, &rt, action);
}

fn perform(app: &AppHandle, rt: &Arc<Runtime>, action: Action) {
    match action {
        Action::Nothing => {}
        // Звука отказа в этой волне нет: он требует своего аудиоресурса и
        // отдельного тракта воспроизведения. Молчание здесь честнее пустого
        // уведомления — человек и так видит, что ничего не произошло.
        Action::Reject => {}
        Action::StartRecording => match Recorder::start() {
            Ok(r) => {
                if let Ok(mut slot) = rt.recorder.lock() {
                    *slot = Some(r);
                }
            }
            Err(e) => {
                // Не смогли открыть микрофон — возвращаемся в покой, иначе
                // следующее нажатие попыталось бы «остановить» несуществующую
                // запись.
                reset(rt);
                deliver::notify(app, "Диктовка", &mic_error_text(&e));
            }
        },
        Action::Cancel => {
            let taken = rt.recorder.lock().ok().and_then(|mut s| s.take());
            // Останавливаем поток, но результат выбрасываем: отмена — это
            // «ничего не доставлять».
            if let Some(r) = taken {
                let _ = r.stop();
            }
        }
        Action::StopAndTranscribe => {
            let Some(rec) = rt.recorder.lock().ok().and_then(|mut s| s.take()) else {
                reset(rt);
                return;
            };
            let app = app.clone();
            let rt = rt.clone();
            // Расшифровка занимает секунды и обязана уйти с потока обработчика
            // хоткея: иначе система сочтёт его зависшим и отберёт регистрацию.
            std::thread::Builder::new()
                .name("dictation-transcribe".into())
                .spawn(move || {
                    transcribe_and_deliver(&app, &rt, rec);
                    handle(&app, Event::TranscriptionDone);
                })
                .ok();
        }
    }
}

/// Возврат в покой после отказа.
fn reset(rt: &Arc<Runtime>) {
    if let Ok(mut st) = rt.state.lock() {
        *st = State::Idle;
    }
    if let Ok(mut slot) = rt.recorder.lock() {
        *slot = None;
    }
}

/// Остановить запись, расшифровать, положить в буфер, сказать человеку.
fn transcribe_and_deliver(app: &AppHandle, rt: &Arc<Runtime>, rec: Recorder) {
    let recording = match rec.stop() {
        Ok(r) => r,
        Err(e) => {
            deliver::notify(app, "Диктовка", &mic_error_text(&e));
            return;
        }
    };
    // Причину остановки говорим до расшифровки: если устройство отвалилось,
    // человек должен понимать, почему фраза оборвалась на полуслове — но
    // записанное всё равно расшифровываем, терять его нельзя.
    match recording.reason {
        StopReason::DeviceChanged => deliver::notify(
            app,
            "Диктовка",
            "Микрофон сменился во время записи. Расшифровываю то, что успело записаться.",
        ),
        StopReason::MaxDuration => deliver::notify(
            app,
            "Диктовка",
            "Достигнут предел в пять минут. Расшифровываю записанное.",
        ),
        StopReason::Asked => {}
    }

    let (model_id, language, dictionary, ui_language) = {
        let Ok(s) = rt.settings.lock() else {
            return;
        };
        (
            s.dictation.model.clone(),
            s.dictation.language.clone(),
            s.dictation.dictionary.clone(),
            s.language.clone(),
        )
    };

    let Some(model) = models::model_path(&rt.models_dir, &model_id) else {
        deliver::notify(
            app,
            "Диктовка",
            &format!("Модель «{model_id}» не скачана — откройте раздел «Модели»."),
        );
        return;
    };
    let (Some(ffmpeg), Some(whisper)) = (locate::ffmpeg(), locate::whisper()) else {
        deliver::notify(
            app,
            "Диктовка",
            "Движки не найдены — переустановите приложение.",
        );
        return;
    };

    // Пустой язык в настройках означает «как в интерфейсе»; «system» в языке
    // интерфейса — «пусть решает whisper».
    let lang = if !language.is_empty() {
        language
    } else if ui_language != "system" {
        ui_language
    } else {
        "auto".into()
    };

    match transcribe_wav(
        &ffmpeg,
        &whisper,
        &recording.path,
        &model,
        &lang,
        &dictionary,
        &CancelToken::new(),
    ) {
        Ok(text) if text.is_empty() => {
            deliver::notify(app, "Диктовка", "Речи не слышно — буфер обмена не тронут.");
        }
        Ok(text) => match deliver::to_clipboard(app, &text) {
            Ok(()) => deliver::notify(
                app,
                "Скопировано в буфер",
                &deliver::preview(&text, PREVIEW_CHARS),
            ),
            Err(e) => deliver::notify(app, "Диктовка", &format!("Не положить в буфер: {e}")),
        },
        Err(DictateError::NoSpeech) => {
            deliver::notify(app, "Диктовка", "Речи не слышно — буфер обмена не тронут.");
        }
        Err(DictateError::Cancelled) => {}
        Err(DictateError::Failed(e)) => {
            deliver::notify(
                app,
                "Диктовка",
                &format!("Не удалось расшифровать: {}", e.message),
            );
        }
    }
}

/// Человеческий текст отказа микрофона.
///
/// Про доступ сказано отдельно, потому что на macOS система не отличает
/// «запрещено» от «не получилось»: наружу приходит один и тот же отказ
/// открытия потока, и подсказать, куда идти, можем только мы.
fn mic_error_text(e: &MicError) -> String {
    match e {
        MicError::NoDevice => "Микрофон не найден.".into(),
        MicError::OpenFailed(_) => {
            "Не открыть микрофон. Проверьте доступ: Системные настройки → Конфиденциальность → Микрофон."
                .into()
        }
        MicError::Empty => "С микрофона не пришло ни звука.".into(),
        other => format!("Микрофон: {other}"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Хоткей по умолчанию обязан разбираться.
    ///
    /// Опечатка в строке — это не ошибка компиляции, а молча не включившаяся
    /// фича: `register` вернул бы отказ разбора, а человек увидел бы лишь
    /// уведомление при старте, которое легко пропустить. Тест ловит это на
    /// сборке.
    #[test]
    fn default_hotkey_parses() {
        let s = crate::settings::Dictation::default().hotkey;
        let parsed: Result<Shortcut, _> = s.parse();
        assert!(parsed.is_ok(), "хоткей по умолчанию «{s}» не разобрался");
    }

    /// Заодно проверяем сам разбор на том, что мы обещаем в README как
    /// запасные варианты: если плагин однажды перестанет их понимать, узнать об
    /// этом лучше здесь, а не от человека, которому мы это посоветовали.
    #[test]
    fn documented_alternative_hotkeys_parse() {
        for s in ["Ctrl+Option+D", "Option+Space", "Cmd+Option+Space"] {
            let parsed: Result<Shortcut, _> = s.parse();
            assert!(parsed.is_ok(), "комбинация «{s}» не разобралась");
        }
    }

    /// Прогоняет последовательность «(событие, время)» и отдаёт список действий.
    fn run(events: &[(Event, u64)]) -> (State, Vec<Action>) {
        let mut st = State::default();
        let mut acts = Vec::new();
        for (e, t) in events {
            let (next, a) = step(st, *e, *t);
            st = next;
            acts.push(a);
        }
        (st, acts)
    }

    #[test]
    fn hold_records_while_key_is_down() {
        let (st, acts) = run(&[(Event::Pressed, 0), (Event::Released, 2_000)]);
        assert_eq!(acts[0], Action::StartRecording);
        assert_eq!(acts[1], Action::StopAndTranscribe);
        assert_eq!(
            st,
            State::Transcribing {
                swallow_release: false
            }
        );
    }

    /// Порог ровно на границе считается удержанием: иначе у 350 мс не было бы
    /// определённого поведения.
    #[test]
    fn threshold_boundary_counts_as_hold() {
        let (_, acts) = run(&[
            (Event::Pressed, 1_000),
            (Event::Released, 1_000 + HOLD_THRESHOLD_MS),
        ]);
        assert_eq!(acts[1], Action::StopAndTranscribe);
    }

    #[test]
    fn short_press_switches_to_toggle_and_keeps_recording() {
        let (st, acts) = run(&[(Event::Pressed, 0), (Event::Released, 80)]);
        assert_eq!(acts[0], Action::StartRecording);
        assert_eq!(acts[1], Action::Nothing, "запись обязана продолжиться");
        assert_eq!(st, State::Toggled);
    }

    #[test]
    fn second_press_stops_the_toggle() {
        let (st, acts) = run(&[
            (Event::Pressed, 0),
            (Event::Released, 80),
            (Event::Pressed, 5_000),
        ]);
        assert_eq!(acts[2], Action::StopAndTranscribe);
        assert_eq!(
            st,
            State::Transcribing {
                swallow_release: true
            }
        );
    }

    /// Отпускание после останавливающего нажатия — хвост того же движения,
    /// а не просьба. Звука отказа быть не должно.
    #[test]
    fn release_after_stopping_press_is_swallowed_silently() {
        let (st, acts) = run(&[
            (Event::Pressed, 0),
            (Event::Released, 80),
            (Event::Pressed, 5_000),
            (Event::Released, 5_060),
        ]);
        assert_eq!(acts[3], Action::Nothing, "проглоченное отпускание не пищит");
        assert_eq!(
            st,
            State::Transcribing {
                swallow_release: false
            }
        );
    }

    /// Автоповтор клавиши не должен ничего переключать — из-за него нельзя
    /// написать «нажатие = переключить состояние».
    #[test]
    fn key_autorepeat_is_ignored() {
        let (st, acts) = run(&[
            (Event::Pressed, 0),
            (Event::Pressed, 500),
            (Event::Pressed, 1_000),
        ]);
        assert_eq!(acts[0], Action::StartRecording);
        assert_eq!(acts[1], Action::Nothing);
        assert_eq!(acts[2], Action::Nothing);
        assert_eq!(
            st,
            State::Holding { pressed_at_ms: 0 },
            "время первого нажатия не сбрасывается"
        );
    }

    #[test]
    fn escape_cancels_from_hold_and_from_toggle() {
        let (st, acts) = run(&[(Event::Pressed, 0), (Event::Escape, 900)]);
        assert_eq!(acts[1], Action::Cancel);
        assert_eq!(st, State::Idle);

        let (st, acts) = run(&[
            (Event::Pressed, 0),
            (Event::Released, 50),
            (Event::Escape, 900),
        ]);
        assert_eq!(acts[2], Action::Cancel);
        assert_eq!(st, State::Idle);
    }

    #[test]
    fn hotkey_during_transcription_is_rejected_not_queued() {
        let (st, acts) = run(&[
            (Event::Pressed, 0),
            (Event::Released, 2_000),
            (Event::Pressed, 2_100),
        ]);
        assert_eq!(acts[2], Action::Reject);
        assert_eq!(
            st,
            State::Transcribing {
                swallow_release: false
            },
            "вторая диктовка не начинается поверх первой"
        );
    }

    #[test]
    fn transcription_done_returns_to_idle() {
        let (st, _) = run(&[
            (Event::Pressed, 0),
            (Event::Released, 2_000),
            (Event::TranscriptionDone, 3_500),
        ]);
        assert_eq!(st, State::Idle);
    }

    #[test]
    fn escape_during_transcription_cancels_it() {
        let (st, acts) = run(&[
            (Event::Pressed, 0),
            (Event::Released, 2_000),
            (Event::Escape, 2_200),
        ]);
        assert_eq!(acts[2], Action::Cancel);
        assert_eq!(st, State::Idle);
    }

    /// Одинокое отпускание в покое приходит, когда нажатие проглотили в
    /// предыдущем цикле. Молчим, а не пищим.
    #[test]
    fn stray_release_in_idle_is_silent() {
        let (st, acts) = run(&[(Event::Released, 10)]);
        assert_eq!(acts[0], Action::Nothing);
        assert_eq!(st, State::Idle);
    }

    /// Часы, идущие назад, не должны превращать удержание в переключатель:
    /// `saturating_sub` даёт ноль, ноль меньше порога — это короткое нажатие,
    /// то есть запись продолжается. Потерять запись хуже, чем лишний раз
    /// оставить её включённой.
    #[test]
    fn clock_going_backwards_keeps_recording() {
        let (st, acts) = run(&[(Event::Pressed, 5_000), (Event::Released, 1_000)]);
        assert_eq!(acts[1], Action::Nothing);
        assert_eq!(st, State::Toggled);
    }
}
