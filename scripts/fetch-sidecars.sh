#!/usr/bin/env bash
# MediaChef: разложить сайдкары в app/src-tauri/binaries/ — ffmpeg, ffprobe и
# whisper-cli, которые уезжают внутри .app (tauri externalBin).
# Использование: ./scripts/fetch-sidecars.sh
#
# macOS/Apple Silicon (aarch64-apple-darwin). Windows и Linux собирают то же
# самое шагами релизного workflow (.github/workflows/release.yml).
#
# ffmpeg/ffprobe — готовые статические сборки, каждая скачка проверяется по
# пиненому sha256 (и архив, и распакованный бинарник). whisper-cli собирается
# из исходников по пиненому тегу: готовых сборок с Metal нет.
# Скрипт идемпотентен: уже разложенное с верной sha не перекачивается, whisper
# не пересобирается, пока не изменились его тег или флаги сборки. Самопроверка
# (запуск + линковка) прогоняется на каждом вызове, даже на пустом.
set -euo pipefail
cd "$(dirname "$0")/.."

TRIPLE="aarch64-apple-darwin"
OUT="app/src-tauri/binaries"

# ---------------------------------------------------------------- ПИНЫ --------
# Меняются только сознательно: подняли версию — обновили ОБА sha (архива и
# бинарника внутри) и NOTICE.md. Плавающих latest-ссылок здесь быть не должно.
#
# ffmpeg: release-сборка (не snapshot) с ffmpeg.martin-riedl.de, GPL, arm64.
# Каталог 1787073674_9.0.1 — это их «Download Release Build → macOS arm64»
# от 18 Aug 2026; их же .sha256-файлы совпали с локально посчитанными.
FFMPEG_VERSION="9.0.1"
FFMPEG_BASE_URL="https://ffmpeg.martin-riedl.de/download/macos/arm64/1787073674_9.0.1"
FFMPEG_ZIP_SHA="8287a1b2229e05eb41859f073e18e6c52c60a778f2f5e6881070fe51b79407fe"
FFMPEG_BIN_SHA="393e4c395020a1cb7cbd77fbe00599ce69d1c6466fee0dbd59d13f86a81a1611"
FFPROBE_ZIP_SHA="102a26b8940a053298d9929bfaae71e4b6ef65ba5f19a99a88c433108560741a"
FFPROBE_BIN_SHA="7abc49fb2bdf2204f018e76dc6e0a8ae7643313bae09a9fa43e7eb12442271bc"

# whisper.cpp: тег, а не ветка. Сборка статическая (BUILD_SHARED_LIBS=OFF) —
# иначе whisper-cli тянет libwhisper/libggml*.dylib и рядом с exe в бандле
# развалится. Metal-шейдеры вкомпилированы в бинарник, отдельного
# ggml-metal.metal рядом не нужно (проверено запуском из бандла).
WHISPER_TAG="v1.7.6"
# Канонический адрес репозитория: ggerganov/whisper.cpp жив только редиректом
# GitHub на организацию, а пин не должен зависеть от редиректа.
WHISPER_REPO="https://github.com/ggml-org/whisper.cpp.git"
WHISPER_CMAKE_FLAGS=(-DGGML_METAL=ON -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF)
# ------------------------------------------------------------------------------

[ "$(uname -s)" = "Darwin" ] && [ "$(uname -m)" = "arm64" ] || {
  echo "этот скрипт — для macOS на Apple Silicon; на $(uname -s)/$(uname -m) сайдкары собирает release.yml" >&2
  exit 1
}
for t in curl unzip shasum git cmake; do
  command -v "$t" >/dev/null || { echo "нужен $t (brew install cmake — для сборки whisper)" >&2; exit 1; }
done

mkdir -p "$OUT"
WORK="${TMPDIR:-/tmp}/mediachef-sidecars"
mkdir -p "$WORK"
SUMMARY=()   # строки таблицы: имя|версия|состояние

sha_of() { shasum -a 256 "$1" | awk '{print $1}'; }

