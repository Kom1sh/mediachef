//! Плашка со статусом диктовки — та, что висит под монобровью.
//!
//! ## Почему окно не крадёт фокус
//!
//! Это главное требование ко всему модулю, и оно не про красоту: диктовка
//! печатает текст в **активное** окно. Если плашка станет активной, «активным
//! окном» окажется она сама, и текст уедет в никуда.
//!
//! Держится это на трёх вещах:
//!
//! - `focusable(false)` — Tauri создаёт окна не голым `NSWindow`, а своим
//!   подклассом `TaoWindow`, который переопределяет `canBecomeKeyWindow` и
//!   `canBecomeMainWindow`, возвращая из них этот флаг. То есть окно **не может**
//!   стать активным, а не просто не становится им при показе.
//! - `set_ignore_cursor_events(true)` — мышь проходит сквозь плашку насквозь.
//!   Клик по ней достаётся тому, что под ней, и активировать нечего.
//! - окно строится **невидимым** и показывается своими руками через
//!   `orderFront:` — см. [`show_above_menu_bar`]. Показ силами Tauri
//!   (`show()`/`set_visible`) идёт через `makeKeyAndOrderFront`, и полагаться
//!   на него мы не стали.
//!
//! ## Про `NSPanel`, которого здесь нет
//!
//! Одна редакция этого модуля подменяла класс окна на `NSPanel` со стилем
//! `NonactivatingPanel` — по учебнику это единственный «настоящий» запрет на
//! активацию приложения. Она и уронила программу: KVO в Objective-C устроен
//! подменой isa, WebKit подписывается на окно через KVO, и наш
//! `object_setClass` затирал его обёртку. При закрытии плашки WebKit
//! отписывался, runtime не находил подписки и бросал исключение, а Rust через
//! чужое исключение не раскручивается — процесс глох с голым «abort() called».
//!
//! Проверили, нужна ли подмена вообще: самопроверка (`MEDIACHEF_SELFTEST=
//! overlay`, см. `dictation.rs`) выводит вперёд другое приложение, показывает
//! плашку и спрашивает у `NSApp`, активны ли мы. Ответ — нет, что с подменой,
//! что без неё. Подмену убрали; самопроверка осталась как измеритель.
//! Стороннего `tauri-nspanel` не понадобилось, и теперь понятно, почему.
//!
//! ## Почему окно создаётся и закрывается каждый раз
//!
//! Приложение выходит по закрытию последнего окна. Вечно живущая скрытая
//! плашка была бы вторым окном и тихо сломала бы выход: человек закрыл главное
//! окно, а процесс остался. Создание стоит десятки миллисекунд и происходит в
//! момент, когда человек только начал говорить, — на фоне секунды распознавания
//! это незаметно.
//!
//! ## Про монобровь и Dynamic Island
//!
//! Первая попытка оставляла сверху прозрачный зазор под монобровь, и панель
//! висела ПОД ней — отдельным прямоугольником. Выглядело именно так, как и
//! было устроено: не остров, а всплывшее окно.
//!
//! Правильный приём — обратный. Монобровь физически непрозрачна и всегда
//! чёрная, поэтому её не обходят, её **поглощают**: панель начинается от
//! самого верха экрана, чёрная и непрозрачная, шире и выше монобровы. Граница
//! между ними исчезает, потому что оба чёрные, и монобровь читается как часть
//! панели. Ровно так же сделан Dynamic Island на телефоне.
//!
//! Отдельного определения «есть ли монобровь» по-прежнему нет и не нужно. На
//! маке без неё та же чёрная панель просто накрывает пустую середину строки
//! меню, которую всё равно никто не занимает; на Windows и Linux — пустоту
//! сверху. Одна раскладка, все случаи выглядят правильно.

use serde::Serialize;
use tauri::{AppHandle, Emitter, LogicalPosition, LogicalSize, Manager, WebviewUrl, WebviewWindow};

/// Ярлык окна. По нему же адресуются события.
pub const LABEL: &str = "dictation-overlay";

/// Размер плашки в логических точках.
const WIDTH: f64 = 460.0;
const HEIGHT: f64 = 132.0;

/// Габариты монобровы на маках, у которых она есть: примерно 200 на 32 точки.
///
/// Числа нужны не для позиционирования — панель стоит по центру сверху в любом
/// случае, — а для анимации: остров «вырастает» именно из этого размера, и
/// первый её кадр обязан совпасть с монобровью, иначе рост читается как
/// появление постороннего окна. Дублируются в `overlay.tsx`; связь держат
/// проверки на сборке ниже.
pub const NOTCH_WIDTH: f64 = 200.0;
pub const NOTCH_HEIGHT: f64 = 32.0;

