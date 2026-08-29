/**
 * Обновление приложения на месте.
 *
 * Зачем вообще: до этого установленная копия замерзала на той версии, которую
 * скачала. Человек ставил MediaChef один раз, а дальше жил со сборкой полугодовой
 * давности, потому что узнать о новой было неоткуда — и каждый релиз приходилось
 * продавать заново тем же людям.
 *
 * Две проверки, и они ведут себя по-разному:
 *
 *  - при старте — молча. Если сети нет, если приложение запущено из исходников,
 *    если оно поставлено из deb (апдейтер умеет только AppImage) — человек не
 *    должен видеть ошибку, о которой не просил. Молчание здесь и есть правильный
 *    ответ: ничего не сломалось, просто обновляться нечем или неоткуда.
 *  - по кнопке в настройках — вслух. Человек спросил, поэтому ответ он получает
 *    любой, включая «не вышло, вот почему».
 *
 * Подпись проверяет сам плагин: публичный ключ зашит в tauri.conf.json, приватный
 * лежит только в секретах CI. Пакет, подписанный чем-то другим, не установится.
 */
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export type UpdateState =
  | { kind: "idle" }
  | { kind: "checking" }
  /** Проверяли по кнопке, обновлений нет. */
  | { kind: "current" }
  | { kind: "found"; version: string; notes: string }
  /** `percent` — null, пока сервер не сказал размер: полоса тогда неопределённая. */
  | { kind: "downloading"; percent: number | null }
  /** Скачано и установлено, осталось перезапустить. */
  | { kind: "ready" }
  | { kind: "failed"; reason: string };

/**
 * Ищет обновление. Возвращает `null`, если его нет.
 *
 * Ошибки не глотает: решение о том, показывать их или нет, принимает вызывающий,
 * потому что оно зависит от того, спрашивал ли человек.
 */
export async function lookForUpdate(): Promise<Update | null> {
  return await check();
}

/**
 * Скачивает и ставит. `onProgress` получает долю от 0 до 1 либо null, если размер
 * неизвестен, — по нему рисуется полоса.
 *
 * Установка не перезапускает приложение: очередь может быть в работе, и решать,
 * когда её прервать, должен человек, а не апдейтер.
 */
export async function installUpdate(
  update: Update,
  onProgress: (fraction: number | null) => void,
): Promise<void> {
  let total = 0;
  let got = 0;
  await update.downloadAndInstall((event) => {
    switch (event.event) {
      case "Started":
        total = event.data.contentLength ?? 0;
        onProgress(total > 0 ? 0 : null);
        break;
      case "Progress":
        got += event.data.chunkLength;
        onProgress(total > 0 ? Math.min(got / total, 1) : null);
        break;
      case "Finished":
        onProgress(1);
        break;
    }
  });
}

export { relaunch };

/**
 * Человеческая причина отказа.
 *
 * Апдейтер отдаёт ошибку строкой, и у неё бывает ровно один случай, который стоит
 * объяснить отдельно: сборка поставлена не тем способом, который умеет обновляться
 * сама (deb, пакетный менеджер). Всё остальное — сеть или сервер, и там честнее
 * показать исходный текст, чем угадывать.
 */
export function isUnsupportedInstall(reason: string): boolean {
  const r = reason.toLowerCase();
  return r.includes("appimage") || r.includes("not supported") || r.includes("unsupported");
}
