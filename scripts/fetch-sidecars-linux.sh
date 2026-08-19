#!/usr/bin/env bash
# MediaChef: разложить сайдкары в app/src-tauri/binaries/ на linux x86_64 —
# ffmpeg, ffprobe и whisper-cli, которые уезжают внутрь deb и AppImage
# (tauri externalBin).
# Использование: ./scripts/fetch-sidecars-linux.sh
#
# Близнец scripts/fetch-sidecars.sh (тот — для macOS/arm64), те же гарантии:
# ffmpeg/ffprobe — готовые статические сборки, у каждой скачки проверяется
# пиненая sha256 (и архива, и распакованного бинарника); whisper-cli собирается
# из исходников по пиненому тегу. Идемпотентен: разложенное с верной sha не
# перекачивается, whisper не пересобирается, пока не изменились его тег или
# флаги. Самопроверка (запуск + линковка) прогоняется на каждом вызове, даже на
# пустом — в CI каталог приезжает из actions/cache, и проверять надо именно то,
# что приехало.
set -euo pipefail
cd "$(dirname "$0")/.."

TRIPLE="x86_64-unknown-linux-gnu"
OUT="app/src-tauri/binaries"

# ---------------------------------------------------------------- ПИНЫ --------
# Меняются только сознательно: подняли версию — обновили ВСЕ sha (архива и двух
# бинарников внутри) и NOTICE.md. Плавающих ссылок здесь быть не должно: у BtbN
# есть релиз с тегом latest и ассеты, у которых вместо версии в имени стоят
# «master» и «latest», — под теми же адресами лежит меняющееся содержимое.
# Брать только versioned-релиз autobuild-ГГГГ-ММ-ДД-ЧЧ-ММ.
#
# ffmpeg: BtbN FFmpeg-Builds, вариант linux64-gpl (статический, GPL — как и наш
# GPL-3.0). Линия n9.0.1 — самая свежая версионная в этом релизе (там же есть
# master-снапшот N-126217 и линия n8.1.2, они нам не нужны). Обе sha сверены с
# checksums.sha256 из ассетов того же релиза.
BTBN_TAG="autobuild-2026-08-19-19-21"
FFMPEG_VERSION="n9.0.1-6-g9d4ca21220"
FFMPEG_ARCHIVE="ffmpeg-$FFMPEG_VERSION-linux64-gpl-9.0.tar.xz"
FFMPEG_ARCHIVE_URL="https://github.com/BtbN/FFmpeg-Builds/releases/download/$BTBN_TAG/$FFMPEG_ARCHIVE"
FFMPEG_ARCHIVE_SHA="281e0717db7b4fc1d3326e92fef6f2fd716b6a833e0f093e1b750848da7c69c5"
FFMPEG_BIN_SHA="a2c66e9918b0eb1619cd4a3b029860c8aafcee86c7c9a415761f225e0640d1df"
FFPROBE_BIN_SHA="138a6f6079913f202f953fe8801af1a4e460b7cd3e3e145c9d33a867c1e50202"

# whisper.cpp: тот же тег, что на маке, — одна версия движка на все поставки.
# Флаги отличаются от маковых ровно платформой: Metal тут нет, зато нужны те же
# два «чтобы бинарник был самодостаточным» —
#   BUILD_SHARED_LIBS=OFF — иначе whisper-cli тянет libwhisper/libggml*.so,
#     которых рядом с exe в бандле не будет;
#   GGML_OPENMP=OFF — иначе линкуется libgomp.so.1, а это не системная
#     библиотека, которой можно распоряжаться на чужой машине.
# GGML_NATIVE=OFF — про переносимость, а не про самодостаточность: с NATIVE=ON
# (это дефолт ggml) в сборку уходит -march=native, то есть набор инструкций
# ИМЕННО ЭТОГО раннера. Раннер с AVX-512 выдал бы бинарник, падающий с SIGILL у
# всех, у кого только AVX2. С NATIVE=OFF ggml вместо native включает свой
# фиксированный набор (INS_ENB: SSE4.2+AVX+AVX2+FMA+F16C+BMI2) — базовая линия
# Haswell/2013, и она одинакова, на каком бы раннере ни собирали.
WHISPER_TAG="v1.7.6"
WHISPER_REPO="https://github.com/ggml-org/whisper.cpp.git"
WHISPER_CMAKE_FLAGS=(
  -DCMAKE_BUILD_TYPE=Release
  -DBUILD_SHARED_LIBS=OFF
  -DGGML_NATIVE=OFF
  -DGGML_OPENMP=OFF
)
# ------------------------------------------------------------------------------

[ "$(uname -s)" = "Linux" ] && [ "$(uname -m)" = "x86_64" ] || {
  echo "этот скрипт — для linux x86_64; на $(uname -s)/$(uname -m) сайдкары берут другие скрипты (mac: scripts/fetch-sidecars.sh)" >&2
  exit 1
}
# xz — отдельным пунктом: tar сам xz не распаковывает, он зовёт его бинарником, и
# без xz-utils падение выглядит как невнятная ошибка внутри tar.
for t in curl tar xz sha256sum git cmake ldd; do
  command -v "$t" >/dev/null || { echo "нужен $t (apt-get install -y ...)" >&2; exit 1; }
