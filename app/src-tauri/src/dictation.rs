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
use crate::overlay;
use crate::settings::AppSettings;
use mediachef_core::dictate::{is_hallucination, transcribe_wav, DictateError};
use mediachef_core::process::CancelToken;
use mediachef_core::{locate, models};
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex, OnceLock};
use std::time::{Duration, Instant};
use tauri::AppHandle;
use tauri::Listener;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

/// Сколько знаков расшифровки показать в уведомлении.
const PREVIEW_CHARS: usize = 60;

/// Как часто плашка обновляет полоску уровня.
///
/// 80 мс — на глаз непрерывно и стоит ноль: это чтение одного атомика и
/// отправка события в вебвью.
const METER_PERIOD: Duration = Duration::from_millis(80);

/// Как часто пересчитывается предварительный текст.
///
/// Полторы секунды — компромисс, а не круглое число. Чаще: whisper не успевает
/// договорить предыдущий проход, и очередь растёт. Реже: человек успевает
/// сказать фразу целиком и решить, что его не слышат.
const PREVIEW_PERIOD: Duration = Duration::from_millis(1500);

/// Короче этого куска распознавать бессмысленно: whisper на входе меньше
/// секунды выдаёт мусор или тишину.
const PREVIEW_MIN_SECONDS: f32 = 1.0;

/// Сколько плашка висит после доставки, прежде чем исчезнуть.
const DONE_LINGER: Duration = Duration::from_millis(900);

/// Начало отсчёта. Машина состояний живёт в миллисекундах от него, а не в
/// `Instant`, чтобы её можно было тестировать произвольным временем.
fn epoch() -> &'static Instant {
    static EPOCH: OnceLock<Instant> = OnceLock::new();
    EPOCH.get_or_init(Instant::now)
}

fn now_ms() -> u64 {
    epoch().elapsed().as_millis() as u64
}

/// Комбинация «надиктовать и нажать Enter» — та же, что основная, плюс Shift.
///
/// Выводится из основной, а не задаётся отдельной настройкой, и это решает
/// сразу две задачи. Во-первых, две комбинации не могут разойтись: сменили
/// основную — вторая переехала сама. Во-вторых, они физически не могут
/// столкнуться друг с другом, потому что различаются ровно одним модификатором.
///
/// `None`, если в основной комбинации Shift уже есть: добавлять его второй раз
/// некуда, и вместо второго хоткея получилась бы копия первого. Тогда режим
/// «с отправкой» просто не регистрируется — молча ломать основной хоткей ради
/// дополнительного нельзя.
pub fn send_hotkey_for(main: &str) -> Option<String> {
    let has_shift = main
        .split('+')
        .any(|t| t.trim().eq_ignore_ascii_case("shift"));
    if has_shift {
        return None;
    }
    // Shift ставим перед последним элементом: последний — это сама клавиша,
    // а парсер требует модификаторы до неё.
    let mut parts: Vec<&str> = main.split('+').map(|t| t.trim()).collect();
    let key = parts.pop()?;
    parts.push("Shift");
    parts.push(key);
    Some(parts.join("+"))
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
    /// Куда писать журнал. Рядом с настройками, чтобы искать в одном месте.
    log: PathBuf,
    /// Куда сохранять настройки, когда их меняет само приложение (кнопки в
    /// окне про разрешение).
    settings_dir: PathBuf,
    /// Спрашивали ли уже про разрешение в этом запуске.
    asked_permission: AtomicBool,
    /// Раздел «Микрофон» системных настроек уже открывали в этом запуске.
    asked_microphone: AtomicBool,
    /// Нажать ли Enter после доставки текущей диктовки. Ставится в момент
    /// начала записи тем хоткеем, которым её начали, и снимается при любом
    /// исходе — иначе следующая обычная диктовка унаследовала бы отправку.
    send_after: AtomicBool,
    /// Вторая зарегистрированная комбинация, если она есть.
    registered_send: Mutex<Option<String>>,
    /// Номер текущей диктовки. Фоновые потоки плашки запоминают его при старте
    /// и выходят, как только он сменился: это надёжнее флага «идёт запись»,
    /// потому что переживает быстрое «начал-остановил-начал».
    generation: AtomicU64,
    /// Последний предварительный текст. Пишет его цикл распознавания, читает
    /// тикер плашки — так на вебвью идёт один поток событий, а не два.
    preview: Mutex<String>,
    /// Какая комбинация сейчас зарегистрирована. Нужна, чтобы снять её при
    /// смене хоткея: снимать «ту, что в настройках» нельзя — там уже новая.
    registered: Mutex<Option<String>>,
}

static RUNTIME: OnceLock<Arc<Runtime>> = OnceLock::new();

/// Потолок журнала. Дальше файл начинается заново.
///
/// Журнал нужен, чтобы разобрать «нажал, а ничего не произошло», и для этого
/// хватает последних событий. Расти без предела ему незачем: диктовка пишет
/// несколько строк на фразу, и за месяц ежедневного использования это мегабайты
/// в папке, куда никто не заглядывает.
const LOG_MAX_BYTES: u64 = 256 * 1024;

/// Пишет строку в журнал диктовки.
///
/// Своя запись, а не `println!`: у собранного `.app` нет терминала, куда
/// смотреть, и единственный способ понять, что произошло на чужой машине, —
/// файл, который можно попросить прислать. Ошибки записи проглатываются: не
/// вести журнал неприятно, а уронить из-за него диктовку — недопустимо.
fn trace(rt: &Runtime, line: &str) {
    use std::io::Write;
    let _ = (|| -> std::io::Result<()> {
        if std::fs::metadata(&rt.log).map(|m| m.len()).unwrap_or(0) > LOG_MAX_BYTES {
            let _ = std::fs::remove_file(&rt.log);
        }
        let mut f = std::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&rt.log)?;
        writeln!(f, "[{:>8} мс] {line}", now_ms())
    })();
}

