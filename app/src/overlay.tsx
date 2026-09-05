/**
 * Плашка со статусом диктовки: та, что выезжает из-под монобровы.
 *
 * Отдельная точка входа, а не часть главного окна, и это не архитектурная
 * прихоть. Диктуют при закрытом окне MediaChef — в этом весь смысл фичи, —
 * поэтому показывать статус внутри главного окна было бы показом его тому,
 * кто на него не смотрит.
 *
 * Стили здесь свои, без Tailwind: плашка — единственное место в приложении,
 * которое рисуется поверх чужих окон и обязано выглядеть одинаково независимо
 * от темы системы и от того, что под ней. Тянуть сюда токены темы значило бы
 * привязать её внешний вид к настройкам, до которых ей нет дела.
 */
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { listen } from "@tauri-apps/api/event";

type Phase = "listening" | "working" | "done";

interface Status {
  phase: Phase;
  /** Пиковый уровень 0..1. */
  level: number;
  /** Распознанное на сейчас; пустая строка, пока распознавать нечего. */
  text: string;
}

/** Подписи фаз. Коротко: плашка читается боковым зрением, а не изучается. */
const CAPTION: Record<Phase, string> = {
  listening: "Слушаю",
  working: "Расшифровываю",
  done: "Готово",
};

/**
 * Полоска уровня из восьми делений.
 *
 * Дискретная, а не плавная: сплошная полоска на тихой речи выглядит
 * неподвижной, и человек решает, что микрофон не слышит. Деления заметно
 * дёргаются даже на шёпоте — а вопрос, на который отвечает эта полоска,
 * ровно один: «меня вообще слышно?».
 */
function Meter({ level }: { level: number }) {
  const bars = 8;
  // Корень сжимает динамический диапазон: обычная речь даёт пик около 0,2,
  // и без него горело бы полтора деления из восьми.
  const lit = Math.round(Math.sqrt(Math.max(0, Math.min(1, level))) * bars);
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 14 }}>
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          style={{
            width: 3,
            height: 6 + i,
            borderRadius: 2,
            background: i < lit ? "#7dd3a0" : "rgba(255,255,255,0.18)",
            transition: "background 90ms linear",
          }}
        />
      ))}
    </div>
  );
}

function Overlay() {
  const [status, setStatus] = useState<Status>({ phase: "listening", level: 0, text: "" });

  useEffect(() => {
    const stop = listen<Status>("dictation:status", e => setStatus(e.payload));
    return () => {
      stop.then(unlisten => unlisten());
    };
  }, []);

  return (
    <div
      style={{
        // Верхние 38 точек — прозрачный зазор под монобровь. Панель начинается
        // под ней и выглядит выросшей из неё.
        paddingTop: 38,
        height: "100vh",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          background: "rgba(24,24,27,0.92)",
          // Скругление только снизу: сверху панель «продолжает» монобровь.
          borderRadius: "0 0 18px 18px",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          color: "#fafafa",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
          padding: "10px 16px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          boxShadow: "0 8px 24px rgba(0,0,0,0.28)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: status.phase === "listening" ? "#f87171" : "#7dd3a0",
              // Пульсация только на записи: во время расшифровки мигающая
              // точка обещала бы, что микрофон всё ещё слушает.
              animation: status.phase === "listening" ? "mc-pulse 1.2s infinite" : "none",
            }}
          />
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.2 }}>
            {CAPTION[status.phase]}
          </span>
          <span style={{ marginLeft: "auto" }}>
            {status.phase === "listening" ? <Meter level={status.level} /> : null}
          </span>
        </div>

        <div
          style={{
            fontSize: 13,
            lineHeight: 1.35,
            // Три строки максимум: плашка показывает, что вас слышат, а не
            // заменяет поле ввода. Длинная речь уезжает за многоточие.
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: 34,
            color: status.text ? "#fafafa" : "rgba(250,250,250,0.45)",
          }}
        >
          {status.text || (status.phase === "listening" ? "Говорите…" : "")}
        </div>
      </div>
      <style>{`@keyframes mc-pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.25 } }`}</style>
    </div>
  );
}

createRoot(document.getElementById("overlay-root")!).render(
  <StrictMode>
    <Overlay />
  </StrictMode>,
);
