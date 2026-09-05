//! The user's preferences: one small JSON file in the app-data directory, and
//! the rules that keep whatever is in it from hurting the app.
//!
//! Two ideas carry the whole module. Every value is a plain `String` rather than
//! an enum, because these cross IPC to a webview and out to a file a user can
//! edit — an enum would only move the "what is this value?" question to the
//! deserializer, where the answer is "the whole file is invalid". Instead
//! [`sanitize`] is a border guard every path goes through ([`load`] on the way
//! in, `settings_set` on the way from the UI), so the rest of the app can read
//! `theme` or `ffmpeg_workers` without asking whether it is one of the values it
//! knows.

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

/// The file, inside the app-data directory (`models/` is its neighbour).
const FILE: &str = "settings.json";

/// The parallelism ceiling. Every worker runs an ffmpeg that already uses all
/// cores, so more than a few only makes them fight over the same cores while
/// costing the same total time — and an unclamped value out of a hand-edited
/// file would be a fork bomb with a progress bar.
const MAX_WORKERS: u8 = 3;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
// `default` so a file written by an older build (or by hand, partially) keeps
// every field it does have; `deny_unknown_fields` so a typo'd key is a loud
// fallback to defaults rather than a setting that silently does nothing.
#[serde(default, deny_unknown_fields)]
pub struct AppSettings {
    /// "system" | "en" | "ru" — "system" follows the OS locale, which the
    /// frontend's `resolveLocale` reads off the webview's `navigator.language`.
    pub language: String,
    /// "system" | "light" | "dark". Applied by the frontend's `applyTheme`.
    pub theme: String,
    /// "beside" (next to the input file) | "fixed" (always `output_dir`).
    pub output_mode: String,
    /// Only meaningful with `output_mode: "fixed"`; `sanitize` demotes the mode
    /// back to "beside" when it is missing.
    pub output_dir: Option<String>,
    /// Desktop notification when a job finishes. Read by the frontend, which is
    /// where the notification is sent from.
    pub notifications: bool,
    /// How many ffmpeg jobs run at once, 1..=MAX_WORKERS. Read once at boot when
    /// the lane workers are spawned, so a change lands after a restart.
    pub ffmpeg_workers: u8,
    /// Диктовка. Вложенным объектом, а не россыпью полей: настроек у неё скоро
    /// станет вдвое больше, и плоский список перестанет читаться.
    pub dictation: Dictation,
}

/// Настройки режима диктовки.
///
/// В волне 5.1 интерфейса у них нет — правятся руками в `settings.json`.
/// Экран настроек приходит в 5.2 и будет писать в те же поля.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(default, deny_unknown_fields)]
pub struct Dictation {
    /// Выключена по умолчанию: пока человек её не включил, приложение ведёт
    /// себя ровно как прежде — глобальный хоткей не регистрируется вовсе.
    pub enabled: bool,
    /// Комбинация в формате плагина глобальных хоткеев.
    ///
    /// Одиночный модификатор (правый Cmd) хоткеем быть не может — тип
    /// `Shortcut` требует обычную клавишу, — поэтому это всегда комбинация.
    ///
    /// По умолчанию `Option+Space`, и выбор тут не вкусовой. Глобальный хоткей
    /// перехватывается **до** всех приложений, поэтому занимать им `Cmd`+букву
    /// нельзя: это ровно тот класс комбинаций, которым приложения занимают свои
    /// меню, и `Cmd+D` глобально сломал бы «дублировать» и «закладку» вообще
    /// везде. `Ctrl+Shift`+буква ничем не лучше — такие занимают редакторы и
    /// терминалы (в Claude Code `Ctrl+Shift+D` уже занят).
    ///
    /// `Option+Space` не заявлен ни системой, ни типовыми приложениями: `Cmd`
    /// со Space — это Spotlight, `Ctrl` со Space — переключение раскладки, а
    /// `Option` со Space свободен. Цена одна и небольшая: в текстовых полях
    /// macOS эта комбинация вставляет неразрывный пробел, и после регистрации
    /// хоткея так делать больше нельзя.
    pub hotkey: String,
    /// Идентификатор модели whisper, как в `core/models.rs`.
    ///
    /// `small`, а не `large-v3-turbo`: это та же модель, что у рецептов
    /// транскрибации, поэтому у активного пользователя она уже на диске и
    /// диктовка включается без единой загрузки. Термины чинит словарь, а не
    /// размер модели — измерено в спеке.
    pub model: String,
    /// Код языка речи, `"auto"` для определения по звуку. Пустая строка —
    /// «как язык интерфейса», и подставляется при чтении.
    pub language: String,
    /// Словарь терминов, уезжающий в `--prompt`.
    ///
    /// Лимит whisper — `n_text_ctx/2`, то есть токены, а не знаки: 398 знаков
    /// кириллицы дают 185 токенов при потолке 229. Отсюда порог в знаках
    /// [`DICTIONARY_MAX_CHARS`] выставлен по кириллице как по худшему случаю;
    /// для латиницы он втрое с запасом.
    pub dictionary: String,
    /// `"clipboard"` или `"type"`.
    ///
    /// По умолчанию буфер: он не требует ничего сверх микрофона и работает
    /// всегда. `"type"` печатает текст прямо в активное поле и **не трогает
    /// буфер** — при диктовке несколько раз в час это разница между «буфером
    /// можно пользоваться» и «нельзя». На macOS печать требует
    /// разрешения «Универсальный доступ», которое проверяется перед каждой
    /// попыткой. Разрешение проверяется
    /// перед каждой вставкой, а не при старте: его можно отозвать в любой
    /// момент, и оно слетает при обновлении неподписанного приложения.
    /// Отсутствие доступа — не тишина, а уведомление плюс открытый раздел
    /// системных настроек; текст при этом всё равно оказывается в буфере.
    pub delivery: String,
    /// Сколько последних расшифровок хранить. Ноль — не хранить ничего.
    ///
    /// По умолчанию ноль. Продукт обещает, что содержимое не покидает машину,
    /// и на этом фоне странно по умолчанию писать **на** машину всё
    /// надиктованное открытым текстом: диктуют пароли и куски переписки.
    pub history_depth: u8,
}

