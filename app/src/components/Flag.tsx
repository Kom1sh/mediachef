/**
 * Флажки для переключателя языка — те же, что на сайте (site/src/components/Flag.astro).
 *
 * Рисуем SVG, а не эмодзи: флаговые эмодзи Windows не показывает вообще, и
 * вместо флага у половины пользователей были бы две буквы кода страны.
 * Внешний `svg` сам обрезает всё, что вылезло за viewBox, поэтому диагонали
 * британского флага рисуются штрихами без clipPath — и без коллизий id, когда
 * на экране десять флагов сразу.
 *
 * Флаг у языка, а не у страны, — упрощение: у испанского, португальского,
 * французского, немецкого и арабского носителей стран много. Берём тот,
 * который в переключателях языков читается привычнее всего.
 */
const BOX = {
  viewBox: "0 0 60 40",
  width: 17,
  height: 12,
  "aria-hidden": true as const,
  className: "shrink-0 rounded-[2px]",
};

export function Flag({ code }: { code: string }) {
  switch (code) {
    case "gb":
      return (
        <svg {...BOX}>
          <rect width="60" height="40" fill="#012169" />
          <path d="M0 0 60 40M60 0 0 40" stroke="#fff" strokeWidth="8" />
          <path d="M0 0 60 40M60 0 0 40" stroke="#C8102E" strokeWidth="4" />
          <path d="M30 0V40M0 20H60" stroke="#fff" strokeWidth="13" />
          <path d="M30 0V40M0 20H60" stroke="#C8102E" strokeWidth="8" />
        </svg>
      );
    case "ru":
      return (
        <svg {...BOX}>
          <rect width="60" height="40" fill="#fff" />
          <rect y="13.33" width="60" height="13.34" fill="#0039A6" />
          <rect y="26.67" width="60" height="13.33" fill="#D52B1E" />
          <rect width="60" height="40" fill="none" stroke="rgba(0,0,0,.2)" strokeWidth="2" />
        </svg>
      );
    case "es":
      return (
        <svg {...BOX}>
          <rect width="60" height="40" fill="#AA151B" />
          <rect y="10" width="60" height="20" fill="#F1BF00" />
        </svg>
      );
    case "pt":
      return (
        <svg {...BOX}>
          <rect width="60" height="40" fill="#DA291C" />
          <rect width="24" height="40" fill="#046A38" />
          <circle cx="24" cy="20" r="7.5" fill="#FFE900" stroke="#046A38" strokeWidth="1.5" />
        </svg>
      );
    case "fr":
      return (
        <svg {...BOX}>
          <rect width="60" height="40" fill="#fff" />
          <rect width="20" height="40" fill="#002395" />
          <rect x="40" width="20" height="40" fill="#ED2939" />
          <rect width="60" height="40" fill="none" stroke="rgba(0,0,0,.15)" strokeWidth="2" />
        </svg>
      );
    case "de":
      return (
        <svg {...BOX}>
          <rect width="60" height="40" fill="#000" />
          <rect y="13.33" width="60" height="13.34" fill="#DD0000" />
          <rect y="26.67" width="60" height="13.33" fill="#FFCE00" />
        </svg>
      );
    case "pl":
      return (
        <svg {...BOX}>
          <rect width="60" height="40" fill="#fff" />
          <rect y="20" width="60" height="20" fill="#DC143C" />
          <rect width="60" height="40" fill="none" stroke="rgba(0,0,0,.2)" strokeWidth="2" />
        </svg>
      );
    case "it":
      return (
        <svg {...BOX}>
          <rect width="60" height="40" fill="#fff" />
          <rect width="20" height="40" fill="#008C45" />
          <rect x="40" width="20" height="40" fill="#CD212A" />
          <rect width="60" height="40" fill="none" stroke="rgba(0,0,0,.15)" strokeWidth="2" />
        </svg>
      );
    case "sa":
      return (
        <svg {...BOX}>
          <rect width="60" height="40" fill="#006C35" />
          <rect x="10" y="14" width="40" height="3.4" rx="1.7" fill="#fff" />
          <rect x="10" y="21" width="34" height="2.6" rx="1.3" fill="#fff" />
          <path d="M44 22.3 L50 22.3" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      );
    case "cn":
      return (
        <svg {...BOX}>
          <rect width="60" height="40" fill="#EE1C25" />
          <path d="m12 6 1.9 5.7H20l-4.8 3.5 1.8 5.7L12 17.4l-4.9 3.5 1.8-5.7L4 11.7h6.1z" fill="#FFDE00" />
          <circle cx="25" cy="6" r="1.8" fill="#FFDE00" />
          <circle cx="30" cy="11" r="1.8" fill="#FFDE00" />
          <circle cx="30" cy="18" r="1.8" fill="#FFDE00" />
          <circle cx="25" cy="23" r="1.8" fill="#FFDE00" />
        </svg>
      );
    default:
      return null;
  }
}