/// Приводит регистрацию хоткея в соответствие настройкам.
///
/// Зовётся и при старте, и после каждого сохранения настроек — поэтому обязана
/// быть идемпотентной и уметь всё: включить, выключить, сменить комбинацию.
///
/// Применять на лету, а не «после перезапуска», здесь принципиально. Настройка,
/// которая не действует до перезапуска, неотличима от сломанной: человек щёлкает
/// переключатель, жмёт хоткей, ничего не происходит — и он идёт писать, что
/// фича не работает. Ровно этот случай мы уже разбирали вручную.
pub fn apply(
    app: &AppHandle,
    settings: Arc<Mutex<AppSettings>>,
    models_dir: PathBuf,
) -> Result<(), String> {
    let log = models_dir
        .parent()
        .unwrap_or(&models_dir)
        .join("dictation.log");

    let rt = RUNTIME
        .get_or_init(|| {
            Arc::new(Runtime {
                state: Mutex::new(State::default()),
                recorder: Mutex::new(None),
                settings: settings.clone(),
                models_dir: models_dir.clone(),
                settings_dir: models_dir.parent().unwrap_or(&models_dir).to_path_buf(),
                asked_permission: AtomicBool::new(false),
                asked_microphone: AtomicBool::new(false),
                send_after: AtomicBool::new(false),
                registered_send: Mutex::new(None),
                generation: AtomicU64::new(0),
                preview: Mutex::new(String::new()),
                log,
                registered: Mutex::new(None),
            })
        })
        .clone();

    maybe_selftest(app, &rt);
    // Разрешение на микрофон — в журнал сразу: без него macOS отдаёт тишину
    // молча, и без этой строки тишина неотличима от сломанного микрофона.
    trace(
        &rt,
        &format!("разрешение на микрофон: {}", deliver::microphone_status()),
    );
    // Самоотчёт плашки слушаем независимо от того, включена ли диктовка:
    // самопроверка гоняет плашку и при выключенной.
    overlay_probe_listener_once(app, &rt);

    let (enabled, wanted) = {
        let s = rt
            .settings
            .lock()
            .map_err(|_| "настройки заблокированы".to_string())?;
        (s.dictation.enabled, s.dictation.hotkey.clone())
    };

    // Снимаем прежнюю регистрацию до всего остального: иначе смена комбинации
    // оставила бы висеть старую, и обе работали бы одновременно.
    let previous = rt.registered.lock().ok().and_then(|mut r| r.take());
    if let Some(prev) = previous {
        if let Ok(sc) = prev.parse::<Shortcut>() {
            let _ = app.global_shortcut().unregister(sc);
        }
        trace(&rt, &format!("снята регистрация «{prev}»"));
    }
    let previous_send = rt.registered_send.lock().ok().and_then(|mut r| r.take());
    if let Some(prev) = previous_send {
        if let Ok(sc) = prev.parse::<Shortcut>() {
            let _ = app.global_shortcut().unregister(sc);
        }
        trace(&rt, &format!("снята регистрация «{prev}»"));
    }

    if !enabled {
        // Перехватчик модификатора тоже гасим: выключено — значит выключено.
        let _ = crate::modkey::configure(app, None);
        trace(&rt, "диктовка выключена в настройках");
        return Ok(());
    }

    warm_up_once(&rt);

    // Триггер-модификатор идёт своим путём: плагин хоткеев его не умеет.
    if let Some(trigger) = crate::modkey::Trigger::parse(&wanted) {
        if cfg!(target_os = "macos") {
            return install_modifier_trigger(app, &rt, trigger);
        }
    }
    let _ = crate::modkey::configure(app, None);
    let wanted = crate::modkey::plugin_fallback(&wanted);

    let shortcut: Shortcut = wanted
        .parse()
        .map_err(|e| format!("не разобрать комбинацию «{wanted}»: {e}"))?;

    app.global_shortcut()
        .on_shortcut(shortcut, move |app, _sc, event| {
            let ev = match event.state {
                ShortcutState::Pressed => Event::Pressed,
                ShortcutState::Released => Event::Released,
            };
            handle(app, ev, false);
        })
        .map_err(|e| format!("комбинация «{wanted}» занята другим приложением: {e}"))?;

    // Второй хоткей — не критичен: если он занят, диктовка обязана продолжить
    // работать без него. Поэтому отказ здесь только пишется в журнал.
    if let Some(send) = send_hotkey_for(&wanted) {
        match send.parse::<Shortcut>() {
            Ok(sc) => match app
                .global_shortcut()
                .on_shortcut(sc, move |app, _sc, event| {
                    let ev = match event.state {
                        ShortcutState::Pressed => Event::Pressed,
                        ShortcutState::Released => Event::Released,
                    };
                    handle(app, ev, true);
                }) {
                Ok(()) => {
                    if let Ok(mut r) = rt.registered_send.lock() {
                        *r = Some(send.clone());
                    }
                    trace(&rt, &format!("зарегистрирована «{send}» — с отправкой"));
                }
                Err(e) => trace(
                    &rt,
                    &format!("«{send}» занята, режим с отправкой выключен: {e}"),
                ),
            },
            Err(e) => trace(&rt, &format!("не разобрать «{send}»: {e}")),
        }
    } else {
        trace(
            &rt,
            "в основной комбинации уже есть Shift — второго хоткея не будет",
        );
    }

    if let Ok(mut r) = rt.registered.lock() {
        *r = Some(wanted.clone());
    }
    // Состояние сбрасываем: после смены хоткея машина не должна помнить, что
    // «клавишу держат» — держали-то другую.
    if let Ok(mut st) = rt.state.lock() {
        *st = State::Idle;
    }
    trace(&rt, &format!("зарегистрирована «{wanted}»"));
    Ok(())
}

