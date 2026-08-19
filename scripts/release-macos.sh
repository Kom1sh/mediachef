#!/usr/bin/env bash
# MediaChef: собрать macOS-поставку и выложить на GitHub.
# Использование: ./scripts/release-macos.sh            (версия берётся из tauri.conf.json)
# Перед первым запуском: ./scripts/fetch-sidecars.sh — без движков сборка .app
# не проходит вообще (проверка ниже).
# Что делает: tauri build → zip (.app + КАК_ОТКРЫТЬ.txt + NOTICE.md) → публикация:
#   - если установлен и авторизован gh: GitHub Release v<версия> (канонично)
#   - иначе: коммит zip в orphan-ветку builds (прямые ссылки, без gh)
set -euo pipefail
cd "$(dirname "$0")/.."
source "$HOME/.cargo/env" 2>/dev/null || true

VER=$(python3 -c "import json;print(json.load(open('app/src-tauri/tauri.conf.json'))['version'])")
ZIP="MediaChef-${VER}-macos-arm64.zip"
APP="target/release/bundle/macos/MediaChef.app"

# Сайдкары — условие СБОРКИ, а не упаковки: tauri копирует externalBin из
# build.rs и падает, если файла нет. Проверяем заранее, чтобы получить
# человеческий текст вместо «resource path ... doesn't exist».
missing=""
for b in ffmpeg ffprobe whisper-cli; do
  [ -f "app/src-tauri/binaries/$b-aarch64-apple-darwin" ] || missing="$missing $b"
done
[ -z "$missing" ] || {
  echo "нет сайдкаров:$missing" >&2
  echo "сначала ./scripts/fetch-sidecars.sh (движки внутрь .app, ~130 МБ)" >&2
  exit 1
}

echo "==> building v${VER}"
# Прошлый бандл сносим до сборки: иначе упавшая сборка оставила бы старый .app,
# и в релиз молча уехала бы прошлая версия.
rm -rf "$APP"
# --bundles app вместо «|| true»: терпели мы только dmg-этап tauri, который без
# GUI-сессии не проходит, а он и не нужен — dmg ниже собирает hdiutil. Теперь
# упала сборка — упал скрипт (так же, как в .github/workflows/release.yml).
( cd app && npm run tauri build -- --bundles app )
test -d "$APP" || { echo ".app not built"; exit 1; }

echo "==> packaging ${ZIP}"
rm -rf dist-release && mkdir -p dist-release
cp docs/КАК_ОТКРЫТЬ.txt dist-release/ 2>/dev/null || cp scripts/КАК_ОТКРЫТЬ.txt dist-release/
# NOTICE.md едет в каждой поставке: внутри .app лежат ffmpeg/ffprobe (GPL-сборки)
# и whisper-cli, а GPL требует, чтобы лицензии и ссылки на исходники ехали вместе
# с бинарниками, а не только лежали в репозитории.
cp NOTICE.md dist-release/
cp -R "$APP" dist-release/
( cd dist-release && zip -qry "$ZIP" MediaChef.app КАК_ОТКРЫТЬ.txt NOTICE.md )

DMG="MediaChef_${VER}_aarch64.dmg"
echo "==> packaging ${DMG} (hdiutil — без GUI-зависимого оформления, с инструкцией внутри)"
rm -rf dist-release/dmg-stage && mkdir -p dist-release/dmg-stage
cp -R "$APP" dist-release/dmg-stage/
cp dist-release/КАК_ОТКРЫТЬ.txt dist-release/dmg-stage/
cp dist-release/NOTICE.md dist-release/dmg-stage/
ln -s /Applications dist-release/dmg-stage/Applications
hdiutil create -volname "MediaChef ${VER}" -srcfolder dist-release/dmg-stage -ov -format UDZO "dist-release/${DMG}" >/dev/null

if command -v gh >/dev/null && gh auth status >/dev/null 2>&1; then
  echo "==> gh release v${VER}"
  gh release create "v${VER}" "dist-release/${ZIP}" "dist-release/${DMG}" --title "MediaChef ${VER}" \
    --notes "macOS (Apple Silicon). Первый запуск: правый клик → Открыть, либо xattr -cr. FFmpeg и Whisper уже внутри — ничего доустанавливать не нужно. Инструкция внутри архива."
else
  echo "==> gh отсутствует — публикую в ветку builds"
  WT=.builds-wt; rm -rf "$WT"
  git fetch origin builds:refs/remotes/origin/builds 2>/dev/null || true
  if git show-ref --verify --quiet refs/remotes/origin/builds; then
    git worktree add "$WT" -B builds origin/builds
  else
    git worktree add --detach "$WT"
    ( cd "$WT" && git checkout --orphan builds && git rm -rfq . 2>/dev/null || true )
  fi
  cp "dist-release/${ZIP}" "dist-release/${DMG}" "$WT/" && cp dist-release/КАК_ОТКРЫТЬ.txt "$WT/"
  ( cd "$WT" && git add -A && git commit -q -m "build: MediaChef ${VER} (macos-arm64)" && git push origin builds )
  git worktree remove --force "$WT"
  echo "==> https://github.com/Kom1sh/mediachef/raw/builds/${ZIP}"
fi
echo "done"
