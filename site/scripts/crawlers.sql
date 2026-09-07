-- Схема журнала заходов роботов. Применяется руками, один раз:
--   npx wrangler d1 execute mediachef-crawlers --remote --file=scripts/crawlers.sql
-- Повторный прогон безопасен — всё через IF NOT EXISTS.

-- Одна строка = один запрос робота. Люди сюда не попадают: их отсекает
-- botFrom() в _worker.js, иначе суточный лимит записей D1 съел бы обычный
-- трафик, а ценности в этом ноль — люди видны в аналитике Cloudflare.
CREATE TABLE IF NOT EXISTS hits (
  -- Без AUTOINCREMENT: INTEGER PRIMARY KEY в SQLite и есть rowid, а
  -- AUTOINCREMENT добавляет отдельную таблицу-счётчик и лишнюю запись.
  id INTEGER PRIMARY KEY,
  -- Unix-миллисекунды. Числом, а не строкой: по нему идут все диапазоны, а
  -- сравнение чисел не зависит от формата даты.
  at INTEGER NOT NULL,
  -- Нормализованное имя робота: «GPTBot», «Googlebot», «ClaudeBot».
  -- Приводится к известному виду в _worker.js, чтобы «GPTBot/1.2» и
  -- «GPTBot/1.3» не расползались по группировке.
  bot TEXT NOT NULL,
  method TEXT NOT NULL,
  -- Путь без домена и без query: домен у нас один, а query у роботов не
  -- бывает — зато с ним группировка по страницам рассыпалась бы.
  path TEXT NOT NULL,
  status INTEGER NOT NULL,
  -- Content-Type ответа: тот самый «формат контента». По нему видно, что
  -- именно робот забрал — HTML страницы, llms.txt, sitemap.xml или картинку.
  type TEXT,
  -- Размера ответа здесь нет намеренно. Единственный доступный источник —
  -- заголовок Content-Length, а Cloudflare на сжатых ответах его не ставит:
  -- в проверке на живом сайте он оказался пустым у HTML и у llms.txt, то есть
  -- у всего, что роботы и забирают. Колонка, пустая в девяноста случаях из
  -- ста, не сообщает ничего, зато выглядит поломкой.
  --
  -- ASN и страна источника. Главная защита от вранья: User-Agent подделывает
  -- кто угодно, а сеть — нет. «GPTBot» с чужой автономной системы — это не
  -- GPTBot, и увидеть это можно только здесь.
  asn INTEGER,
  country TEXT,
  -- Полный User-Agent: по нему разбирают версии и незнакомых роботов,
  -- которые попали в журнал как «other».
  ua TEXT NOT NULL
);

-- Индексы под два реальных вопроса: «что было за последнюю неделю» и «что
-- делал вот этот робот». Оба запроса упорядочены по времени, поэтому время —
-- последняя колонка составного индекса.
CREATE INDEX IF NOT EXISTS hits_at ON hits (at);
CREATE INDEX IF NOT EXISTS hits_bot_at ON hits (bot, at);
CREATE INDEX IF NOT EXISTS hits_path_at ON hits (path, at);