/// Один шаг машины плюс исполнение того, что она велела.
pub(crate) fn handle(app: &AppHandle, event: Event, with_enter: bool) {
    let Some(rt) = RUNTIME.get().cloned() else {
        return;
    };
    let (before, action, after) = {
        let Ok(mut st) = rt.state.lock() else {
            return;
        };
        let before = *st;
        let (next, action) = step(before, event, now_ms());
        *st = next;
        (before, action, next)
    };
    // Каждое событие в журнал: именно этой строки не хватало, когда «включилось,
    // а текста нет». По ней сразу видно, приходит ли отпускание клавиши, —
    // а без него машина навсегда остаётся в «удержании», и второе нажатие
    // выглядит проглоченным автоповтором.
    trace(
        &rt,
        &format!("{event:?}: {before:?} -> {after:?}, действие {action:?}"),
    );
    // Флаг ставится ровно в момент начала записи и по тому хоткею, который её
    // начал. Ставить его на каждое событие нельзя: отпускание второго хоткея
    // и нажатие первого перемешались бы, и обычная диктовка иногда отправляла
    // бы сообщение сама.
    if action == Action::StartRecording {
        rt.send_after.store(with_enter, Ordering::Relaxed);
    }
    perform(app, &rt, action);
}

/// Ставит триггер-модификатор (правый ⌥ или ⌘) вместо комбинации плагина.
///
/// Без «Универсального доступа» перехватчик клавиатуры не создать, поэтому
/// сначала проверяем разрешение и, если его нет, показываем окно с
/// инструкцией — с фонового потока, окно блокирующее. Возвращаем ошибку:
/// снаружи она станет уведомлением «диктовка не включилась», и человек будет
/// знать, что делать дальше.
fn install_modifier_trigger(
    app: &AppHandle,
    rt: &Arc<Runtime>,
    trigger: crate::modkey::Trigger,
) -> Result<(), String> {
    if let Ok(mut st) = rt.state.lock() {
        *st = State::Idle;
    }
    if !deliver::can_paste() {
        trace(
            rt,
            &format!(
                "триггер {}: нет «Универсального доступа», перехватчик не ставим",
                trigger.describe()
            ),
        );
        let app = app.clone();
        let rt = rt.clone();
        std::thread::Builder::new()
            .name("dictation-ask".into())
            .spawn(move || ask_permission_once(&app, &rt, deliver::PermissionReason::Hotkey))
            .ok();
        return Err("нужно разрешение «Универсальный доступ» — окно с инструкцией открыто".into());
    }
    crate::modkey::configure(app, Some(trigger))?;
    trace(
        rt,
        &format!(
            "триггер: {} — зажать и говорить, нажать — включить, с Shift — отправить",
            trigger.describe()
        ),
    );
    Ok(())
}

/// Прогрев CoreAudio — один раз за запуск, в фоне. См. `mic::warm_up`.
fn warm_up_once(rt: &Arc<Runtime>) {
    static WARMED: AtomicBool = AtomicBool::new(false);
    if WARMED.swap(true, Ordering::Relaxed) {
        return;
    }
    let rt = rt.clone();
    std::thread::Builder::new()
        .name("dictation-warmup".into())
        .spawn(move || match crate::mic::warm_up() {
            Some(took) => trace(
                &rt,
                &format!("CoreAudio прогрет за {} мс", took.as_millis()),
            ),
            None => trace(&rt, "прогрев: устройства ввода не найдено"),
        })
        .ok();
}

/// Самоотчёт плашки — в журнал. Плашка присылает его сама через секунду
/// после показа: видима ли страница по мнению WebKit, крутятся ли кадры,
/// доходят ли события. Одна строка на диктовку, зато «в плашке ничего не
/// происходит» больше не разбирается вслепую.
fn overlay_probe_listener_once(app: &AppHandle, rt: &Arc<Runtime>) {
    static LISTENING: AtomicBool = AtomicBool::new(false);
    if LISTENING.swap(true, Ordering::Relaxed) {
        return;
    }
    let rt = rt.clone();
    app.listen_any("dictation:overlay-probe", move |e| {
        trace(&rt, &format!("плашка сообщает: {}", e.payload()));
    });
}

