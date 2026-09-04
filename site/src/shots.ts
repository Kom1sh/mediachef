// Скриншоты интерфейса приложения: по кадру на язык и тему.
//
// Раньше здесь была одна пара картинок, снятая с русского интерфейса, и она
// показывалась на всех десяти локалях. Для англоязычного посетителя это был
// прямой сигнал «программа не на вашем языке» — при том что она как раз на
// его языке и есть. Теперь у каждой локали свой кадр.
//
// Файлы генерируются, а не снимаются руками: `npm run shots` поднимает
// собранный фронтенд приложения в headless-браузере с подставленным Tauri IPC
// и делает двадцать кадров. Подробности и причины — в scripts/shoot-app.mjs.
//
// Импорты статические, по одному на файл: так Astro кладёт в имя хеш
// содержимого, и после пересъёмки браузеры не отдают старую картинку из кеша
// (в public/ этим уже обжигались — сутки max-age под неизменным именем).
import enLight from "./assets/app-main-en-light.png";
import enDark from "./assets/app-main-en-dark.png";
import ruLight from "./assets/app-main-ru-light.png";
import ruDark from "./assets/app-main-ru-dark.png";
import esLight from "./assets/app-main-es-light.png";
import esDark from "./assets/app-main-es-dark.png";
import ptLight from "./assets/app-main-pt-light.png";
import ptDark from "./assets/app-main-pt-dark.png";
import frLight from "./assets/app-main-fr-light.png";
import frDark from "./assets/app-main-fr-dark.png";
import deLight from "./assets/app-main-de-light.png";
import deDark from "./assets/app-main-de-dark.png";
import plLight from "./assets/app-main-pl-light.png";
import plDark from "./assets/app-main-pl-dark.png";
import itLight from "./assets/app-main-it-light.png";
import itDark from "./assets/app-main-it-dark.png";
import arLight from "./assets/app-main-ar-light.png";
import arDark from "./assets/app-main-ar-dark.png";
import zhLight from "./assets/app-main-zh-light.png";
import zhDark from "./assets/app-main-zh-dark.png";

import type { Locale } from "./content";

export interface Shot {
  light: string;
  dark: string;
  w: number;
  h: number;
}

const FILES = {
  en: { light: enLight, dark: enDark },
  ru: { light: ruLight, dark: ruDark },
  es: { light: esLight, dark: esDark },
  pt: { light: ptLight, dark: ptDark },
  fr: { light: frLight, dark: frDark },
  de: { light: deLight, dark: deDark },
  pl: { light: plLight, dark: plDark },
  it: { light: itLight, dark: itDark },
  ar: { light: arLight, dark: arDark },
  zh: { light: zhLight, dark: zhDark },
} as const;

/**
 * Кадр для локали. Размеры берём из самой картинки, а не константой: если
 * когда-нибудь изменится размер окна приложения, вёрстка не разъедется
 * с реальными пропорциями.
 */
export const SHOTS: Record<Locale, Shot> = Object.fromEntries(
  Object.entries(FILES).map(([locale, pair]) => [
    locale,
    { light: pair.light.src, dark: pair.dark.src, w: pair.light.width, h: pair.light.height },
  ]),
) as Record<Locale, Shot>;
