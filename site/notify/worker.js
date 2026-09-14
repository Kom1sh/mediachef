// Письмо о новом сообщении из формы обратной связи.
//
// Зачем: до этого воркера сообщения только ложились в D1, и увидеть их можно
// было одной командой `npm run feedback` — если про неё вспомнить. Первое
// сообщение от живого человека могло пролежать неделю.
//
// Вызывается только сайтом через service binding (см. wrangler.toml рядом).
// Принимает JSON с полями записи и отправляет простое текстовое письмо на адрес
// из секрета NOTIFY_TO. Сама запись уже в базе к этому моменту: письмо —
// уведомление, а не хранилище, и его потеря ничего не теряет.

import { EmailMessage } from "cloudflare:email";

// Отправитель обязан быть на домене с включённым Email Routing.
const FROM = "feedback@mediachef.app";

export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("method not allowed", { status: 405 });
    if (!env.NOTIFY_TO) return new Response("NOTIFY_TO is not set", { status: 503 });

    let item;
    try {
      item = await request.json();
    } catch {
      return new Response("bad json", { status: 400 });
    }

    const raw = mime({ to: env.NOTIFY_TO, ...letter(item) });
    try {
      await env.MAIL.send(new EmailMessage(FROM, env.NOTIFY_TO, raw));
    } catch (e) {
      console.error("notify: письмо не ушло:", e?.message || String(e));
      return new Response("send failed", { status: 502 });
    }
    return new Response("sent");
  },
};

/** Тема, текст и адрес для ответа из полей записи. */
export function letter(item) {
  const kind = item.kind === "idea" ? "идея" : "что-то не работает";
  const bits = [item.locale, item.version, item.platform].filter(Boolean).join(" · ");
  const subject = `MediaChef: ${kind}${bits ? ` (${bits})` : ""}`;

  const rows = [
    ["Тип", kind],
    ["Язык", item.locale],
    ["Версия", item.version],
    ["Система", item.platform],
    ["Откуда", item.context],
    ["Контакт", item.contact],
  ].filter(([, v]) => v);

  const text = [
    "Новое сообщение через форму на mediachef.app.",
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    "——————————",
    String(item.message || ""),
    "——————————",
    "",
    "Все сообщения: cd ~/Documents/Claude/mediachef/site && npm run feedback",
  ].join("\n");

  return { subject, text, replyTo: emailOrNull(item.contact) };
}

/**
 * Адрес для ответа — только если контакт действительно похож на почту.
 *
 * Строгая проверка здесь не педантизм: значение уходит в заголовок письма, а
 * контакт пишет кто угодно. Перевод строки в нём дописал бы свои заголовки.
 */
export function emailOrNull(contact) {
  const s = String(contact || "").trim();
  return /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,190}\.[A-Za-z]{2,24}$/.test(s) ? s : null;
}

/** Минимальное письмо в MIME: UTF-8, тема и тело в base64. */
export function mime({ to, subject, text, replyTo }) {
  const headers = [
    `From: MediaChef feedback <${FROM}>`,
    `To: <${to}>`,
    `Subject: =?UTF-8?B?${b64(subject)}?=`,
    `Date: ${new Date().toUTCString().replace("GMT", "+0000")}`,
    `Message-ID: <${crypto.randomUUID()}@mediachef.app>`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: base64",
  ];
  if (replyTo) headers.push(`Reply-To: <${replyTo}>`);
  const body = b64(text).replace(/.{1,76}/g, "$&\r\n");
  return headers.join("\r\n") + "\r\n\r\n" + body;
}

/** base64 от UTF-8, без `String.fromCharCode(...bytes)`: длинное тело переполнило бы стек. */
function b64(s) {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
