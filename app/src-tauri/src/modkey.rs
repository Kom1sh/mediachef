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
//!
//! ## Windows
//!
//! До 0.8.5 на Windows диктовка висела на Ctrl+Alt+D — три клавиши разом там,
//! где на маке одна. Теперь и там одна: правый Ctrl, правый Alt или Caps Lock.
//! Перехватчик — низкоуровневый хук клавиатуры (`WH_KEYBOARD_LL`) в своём
//! потоке с циклом сообщений; разбор — та же [`decode`], что на маке.
//! Разрешений Windows для этого не просит.
//!
//! Две клавиши требуют больше, чем «послушать»:
//! - **правый Alt** на раскладке без AltGr (английская, русская) — это Alt, а
//!   одиночное нажатие Alt Windows понимает как «перейти в меню окна». Отпустил
//!   триггер — и следующая надиктованная буква открыла бы меню «Файл». Поэтому
//!   одиночное отпускание хук придерживает и перед ним вставляет пустую
//!   клавишу 0xE8 — ровно так гасит меню AutoHotkey. На раскладках с AltGr
//!   (польская, немецкая) правый Alt печатает буквы; об этом говорит подсказка
//!   на вкладке, там лучше правый Ctrl.
//! - **Caps Lock** хук глотает целиком, иначе каждая диктовка переключала бы
//!   регистр. Выбравший его в триггер Caps Lock как Caps Lock теряет — ради
//!   клавиши, которая есть на любой клавиатуре.
//!
//! На Linux одиночный триггер пока не сделан: на X11 нужен свой слушатель, а
//! на Wayland приложению клавиатуру не дают вовсе.

use crate::dictation::Event;

/// Какой модификатор служит триггером.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum Trigger {
    RightOption = 0,
    RightCommand = 1,
    /// Windows: правый Ctrl — умолчание там, ничего не делает в одиночку.
    RightCtrl = 2,
    /// Windows: правый Alt (AltGr на части раскладок).
    RightAlt = 3,
    /// Windows: Caps Lock, проглатывается целиком.
    CapsLock = 4,
}

impl Trigger {
    /// Разбор значения настройки. `None` — это обычная комбинация для плагина,
    /// а не модификатор.
    pub fn parse(hotkey: &str) -> Option<Self> {
        match hotkey {
            "RightOption" => Some(Self::RightOption),
            "RightCommand" => Some(Self::RightCommand),
            "RightCtrl" => Some(Self::RightCtrl),
            "RightAlt" => Some(Self::RightAlt),
            "CapsLock" => Some(Self::CapsLock),
            _ => None,
        }
    }

    /// Есть ли перехватчик для этого триггера на текущей системе. Нет — `apply`
    /// уходит в плагин хоткеев с запасной комбинацией.
    pub fn supported(self) -> bool {
        match self {
            Self::RightOption | Self::RightCommand => cfg!(target_os = "macos"),
            Self::RightCtrl | Self::RightAlt | Self::CapsLock => cfg!(target_os = "windows"),
        }
    }

    /// Для журнала.
    pub fn describe(self) -> &'static str {
        match self {
            Self::RightOption => "правый ⌥",
            Self::RightCommand => "правый ⌘",
            Self::RightCtrl => "правый Ctrl",
            Self::RightAlt => "правый Alt",
            Self::CapsLock => "Caps Lock",
        }
    }

    /// Виртуальный код клавиши на маке: `kVK_RightOption` и `kVK_RightCommand`.
    /// У триггеров Windows мак-кода нет — минус один не совпадёт ни с одним.
    fn keycode(self) -> i64 {
        match self {
            Self::RightOption => 61,
            Self::RightCommand => 54,
            Self::RightCtrl | Self::RightAlt | Self::CapsLock => -1,
        }
    }

    /// Бит конкретного устройства во флагах события — `NX_DEVICERALTKEYMASK`
    /// и `NX_DEVICERCMDKEYMASK`. Именно он, а не общий «alt нажат»: общий бит
    /// одинаков для левого и правого, а нам нужен только правый.
    fn device_flag(self) -> u64 {
        match self {
            Self::RightOption => 0x40,
            Self::RightCommand => 0x10,
            Self::RightCtrl | Self::RightAlt | Self::CapsLock => 0,
        }
    }

    /// Обратно из атомика — нужен только перехватчикам, а они есть лишь на
    /// macOS и Windows; без `cfg` сборка под Linux ругалась бы на мёртвый код.
    #[cfg(any(target_os = "macos", target_os = "windows"))]
    fn from_u8(v: u8) -> Self {
        match v {
            1 => Self::RightCommand,
            2 => Self::RightCtrl,
            3 => Self::RightAlt,
            4 => Self::CapsLock,
            _ => Self::RightOption,
        }
    }
}