/// Порог длины словаря в знаках.
///
/// Выставлен по кириллице: 0,47 токена на знак при потолке ~224 токена даёт
/// примерно 470 знаков, округлено вниз с запасом. Для латиницы соотношение
/// втрое выгоднее, так что порог для неё щедрый.
///
/// Проверять приходится нам: whisper обрезает длинный промпт **молча** —
/// измерено, 1595 знаков превратились в 229 токенов без предупреждения и с
/// нулевым кодом возврата.
pub const DICTIONARY_MAX_CHARS: usize = 400;

/// Потолок истории. Кольцо, а не архив: двадцати хватает, чтобы вернуть
/// потерянное, и мало, чтобы файл разросся.
const MAX_HISTORY: u8 = 100;

impl Default for Dictation {
    fn default() -> Self {
        Self {
            enabled: false,
            hotkey: "Option+Space".into(),
            model: "small".into(),
            language: String::new(),
            dictionary: String::new(),
            delivery: "clipboard".into(),
            history_depth: 0,
        }
    }
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            language: "system".into(),
            theme: "system".into(),
            output_mode: "beside".into(),
            output_dir: None,
            notifications: true,
            ffmpeg_workers: 1,
            dictation: Dictation::default(),
        }
    }
}

/// Reads the settings file, or hands back defaults — for a first run, an
/// unreadable file, or one whose contents no longer parse. Never fails: there is
/// no useful way for an app to refuse to start over a preferences file, and the
/// next [`save`] rewrites it anyway.
///
/// Sanitizing here and not only in the IPC setter is what makes the guarantee
/// hold for a file the app did not write: an editor can put `ffmpeg_workers: 99`
/// in there, and the worker loop must still see 3.
pub fn load(dir: &Path) -> AppSettings {
    let Ok(text) = std::fs::read_to_string(dir.join(FILE)) else {
        return AppSettings::default();
    };
    sanitize(serde_json::from_str(&text).unwrap_or_default())
}

/// A scratch file name no other writer can pick: this process, a clock, and a
/// counter.
///
/// Three parts because each covers the others' blind spot — the pid tells two
/// processes apart, the counter two threads of one process (two clock reads can land
/// on the same nanosecond), and the clock a second run of a recycled pid whose
/// counter is back at zero.
fn scratch_name() -> String {
    use std::sync::atomic::{AtomicU64, Ordering};
    static SEQ: AtomicU64 = AtomicU64::new(0);
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    format!(
        "{FILE}.{}-{nanos}-{}.tmp",
        std::process::id(),
        SEQ.fetch_add(1, Ordering::Relaxed)
    )
}