/// Что показывает плашка.
#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Phase {
    /// Идёт запись.
    Listening,
    /// Запись кончилась, идёт расшифровка.
    Working,
    /// Готово — короткий показ итога перед тем, как плашка исчезнет.
    Done,
}

/// Полезная нагрузка события для вебвью плашки.
#[derive(Debug, Clone, Serialize)]
pub struct Status {
    pub phase: Phase,
    /// Пиковый уровень 0..1 — полоска, по которой видно, что микрофон слышит.
    pub level: f32,
    /// Распознанное на сейчас. Пока пусто — плашка показывает только статус.
    pub text: String,
}

/// Показывает плашку, создавая окно при необходимости.
///
/// Ошибки не роняют диктовку: плашка — это удобство, и её отсутствие не
/// повод не дать человеку надиктовать текст. Но и молча они не глотаются:
/// `report` получает строку о каждом сбое, и вызывающий пишет её в журнал.
/// Появилось после падения, которое отчёт о сбое описал одной строкой
/// «abort() called» — без единого слова о том, что именно пошло не так.
pub fn show(app: &AppHandle, report: impl Fn(&str) + Send + 'static) {
    if app.get_webview_window(LABEL).is_some() {
        return;
    }
    let Some(monitor) = app.primary_monitor().ok().flatten() else {
        return;
    };
    let scale = monitor.scale_factor();
    let screen = monitor.size().to_logical::<f64>(scale);
    let x = (screen.width - WIDTH) / 2.0;

    let built = WebviewWindow::builder(app, LABEL, WebviewUrl::App("overlay.html".into()))
        // Не может стать активным окном — см. шапку модуля.
        .focusable(false)
        // И — отдельным флагом — не просит фокус при показе. Это не дубль
        // предыдущей строки, а разные вещи, и разница стоила бага: `tao` при
        // `focused: true` зовёт `makeKeyAndOrderFront`, который АКТИВИРУЕТ
        // приложение. Плашка сама активной стать не могла (не `focusable`), и
        // система делала активным главное окно MediaChef — то есть текст уезжал
        // в него вместо поля, куда диктовали. С `false` зовётся `orderFront`,
        // который показывает окно, никого не активируя.
        .focused(false)
        .always_on_top(true)
        // Иначе плашка не видна поверх полноэкранного приложения, а диктуют
        // как раз в полноэкранных редакторах и терминалах.
        .visible_on_all_workspaces(true)
        .decorations(false)
        .transparent(true)
        .shadow(false)
        .skip_taskbar(true)
        .resizable(false)
        .inner_size(WIDTH, HEIGHT)
        .position(x, 0.0)
        // Невидимым: показывать будем сами, когда поднимем уровень окна выше
        // строки меню. Обычное окно macOS на строку меню не пускает и
        // прижимает вниз, а к невидимому это не применяется.
        .visible(false)
        .build();

    let Ok(win) = built else { return };
    // Мышь проходит насквозь: клик по плашке достаётся окну под ней.
    let _ = win.set_ignore_cursor_events(true);
    let _ = win.set_size(LogicalSize::new(WIDTH, HEIGHT));

    // Дальше — главный поток, и это не перестраховка.
    //
    // Своим операциям над окном Tauri переезд на главный поток устраивает
    // сам, но сырые вызовы AppKit ниже никто не переносит, а AppKit с чужого
    // потока — неопределённое поведение: то сработает, то нет. Обработчик
    // хоткея сегодня живёт на главном потоке (Carbon), но правильность не
    // должна зависеть от того, откуда позвали: самопроверка, например, зовёт
    // отсюда же с фонового.
    let app = app.clone();
    let _ = app.clone().run_on_main_thread(move || {
        // Плашку могли успеть закрыть, пока задача ждала очереди: диктовку
        // отменяют и в первые же миллисекунды. Тогда окна уже нет, и трогать
        // его нельзя.
        let Some(win) = app.get_webview_window(LABEL) else {
            report("плашка: окно закрыли раньше, чем оно показалось");
            return;
        };
        match show_above_menu_bar(&win) {
            Ok(()) => report("плашка: показана поверх строки меню"),
            Err(e) => report(&format!("плашка: не удалось показать: {e}")),
        }
        // Позиция — после показа и после подъёма уровня: окну уровня 25 на
        // строку меню уже можно, обычному — нет, его прижмут вниз.
        let _ = win.set_position(LogicalPosition::new(x, 0.0));
    });
}

/// Обновляет содержимое плашки.
pub fn update(app: &AppHandle, status: &Status) {
    let _ = app.emit_to(LABEL, "dictation:status", status);
}

