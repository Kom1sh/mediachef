/**
 * Состояние обновления для интерфейса. Живёт в App и раздаётся вниз, потому что
 * его читают двое: полоса над рабочей областью и строка в настройках. Два
 * независимых хука разошлись бы — настройки показывали бы «актуальная версия»,
 * пока полоса зовёт перезапуститься.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import type { Update } from "@tauri-apps/plugin-updater";
import { installUpdate, lookForUpdate, relaunch, type UpdateState } from "./updater";

export interface Updater {
  state: UpdateState;
  /** Версия работающей сборки. Пустая строка, пока Tauri не ответил. */
  current: string;
  /** Проверка по кнопке: показывает и «всё актуально», и ошибку. */
  checkNow: () => void;
  /** Скачать и поставить найденное. */
  install: () => void;
  restart: () => void;
  /** Убрать полосу до конца сеанса. Само обновление остаётся в настройках. */
  dismiss: () => void;
  dismissed: boolean;
}

export function useUpdater(): Updater {
  const [state, setState] = useState<UpdateState>({ kind: "idle" });
  const [dismissed, setDismissed] = useState(false);
  // Версию спрашиваем у Tauri, а не читаем из package.json: сборка знает свою
  // настоящую, а файл в исходниках — ту, что была на момент коммита.
  const [current, setCurrent] = useState("");
  useEffect(() => { getVersion().then(setCurrent).catch(() => {}); }, []);
  // Найденное обновление держим здесь, а не в state: это дескриптор плагина, а не
  // данные для отрисовки, и React не должен пытаться его сравнивать.
  const found = useRef<Update | null>(null);
  // Проверка на старте — ровно одна. В React 19 в строгом режиме эффект вызывается
  // дважды, и без этого флага приложение стучалось бы на GitHub два раза за запуск.
  const probed = useRef(false);

  const run = useCallback(async (loud: boolean) => {
    if (loud) setState({ kind: "checking" });
    try {
      const update = await lookForUpdate();
      found.current = update;
      if (update) setState({ kind: "found", version: update.version, notes: update.body ?? "" });
      else if (loud) setState({ kind: "current" });
    } catch (e) {
      // Тихая проверка молчит про любую неудачу: нет сети, запуск из исходников,
      // установка из deb — ни об одном из этих случаев человек не спрашивал.
      if (loud) setState({ kind: "failed", reason: String(e) });
    }
  }, []);

  useEffect(() => {
    if (probed.current) return;
    probed.current = true;
    void run(false);
  }, [run]);

  const install = useCallback(() => {
    const update = found.current;
    if (!update) return;
    setState({ kind: "downloading", percent: null });
    void (async () => {
      try {
        await installUpdate(update, (fraction) =>
          setState({ kind: "downloading", percent: fraction }),
        );
        setState({ kind: "ready" });
      } catch (e) {
        setState({ kind: "failed", reason: String(e) });
      }
    })();
  }, []);

  return {
    state,
    current,
    checkNow: useCallback(() => void run(true), [run]),
    install,
    restart: useCallback(() => void relaunch(), []),
    dismiss: useCallback(() => setDismissed(true), []),
    dismissed,
  };
}