# Сайдкар обязан быть самодостаточным: в бандле рядом с ним лежат только два
# других наших бинарника и ни одной dylib. Всё, что слинковано вне /usr/lib и
# /System, на чужой машине не найдётся — libwhisper/libggml от нестатической
# сборки, brew-зависимости, что угодно. Пусть падает здесь, а не у юзера.
# Строки зависимостей у otool начинаются с табуляции; заголовки (в том числе
# «(architecture ...)» у fat-бинарника) — нет, поэтому фильтр по ^\t.
assert_self_contained() {
  local bin="$1" libs deps bad
  # otool отдельно от фильтра: его ошибку (файла нет) нельзя терять в пайпе.
  libs="$(otool -L "$bin")" || { echo "otool -L $bin не сработал — это вообще бинарник?" >&2; exit 1; }
  deps="$(printf '%s\n' "$libs" | awk '/^\t/ {print $1}')"
  # Пустой список — не «всё чисто»: на не-Mach-O файле otool пишет «is not an
  # object file» и выходит с нулём, так что пустая заглушка иначе прошла бы
  # проверку. Живой бинарник всегда линкует хотя бы libSystem.
  [ -n "$deps" ] || {
    echo "$bin: otool не увидел ни одной зависимости — это не бинарник (пустая заглушка?)" >&2
    exit 1
  }
  bad="$(printf '%s\n' "$deps" | grep -vE '^(/usr/lib/|/System/)' || true)"
  [ -n "$bad" ] || return 0
  echo "$bin слинкован не только с системными библиотеками — сайдкар не самодостаточен:" >&2
  while IFS= read -r lib; do echo "  $lib" >&2; done <<<"$bad"
  exit 1
}

# Скачать <name>.zip с пиненого базового URL, проверить sha архива, распаковать
# единственный бинарник внутри, проверить и его sha, положить в $OUT.
fetch_ffmpeg_tool() {
  local name="$1" zip_sha="$2" bin_sha="$3"
  local dest="$OUT/$name-$TRIPLE"

  if [ -f "$dest" ] && [ "$(sha_of "$dest")" = "$bin_sha" ]; then
    SUMMARY+=("$name|$FFMPEG_VERSION|sha OK (уже на месте)")
    return
  fi

  # Состояние для таблицы считаем по факту: архив с прошлого запуска с верной
  # sha распаковываем молча, но и не выдаём за скачанный.
  local zip="$WORK/$name-$FFMPEG_VERSION.zip" state="скачан" got
  if [ -f "$zip" ] && [ "$(sha_of "$zip")" = "$zip_sha" ]; then
    state="из кэша архивов"
  else
    echo "==> качаю $name $FFMPEG_VERSION"
    curl -fSL --retry 3 --connect-timeout 20 -o "$zip.part" "$FFMPEG_BASE_URL/$name.zip"
    mv "$zip.part" "$zip"
    got="$(sha_of "$zip")"
    [ "$got" = "$zip_sha" ] || {
      echo "$name.zip: sha256 не совпала!" >&2
      echo "  ждали $zip_sha" >&2
      echo "  вышло $got" >&2
      exit 1
    }
  fi

  rm -rf "$WORK/unzip-$name" && mkdir -p "$WORK/unzip-$name"
  unzip -qo "$zip" -d "$WORK/unzip-$name"
  [ -f "$WORK/unzip-$name/$name" ] || { echo "в $name.zip нет файла $name" >&2; exit 1; }
  got="$(sha_of "$WORK/unzip-$name/$name")"
  [ "$got" = "$bin_sha" ] || {
    echo "$name (из архива): sha256 не совпала! ждали $bin_sha, вышло $got" >&2
    exit 1
  }
  mv "$WORK/unzip-$name/$name" "$dest"
  chmod +x "$dest"
  SUMMARY+=("$name|$FFMPEG_VERSION|sha OK ($state)")
}

