//! Триггер диктовки на одиночном модификаторе: правый ⌥ или правый ⌘.
//!
//! ## Почему не комбинация клавиш
//!
//! Первая редакция вешала диктовку на `Option+Space` через плагин глобальных
//! хоткеев. На живых руках это провалилось: в режиме удержания человек
//! отпускает модификатор раньше клавиши — и зажатый пробел автоповтором
//! печатается в поле, в которое он только что диктовал. Любая клавиша-символ
//! ведёт себя так же; лечится это не выбором другой буквы, а отказом от
//! символа вообще.
//!
//! Одиночный модификатор ничего не печатает по определению, и ровно так
//! устроен push-to-talk в Discord и в диктовках вроде Wispr Flow. Правый ⌥ и
//! правый ⌘ выбраны потому, что у системы на них нет собственных действий (у
//! 🌐/Fn — есть), а в сочетаниях люди почти всегда жмут левые.
//!
//! ## Как это устроено
//!
//! Плагин хоткеев модификатор-одиночку не умеет — Carbon-хоткею нужна
//! клавиша. Поэтому свой перехватчик: `CGEventTap` в режиме «только слушать»
//! на события `flagsChanged` (модификаторы) и `keyDown` (остальные клавиши).
//! Первые дают нажатие и отпускание триггера, вторые — признак, что человек
//! на самом деле жмёт чужое сочетание (правый ⌥ плюс буква), и запись надо
//! отменить, а не доставлять.
//!
//! Перехватчик живёт в своём потоке со своим циклом событий. Его обработчик
//! ничего тяжёлого не делает — только разбирает событие и кладёт результат в
//! канал: замешкайся он дольше секунды, система выключит тап. Разбор вынесен
//! в чистую функцию [`decode`] и накрыт тестами: живьём его не проверить без
//! разрешения «Универсальный доступ», а оно у неподписанной сборки слетает
//! при каждой пересборке.
//!
//! Слушать клавиатуру без этого разрешения система не даёт — `CGEventTapCreate`
//! возвращает пустоту. Это то же разрешение, что нужно для печати текста в
//! поле, так что новых просьб к человеку модуль не добавляет.

use crate::dictation::Event;

/// Какой модификатор служит триггером.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum Trigger {
    RightOption = 0,
    RightCommand = 1,
}

impl Trigger {
    /// Разбор значения настройки. `None` — это обычная комбинация для плагина,
    /// а не модификатор.
    pub fn parse(hotkey: &str) -> Option<Self> {
        match hotkey {
            "RightOption" => Some(Self::RightOption),
            "RightCommand" => Some(Self::RightCommand),
            _ => None,
        }
    }

    /// Для журнала.
    pub fn describe(self) -> &'static str {
        match self {
            Self::RightOption => "правый ⌥",
            Self::RightCommand => "правый ⌘",
        }
    }

    /// Виртуальный код клавиши: `kVK_RightOption` и `kVK_RightCommand`.
    fn keycode(self) -> i64 {
        match self {
            Self::RightOption => 61,
            Self::RightCommand => 54,
        }
    }

    /// Бит конкретного устройства во флагах события — `NX_DEVICERALTKEYMASK`
    /// и `NX_DEVICERCMDKEYMASK`. Именно он, а не общий «alt нажат»: общий бит
    /// одинаков для левого и правого, а нам нужен только правый.
    fn device_flag(self) -> u64 {
        match self {
            Self::RightOption => 0x40,
            Self::RightCommand => 0x10,
        }
    }

    /// Обратно из атомика — нужен только перехватчику, а он есть лишь на macOS;
    /// без `cfg` сборка под Linux и Windows ругалась бы на мёртвый код.
    #[cfg(target_os = "macos")]
    fn from_u8(v: u8) -> Self {
        if v == Self::RightCommand as u8 {
            Self::RightCommand
        } else {
            Self::RightOption
        }
    }
}

/// Событие клавиатуры в том виде, в каком его отдаёт тап.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Key {
    /// Изменились модификаторы. `keycode` говорит, какой именно, `flags` —
    /// что нажато сейчас.
    FlagsChanged { keycode: i64, flags: u64 },
    /// Нажата обычная клавиша.
    KeyDown,
}

/// Итог разбора одного события.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Decoded {
    /// Что послать машине состояний и с каким признаком «отправить Enter'ом».
    pub event: Option<(Event, bool)>,
    /// Зажат ли триггер после этого события.
    pub trigger_down: bool,
}

/// `NX_SHIFTMASK`: Shift в момент нажатия триггера — вариант «с отправкой».
const SHIFT: u64 = 0x0002_0000;

