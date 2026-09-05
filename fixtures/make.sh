#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
FF="${MEDIACHEF_FFMPEG:-$(command -v ffmpeg)}"
"$FF" -y -hide_banner -loglevel error -f lavfi -i testsrc2=duration=2:size=320x240:rate=30 \
  -f lavfi -i sine=frequency=440:duration=2 -c:v libx264 -pix_fmt yuv420p -c:a aac tiny.mp4
"$FF" -y -hide_banner -loglevel error -f lavfi -i sine=frequency=440:duration=2 -c:a libmp3lame tiny.mp3
"$FF" -y -hide_banner -loglevel error -f lavfi -i testsrc2=duration=1:size=64x64:rate=10 -frames:v 1 tiny.png
# Голосовая фикстура для whisper-тестов.
#
# В отличие от остальных она лежит в репозитории и по умолчанию НЕ пересоздаётся.
# Причина — поломка, пойманная 2026-09-05: на образе macos-latest у `say` не
# оказалось голосовых данных, он молча записал пять миллисекунд тишины, шаг
# отработал зелёным, а упал уже whisper-тест — с «речи не слышно» вместо
# внятного «синтезатор не сработал». Диагноз стоил трёх минут CI и получаса
# чтения логов.
#
# Синтезатор речи — единственная зависимость этого скрипта, которой нет ни в
# ffmpeg, ни в репозитории, и которая может исчезнуть без предупреждения при
# смене образа раннера. Поэтому речь коммитится, а всё остальное строится:
# ffmpeg из lavfi даёт одно и то же везде и всегда.
#
# Пересоздать намеренно: MEDIACHEF_REBUILD_SPEECH=1 ./fixtures/make.sh

# ~1 секунда 16 кГц моно s16 = 32000 байт. Порог заведомо выше любой тишины и
# заведомо ниже настоящей фразы: битый файл из CI весил 258 байт.
MIN_SPEECH_BYTES=32000

speech_ok() {
  [ -f speech.wav ] && [ "$(wc -c < speech.wav)" -ge "$MIN_SPEECH_BYTES" ]
}

synth() {
  if command -v say >/dev/null; then
    say -o speech_raw.aiff "hello world test one two three"
    "$FF" -y -hide_banner -loglevel error -i speech_raw.aiff -ar 16000 -ac 1 -c:a pcm_s16le speech.wav
    rm -f speech_raw.aiff
  elif command -v espeak-ng >/dev/null; then
    espeak-ng -w speech_raw.wav "hello world test one two three"
    "$FF" -y -hide_banner -loglevel error -i speech_raw.wav -ar 16000 -ac 1 -c:a pcm_s16le speech.wav
    rm -f speech_raw.wav
  else
    return 1
  fi
}

if speech_ok && [ -z "${MEDIACHEF_REBUILD_SPEECH:-}" ]; then
  echo "note: speech.wav взят из репозитория, пересоздание пропущено"
elif synth; then
  # Проверяем то, что синтезатор реально записал: он умеет отработать без
  # ошибки и не сказать при этом ни слова. Молча отдать такой файл дальше
  # нельзя — он превращается в ложное «whisper не расслышал речь».
  if ! speech_ok; then
    echo "error: синтезатор отдал $(wc -c < speech.wav) байт вместо речи." >&2
    echo "       На macOS это обычно значит, что в системе нет голосовых данных." >&2
    echo "       Верните speech.wav из репозитория: git checkout -- fixtures/speech.wav" >&2
    exit 1
  fi
else
  speech_ok || echo "note: no TTS available and no speech.wav in tree, whisper tests will skip"
fi
echo OK