/// Самопроверка микрофона: `MEDIACHEF_SELFTEST=mic`.
///
/// Открывает вход по умолчанию на полторы секунды и пишет в журнал пик,
/// источник и состояние разрешения — то, что нужно, чтобы отличить «macOS
/// молча отдаёт нули» от «микрофон и правда молчит». Запускать через
/// `open -a … --env MEDIACHEF_SELFTEST=mic`: так приложение стартует тем же
/// путём, что у человека, и TCC относит запрос к нему, а не к терминалу.
fn selftest_mic(app: &AppHandle, rt: &Arc<Runtime>) {
    static STARTED: AtomicBool = AtomicBool::new(false);
    if STARTED.swap(true, Ordering::Relaxed) {
        return;
    }
    let app = app.clone();
    let rt = rt.clone();
    std::thread::Builder::new()
        .name("dictation-selftest-mic".into())
        .spawn(move || {
            std::thread::sleep(Duration::from_secs(2));
            trace(
                &rt,
                &format!("самопроверка микрофона: до открытия разрешение = {}", deliver::microphone_status()),
            );
            match Recorder::start("") {
                Ok(rec) => {
                    // Двенадцать секунд, а не полторы: если система покажет
                    // запрос на микрофон, человек должен успеть ответить, пока
                    // процесс жив — иначе диалог исчезнет вместе с ним.
                    std::thread::sleep(Duration::from_secs(12));
                    match rec.stop() {
                        Ok(r) => trace(
                            &rt,
                            &format!(
                                "самопроверка микрофона: пик {:.4}, источник {}, разрешение после = {}",
                                r.peak,
                                r.source,
                                deliver::microphone_status()
                            ),
                        ),
                        Err(e) => trace(&rt, &format!("самопроверка микрофона: стоп не удался: {e}")),
                    }
                }
                Err(e) => trace(&rt, &format!("самопроверка микрофона: не открылся: {e}")),
            }
            std::thread::sleep(Duration::from_secs(1));
            app.exit(0);
        })
        .ok();
}

/// Самопроверка плашки без микрофона: `MEDIACHEF_SELFTEST=overlay`.
///
/// Показывает плашку, гонит по ней уровень, скрывает — и выходит. Нужна,
/// чтобы прогонять этот путь под отладчиком, не нажимая хоткей и не говоря в
/// микрофон. Появилась после падения, которое воспроизводилось только в живом
/// приложении и только на закрытии плашки: ни тесты, ни отдельная проба тех
/// же вызовов AppKit его не ловили.
///
/// Потоки — те же, что у настоящей диктовки, иначе проверка проверяла бы не
/// то: показ идёт с главного (там живёт обработчик хоткея), скрытие — с
/// фонового (там живёт расшифровка).
fn maybe_selftest(app: &AppHandle, rt: &Arc<Runtime>) {
    let mode = std::env::var("MEDIACHEF_SELFTEST").unwrap_or_default();
    if mode == "mic" {
        selftest_mic(app, rt);
        return;
    }
    if mode != "overlay" {
        return;
    }
    // `apply` зовут при каждой смене настроек; проверка нужна одна.
    static STARTED: AtomicBool = AtomicBool::new(false);
    if STARTED.swap(true, Ordering::Relaxed) {
        return;
    }
    // Причину исключения Objective-C — в журнал, пока процесс ещё жив.
    #[cfg(target_os = "macos")]
    overlay::install_exception_logger({
        let rt = rt.clone();
        move |m| trace(&rt, m)
    });
    let app = app.clone();
    let rt = rt.clone();
    std::thread::Builder::new()
        .name("dictation-selftest".into())
        .spawn(move || {
            // Шесть секунд — чтобы снаружи успели вывести вперёд другое
            // приложение: иначе замер активности ничего не измеряет, MediaChef
            // при запуске активируется сам.
            std::thread::sleep(Duration::from_secs(6));
            trace(
                &rt,
                &format!(
                    "самопроверка: до показа приложение активно = {}",
                    overlay::app_is_active()
                ),
            );
            trace(&rt, "самопроверка: показываем плашку");
            let a = app.clone();
            let r = rt.clone();
            let _ = app.run_on_main_thread(move || {
                let r2 = r.clone();
                overlay::show(&a, move |m| trace(&r2, m));
            });
            std::thread::sleep(Duration::from_millis(600));
            trace(
                &rt,
                &format!(
                    "самопроверка: после показа приложение активно = {}",
                    overlay::app_is_active()
                ),
            );
            for i in 0..10u32 {
                std::thread::sleep(Duration::from_millis(200));
                overlay::update(
                    &app,
                    &overlay::Status {
                        phase: overlay::Phase::Listening,
                        level: i as f32 / 10.0,
                        text: "самопроверка плашки".into(),
                    },
                );
            }
            trace(&rt, "самопроверка: скрываем плашку");
            overlay::hide(&app);
            std::thread::sleep(Duration::from_secs(2));
            trace(&rt, "самопроверка: закрытие пережили, выходим");
            app.exit(0);
        })
        .ok();
}

fn perform(app: &AppHandle, rt: &Arc<Runtime>, action: Action) {
    match action {
        Action::Nothing => {}
        // Звука отказа в этой волне нет: он требует своего аудиоресурса и
        // отдельного тракта воспроизведения. Молчание здесь честнее пустого
        // уведомления — человек и так видит, что ничего не произошло.
        Action::Reject => {}
        Action::StartRecording => {
            // Плашку — до микрофона, а не после. Первое открытие микрофона за
            // запуск занимает до двух секунд: просыпается CoreAudio. Человек,
            // не видя отклика, отпускал клавишу раньше, чем запись началась,
            // и получал запись в 46 миллисекунд. Плашка сразу говорит
            // «слушаю», и держать клавишу становится естественно.
            overlay::show(app, {
                let rt = rt.clone();
                move |m| trace(&rt, m)
            });
            let preferred = rt
                .settings
                .lock()
                .map(|s| s.dictation.input_device.clone())
                .unwrap_or_default();
            match Recorder::start(&preferred) {
                Ok(r) => {
                    trace(rt, "микрофон открыт, пишем");
                    // Новая диктовка — новое поколение: фоновые потоки прошлой
                    // увидят смену и выйдут сами.
                    let gen = rt.generation.fetch_add(1, Ordering::Relaxed) + 1;
                    if let Ok(mut t) = rt.preview.lock() {
                        t.clear();
                    }
                    if let Ok(mut slot) = rt.recorder.lock() {
                        *slot = Some(r);
                    }
                    spawn_meter(app, rt, gen);
                    spawn_preview(rt, gen);
                }
                Err(e) => {
                    // Не смогли открыть микрофон — возвращаемся в покой, иначе
                    // следующее нажатие попыталось бы «остановить» несуществующую
                    // запись.
                    trace(rt, &format!("микрофон не открылся: {e}"));
                    overlay::hide(app);
                    reset(rt);
                    deliver::notify(app, "Диктовка", &mic_error_text(&e));
                }
            }
        }
        Action::Cancel => {
            rt.send_after.store(false, Ordering::Relaxed);
            // Поколение сдвигаем: фоновые потоки прошлой диктовки выйдут, а
            // плашка не останется висеть после отмены.
            rt.generation.fetch_add(1, Ordering::Relaxed);
            overlay::hide(app);
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
                    // Поколение сдвигаем ПЕРЕД тем, как убрать плашку: иначе
                    // тикер успел бы нарисовать её заново после закрытия окна.
                    rt.generation.fetch_add(1, Ordering::Relaxed);
                    std::thread::sleep(DONE_LINGER);
                    overlay::hide(&app);
                    handle(&app, Event::TranscriptionDone, false);
                })
                .ok();
        }
    }
}