/// Убирает плашку.
pub fn hide(app: &AppHandle) {
    if let Some(win) = app.get_webview_window(LABEL) {
        let _ = win.close();
    }
}

/// Активно ли приложение сейчас — для самопроверки: так измеряется, крадёт ли
/// плашка фокус.
#[cfg(target_os = "macos")]
pub fn app_is_active() -> bool {
    use std::ffi::c_void;
    extern "C" {
        fn objc_getClass(name: *const u8) -> *mut c_void;
        fn sel_registerName(name: *const u8) -> *const c_void;
        fn objc_msgSend();
    }
    // SAFETY: `sharedApplication` и `isActive` — методы NSApplication с
    // объявленными ниже сигнатурами.
    unsafe {
        let send_id: extern "C" fn(*mut c_void, *const c_void) -> *mut c_void =
            std::mem::transmute(objc_msgSend as *const ());
        let send_bool: extern "C" fn(*mut c_void, *const c_void) -> i8 =
            std::mem::transmute(objc_msgSend as *const ());
        let cls = objc_getClass(c"NSApplication".as_ptr() as *const u8);
        let app = send_id(
            cls,
            sel_registerName(c"sharedApplication".as_ptr() as *const u8),
        );
        send_bool(app, sel_registerName(c"isActive".as_ptr() as *const u8)) != 0
    }
}

#[cfg(not(target_os = "macos"))]
pub fn app_is_active() -> bool {
    false
}

/// Поднимает окно выше строки меню и показывает его, никого не активируя.
///
/// Здесь собрано то, чего не дают флаги Tauri, и каждая строка оплачена
/// сломанным сценарием.
///
/// **Почему уровень 25.** Строка меню живёт на 24-м. Ниже — и верх панели,
/// та самая часть, что сливается с монобровью, просто не видна, а окно ещё и
/// прижимается системой под строку меню. `always_on_top` у Tauri — это
/// уровень 3, до строки меню ему далеко.
///
/// **Почему показываем сами, а не через Tauri.** `show()` в tao идёт через
/// `makeKeyAndOrderFront`. Тот, кто может стать ключевым, от этого становится
/// им; наше окно не может, но проверять на живых людях, активирует ли это
/// приложение, мы не стали: `orderFront:` показывает окно и заведомо никого
/// не трогает — самопроверка это подтверждает цифрой.
#[cfg(target_os = "macos")]
fn show_above_menu_bar(win: &WebviewWindow) -> Result<(), String> {
    use std::ffi::c_void;
    let ns = win.ns_window().map_err(|e| e.to_string())?;

    extern "C" {
        fn sel_registerName(name: *const u8) -> *const c_void;
        fn objc_msgSend();
    }

    /// Выше строки меню (24).
    const STATUS_LEVEL: i64 = 25;

    // Всё, что ниже, — под ловушкой исключений Objective-C, и это не
    // осторожность ради осторожности. Rust не умеет раскручиваться через чужое
    // исключение: встретив его, он глушит процесс целиком, и отчёт о сбое
    // получает голое «abort() called» без причины. Так плашка однажды и
    // уронила приложение. Ловушка превращает это в строку журнала.
    //
    // SAFETY: `ns_window` отдаёт живой NSWindow; все селекторы есть у
    // NSWindow, и сигнатуры совпадают с объявленными ниже.
    let outcome = objc2::exception::catch(|| unsafe {
        let send_u64: extern "C" fn(*mut c_void, *const c_void, u64) =
            std::mem::transmute(objc_msgSend as *const ());
        let send_i64: extern "C" fn(*mut c_void, *const c_void, i64) =
            std::mem::transmute(objc_msgSend as *const ());
        let send_bool: extern "C" fn(*mut c_void, *const c_void, i8) =
            std::mem::transmute(objc_msgSend as *const ());
        let send_void: extern "C" fn(*mut c_void, *const c_void, *const c_void) =
            std::mem::transmute(objc_msgSend as *const ());

        send_i64(
            ns,
            sel_registerName(c"setLevel:".as_ptr() as *const u8),
            STATUS_LEVEL,
        );
        // Панель не должна прятаться, когда приложение уходит в фон, — а оно
        // в фоне всегда: диктуют в чужом окне.
        send_bool(
            ns,
            sel_registerName(c"setHidesOnDeactivate:".as_ptr() as *const u8),
            0,
        );
        // Панель видна над полноэкранными приложениями и на всех рабочих
        // столах. Флаг `visible_on_all_workspaces` при создании ставит только
        // `CanJoinAllSpaces`, а этого мало: без `FullScreenAuxiliary` плашка
        // пропадает ровно там, где нужна больше всего, — поверх развёрнутого
        // на весь экран редактора или терминала.
        const CAN_JOIN_ALL_SPACES: u64 = 1 << 0;
        const STATIONARY: u64 = 1 << 4;
        const FULL_SCREEN_AUXILIARY: u64 = 1 << 8;
        send_u64(
            ns,
            sel_registerName(c"setCollectionBehavior:".as_ptr() as *const u8),
            CAN_JOIN_ALL_SPACES | STATIONARY | FULL_SCREEN_AUXILIARY,
        );
        // Показываем сами: Tauri сделал бы это с активацией.
        send_void(
            ns,
            sel_registerName(c"orderFront:".as_ptr() as *const u8),
            std::ptr::null(),
        );
    });
    match outcome {
        Ok(()) => Ok(()),
        Err(Some(exc)) => Err(format!("{exc}")),
        Err(None) => Err("исключение без объекта".into()),
    }
}

