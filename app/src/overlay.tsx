/**
 * Плашка со статусом диктовки — остров, вырастающий из монобровы.
 *
 * Отдельная точка входа, а не часть главного окна, и это не архитектурная
 * прихоть. Диктуют при закрытом окне MediaChef — в этом весь смысл фичи, —
 * поэтому показывать статус внутри главного окна было бы показом его тому,
 * кто на него не смотрит.
 *
 * ## Почему панель начинается от самого верха
 *
 * Первая попытка оставляла сверху прозрачный зазор под монобровь, и панель
 * висела ПОД ней отдельным прямоугольником — то есть выглядела ровно тем, чем
 * была: всплывшим окном.
 *
 * Приём обратный. Монобровь непрозрачна и всегда чёрная, поэтому её не
 * обходят, а поглощают: панель идёт от самого верха, чёрная и непрозрачная,
 * шире и выше монобровы. Граница исчезает, потому что оба чёрные, и монобровь
 * читается как часть панели. Так устроен Dynamic Island.
 *
 * Отсюда же требование к цвету: фон должен быть НЕПРОЗРАЧНЫМ чёрным. Любая
 * полупрозрачность или размытие проявили бы под панелью обои, а монобровь
 * осталась бы плотно-чёрной — и стык стал бы виден именно там, где его быть
 * не должно.
 */
import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { emit, listen } from "@tauri-apps/api/event";

type Phase = "listening" | "working" | "done";

interface Status {
  phase: Phase;
  /** Пиковый уровень 0..1. */
  level: number;
  /** Распознанное на сейчас; пустая строка, пока распознавать нечего. */
  text: string;
}

/** Размер окна — тот же, что в overlay.rs. */
const WIDTH = 460;
const HEIGHT = 132;
/** Габариты монобровы: из них вырастает остров. Тоже дублируются в overlay.rs. */
const NOTCH_WIDTH = 200;
const NOTCH_HEIGHT = 32;

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
            background: i < lit ? "#7dd3a0" : "rgba(255,255,255,0.22)",
            transition: "background 90ms linear",
          }}
        />
      ))}
    </div>
  );
}

function Overlay() {
  const [status, setStatus] = useState<Status>({ phase: "listening", level: 0, text: "" });
  // Рост из монобровы стартует не на монтировании, а по первому событию
  // статуса — первому свидетельству, что окно уже показано и живёт. Окно
  // строится невидимым, и анимация, запущенная на монтировании, могла бы
  // отыграть впустую до показа. Запасной таймер — на случай, если событий
  // нет: лучше остров без роста, чем остров размером с монобровь навсегда.
  const [grown, setGrown] = useState(false);
  const received = useRef(0);

  useEffect(() => {
    const stop = listen<Status>("dictation:status", e => {
      received.current += 1;
      setGrown(true);
      setStatus(e.payload);
    });
    const fallback = window.setTimeout(() => setGrown(true), 250);
    return () => {
      window.clearTimeout(fallback);
      stop.then(unlisten => unlisten());
    };
  }, []);

  // Самоотчёт плашки — одна строка в журнал диктовки на каждый показ: видит
  // ли WebKit страницу видимой, крутятся ли кадры, доходят ли события. Без
  // этого «в плашке ничего не происходит» разбиралось бы вслепую.
  useEffect(() => {
    const mounted = performance.now();
    let frames = 0;
    let raf = 0;
    const tick = () => {
      frames += 1;
      if (performance.now() - mounted < 1000) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const report = window.setTimeout(() => {
      emit("dictation:overlay-probe", {
        visibility: document.visibilityState,
        frames,
        events: received.current,
        sinceMountMs: Math.round(performance.now() - mounted),
      }).catch(() => {});
    }, 1200);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(report);
    };
  }, []);

  return (
    <div style={{ height: "100vh", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: "100%",
          height: HEIGHT,
          // Непрозрачный чёрный, тот же, что у монобровы. Ни прозрачности, ни
          // размытия: они проявили бы обои и обозначили стык.
          background: "#000",
          // Скругление только снизу: сверху панель продолжает монобровь, и
          // скруглять там нечего — там край экрана.
          borderRadius: `0 0 ${NOTCH_HEIGHT / 2}px ${NOTCH_HEIGHT / 2}px`,
          color: "#fafafa",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
          padding: `${NOTCH_HEIGHT + 6}px 18px 12px`,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          // Рост из монобровы: первый кадр совпадает с ней по размеру и форме,
          // поэтому старта не видно — видно только, как она раздаётся. До
          // сигнала «выросли» панель стоит сжатой до монобровы.
          transformOrigin: "top center",
          transform: grown ? undefined : `scale(${NOTCH_WIDTH / WIDTH}, ${NOTCH_HEIGHT / HEIGHT})`,
          animation: grown ? "mc-grow 320ms cubic-bezier(0.22, 1, 0.36, 1) both" : "none",
        }}
      >
        {/* Содержимое проявляется после того, как остров вырос: во время
            растяжения оно было бы сплющено вместе с панелью. */}
        <div
          style={{
            opacity: grown ? undefined : 0,
            animation: grown ? "mc-fade 200ms ease 200ms both" : "none",
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
              marginTop: 6,
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
      </div>
      <style>{`
        @keyframes mc-pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.25 } }
        @keyframes mc-fade  { from { opacity: 0 } to { opacity: 1 } }
        /* Старт — ровно габариты монобровы, поэтому первый кадр от неё
           неотличим. Дальше остров раздаётся вширь и вниз. */
        @keyframes mc-grow {
          from {
            transform: scale(${NOTCH_WIDTH / WIDTH}, ${NOTCH_HEIGHT / HEIGHT});
            border-radius: 0 0 ${NOTCH_HEIGHT / 2}px ${NOTCH_HEIGHT / 2}px;
          }
          to { transform: scale(1, 1) }
        }
        /* Уважаем системную настройку «уменьшить движение»: плашка нужна,
           чтобы показать статус, а не чтобы двигаться. */
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; animation-delay: 0ms !important }
        }
      `}</style>
    </div>
  );
}

createRoot(document.getElementById("overlay-root")!).render(
  <StrictMode>
    <Overlay />
  </StrictMode>,
);