/// Событие клавиатуры в том виде, в каком его отдаёт тап.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Key {
    /// Изменились модификаторы. `keycode` говорит, какой именно, `flags` —
    /// что нажато сейчас.
    FlagsChanged { keycode: i64, flags: u64 },
    /// Сам триггер нажат или отпущен — так говорит перехватчик, который знает
    /// клавишу напрямую (Windows). `shift` — зажат ли Shift в этот момент.
    Trigger { down: bool, shift: bool },
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
        Key::Trigger { down, shift } => {
            let event = match (trigger_down, down) {
                (false, true) => Some((Event::Pressed, shift)),
                (true, false) => Some((Event::Released, false)),
                // Автоповтор зажатой клавиши шлёт «нажата» снова и снова.
                _ => None,
            };
            Decoded {
                event,
                trigger_down: down,
            }
        }
        Key::KeyDown => Decoded {
            event: trigger_down.then_some((Event::Escape, false)),
            trigger_down,
        },
    }
}

/// Что значит записанный хоткей на этой системе.
///
/// Настройки переносят только `sanitize_dictation`, но файл могли принести
/// с другой машины, а правый ⌥ на Windows не существует. Здесь каждая система
/// получает свой ближайший аналог — тот же, что показывает вкладка
/// (`effectiveHotkey` в `types.ts`).
pub fn native(hotkey: &str) -> String {
    match (
        hotkey,
        cfg!(target_os = "macos"),
        cfg!(target_os = "windows"),
    ) {
        ("RightCtrl" | "RightAlt" | "CapsLock", true, _) => "RightOption".into(),
        ("RightOption" | "RightCommand", _, true) => "RightCtrl".into(),
        _ => hotkey.to_string(),
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

#[cfg(target_os = "windows")]
pub use hook::configure;

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

/// На Linux триггер-модификатор не реализован: там вместо него подставляется
/// комбинация для плагина — см. [`plugin_fallback`].
#[cfg(not(any(target_os = "macos", target_os = "windows")))]
pub fn configure(_app: &tauri::AppHandle, trigger: Option<Trigger>) -> Result<(), String> {
    match trigger {
        None => Ok(()),
        Some(_) => Err("триггер-модификатор на Linux пока не поддерживается".into()),
    }
}

#[cfg(target_os = "windows")]
mod hook {
    //! Низкоуровневый хук клавиатуры — см. шапку модуля, раздел «Windows».
    use super::{decode, Key, Trigger};
    use crate::dictation::Event;
    use std::sync::atomic::{AtomicBool, AtomicU8, Ordering};
    use std::sync::{mpsc, OnceLock};
    use std::time::Duration;
    use tauri::AppHandle;
    use windows_sys::Win32::Foundation::{LPARAM, LRESULT, WPARAM};
    use windows_sys::Win32::System::LibraryLoader::GetModuleHandleW;
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::{
        GetAsyncKeyState, SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT,
        KEYEVENTF_EXTENDEDKEY, KEYEVENTF_KEYUP, VK_CAPITAL, VK_CONTROL, VK_LCONTROL, VK_LMENU,
        VK_LSHIFT, VK_LWIN, VK_MENU, VK_RCONTROL, VK_RMENU, VK_RSHIFT, VK_RWIN, VK_SHIFT,
    };
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        CallNextHookEx, GetMessageW, SetWindowsHookExW, KBDLLHOOKSTRUCT, LLKHF_INJECTED, MSG,
        WH_KEYBOARD_LL, WM_KEYDOWN, WM_SYSKEYDOWN,
    };

    /// Пустая клавиша, которой гасится меню после одиночного Alt: код 0xE8 не
    /// назначен ни одной раскладке, и приложения его не видят.
    const MASK_KEY: u16 = 0xE8;

    static ENABLED: AtomicBool = AtomicBool::new(false);
    static TRIGGER: AtomicU8 = AtomicU8::new(0);
    static TRIGGER_DOWN: AtomicBool = AtomicBool::new(false);
    /// Была ли другая клавиша, пока зажат триггер: без неё отпускание правого
    /// Alt — одиночное, и меню надо гасить.
    static OTHER_SINCE_PRESS: AtomicBool = AtomicBool::new(false);
    static INSTALLED: AtomicBool = AtomicBool::new(false);
    static SENDER: OnceLock<mpsc::Sender<(Event, bool)>> = OnceLock::new();

    fn vk_of(trigger: Trigger) -> u16 {
        match trigger {
            Trigger::RightAlt => VK_RMENU,
            Trigger::CapsLock => VK_CAPITAL,
            // Мак-триггеры сюда не доходят: `native` заменил их правым Ctrl.
            _ => VK_RCONTROL,
        }
    }

    /// Модификаторы (и Caps Lock) — не «чужое сочетание»: Shift вместе с
    /// триггером — это вариант с отправкой, а AltGr приходит парой с
    /// поддельным левым Ctrl.
    fn is_modifier(vk: u16) -> bool {
        matches!(
            vk,
            VK_SHIFT
                | VK_LSHIFT
                | VK_RSHIFT
                | VK_CONTROL
                | VK_LCONTROL
                | VK_RCONTROL
                | VK_MENU
                | VK_LMENU
                | VK_RMENU
                | VK_LWIN
                | VK_RWIN
                | VK_CAPITAL
        )
    }

    fn shift_held() -> bool {
        // Старший бит — клавиша зажата сейчас.
        let state = unsafe { GetAsyncKeyState(VK_SHIFT as i32) };
        state < 0
    }

    fn key_input(vk: u16, scan: u16, flags: u32) -> INPUT {
        INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: vk,
                    wScan: scan,
                    dwFlags: flags,
                    time: 0,
                    dwExtraInfo: 0,
                },
            },
        }
    }

    /// Отпускание правого Alt с пустой клавишей перед ним — чтобы Windows не
    /// ушла в меню окна. Настоящее отпускание хук придержал, это — замена.
    fn release_alt_masked(scan: u16) {
        let inputs = [
            key_input(MASK_KEY, 0, 0),
            key_input(MASK_KEY, 0, KEYEVENTF_KEYUP),
            key_input(VK_RMENU, scan, KEYEVENTF_KEYUP | KEYEVENTF_EXTENDEDKEY),
        ];
        unsafe {
            SendInput(
                inputs.len() as u32,
                inputs.as_ptr(),
                std::mem::size_of::<INPUT>() as i32,
            );
        }
    }

    /// Обработчик хука. Только разбор и канал: Windows снимает хук, который
    /// думает дольше сотен миллисекунд.
    unsafe extern "system" fn on_key(code: i32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
        let pass = || CallNextHookEx(std::ptr::null_mut(), code, wparam, lparam);
        if code < 0 || !ENABLED.load(Ordering::Relaxed) {
            return pass();
        }
        let kb = &*(lparam as *const KBDLLHOOKSTRUCT);
        // Своё же: пустая клавиша, поддельное отпускание Alt и печать текста
        // через `enigo`. Иначе печать надиктованного отменяла бы саму себя.
        if kb.flags & LLKHF_INJECTED != 0 {
            return pass();
        }
        let vk = kb.vkCode as u16;
        let down = matches!(wparam as u32, WM_KEYDOWN | WM_SYSKEYDOWN);
        let trigger = Trigger::from_u8(TRIGGER.load(Ordering::Relaxed));
        let was_down = TRIGGER_DOWN.load(Ordering::Relaxed);

        let key = if vk == vk_of(trigger) {
            Key::Trigger {
                down,
                shift: down && shift_held(),
            }
        } else if down && !is_modifier(vk) {
            OTHER_SINCE_PRESS.store(true, Ordering::Relaxed);
            Key::KeyDown
        } else {
            return pass();
        };

        let decoded = decode(trigger, key, was_down);
        TRIGGER_DOWN.store(decoded.trigger_down, Ordering::Relaxed);
        if let Some((Event::Pressed, _)) = decoded.event {
            OTHER_SINCE_PRESS.store(false, Ordering::Relaxed);
        }
        if let (Some(ev), Some(tx)) = (decoded.event, SENDER.get()) {
            let _ = tx.send(ev);
        }

        if let Key::Trigger { down, .. } = key {
            match trigger {
                // Caps Lock — триггер, а не переключатель регистра.
                Trigger::CapsLock => return 1,
                Trigger::RightAlt
                    if !down && was_down && !OTHER_SINCE_PRESS.load(Ordering::Relaxed) =>
                {
                    release_alt_masked(kb.scanCode as u16);
                    return 1;
                }
                _ => {}
            }
        }
        pass()
    }

    /// Включает триггер (`Some`) или выключает перехватчик (`None`).
    ///
    /// Хук ставится один раз за жизнь процесса и дальше только включается и
    /// выключается — как тап на маке.
    pub fn configure(app: &AppHandle, trigger: Option<Trigger>) -> Result<(), String> {
        let Some(trigger) = trigger else {
            ENABLED.store(false, Ordering::Relaxed);
            TRIGGER_DOWN.store(false, Ordering::Relaxed);
            return Ok(());
        };
        TRIGGER.store(trigger as u8, Ordering::Relaxed);
        TRIGGER_DOWN.store(false, Ordering::Relaxed);
        ensure_worker(app);
        ensure_hook()?;
        ENABLED.store(true, Ordering::Relaxed);
        Ok(())
    }

    /// Поток, который превращает нажатия в шаги машины состояний — отдельный
    /// от хука по той же причине, что на маке: открытие микрофона долгое.
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

    /// Ставит хук в отдельном потоке: низкоуровневому хуку нужен цикл
    /// сообщений в том потоке, где он поставлен.
    fn ensure_hook() -> Result<(), String> {
        if INSTALLED.load(Ordering::Relaxed) {
            return Ok(());
        }
        let (ready_tx, ready_rx) = mpsc::channel::<Result<(), String>>();
        std::thread::Builder::new()
            .name("dictation-modkey-hook".into())
            .spawn(move || unsafe {
                let module = GetModuleHandleW(std::ptr::null());
                let hook = SetWindowsHookExW(WH_KEYBOARD_LL, Some(on_key), module, 0);
                if hook.is_null() {
                    let _ = ready_tx.send(Err("Windows не дала поставить хук клавиатуры".into()));
                    return;
                }
                INSTALLED.store(true, Ordering::Relaxed);
                let _ = ready_tx.send(Ok(()));
                // Отсюда поток не возвращается: цикл крутится, пока живёт процесс.
                let mut msg: MSG = std::mem::zeroed();
                while GetMessageW(&mut msg, std::ptr::null_mut(), 0, 0) > 0 {}
            })
            .map_err(|e| e.to_string())?;
        ready_rx
            .recv_timeout(Duration::from_secs(3))
            .map_err(|_| "хук клавиатуры не ответил".to_string())?
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

    /// Триггер, о котором перехватчик знает напрямую (Windows): нажатие с
    /// Shift — вариант с отправкой, автоповтор — ничего, отпускание — конец.
    #[test]
    fn direct_trigger_press_repeat_release() {
        let d = decode(
            Trigger::RightCtrl,
            Key::Trigger {
                down: true,
                shift: false,
            },
            false,
        );
        assert_eq!(d.event, Some((Event::Pressed, false)));
        assert!(d.trigger_down);
        let repeat = decode(
            Trigger::RightCtrl,
            Key::Trigger {
                down: true,
                shift: false,
            },
            true,
        );
        assert_eq!(repeat.event, None);
        let up = decode(
            Trigger::RightCtrl,
            Key::Trigger {
                down: false,
                shift: false,
            },
            true,
        );
        assert_eq!(up.event, Some((Event::Released, false)));
        assert!(!up.trigger_down);
        let with_shift = decode(
            Trigger::CapsLock,
            Key::Trigger {
                down: true,
                shift: true,
            },
            false,
        );
        assert_eq!(with_shift.event, Some((Event::Pressed, true)));
    }

    /// Буква при зажатом триггере отменяет запись и на Windows.
    #[test]
    fn letter_while_direct_trigger_held_cancels() {
        let d = decode(Trigger::RightAlt, Key::KeyDown, true);
        assert_eq!(d.event, Some((Event::Escape, false)));
    }

    /// Новые значения разбираются, и каждая система получает свой триггер.
    #[test]
    fn windows_triggers_parse_and_map() {
        for v in ["RightCtrl", "RightAlt", "CapsLock"] {
            assert!(Trigger::parse(v).is_some(), "{v}");
        }
        if cfg!(target_os = "windows") {
            assert_eq!(native("RightOption"), "RightCtrl");
            assert!(Trigger::RightCtrl.supported());
            assert!(!Trigger::RightOption.supported());
        }
        if cfg!(target_os = "macos") {
            assert_eq!(native("CapsLock"), "RightOption");
            assert!(Trigger::RightOption.supported());
            assert!(!Trigger::RightCtrl.supported());
        }
        assert_eq!(native("Ctrl+Option+Space"), "Ctrl+Option+Space");
    }
}