/// Чистый разбор: событие плюс текущее состояние → что слать машине.
///
/// Правила:
/// - триггер опустился — `Pressed` (с признаком Shift), поднялся — `Released`;
///   повтор того же положения — ничего: система иногда шлёт `flagsChanged`
///   без смены состояния нужного бита;
/// - чужой модификатор — ничего и состояние не трогаем;
/// - обычная клавиша при зажатом триггере — `Escape`: это чужое сочетание, и
///   начатую запись надо отменить, а не доставить. Без триггера — ничего.
pub fn decode(trigger: Trigger, key: Key, trigger_down: bool) -> Decoded {
    match key {
        Key::FlagsChanged { keycode, flags } if keycode == trigger.keycode() => {
            let down = flags & trigger.device_flag() != 0;
            let event = match (trigger_down, down) {
                (false, true) => Some((Event::Pressed, flags & SHIFT != 0)),
                (true, false) => Some((Event::Released, false)),
                _ => None,
            };
            Decoded {
                event,
                trigger_down: down,
            }
        }
        Key::FlagsChanged { .. } => Decoded {
            event: None,
            trigger_down,
        },
        Key::KeyDown => Decoded {
            event: trigger_down.then_some((Event::Escape, false)),
            trigger_down,
        },
    }
}

/// Комбинация для плагина хоткеев там, где модификатор-одиночка не
/// поддерживается. На macOS — значение как есть.
pub fn plugin_fallback(hotkey: &str) -> String {
    if cfg!(target_os = "macos") || Trigger::parse(hotkey).is_none() {
        hotkey.to_string()
    } else {
        "Ctrl+Option+D".to_string()
    }
}

#[cfg(target_os = "macos")]
pub use tap::configure;

#[cfg(target_os = "macos")]
mod tap {
    use super::{decode, Key, Trigger};
    use crate::dictation::Event;
    use std::ffi::c_void;
    use std::sync::atomic::{AtomicBool, AtomicU8, AtomicUsize, Ordering};
    use std::sync::{mpsc, OnceLock};
    use std::time::Duration;
    use tauri::AppHandle;

    type Callback = unsafe extern "C" fn(*mut c_void, u32, *mut c_void, *mut c_void) -> *mut c_void;

    #[link(name = "CoreGraphics", kind = "framework")]
    extern "C" {
        fn CGEventTapCreate(
            tap: u32,
            place: u32,
            options: u32,
            mask: u64,
            callback: Callback,
            user_info: *mut c_void,
        ) -> *mut c_void;
        fn CGEventTapEnable(tap: *mut c_void, enable: bool);
        fn CGEventGetIntegerValueField(event: *mut c_void, field: u32) -> i64;
        fn CGEventGetFlags(event: *mut c_void) -> u64;
    }

    #[link(name = "CoreFoundation", kind = "framework")]
    extern "C" {
        fn CFMachPortCreateRunLoopSource(
            allocator: *const c_void,
            port: *mut c_void,
            order: isize,
        ) -> *mut c_void;
        fn CFRunLoopGetCurrent() -> *mut c_void;
        fn CFRunLoopAddSource(rl: *mut c_void, source: *mut c_void, mode: *const c_void);
        fn CFRunLoopRun();
        static kCFRunLoopCommonModes: *const c_void;
    }

    /// `kCGSessionEventTap`: события текущего сеанса, до раздачи приложениям.
    const SESSION_TAP: u32 = 1;
    /// `kCGHeadInsertEventTap`.
    const HEAD_INSERT: u32 = 0;
    /// `kCGEventTapOptionListenOnly`: только смотрим, ничего не глотаем.
    const LISTEN_ONLY: u32 = 1;
    const KEY_DOWN: u32 = 10;
    const FLAGS_CHANGED: u32 = 12;
    const DISABLED_BY_TIMEOUT: u32 = 0xFFFF_FFFE;
    const DISABLED_BY_USER: u32 = 0xFFFF_FFFF;
    /// `kCGKeyboardEventKeycode`.
    const FIELD_KEYCODE: u32 = 9;

    static ENABLED: AtomicBool = AtomicBool::new(false);
    static TRIGGER: AtomicU8 = AtomicU8::new(0);
    static TRIGGER_DOWN: AtomicBool = AtomicBool::new(false);
    /// Указатель на тап как число: нужен обработчику, чтобы включить тап
    /// обратно, когда система его выключила.
    static TAP: AtomicUsize = AtomicUsize::new(0);
    static SENDER: OnceLock<mpsc::Sender<(Event, bool)>> = OnceLock::new();