/// Тикер полоски уровня: пока идёт эта диктовка, шлёт плашке уровень и
/// последний предварительный текст.
///
/// Отдельно от цикла распознавания, потому что у них разная цена. Уровень —
/// это чтение атомика, его можно слать десять раз в секунду. Распознавание
/// занимает сотни миллисекунд, и будь они в одном потоке, полоска замирала бы
/// на каждом проходе — ровно тогда, когда человек говорит и смотрит на неё.
fn spawn_meter(app: &AppHandle, rt: &Arc<Runtime>, generation: u64) {
    let app = app.clone();
    let rt = rt.clone();
    std::thread::Builder::new()
        .name("dictation-meter".into())
        .spawn(move || {
            while rt.generation.load(Ordering::Relaxed) == generation {
                let level = rt
                    .recorder
                    .lock()
                    .ok()
                    .and_then(|r| r.as_ref().map(|r| r.level()))
                    .unwrap_or(0.0);
                // Запись кончилась, но расшифровка ещё идёт: плашка меняет
                // подпись, а не исчезает — иначе человек решит, что диктовка
                // пропала вместе с ней.
                let phase = if level > 0.0 || has_recorder(&rt) {
                    overlay::Phase::Listening
                } else {
                    overlay::Phase::Working
                };
                let text = rt.preview.lock().map(|t| t.clone()).unwrap_or_default();
                overlay::update(&app, &overlay::Status { phase, level, text });
                std::thread::sleep(METER_PERIOD);
            }
        })
        .ok();
}

fn has_recorder(rt: &Arc<Runtime>) -> bool {
    rt.recorder.lock().map(|r| r.is_some()).unwrap_or(false)
}

/// Цикл предварительного распознавания: каждые [`PREVIEW_PERIOD`] прогоняет
/// уже записанное и кладёт результат в `preview`.
///
/// Гоняется по ВСЕМУ буферу с начала, а не по последнему куску, и это
/// сознательно. Whisper не потоковый: он не умеет продолжать с середины, а
/// куски, нарезанные по таймеру, рвут слова и портят контекст. Цена — текст
/// между проходами переписывается («привет как дела» становится «Привет, как
/// дела?»), но переписывание видно только в плашке, а в поле ввода уезжает
/// один чистый финальный результат.
///
/// Модель — своя, `preview_model` из настроек, по умолчанию `tiny`: превью
/// нужно быстрое, а не точное, и оно обязано укладываться в такт речи. Кому
/// разница между показом и итогом режет глаз, ставит `small`. Если выбранной
/// модели нет на диске, берётся самая лёгкая из установленных: показ без
/// точности лучше, чем без показа. Словарь передаётся и сюда — тот же
/// `--prompt`, что у финального прохода, чтобы термины в плашке и в поле
/// писались одинаково.
fn spawn_preview(rt: &Arc<Runtime>, generation: u64) {
    let rt = rt.clone();
    std::thread::Builder::new()
        .name("dictation-preview".into())
        .spawn(move || {
            let (wanted, dictionary) = rt
                .settings
                .lock()
                .map(|s| {
                    (
                        s.dictation.preview_model.clone(),
                        s.dictation.dictionary.clone(),
                    )
                })
                .unwrap_or_default();
            let Some(model) = models::model_path(&rt.models_dir, &wanted)
                .or_else(|| lightest_model(&rt.models_dir))
            else {
                trace(&rt, "превью выключено: ни одной модели на диске");
                return;
            };
            trace(
                &rt,
                &format!(
                    "живой показ: модель {}",
                    model
                        .file_name()
                        .map(|f| f.to_string_lossy().into_owned())
                        .unwrap_or_default()
                ),
            );
            let (Some(ffmpeg), Some(whisper)) = (locate::ffmpeg(), locate::whisper()) else {
                return;
            };
            let Ok(dir) = tempfile::tempdir() else { return };
            let wav = dir.path().join("preview.wav");
            let language = preview_language(&rt);

            loop {
                std::thread::sleep(PREVIEW_PERIOD);
                if rt.generation.load(Ordering::Relaxed) != generation {
                    return;
                }
                let Some((samples, rate)) = snapshot(&rt) else {
                    // Запись уже остановлена — превью больше не нужно.
                    return;
                };
                if (samples.len() as f32) < rate as f32 * PREVIEW_MIN_SECONDS {
                    continue;
                }
                if crate::mic::write_snapshot(&wav, &samples, rate).is_err() {
                    continue;
                }
                let text = match transcribe_wav(
                    &ffmpeg,
                    &whisper,
                    &wav,
                    &model,
                    &language,
                    &dictionary,
                    &CancelToken::new(),
                ) {
                    Ok(t) => t,
                    // Тишина и короткие куски — обычное дело для превью, это не
                    // повод ни ругаться, ни останавливать цикл.
                    Err(_) => continue,
                };
                // Пока шёл проход, диктовка могла кончиться: тогда её результат
                // уже доставлен, и подменять его устаревшим превью нельзя.
                if rt.generation.load(Ordering::Relaxed) != generation {
                    return;
                }
                if let Ok(mut slot) = rt.preview.lock() {
                    *slot = text;
                }
            }
        })
        .ok();
}