# Собрать whisper-cli из пиненого тега. Идемпотентность — по метке рядом с
# бинарником: sha собранного локально не предскажешь, а вот вход сборки —
# вполне. В метке лежит тег И хэш флагов cmake: сменили -DGGML_METAL или
# -DBUILD_SHARED_LIBS на том же теге — старый бинарник обязан пересобраться,
# иначе «поправил флаги, перезапустил, ничего не изменилось».
build_whisper_cli() {
  local dest="$OUT/whisper-cli-$TRIPLE"
  local stamp="$OUT/.whisper-cli-$TRIPLE.stamp"
  local want
  want="$WHISPER_TAG $(printf '%s\n' "${WHISPER_CMAKE_FLAGS[@]}" | shasum -a 256 | awk '{print $1}')"

  if [ -f "$dest" ] && [ -f "$stamp" ] && [ "$(cat "$stamp")" = "$want" ]; then
    SUMMARY+=("whisper-cli|whisper.cpp $WHISPER_TAG|собран ранее (тег и флаги совпали)")
    return
  fi

  local src="$WORK/whisper.cpp-$WHISPER_TAG"
  if [ ! -d "$src/.git" ]; then
    echo "==> клонирую whisper.cpp $WHISPER_TAG"
    rm -rf "$src"
    git clone --depth 1 --branch "$WHISPER_TAG" "$WHISPER_REPO" "$src"
  fi
  # Пин обязан быть тегом, а не «что там сейчас в ветке»: сверяем, что HEAD
  # клона — это ровно он (клон мог остаться с прошлого, другого, пина).
  git -C "$src" describe --tags --exact-match HEAD 2>/dev/null | grep -qx "$WHISPER_TAG" || {
    echo "клон в $src не на теге $WHISPER_TAG — удалите каталог и повторите" >&2
    exit 1
  }

  echo "==> собираю whisper-cli (Metal, static)"
  cmake -S "$src" -B "$src/build" "${WHISPER_CMAKE_FLAGS[@]}" >"$WORK/cmake-configure.log" 2>&1 ||
    { tail -30 "$WORK/cmake-configure.log" >&2; echo "cmake configure упал (лог: $WORK/cmake-configure.log)" >&2; exit 1; }
  cmake --build "$src/build" --target whisper-cli -j"$(sysctl -n hw.ncpu)" >"$WORK/cmake-build.log" 2>&1 ||
    { tail -30 "$WORK/cmake-build.log" >&2; echo "сборка упала (лог: $WORK/cmake-build.log)" >&2; exit 1; }

  [ -f "$src/build/bin/whisper-cli" ] || { echo "сборка не оставила build/bin/whisper-cli" >&2; exit 1; }
  # Проверяем ДО установки: битую сборку не за чем класть в $OUT и помечать
  # меткой. То же самое ниже прогоняется на установленных файлах — на каждом
  # запуске, включая тот, где ничего не собиралось.
  assert_self_contained "$src/build/bin/whisper-cli"
  cp "$src/build/bin/whisper-cli" "$dest"
  chmod +x "$dest"
  printf '%s' "$want" >"$stamp"
  SUMMARY+=("whisper-cli|whisper.cpp $WHISPER_TAG|собран (static, Metal)")
}

fetch_ffmpeg_tool ffmpeg "$FFMPEG_ZIP_SHA" "$FFMPEG_BIN_SHA"
fetch_ffmpeg_tool ffprobe "$FFPROBE_ZIP_SHA" "$FFPROBE_BIN_SHA"
build_whisper_cli

# Самопроверка: каждый бинарник должен запускаться и не тянуть за собой чужих
# библиотек. Три разных ответа на «ты живой?»: ffmpeg/ffprobe умеют -version,
# whisper-cli — только --help. Линковку проверяем именно здесь и на том, что
# реально лежит в $OUT: файлы могли не собираться и не качаться, а приехать из
# кэша (в CI $OUT восстанавливает actions/cache) — проверка обязана быть и там.
echo
"$OUT/ffmpeg-$TRIPLE" -version >/dev/null
"$OUT/ffprobe-$TRIPLE" -version >/dev/null
assert_self_contained "$OUT/ffmpeg-$TRIPLE"
assert_self_contained "$OUT/ffprobe-$TRIPLE"
# У ffmpeg/ffprobe битый файл самоисцеляется: sha установленного не совпала —
# его перекладывают из архива. У whisper-cli пиненой sha нет (сборка локальная),
# его битость ловится только здесь — и битый бинарник при валидной метке падал
# бы на этом месте вечно (в CI одна испорченная кэш-запись красила бы джобу до
# смены ключа). Поэтому на провале снимаем метку: следующий запуск пересоберёт.
if ! { "$OUT/whisper-cli-$TRIPLE" --help >/dev/null 2>&1 &&
       (assert_self_contained "$OUT/whisper-cli-$TRIPLE"); }; then
  rm -f "$OUT/.whisper-cli-$TRIPLE.stamp"
  echo "whisper-cli не прошёл самопроверку — метка сборки снята, повторный ./scripts/fetch-sidecars.sh пересоберёт его" >&2
  exit 1
fi
# Заголовки латиницей не из вредности: printf выравнивает по БАЙТАМ, и кириллица
# в первых двух колонках разъезжается. Русский текст — только в последней.
printf '%-12s %-24s %s\n' "BINARY" "VERSION" "STATE"
for row in "${SUMMARY[@]}"; do
  IFS='|' read -r n v s <<<"$row"
  printf '%-12s %-24s %s\n' "$n" "$v" "$s"
done
echo
echo "готово: $OUT (запускаются, tauri externalBin подхватит их при сборке)"