    /// Обработчик тапа. Только разбор и канал — см. шапку модуля.
    unsafe extern "C" fn on_event(
        _proxy: *mut c_void,
        kind: u32,
        event: *mut c_void,
        _info: *mut c_void,
    ) -> *mut c_void {
        if kind == DISABLED_BY_TIMEOUT || kind == DISABLED_BY_USER {
            // Система выключила тап — включаем обратно, иначе диктовка молча
            // перестанет реагировать до перезапуска.
            let tap = TAP.load(Ordering::Relaxed);
            if tap != 0 {
                CGEventTapEnable(tap as *mut c_void, true);
            }
            return event;
        }
        if !ENABLED.load(Ordering::Relaxed) {
            return event;
        }
        let key = match kind {
            FLAGS_CHANGED => Key::FlagsChanged {
                keycode: CGEventGetIntegerValueField(event, FIELD_KEYCODE),
                flags: CGEventGetFlags(event),
            },
            KEY_DOWN => Key::KeyDown,
            _ => return event,
        };
        let trigger = Trigger::from_u8(TRIGGER.load(Ordering::Relaxed));
        let decoded = decode(trigger, key, TRIGGER_DOWN.load(Ordering::Relaxed));
        TRIGGER_DOWN.store(decoded.trigger_down, Ordering::Relaxed);
        if let (Some(ev), Some(tx)) = (decoded.event, SENDER.get()) {
            let _ = tx.send(ev);
        }
        event
    }

    /// Включает триггер (`Some`) или выключает перехватчик (`None`).
    ///
    /// Тап создаётся один раз за жизнь процесса и дальше только включается и
    /// выключается: пересоздавать объекты CoreFoundation с другого потока —
    /// верный способ получить гонку на закрытии.
    pub fn configure(app: &AppHandle, trigger: Option<Trigger>) -> Result<(), String> {
        let Some(trigger) = trigger else {
            ENABLED.store(false, Ordering::Relaxed);
            TRIGGER_DOWN.store(false, Ordering::Relaxed);
            let tap = TAP.load(Ordering::Relaxed);
            if tap != 0 {
                unsafe { CGEventTapEnable(tap as *mut c_void, false) };
            }
            return Ok(());
        };
        TRIGGER.store(trigger as u8, Ordering::Relaxed);
        TRIGGER_DOWN.store(false, Ordering::Relaxed);
        ensure_worker(app);
        ensure_tap()?;
        ENABLED.store(true, Ordering::Relaxed);
        unsafe { CGEventTapEnable(TAP.load(Ordering::Relaxed) as *mut c_void, true) };
        Ok(())
    }

    /// Поток, который превращает события тапа в шаги машины состояний.
    ///
    /// Отдельный от потока тапа: `handle` открывает микрофон, а это до двух
    /// секунд на первом открытии — тап за такое время система выключит.
    fn ensure_worker(app: &AppHandle) {
        if SENDER.get().is_some() {
            return;
        }
        let (tx, rx) = mpsc::channel::<(Event, bool)>();
        if SENDER.set(tx).is_err() {
            return;
        }
        let app = app.clone();
        std::thread::Builder::new()
            .name("dictation-modkey".into())
            .spawn(move || {
                while let Ok((ev, with_enter)) = rx.recv() {
                    crate::dictation::handle(&app, ev, with_enter);
                }
            })
            .ok();
    }

    /// Создаёт тап в отдельном потоке с собственным циклом событий.
    fn ensure_tap() -> Result<(), String> {
        if TAP.load(Ordering::Relaxed) != 0 {
            return Ok(());
        }
        let (ready_tx, ready_rx) = mpsc::channel::<Result<(), String>>();
        std::thread::Builder::new()
            .name("dictation-modkey-tap".into())
            .spawn(move || unsafe {
                let mask = (1u64 << KEY_DOWN) | (1u64 << FLAGS_CHANGED);
                let tap = CGEventTapCreate(
                    SESSION_TAP,
                    HEAD_INSERT,
                    LISTEN_ONLY,
                    mask,
                    on_event,
                    std::ptr::null_mut(),
                );
                if tap.is_null() {
                    let _ = ready_tx.send(Err(
                        "система не дала слушать клавиатуру — нужен «Универсальный доступ»".into(),
                    ));
                    return;
                }
                let source = CFMachPortCreateRunLoopSource(std::ptr::null(), tap, 0);
                if source.is_null() {
                    let _ = ready_tx.send(Err("не создать источник цикла событий".into()));
                    return;
                }
                CFRunLoopAddSource(CFRunLoopGetCurrent(), source, kCFRunLoopCommonModes);
                CGEventTapEnable(tap, true);
                TAP.store(tap as usize, Ordering::Relaxed);
                let _ = ready_tx.send(Ok(()));
                // Отсюда поток не возвращается: цикл крутится, пока живёт процесс.
                CFRunLoopRun();
            })
            .map_err(|e| e.to_string())?;
        ready_rx
            .recv_timeout(Duration::from_secs(3))
            .map_err(|_| "перехватчик клавиатуры не ответил".to_string())?
    }
}

