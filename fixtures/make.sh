#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
FF="${MEDIACHEF_FFMPEG:-$(command -v ffmpeg)}"
"$FF" -y -hide_banner -loglevel error -f lavfi -i testsrc2=duration=2:size=320x240:rate=30 \
  -f lavfi -i sine=frequency=440:duration=2 -c:v libx264 -pix_fmt yuv420p -c:a aac tiny.mp4
"$FF" -y -hide_banner -loglevel error -f lavfi -i sine=frequency=440:duration=2 -c:a libmp3lame tiny.mp3
"$FF" -y -hide_banner -loglevel error -f lavfi -i testsrc2=duration=1:size=64x64:rate=10 -frames:v 1 tiny.png
# Голосовая фикстура для whisper-тестов: macOS `say`, иначе espeak-ng, иначе пропуск.
if command -v say >/dev/null; then
  say -o speech_raw.aiff "hello world test one two three"
  "$FF" -y -hide_banner -loglevel error -i speech_raw.aiff -ar 16000 -ac 1 -c:a pcm_s16le speech.wav
  rm -f speech_raw.aiff
elif command -v espeak-ng >/dev/null; then
  espeak-ng -w speech_raw.wav "hello world test one two three"
  "$FF" -y -hide_banner -loglevel error -i speech_raw.wav -ar 16000 -ac 1 -c:a pcm_s16le speech.wav
  rm -f speech_raw.wav
else
  echo "note: no TTS available, speech.wav skipped"
fi
echo OK
