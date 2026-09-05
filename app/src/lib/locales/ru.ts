// Словарь интерфейса, локаль «ru». Набор ключей задаёт английский файл —
// он эталон; остальные типизированы по нему, поэтому забытый ключ не соберётся.
import type { Dict } from "./en";

export const dict: Dict = {
  appName: "MediaChef",
  navSections: "Разделы",
  navConvert: "Конвертация",
  navModels: "Модели",
  navSettings: "Настройки",

  dropHint: "Перетащите файлы сюда — или нажмите, чтобы выбрать",
  dropSub: "MP4, MKV, MOV, MP3, WAV, SRT и другие",
  searchPlaceholder: "Поиск: «видео в мп3», «make gif»…",
  nothingFound: "Ничего не нашлось",
  clearSearch: "Очистить поиск",
  popular: "Популярное",
  // «Что готовим?» — вопрос, а не заголовок раздела: экран пустой, и первое слово
  // приложения должно приглашать, а не описывать.
  emptyTitle: "Что готовим?",
  emptySub: "Положите файл на доску и выберите рецепт.",

  clearNamed: "Убрать {name}",
  durationNamed: "Длительность: {time}",
  unitKB: "КБ",
  unitMB: "МБ",
  unitGB: "ГБ",
  mt_video: "видео",
  mt_audio: "аудио",
  mt_image: "изображение",
  mt_subtitle: "субтитры",
  mt_any: "любой",

  advanced: "Дополнительно",
  close: "Закрыть",
  addToQueue: "В очередь",
  adding: "Добавляю…",
  addingN: "Добавляю {n}…",
  addAllN: "Добавить все файлы ({n})",
  retryOne: "Повторить",
  retryN: "Повторить ({n})",
  clickToCopy: "Нажмите, чтобы скопировать",
  clickToCopyPreview: "Нажмите, чтобы скопировать — команда только для наглядности, в таком виде она не запустится",
  copied: "Скопировано в буфер обмена",
  previewOnly: "# только для наглядности — очередь сначала готовит WAV 16 кГц, поэтому в таком виде команда не запустится",
  // "Получаю список", not "Загружаю": next to a «Скачать» button, "загружаю"
  // reads as *downloading a model* rather than as fetching the list of them.
  loadingModels: "Получаю список моделей…",
  openModels: "Открыть «Модели»",
  downloadModelPrompt: "Скачать модель → «Модели»",

  queue: "Очередь",
  // «Активных: 2», not «2 активных» — the counted noun stays out of agreement
  // position, so one form works for 1, 2 and 5 (i18n rule 3).
  activeN: "Активных: {n}",
  queueEmpty: "Здесь появятся задачи.",
  st_queued: "в очереди",
  st_running: "выполняется",
  st_done: "готово",
  st_error: "ошибка",
  st_cancelled: "отменено",
  cancel: "Отменить",
  // «Ход задачи», а не «Прогресс задачи»: по-русски о выполняющемся процессе
  // говорят «ход», и слово согласуется с `st_running` — «выполняется».
  jobProgressNamed: "Ход задачи: {name}",
  etaLeft: "осталось ~{time}",
  showInFinder: "Показать в Finder",
  copyLog: "Скопировать лог",
  failed: "Не удалось",
  notifyDone: "Готово: {name}",

  modelsTitle: "Модели Whisper",
  modelsBlurb: "Расшифровка идёт на вашем компьютере. Модель скачивается один раз.",
  download: "Скачать",
  deleteModel: "Удалить",
  // «Загрузки» здесь — скачивание модели, тем же словом, что и `cancelDownload`.
  downloadProgressNamed: "Ход загрузки: {name}",
  cancelling: "Отмена…",
  cancelDownload: "Отменить загрузку",
  // «При следующем обращении к сети», а не «на следующем чтении из сети»: второе —
  // калька с английского read, по-русски так о загрузке не говорят.
  cancelHint: "Отмена применится при следующем обращении к сети — на зависшем соединении это может занять до 30 с.",
  // «Не обнаружена», а не «не распознана»: распознать не удалось бы плохую запись,
  // а здесь речи в файле нет вовсе — и это не ошибка пользователя.
  noSpeech: "Речь в файле не обнаружена",

  loadingSettings: "Загружаю настройки…",
  optSystem: "Как в системе",
  themeLight: "Светлая",
  themeDark: "Тёмная",
  setLanguage: "Язык",
  setLanguageHint: "«Как в системе» — язык вашей ОС.",
  setTheme: "Тема",
  setThemeHint: "Применяется сразу.",
  setOutput: "Папка для результатов",
  setOutputHint: "Куда складывать готовые файлы.",
  outBeside: "Рядом с исходным",
  outFixed: "Выбранная папка",
  change: "Изменить…",
  setNotifications: "Уведомления",
  setNotificationsHint: "Уведомление на рабочем столе, когда задача готова.",
  setDictation: "Диктовка",
  setDictationHint: "Нажмите хоткей где угодно, говорите, нажмите ещё раз — текст окажется в буфере обмена.",
  setDictationKey: "Хоткей диктовки",
  setDictationKeyHint: "Перехватывается на весь компьютер, поэтому Cmd с буквой сломал бы это сочетание во всех приложениях.",
  setDictationDelivery: "Куда попадает текст",
  setDictationDeliveryHint: "Для вставки нужен «Универсальный доступ»; без него текст всё равно окажется в буфере.",
  optDeliveryClipboard: "В буфер",
  optDeliveryType: "Печатать",
  setWorkers: "Параллельные конвертации",
  // «Сколько задач … выполняется», singular: "сколько" + genitive plural takes a
  // singular predicate. "Выполняется" is also the word st_running uses for a job
  // that is running, so the setting and the queue name the same thing the same way.
  setWorkersHint: "Сколько задач ffmpeg выполняется одновременно. Применится после перезапуска.",

  setUpdates: "Обновления",
  setUpdatesHint: "Установлена версия {version}.",
  setUpdatesHintPlain: "Проверить, не вышла ли новая версия.",
  updCheck: "Проверить",
  updChecking: "Проверяем…",
  updCurrent: "Это последняя версия.",
  updFound: "Вышла версия {version}.",
  updInstall: "Обновить",
  updDownloading: "Скачиваем обновление…",
  updDownloadingPct: "Скачиваем обновление — {percent}%",
  updReady: "Обновление установлено. Перезапустите, чтобы завершить.",
  updRestart: "Перезапустить",
  updLater: "Позже",
  updFailed: "Не удалось проверить: {reason}",
  updManual: "Эта копия поставлена через пакетный менеджер — обновляйте её тем же способом.",

  setFeedback: "Обратная связь",
  setFeedbackHint: "Напишет на {email}, версия и система уже подставлены. Отсюда ничего не отправляется.",
  fbBug: "Что-то не работает",
  fbIdea: "Предложить",

  "cat_convert-video": "Конвертация видео",
  "cat_convert-audio": "Конвертация аудио",
  cat_extract: "Извлечение",
  cat_compress: "Сжатие",
  cat_cut: "Обрезка",
  cat_geometry: "Размер",
  cat_gif: "GIF",
  "cat_audio-in-video": "Звук в видео",
  "cat_mux-subs": "Субтитры",
  cat_speed: "Скорость",
  cat_transcribe: "Расшифровка",
  cat_translate: "Перевод",
  cat_advanced: "Для продвинутых",
};