done

mkdir -p "$OUT"
WORK="${TMPDIR:-/tmp}/mediachef-sidecars"
mkdir -p "$WORK"
SUMMARY=()   # строки таблицы: имя|версия|состояние

sha_of() { sha256sum "$1" | awk '{print $1}'; }

# Сайдкар обязан быть самодостаточным: рядом с ним в бандле лежат только два
# других наших бинарника и ни одной .so. Всё, что слинковано вне базового
# системного набора, на чужой машине не найдётся — libwhisper/libggml от
# нестатической сборки, libgomp от OpenMP, что угодно ещё. Пусть падает здесь, а
# не у юзера. Аналог assert_self_contained из маковского скрипта (там otool).
LINUX_SYSTEM_SONAMES='^(linux-vdso\.so\.[0-9]+|ld-linux-x86-64\.so\.[0-9]+|libc\.so\.[0-9]+|libm\.so\.[0-9]+|libpthread\.so\.[0-9]+|libdl\.so\.[0-9]+|librt\.so\.[0-9]+|libstdc\+\+\.so\.[0-9]+|libgcc_s\.so\.[0-9]+)$'
assert_self_contained() {
  local bin="$1" magic out deps bad
  # ldd на не-ELF пишет «not a dynamic executable» и на статическом ELF пишет то
  # же самое — то есть пустой список зависимостей сам по себе ещё не «всё
  # чисто». Поэтому сначала убеждаемся, что это вообще ELF (ffmpeg от BtbN —
  # статический ELF, у него зависимостей и правда нет).
  magic="$(head -c 4 "$bin" | od -An -tx1 | tr -d ' \n')" || magic=""
  [ "$magic" = "7f454c46" ] || {
    echo "$bin: не ELF-бинарник (пустая заглушка? обрезанная скачка?)" >&2
    exit 1
  }
  out="$(ldd "$bin" 2>&1)" || true
  if printf '%s\n' "$out" | grep -qE 'not a dynamic executable|statically linked'; then
    return 0
  fi
  deps="$(printf '%s\n' "$out" | awk 'NF {print $1}')"
  [ -n "$deps" ] || {
    echo "$bin: ldd не дал ни строчки, но и статическим бинарник не назвал:" >&2
    printf '%s\n' "$out" >&2
    exit 1
  }
  # «=> not found» — зависимость, которой нет даже на раннере; такой бинарник
  # ловить надо здесь, а не в рантайме у пользователя.
  if printf '%s\n' "$out" | grep -q 'not found'; then
    echo "$bin: часть зависимостей не разрешилась:" >&2
    printf '%s\n' "$out" | grep 'not found' >&2
    exit 1
  fi
  bad="$(printf '%s\n' "$deps" | xargs -n1 basename | grep -vE "$LINUX_SYSTEM_SONAMES" || true)"
  [ -n "$bad" ] || return 0
  echo "$bin слинкован не только с системными библиотеками — сайдкар не самодостаточен:" >&2
  while IFS= read -r lib; do echo "  $lib" >&2; done <<<"$bad"
  exit 1
}