/// Копия записанного на сейчас, если запись ещё идёт.
fn snapshot(rt: &Arc<Runtime>) -> Option<(Vec<f32>, u32)> {
    rt.recorder.lock().ok()?.as_ref()?.snapshot()
}

/// Самая лёгкая из скачанных моделей — для превью.
/// Состояние диктовки для её вкладки в приложении.
#[derive(Debug, Clone, serde::Serialize)]
pub struct Status {
    /// Выдан ли «Универсальный доступ» — без него не работает ни триггер, ни
    /// печать в поле. Спрашивается у системы в момент запроса, не кэшируется.
    pub accessibility: bool,
    /// Путь к журналу — чтобы вкладка могла его показать.
    pub log_path: String,
    /// Разрешение на микрофон: `authorized` / `denied` / `restricted` /
    /// `undetermined` / `unknown`.
    pub microphone: String,
}

/// Снимок состояния для вкладки. Пустой путь — рантайм ещё не создан.
pub fn status() -> Status {
    Status {
        accessibility: deliver::can_paste(),
        microphone: deliver::microphone_status().to_string(),
        log_path: RUNTIME
            .get()
            .map(|r| r.log.display().to_string())
            .unwrap_or_default(),
    }
}

fn lightest_model(models_dir: &std::path::Path) -> Option<PathBuf> {
    ["tiny", "base", "small", "large-v3-turbo"]
        .iter()
        .find_map(|id| models::model_path(models_dir, id))
}