/// На других системах триггер-модификатор не реализован: там вместо него
/// подставляется комбинация для плагина — см. [`plugin_fallback`].
#[cfg(not(target_os = "macos"))]
pub fn configure(_app: &tauri::AppHandle, trigger: Option<Trigger>) -> Result<(), String> {
    match trigger {
        None => Ok(()),
        Some(_) => Err("триггер-модификатор поддерживается только на macOS".into()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Флаги правого ⌥ в нажатом состоянии: общий бит alt плюс бит устройства.
    const RALT_DOWN: u64 = 0x0008_0000 | 0x40;
    const RCMD_DOWN: u64 = 0x0010_0000 | 0x10;

    #[test]
    fn press_and_release_of_right_option() {
        let d = decode(
            Trigger::RightOption,
            Key::FlagsChanged {
                keycode: 61,
                flags: RALT_DOWN,
            },
            false,
        );
        assert_eq!(d.event, Some((Event::Pressed, false)));
        assert!(d.trigger_down);

        let d = decode(
            Trigger::RightOption,
            Key::FlagsChanged {
                keycode: 61,
                flags: 0,
            },
            true,
        );
        assert_eq!(d.event, Some((Event::Released, false)));
        assert!(!d.trigger_down);
    }

    #[test]
    fn shift_at_press_means_send() {
        let d = decode(
            Trigger::RightOption,
            Key::FlagsChanged {
                keycode: 61,
                flags: RALT_DOWN | SHIFT,
            },
            false,
        );
        assert_eq!(d.event, Some((Event::Pressed, true)));
    }

    /// Система иногда присылает `flagsChanged` без смены нужного бита —
    /// второго `Pressed` от этого быть не должно.
    #[test]
    fn repeated_state_is_silent() {
        let d = decode(
            Trigger::RightOption,
            Key::FlagsChanged {
                keycode: 61,
                flags: RALT_DOWN,
            },
            true,
        );
        assert_eq!(d.event, None);
        assert!(d.trigger_down);
    }

    #[test]
    fn other_modifiers_are_ignored() {
        // Левый ⌥ (код 58) при триггере на правом — не наш.
        let d = decode(
            Trigger::RightOption,
            Key::FlagsChanged {
                keycode: 58,
                flags: 0x0008_0000 | 0x20,
            },
            false,
        );
        assert_eq!(d.event, None);
        assert!(!d.trigger_down);
        // И правый ⌥ при триггере на правом ⌘ — тоже.
        let d = decode(
            Trigger::RightCommand,
            Key::FlagsChanged {
                keycode: 61,
                flags: RALT_DOWN,
            },
            false,
        );
        assert_eq!(d.event, None);
    }

    #[test]
    fn right_command_trigger() {
        let d = decode(
            Trigger::RightCommand,
            Key::FlagsChanged {
                keycode: 54,
                flags: RCMD_DOWN,
            },
            false,
        );
        assert_eq!(d.event, Some((Event::Pressed, false)));
        assert!(d.trigger_down);
    }

    /// Буква при зажатом триггере — чужое сочетание: запись отменяется, а
    /// триггер по-прежнему считается зажатым, чтобы его отпускание не
    /// потерялось.
    #[test]
    fn key_while_held_cancels() {
        let d = decode(Trigger::RightOption, Key::KeyDown, true);
        assert_eq!(d.event, Some((Event::Escape, false)));
        assert!(d.trigger_down);
        let d = decode(Trigger::RightOption, Key::KeyDown, false);
        assert_eq!(d.event, None);
    }

    #[test]
    fn parse_and_fallback() {
        assert_eq!(Trigger::parse("RightOption"), Some(Trigger::RightOption));
        assert_eq!(Trigger::parse("RightCommand"), Some(Trigger::RightCommand));
        assert_eq!(Trigger::parse("Option+Space"), None);
        assert_eq!(plugin_fallback("Ctrl+Option+D"), "Ctrl+Option+D");
    }
}