/// Writes the settings file atomically: a scratch file of this save's own next to
/// the target, then a rename over it.
///
/// The rename is the point. A plain write truncates first, so a crash (or a
/// full disk) in the middle leaves a half file — which `load` would then read as
/// junk and answer with defaults, i.e. the user's settings silently reset. With
/// a rename the file on disk is either entirely the old settings or entirely the
/// new ones. `create_dir_all` covers the first run, where the app-data directory
/// may not exist yet.
///
/// The scratch *name* is the other half of it, and it used to be a constant. Two
/// overlapping saves then wrote the same scratch file, and what that costs is worse
/// than one of the two values losing: whichever bytes landed last are what the first
/// rename carries off, and the second rename finds nothing left to rename — so a
/// save can report failure for the value that ended up on disk and success for the
/// value that did not. `settings_set` holds a mutex across its own save, but a
/// second process running the same app is not inside that lock, and neither is any
/// future caller of this function. A unique name makes each save's scratch file its
/// own, so every interleaving ends with one whole value on disk.
///
/// The one thing a unique name gives up: a hard kill between the write and the
/// rename leaves a scratch file that no later save reuses (every ordinary failure
/// still cleans up after itself below). It is a few hundred bytes in the app-data
/// directory, next to the `.part` files the models sweep exists for.
pub fn save(dir: &Path, s: &AppSettings) -> Result<(), String> {
    std::fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    let text = serde_json::to_string_pretty(s).map_err(|e| e.to_string())?;
    let tmp = dir.join(scratch_name());
    std::fs::write(&tmp, text).map_err(|e| {
        // Half a scratch file (a full disk) is as much litter as a whole one.
        let _ = std::fs::remove_file(&tmp);
        e.to_string()
    })?;
    std::fs::rename(&tmp, dir.join(FILE)).map_err(|e| {
        // A failed rename would otherwise leave the scratch file lying next to
        // the real one for good — nothing else ever looks at it again.
        let _ = std::fs::remove_file(&tmp);
        e.to_string()
    })
}

/// `v` when it is one of `allowed`, the fallback otherwise.
fn one_of(v: String, allowed: &[&str], fallback: &str) -> String {
    if allowed.contains(&v.as_str()) {
        v
    } else {
        fallback.into()
    }
}

/// Forces a settings value into the documented sets: unknown enum strings become
/// their default, the worker count is clamped, and "fixed output" without a
/// folder is demoted to "beside".
///
/// That last rule is the one with teeth: `output_mode: "fixed"` with no
/// `output_dir` is not a configuration but a half-made choice, and left standing
/// it would fail every single job at enqueue. The UI upholds the same rule from
/// the other side — picking "fixed" opens the folder dialog and commits nothing
/// if it is cancelled — so the two never disagree about what the radio shows.
pub fn sanitize(mut s: AppSettings) -> AppSettings {
    // Тот же список, что в src/lib/i18n.tsx. Незнакомое значение
    // (правка settings.json руками, откат на старую сборку) — «system».
    s.language = one_of(
        s.language,
        &[
            "system", "en", "ru", "es", "pt", "fr", "de", "pl", "it", "ar", "zh",
        ],
        "system",
    );
    s.theme = one_of(s.theme, &["system", "light", "dark"], "system");
    s.output_mode = one_of(s.output_mode, &["beside", "fixed"], "beside");
    if s.output_mode == "fixed" && s.output_dir.as_deref().unwrap_or("").is_empty() {
        s.output_mode = "beside".into();
    }
    s.ffmpeg_workers = s.ffmpeg_workers.clamp(1, MAX_WORKERS);
    s.dictation = sanitize_dictation(s.dictation);
    s
}