/// Перехватчик исключений Objective-C на уровне runtime — для самопроверки.
///
/// Rust, встретив чужое исключение, глушит процесс, и отчёт о сбое остаётся
/// без причины. Отладчик здесь не помощник: без включённого режима
/// разработчика lldb упирается в системный запрос пароля. Зато у runtime есть
/// `objc_setExceptionPreprocessor` — функция, которую зовут перед выбросом
/// КАЖДОГО исключения, ещё до раскрутки стека. Отсюда и пишем: описание
/// исключения и стек вызовов в момент броска — то есть ровно то, чего нет в
/// отчёте о сбое.
///
/// Ставится один раз; повторные вызовы ничего не делают.
#[cfg(target_os = "macos")]
pub fn install_exception_logger(report: impl Fn(&str) + Send + Sync + 'static) {
    use std::ffi::{c_char, c_void, CStr};
    use std::sync::OnceLock;

    type Report = Box<dyn Fn(&str) + Send + Sync>;
    static REPORT: OnceLock<Report> = OnceLock::new();
    if REPORT.set(Box::new(report)).is_err() {
        return;
    }

    type Preprocessor = extern "C" fn(*mut c_void) -> *mut c_void;
    extern "C" {
        fn objc_setExceptionPreprocessor(f: Preprocessor) -> Option<Preprocessor>;
        fn sel_registerName(name: *const u8) -> *const c_void;
        fn objc_msgSend();
    }

    extern "C" fn log_exception(exc: *mut c_void) -> *mut c_void {
        // SAFETY: `exc` — живой NSException; `description` и `UTF8String`
        // есть у любого NSObject/NSString, сигнатуры совпадают.
        let text = unsafe {
            let send_id: extern "C" fn(*mut c_void, *const c_void) -> *mut c_void =
                std::mem::transmute(objc_msgSend as *const ());
            let send_cstr: extern "C" fn(*mut c_void, *const c_void) -> *const c_char =
                std::mem::transmute(objc_msgSend as *const ());
            let desc = send_id(exc, sel_registerName(c"description".as_ptr() as *const u8));
            let p = if desc.is_null() {
                std::ptr::null()
            } else {
                send_cstr(desc, sel_registerName(c"UTF8String".as_ptr() as *const u8))
            };
            if p.is_null() {
                "(без описания)".to_string()
            } else {
                CStr::from_ptr(p).to_string_lossy().into_owned()
            }
        };
        let bt = std::backtrace::Backtrace::force_capture();
        if let Some(r) = REPORT.get() {
            r(&format!("исключение Objective-C: {text}\n{bt}"));
        }
        exc
    }

    unsafe {
        objc_setExceptionPreprocessor(log_exception);
    }
}

/// На других системах окно просто показывается: строки меню сверху там нет, а
/// «поверх всех» задаётся флагом при создании.
#[cfg(not(target_os = "macos"))]
fn show_above_menu_bar(win: &WebviewWindow) -> Result<(), String> {
    win.show().map_err(|e| e.to_string())
}

// Геометрия проверяется на сборке, а не тестом: это константы, и ошибка в них
// не «иногда воспроизводится», а есть всегда. Компилятор поймает её раньше,
// чем кто-нибудь запустит тесты.
const _: () = assert!(
    WIDTH > NOTCH_WIDTH,
    "панель не шире монобровы — поглотить её и вырасти из неё не получится"
);
const _: () = assert!(
    HEIGHT > NOTCH_HEIGHT * 2.0,
    "панель почти вровень с монобровью: расти некуда и текст не поместится"
);

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn phase_serialises_lowercase() {
        let s = serde_json::to_string(&Phase::Listening).unwrap();
        assert_eq!(s, "\"listening\"");
    }
}