# Скачать один пиненый tar.xz (внутри и ffmpeg, и ffprobe), проверить его sha,
# распаковать ровно два нужных файла и проверить sha каждого, положить в $OUT.
fetch_ffmpeg_pair() {
  local dest_ffmpeg="$OUT/ffmpeg-$TRIPLE" dest_ffprobe="$OUT/ffprobe-$TRIPLE"
  if [ -f "$dest_ffmpeg" ] && [ "$(sha_of "$dest_ffmpeg")" = "$FFMPEG_BIN_SHA" ] &&
     [ -f "$dest_ffprobe" ] && [ "$(sha_of "$dest_ffprobe")" = "$FFPROBE_BIN_SHA" ]; then
    SUMMARY+=("ffmpeg|$FFMPEG_VERSION|sha OK (уже на месте)")
    SUMMARY+=("ffprobe|$FFMPEG_VERSION|sha OK (уже на месте)")
    return
  fi

  # Состояние для таблицы считаем по факту: архив с прошлого запуска с верной
  # sha распаковываем молча, но и не выдаём за скачанный.
  local archive="$WORK/$FFMPEG_ARCHIVE" state="скачан" got
  if [ -f "$archive" ] && [ "$(sha_of "$archive")" = "$FFMPEG_ARCHIVE_SHA" ]; then
    state="из кэша архивов"
  else
    echo "==> качаю ffmpeg $FFMPEG_VERSION (BtbN $BTBN_TAG, linux64-gpl)"
    curl -fSL --retry 3 --connect-timeout 20 -o "$archive.part" "$FFMPEG_ARCHIVE_URL"
    mv "$archive.part" "$archive"
    got="$(sha_of "$archive")"
    [ "$got" = "$FFMPEG_ARCHIVE_SHA" ] || {
      echo "$FFMPEG_ARCHIVE: sha256 не совпала!" >&2
      echo "  ждали $FFMPEG_ARCHIVE_SHA" >&2
      echo "  вышло $got" >&2
      exit 1
    }
  fi

  # Внутри архива всё лежит в каталоге с именем сборки; --strip-components=2
  # снимает его и bin/, оставляя два файла.
  local un="$WORK/untar-linux-ffmpeg"
  rm -rf "$un" && mkdir -p "$un"
  local root="${FFMPEG_ARCHIVE%.tar.xz}"
  tar -xJf "$archive" -C "$un" --strip-components=2 "$root/bin/ffmpeg" "$root/bin/ffprobe"

  local name sha dest
  for name in ffmpeg ffprobe; do
    if [ "$name" = "ffmpeg" ]; then sha="$FFMPEG_BIN_SHA"; dest="$dest_ffmpeg"
    else sha="$FFPROBE_BIN_SHA"; dest="$dest_ffprobe"; fi
    [ -f "$un/$name" ] || { echo "в $FFMPEG_ARCHIVE нет bin/$name" >&2; exit 1; }
    got="$(sha_of "$un/$name")"
    [ "$got" = "$sha" ] || {
      echo "$name (из архива): sha256 не совпала! ждали $sha, вышло $got" >&2
      exit 1
    }
    mv "$un/$name" "$dest"
    chmod +x "$dest"
    SUMMARY+=("$name|$FFMPEG_VERSION|sha OK ($state)")
  done
}

# Собрать whisper-cli из пиненого тега. Идемпотентность — по метке рядом с
# бинарником: sha собранного локально не предскажешь, а вот вход сборки —
# вполне. В метке лежит тег И хэш флагов cmake: сменили GGML_NATIVE или
# BUILD_SHARED_LIBS на том же теге — старый бинарник обязан пересобраться,
# иначе «поправил флаги, перезапустил, ничего не изменилось».
build_whisper_cli() {
  local dest="$OUT/whisper-cli-$TRIPLE"
  local stamp="$OUT/.whisper-cli-$TRIPLE.stamp"
  local want
  want="$WHISPER_TAG $(printf '%s\n' "${WHISPER_CMAKE_FLAGS[@]}" | sha256sum | awk '{print $1}')"

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

  echo "==> собираю whisper-cli (CPU, static, AVX2-базис)"
  cmake -S "$src" -B "$src/build" "${WHISPER_CMAKE_FLAGS[@]}" >"$WORK/cmake-configure.log" 2>&1 ||
    { tail -30 "$WORK/cmake-configure.log" >&2; echo "cmake configure упал (лог: $WORK/cmake-configure.log)" >&2; exit 1; }
  cmake --build "$src/build" --target whisper-cli -j"$(nproc)" >"$WORK/cmake-build.log" 2>&1 ||
    { tail -30 "$WORK/cmake-build.log" >&2; echo "сборка упала (лог: $WORK/cmake-build.log)" >&2; exit 1; }

  [ -f "$src/build/bin/whisper-cli" ] || { echo "сборка не оставила build/bin/whisper-cli" >&2; exit 1; }
  # Проверяем ДО установки: битую сборку не за чем класть в $OUT и помечать
  # меткой. То же самое ниже прогоняется на установленных файлах — на каждом
  # запуске, включая тот, где ничего не собиралось.
  assert_self_contained "$src/build/bin/whisper-cli"
  cp "$src/build/bin/whisper-cli" "$dest"
  chmod +x "$dest"
  printf '%s' "$want" >"$stamp"
  SUMMARY+=("whisper-cli|whisper.cpp $WHISPER_TAG|собран (static, CPU)")
}

fetch_ffmpeg_pair
build_whisper_cli

# Самопроверка: каждый бинарник должен запускаться и не тянуть за собой чужих
# библиотек. Три разных ответа на «ты живой?»: ffmpeg/ffprobe умеют -version,
# whisper-cli — только --help. Линковку проверяем именно здесь и на том, что
# реально лежит в $OUT: файлы могли не собираться и не качаться, а приехать из
# кэша (в CI $OUT восстанавливает actions/cache) — проверка обязана быть и там.
echo
for b in "ffmpeg-$TRIPLE" "ffprobe-$TRIPLE" "whisper-cli-$TRIPLE"; do
  [ -x "$OUT/$b" ] || { echo "$OUT/$b не исполняемый" >&2; exit 1; }
done
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
  echo "whisper-cli не прошёл самопроверку — метка сборки снята, повторный ./scripts/fetch-sidecars-linux.sh пересоберёт его" >&2
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
echo "готово: $OUT (запускаются, tauri externalBin подхватит их при сборке deb/AppImage)"