/// Чинит блок диктовки, отредактированный руками.
///
/// В волне 5.1 экрана настроек нет, и файл правится в текстовом редакторе —
/// то есть это единственное место, где мусор перехватывается. Пустой хоткей
/// при включённой диктовке страшнее прочего: регистрировать нечего, и фича
/// молча не работала бы.
fn sanitize_dictation(mut d: Dictation) -> Dictation {
    if d.hotkey.trim().is_empty() {
        d.hotkey = Dictation::default().hotkey;
    }
    // Неизвестная модель — к значению по умолчанию: список тот же, что в
    // core/models.rs, и промах здесь означал бы «модель не скачана» на ровном
    // месте.
    d.model = one_of(
        d.model,
        &["tiny", "base", "small", "large-v3-turbo"],
        "small",
    );
    // «paste» — вставка через синтетический Cmd+V — снят: он ронял приложение,
    // а печать доставляет текст туда же и не затирает буфер. Старое значение
    // переводим в «type», а не в «clipboard»: человек просил текст в поле, и
    // именно это он получит.
    if d.delivery == "paste" {
        d.delivery = "type".into();
    }
    d.delivery = one_of(d.delivery, &["clipboard", "type"], "clipboard");
    // Словарь режем по знакам — токенизатора модели здесь нет, а whisper
    // лишнее отрежет сам и молча. Режем по границе символа, а не байта:
    // кириллица многобайтовая, и обрезанный посередине символ дал бы битый
    // UTF-8 в аргументе командной строки.
    if d.dictionary.chars().count() > DICTIONARY_MAX_CHARS {
        d.dictionary = d.dictionary.chars().take(DICTIONARY_MAX_CHARS).collect();
    }
    d.history_depth = d.history_depth.min(MAX_HISTORY);
    d
}