/// Язык для превью: тот же, что у финального прохода.
fn preview_language(rt: &Arc<Runtime>) -> String {
    let Ok(s) = rt.settings.lock() else {
        return "auto".into();
    };
    if !s.dictation.language.is_empty() {
        s.dictation.language.clone()
    } else if s.language != "system" {
        s.language.clone()
    } else {
        "auto".into()
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
        Ok(r) => {
            trace(
                rt,
                &format!(
                    "запись {:?}, пик {:.3}, источник {}, причина {:?}, до первого сэмпла {:?}",
                    r.duration, r.peak, r.source, r.reason, r.first_sample_delay
                ),
            );
            r
        }
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

    // Тишина в Whisper не едет. На пустом звуке он не молчит, а выдумывает:
    // русская модель выдавала титры «Редактор субтитров А.Семкин Корректор
    // А.Егорова», и они печатались в поле как результат диктовки. Пик ниже
    // порога — это не тихая речь, а мёртвый вход, и чаще всего это отсутствие
    // разрешения на микрофон: macOS в таком случае отдаёт нули, а не ошибку.
    if recording.peak < crate::mic::SILENT_PEAK {
        silent_microphone(app, rt, recording.peak, &recording.source);
        return;
    }

    let (model_id, language, dictionary, ui_language, delivery) = {
        let Ok(s) = rt.settings.lock() else {
            return;
        };
        (
            s.dictation.model.clone(),
            s.dictation.language.clone(),
            s.dictation.dictionary.clone(),
            s.language.clone(),
            s.dictation.delivery.clone(),
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
            no_speech(app, rt);
        }
        // Известные титры-галлюцинации — признак шума без речи, а не текст.
        Ok(text) if is_hallucination(&text) => {
            trace(
                rt,
                &format!("галлюцинация Whisper на шуме: «{text}» — считаем тишиной"),
            );
            no_speech(app, rt);
        }
        Ok(text) => deliver_text(app, rt, &text, &delivery),
        Err(DictateError::NoSpeech) => {
            no_speech(app, rt);
        }
        Err(DictateError::Cancelled) => {
            rt.send_after.store(false, Ordering::Relaxed);
        }
        Err(DictateError::Failed(e)) => {
            // Намерение отправить снимаем и здесь: Enter в чужом окне после
            // упавшей расшифровки — это отправленное пустое сообщение или
            // выполненная не та команда.
            rt.send_after.store(false, Ordering::Relaxed);
            trace(rt, &format!("расшифровка не удалась: {}", e.message));
            deliver::notify(
                app,
                "Диктовка",
                &format!("Не удалось расшифровать: {}", e.message),
            );
        }
    }
}

/// Доставляет расшифровку выбранным способом.
///
/// Вынесено из общего потока, потому что здесь три исхода, и у каждого свой
/// разговор с человеком: вставилось, легло только в буфер, не выдан доступ.
/// Последний — единственный, ради которого вся эта возня: он обязан быть
/// громким. Молчащая автовставка неотличима от сломанного приложения.
fn deliver_text(app: &AppHandle, rt: &Arc<Runtime>, text: &str, delivery: &str) {
    let chars = text.chars().count();
    // Пустой текст не отправляет ничего и никогда: снимаем намерение сразу,
    // не доходя до печати.
    if text.is_empty() {
        rt.send_after.store(false, Ordering::Relaxed);
    }
    if delivery == "type" {
        match deliver::type_into_active_window(text) {
            Ok(()) => {
                trace(rt, &format!("напечатано в активное поле: {chars} знаков"));
                // Enter — только если текст действительно напечатан и он не
                // пустой. Пустая диктовка не имеет права отправить сообщение
                // или выполнить команду в терминале: человек промолчал, а не
                // попросил нажать Enter.
                if rt.send_after.swap(false, Ordering::Relaxed) {
                    match deliver::press_enter() {
                        Ok(()) => trace(rt, "нажат Enter"),
                        Err(e) => trace(rt, &format!("Enter не нажался: {e}")),
                    }
                }
                // Буфер намеренно не тронут: в этом весь смысл режима.
                return;
            }
            Err(e) if e == "no_accessibility" => {
                trace(rt, "нет доступа к универсальному управлению");
                // Текст всё равно спасаем в буфер: правило «ни один отказ не
                // теряет надиктованное» сильнее обещания не трогать буфер.
                let _ = deliver::to_clipboard(app, text);
                ask_permission_once(app, rt, deliver::PermissionReason::Typing);
                return;
            }
            Err(e) => {
                trace(rt, &format!("печать не удалась: {e}"));
                let _ = deliver::to_clipboard(app, text);
                deliver::notify(
                    app,
                    "Текст в буфере — вставьте сами",
                    &deliver::preview(text, PREVIEW_CHARS),
                );
                return;
            }
        }
    }
    match deliver::to_clipboard(app, text) {
        Ok(()) => {
            trace(rt, &format!("в буфер: {chars} знаков"));
            deliver::notify(
                app,
                "Скопировано в буфер",
                &deliver::preview(text, PREVIEW_CHARS),
            );
        }
        Err(e) => {
            trace(rt, &format!("не положить в буфер: {e}"));
            deliver::notify(app, "Диктовка", &format!("Не положить в буфер: {e}"));
        }
    }
}

/// Показывает окно про разрешение — один раз за запуск приложения.
///
/// Один раз, а не на каждую диктовку: модальное окно, всплывающее каждый раз,
/// когда человек говорит, — это не помощь, а наказание. Одного показа хватает:
/// после перезапуска (которого окно и требует) счётчик обнулится сам, а если
/// человек перезапускать не стал, он уже видел объяснение.
fn ask_permission_once(app: &AppHandle, rt: &Arc<Runtime>, reason: deliver::PermissionReason) {
    if rt.asked_permission.swap(true, Ordering::Relaxed) {
        // Уже спрашивали в этом запуске — ограничиваемся уведомлением.
        let (title, body) = match reason {
            deliver::PermissionReason::Typing => (
                "Текст в буфере — вставьте сами",
                "Разрешение «Универсальный доступ» так и не выдано.",
            ),
            deliver::PermissionReason::Hotkey => (
                "Диктовка ждёт разрешения",
                "Включите «Универсальный доступ» для MediaChef и перезапустите приложение.",
            ),
        };
        deliver::notify(app, title, body);
        return;
    }
    // Сюда попадают только без доступа: записи нет, она мёртвая (после
    // обновления) или человек отказал. Во всех трёх случаях верно одно и то
    // же: снять свою запись и попросить систему спросить заново — тогда macOS
    // покажет свой диалог и сама добавит MediaChef в список. Переключение
    // туда-сюда мёртвую запись не лечит — проверено.
    let reset = deliver::reset_tcc("Accessibility");
    let trusted = deliver::request_accessibility_prompt();
    trace(
        rt,
        &format!("«Универсальный доступ»: запись сброшена = {reset}, системный запрос показан, доступ сейчас = {trusted}"),
    );
    match deliver::ask_about_permission(app, reason) {
        deliver::PermissionChoice::OpenSettings => {
            // Настройки уже открыты — их открывает сама модалка, до показа.
            trace(rt, "выбрано: пойти выдавать разрешение");
        }
        deliver::PermissionChoice::UseClipboard => {
            trace(rt, "выбрано: класть в буфер");
            set_delivery(app, rt, "clipboard");
        }
        // Кнопки «выключить» в окне больше нет: выключение живёт в настройках
        // приложения. Ветка остаётся ради полноты разбора.
        deliver::PermissionChoice::TurnOff => {
            trace(rt, "выбрано: выключить диктовку");
            disable_dictation(app, rt);
        }
    }
}

/// Речи не нашлось: сказать человеку и снять намерение отправить.
///
/// Снятие здесь — главное требование ко второму хоткею. Молчание не имеет
/// права нажать Enter: в мессенджере это отправленное пустое сообщение, в
/// терминале — выполненная предыдущая команда из истории. Человек промолчал,
/// а не попросил что-то сделать.
fn no_speech(app: &AppHandle, rt: &Arc<Runtime>) {
    rt.send_after.store(false, Ordering::Relaxed);
    trace(rt, "речи не слышно, Enter не нажимаем");
    deliver::notify(app, "Диктовка", "Речи не слышно — буфер обмена не тронут.");
}

/// Запись без единого звука: сказать человеку, где искать причину.
///
/// Раздел настроек открывается один раз за запуск: мёртвый вход — это чаще
/// всего слетевшее после обновления разрешение, но бывает и выключенная
/// гарнитура, и открывать системные настройки на каждую такую диктовку было
/// бы наказанием.
fn silent_microphone(app: &AppHandle, rt: &Arc<Runtime>, peak: f32, source: &str) {
    rt.send_after.store(false, Ordering::Relaxed);
    trace(
        rt,
        &format!(
            "микрофон отдал тишину (пик {peak:.4}, источник {source}) — в Whisper не отправляем"
        ),
    );
    // Устройство — в уведомлении по имени. Тишина с Bluetooth-гарнитуры,
    // лежащей в кейсе, и тишина от слетевшего разрешения выглядят для
    // приложения одинаково, а для человека это два разных действия: надеть
    // наушники или сходить в настройки.
    let device = source.split(" @ ").next().unwrap_or(source);
    deliver::notify(
        app,
        "Микрофон молчит",
        &format!(
            "Запись с «{device}» пустая. Если это гарнитура — наденьте её или выберите другой микрофон \
             в Системных настройках → Звук. Если микрофон на месте — проверьте разрешение для MediaChef: \
             Конфиденциальность → Микрофон (переключатель включён — выключите и включите заново)."
        ),
    );
    // Самолечение — один раз за запуск. Сборка подписана ad-hoc, и после
    // обновления строка микрофона в TCC относится к прежней копии: macOS не
    // переспрашивает, а молча отдаёт нули. Снять свою строку приложение
    // может само (`tccutil reset` для пользовательских служб не требует
    // прав), и следующее же нажатие вызовет системный запрос. Проверено
    // живьём: сброс → запуск → диалог → «Разрешить» → authorized.
    // Гарнитура в кейсе даст ложный сброс и один лишний диалог — цена
    // приемлемая, лечение важнее.
    if !rt.asked_microphone.swap(true, Ordering::Relaxed) {
        let reset = deliver::reset_tcc("Microphone");
        trace(
            rt,
            &format!(
                "сброс строки микрофона в TCC: {}",
                if reset { "ок" } else { "не удался" }
            ),
        );
        if reset {
            deliver::notify(
                app,
                "Нажмите триггер ещё раз",
                "macOS переспросит про микрофон — нажмите «Разрешить».",
            );
        }
    }
}

/// Переключает способ доставки и сохраняет настройки на диск.
fn set_delivery(app: &AppHandle, rt: &Arc<Runtime>, mode: &str) {
    if let Ok(mut s) = rt.settings.lock() {
        s.dictation.delivery = mode.into();
        let _ = crate::settings::save(&rt.settings_dir, &s);
    }
    deliver::notify(
        app,
        "Диктовка",
        "Теперь текст будет попадать в буфер обмена — вставляйте через Cmd+V.",
    );
}

/// Выключает диктовку: снимает хоткей и сохраняет настройку.
///
/// Именно в этом порядке: сначала на диск, потом снятие регистрации через
/// `apply`, который прочитает уже новую настройку. Иначе после перезапуска
/// диктовка вернулась бы включённой, и человек решил бы, что кнопка соврала.
fn disable_dictation(app: &AppHandle, rt: &Arc<Runtime>) {
    if let Ok(mut s) = rt.settings.lock() {
        s.dictation.enabled = false;
        let _ = crate::settings::save(&rt.settings_dir, &s);
    }
    let _ = apply(app, rt.settings.clone(), rt.models_dir.clone());
    deliver::notify(
        app,
        "Диктовка выключена",
        "Включить обратно можно в настройках MediaChef.",
    );
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

    /// Второй хоткей выводится из первого добавлением Shift — и обязан
    /// разбираться тем же парсером, иначе режим с отправкой молча не включится.
    #[test]
    fn send_hotkey_adds_shift_before_the_key() {
        assert_eq!(
            send_hotkey_for("Option+Space").as_deref(),
            Some("Option+Shift+Space")
        );
        assert_eq!(
            send_hotkey_for("Ctrl+Option+D").as_deref(),
            Some("Ctrl+Option+Shift+D")
        );
        // Модификаторы обязаны идти ДО клавиши: парсер плагина требует именно
        // такого порядка и на «Space+Shift» ругается.
        for main in ["Option+Space", "Ctrl+Option+Space", "Ctrl+Option+D"] {
            let send = send_hotkey_for(main).expect("нет второго хоткея");
            assert!(
                send.parse::<Shortcut>().is_ok(),
                "«{send}» не разобрался парсером"
            );
        }
    }

    /// Если Shift уже есть, второго хоткея не будет: добавить его некуда, а
    /// копия первого перехватывала бы сама себя.
    #[test]
    fn send_hotkey_absent_when_main_already_has_shift() {
        assert_eq!(send_hotkey_for("Ctrl+Shift+D"), None);
        assert_eq!(send_hotkey_for("Option+Shift+Space"), None);
    }

    /// Оба хоткея обязаны быть разными: иначе один перехватил бы другой, и
    /// обычная диктовка начала бы отправлять сообщения.
    #[test]
    fn the_two_hotkeys_never_collide() {
        for main in ["Option+Space", "Ctrl+Option+Space", "Ctrl+Option+D"] {
            assert_ne!(send_hotkey_for(main).as_deref(), Some(main));
        }
    }

    /// Хоткей по умолчанию обязан разбираться.
    ///
    /// Опечатка в строке — это не ошибка компиляции, а молча не включившаяся
    /// фича: `register` вернул бы отказ разбора, а человек увидел бы лишь
    /// уведомление при старте, которое легко пропустить. Тест ловит это на
    /// сборке.
    #[test]
    fn default_hotkey_parses() {
        let s = crate::settings::Dictation::default().hotkey;
        // Умолчание — либо триггер-модификатор (на macOS), либо комбинация,
        // которую понимает плагин: третьего пути в `apply` нет.
        let as_trigger = crate::modkey::Trigger::parse(&s).is_some();
        let as_shortcut = s.parse::<Shortcut>().is_ok();
        assert!(
            as_trigger || as_shortcut,
            "хоткей по умолчанию «{s}» не разобрался ни как триггер, ни как комбинация"
        );
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
