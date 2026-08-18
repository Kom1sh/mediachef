#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
FF="${MEDIACHEF_FFMPEG:-$(command -v ffmpeg)}"
"$FF" -y -hide_banner -loglevel error -f lavfi -i testsrc2=duration=2:size=320x240:rate=30 \
  -f lavfi -i sine=frequency=440:duration=2 -c:v libx264 -pix_fmt yuv420p -c:a aac tiny.mp4
"$FF" -y -hide_banner -loglevel error -f lavfi -i sine=frequency=440:duration=2 -c:a libmp3lame tiny.mp3
"$FF" -y -hide_banner -loglevel error -f lavfi -i testsrc2=duration=1:size=64x64:rate=10 -frames:v 1 tiny.png
echo OK