/// The directory finished files go into: `None` means "next to the input", which
/// is `Queue::plan_unique`'s own default.
///
/// A configured folder that is not there any more (deleted, or on a volume that
/// has been ejected) is an `Err` on purpose. The two alternatives are both
/// worse: creating it would happily materialise a lookalike directory at an
/// unmounted volume's mount point on the boot disk, and falling back to "beside"
/// would scatter output next to the inputs while the Settings screen kept
/// claiming a folder that no longer exists.
pub fn output_base(s: &AppSettings) -> Result<Option<PathBuf>, String> {
    if s.output_mode != "fixed" {
        return Ok(None);
    }
    // Unreachable through `sanitize`, which demotes the mode instead; treated as
    // "beside" rather than as an error so a future caller cannot turn a missing
    // folder setting into a queue that refuses everything.
    let Some(dir) = s.output_dir.as_ref().map(PathBuf::from) else {
        return Ok(None);
    };
    if !dir.is_dir() {
        return Err(format!(
            "output folder {} is not there any more — pick another one in Settings",
            dir.display()
        ));
    }
    Ok(Some(dir))
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A settings file the app never wrote: the shape a user's own edit takes.
    fn write(dir: &Path, json: &str) {
        std::fs::write(dir.join("settings.json"), json).unwrap();
    }

    #[test]
    fn dictation_is_off_by_default() {
        let d = AppSettings::default().dictation;
        assert!(!d.enabled, "диктовка обязана быть выключена по умолчанию");
        assert_eq!(
            d.model, "small",
            "модель по умолчанию — та же, что у рецептов"
        );
        assert_eq!(d.delivery, "clipboard");
        assert_eq!(d.history_depth, 0, "история по умолчанию не пишется");
    }

    /// Файл настроек прежней версии не содержит блока диктовки вовсе —
    /// он обязан прочитаться без миграции.
    #[test]
    fn settings_file_without_dictation_still_loads() {
        let dir = tempfile::tempdir().unwrap();
        write(
            dir.path(),
            r#"{"language":"ru","theme":"dark","output_mode":"beside","notifications":true,"ffmpeg_workers":2}"#,
        );
        let s = load(dir.path());
        assert_eq!(s.language, "ru");
        assert_eq!(s.ffmpeg_workers, 2);
        assert_eq!(s.dictation, Dictation::default());
    }

    #[test]
    fn sanitize_repairs_hand_edited_dictation() {
        let mut s = AppSettings::default();
        s.dictation.hotkey = "   ".into();
        s.dictation.model = "gigantic".into();
        s.dictation.delivery = "телепатия".into();
        s.dictation.history_depth = 250;
        let s = sanitize(s);
        assert_eq!(s.dictation.hotkey, "Option+Space", "пустой хоткей чинится");
        assert_eq!(s.dictation.model, "small", "неизвестная модель чинится");
        assert_eq!(
            s.dictation.delivery, "clipboard",
            "неизвестный способ доставки чинится к буферу"
        );
        assert_eq!(s.dictation.history_depth, 100);
    }

    /// Длинный словарь режется по границе символа, а не байта: обрезанная
    /// посередине кириллица дала бы битый UTF-8 в аргументе whisper.
    /// Печать — допустимое значение: разрешение проверяется в момент попытки,
    /// а не отсекается здесь.
    #[test]
    fn type_delivery_is_accepted() {
        let mut s = AppSettings::default();
        s.dictation.delivery = "type".into();
        let s = sanitize(s);
        assert_eq!(s.dictation.delivery, "type");
    }

    /// Файл с уже снятым «paste» переводится в печать, а не сбрасывается в
    /// буфер: человек просил текст в поле, и именно это он получит.
    #[test]
    fn removed_paste_delivery_becomes_typing() {
        let mut s = AppSettings::default();
        s.dictation.delivery = "paste".into();
        let s = sanitize(s);
        assert_eq!(s.dictation.delivery, "type");
    }

    #[test]
    fn long_dictionary_is_trimmed_on_char_boundary() {
        let mut s = AppSettings::default();
        s.dictation.dictionary = "щ".repeat(DICTIONARY_MAX_CHARS + 120);
        let s = sanitize(s);
        assert_eq!(s.dictation.dictionary.chars().count(), DICTIONARY_MAX_CHARS);
        assert!(s.dictation.dictionary.chars().all(|c| c == 'щ'));
    }

    #[test]
    fn short_dictionary_is_untouched() {
        let mut s = AppSettings::default();
        let dict = "MediaChef, хоткей, whisper, ffmpeg";
        s.dictation.dictionary = dict.into();
        let s = sanitize(s);
        assert_eq!(s.dictation.dictionary, dict);
    }

    /// Every scratch file left in `dir`. The name carries a pid and a clock, so the
    /// tests ask for the pattern rather than for one path.
    fn scratch_files(dir: &Path) -> Vec<String> {
        std::fs::read_dir(dir)
            .unwrap()
            .flatten()
            .map(|e| e.file_name().to_string_lossy().into_owned())
            .filter(|n| n.ends_with(".tmp"))
            .collect()
    }

    /// The whole point of the store: what the user picked is still picked after a
    /// restart. Plus the two things the atomic write owes: it creates the app-data
    /// directory on a first run, and it leaves no scratch file behind.
    #[test]
    fn saved_settings_survive_a_restart() {
        let d = tempfile::tempdir().unwrap();
        let dir = d.path().join("app-data-that-does-not-exist-yet");
        // A first run has no file at all — defaults, not an error.
        assert_eq!(load(&dir), AppSettings::default());

        let s = AppSettings {
            language: "ru".into(),
            theme: "dark".into(),
            output_mode: "fixed".into(),
            output_dir: Some(d.path().display().to_string()),
            notifications: false,
            ffmpeg_workers: 3,
            ..Default::default()
        };
        save(&dir, &s).unwrap();
        assert_eq!(load(&dir), s, "a restart lost the user's choices");
        assert!(
            scratch_files(&dir).is_empty(),
            "the atomic write left its scratch file behind: {:?}",
            scratch_files(&dir)
        );
    }

    /// Overlapping saves, which is what the unique scratch name is for. With one
    /// shared `settings.json.tmp` the rename of whoever got there second had nothing
    /// left to rename, so a save reported failure for a value that had in fact landed
    /// on disk — and the file could hold bytes from a write that reported success.
    ///
    /// What must hold with a name per save: every one of them succeeds, the file is
    /// *one whole value* rather than a mixture of several, and no scratch file is left
    /// behind. The payloads differ wildly in length on purpose — a garbled file is
    /// only visible when the two candidates are not the same size.
    #[test]
    fn overlapping_saves_leave_one_whole_value() {
        let d = tempfile::tempdir().unwrap();
        let dir = d.path();
        // Distinct, and deliberately of very different sizes: `beside` with no folder
        // against a fixed folder whose path is hundreds of characters long.
        let values: Vec<AppSettings> = (0..12)
            .map(|i| AppSettings {
                language: if i % 2 == 0 { "ru" } else { "en" }.into(),
                theme: "dark".into(),
                output_mode: "fixed".into(),
                output_dir: Some(format!("/tmp/{}", "d".repeat(1 + i * 40))),
                notifications: i % 3 == 0,
                ffmpeg_workers: 1 + (i % 3) as u8,
                ..Default::default()
            })
            .collect();

        std::thread::scope(|scope| {
            for v in &values {
                scope.spawn(move || save(dir, v).expect("a rival save must not fail"));
            }
        });

        let stored = load(dir);
        assert!(
            values.contains(&stored),
            "the file is a mixture of two saves, not one of them: {stored:?}"
        );
        assert!(
            scratch_files(dir).is_empty(),
            "scratch files left behind: {:?}",
            scratch_files(dir)
        );
    }

    /// Half a file (a kill mid-write on some future non-atomic path), an unknown
    /// key from a newer build, or plain nonsense: none of it may keep the app from
    /// starting, and the answer is always the defaults.
    #[test]
    fn broken_json_falls_back_to_defaults() {
        let d = tempfile::tempdir().unwrap();
        for junk in [
            "{\"language\": \"ru\"",
            "",
            "null",
            "{\"from_the_future\": 1}",
        ] {
            write(d.path(), junk);
            assert_eq!(load(d.path()), AppSettings::default(), "junk: {junk:?}");
        }
        // …while a *partial* object is not junk: every missing field is a default,
        // which is what lets a new setting ship without invalidating old files.
        write(d.path(), "{\"theme\": \"light\"}");
        assert_eq!(
            load(d.path()),
            AppSettings {
                theme: "light".into(),
                ..AppSettings::default()
            }
        );
    }

    /// `sanitize` is the border guard: everything that reaches the app's state
    /// passes through it, so no value outside the documented sets can ever reach
    /// the worker loop or the theme attribute.
    #[test]
    fn sanitize_clamps_garbage_and_keeps_valid_values() {
        let junk = AppSettings {
            language: "xx".into(),
            theme: "neon".into(),
            output_mode: "wherever".into(),
            output_dir: None,
            notifications: true,
            ffmpeg_workers: 9,
            ..Default::default()
        };
        let s = sanitize(junk);
        assert_eq!(s.language, "system");
        assert_eq!(s.theme, "system");
        assert_eq!(s.output_mode, "beside");
        assert_eq!(s.ffmpeg_workers, 3, "9 workers would fork-bomb the machine");
        // Zero workers is the worse half of the same bug: a queue nothing drains.
        assert_eq!(
            sanitize(AppSettings {
                ffmpeg_workers: 0,
                ..AppSettings::default()
            })
            .ffmpeg_workers,
            1
        );

        // "fixed" with nowhere to put the files is not a mode, it is a half-made
        // choice — the one that would otherwise fail every job at enqueue.
        let half = sanitize(AppSettings {
            output_mode: "fixed".into(),
            output_dir: None,
            ..AppSettings::default()
        });
        assert_eq!(half.output_mode, "beside");

        // And a legitimate configuration passes through untouched.
        let good = AppSettings {
            language: "en".into(),
            theme: "light".into(),
            output_mode: "fixed".into(),
            output_dir: Some("/tmp".into()),
            notifications: false,
            ffmpeg_workers: 2,
            ..Default::default()
        };
        assert_eq!(sanitize(good.clone()), good);
    }

    /// A hand-edited file goes through the same guard: `load` sanitizes, so the
    /// worker loop below cannot be handed `ffmpeg_workers: 99` by a text editor.
    #[test]
    fn load_sanitizes_a_hand_edited_file() {
        let d = tempfile::tempdir().unwrap();
        write(
            d.path(),
            r#"{"language": "xx", "theme": "dark", "ffmpeg_workers": 99}"#,
        );
        let s = load(d.path());
        assert_eq!(s.ffmpeg_workers, 3);
        assert_eq!(s.language, "system");
        assert_eq!(s.theme, "dark", "a valid neighbour must not be reset too");
    }

    /// Where finished files land. `beside` is the absence of a base directory —
    /// the queue's own "next to the input" — and a fixed folder that has gone
    /// away (ejected volume, deleted directory) is an error the user can act on,
    /// never a silent fallback that scatters output next to the inputs.
    #[test]
    fn output_base_follows_the_mode_and_refuses_a_missing_folder() {
        let d = tempfile::tempdir().unwrap();
        assert_eq!(output_base(&AppSettings::default()).unwrap(), None);

        let fixed = AppSettings {
            output_mode: "fixed".into(),
            output_dir: Some(d.path().display().to_string()),
            ..AppSettings::default()
        };
        assert_eq!(output_base(&fixed).unwrap(), Some(d.path().to_path_buf()));

        let gone = AppSettings {
            output_dir: Some(d.path().join("ejected").display().to_string()),
            ..fixed
        };
        let err = output_base(&gone).unwrap_err();
        assert!(
            err.contains("ejected"),
            "the error must name the folder: {err}"
        );
    }
}
