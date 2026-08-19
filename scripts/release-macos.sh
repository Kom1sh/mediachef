#!/usr/bin/env bash
# MediaChef: собрать macOS-поставку и выложить на GitHub.
# Использование: ./scripts/release-macos.sh            (версия берётся из tauri.conf.json)
# Что делает: tauri build → zip (.app + КАК_ОТКРЫТЬ.txt) → публикация:
#   - если установлен и авторизован gh: GitHub Release v<версия> (канонично)
#   - иначе: коммит zip в orphan-ветку builds (прямые ссылки, без gh)
set -euo pipefail
cd "$(dirname "$0")/.."
source "$HOME/.cargo/env" 2>/dev/null || true

VER=$(python3 -c "import json;print(json.load(open('app/src-tauri/tauri.conf.json'))['version'])")
ZIP="MediaChef-${VER}-macos-arm64.zip"

echo "==> building v${VER}"
( cd app && npm run tauri build ) || true   # dmg-этап падает без GUI-сессии; .app важнее
test -d target/release/bundle/macos/MediaChef.app || { echo ".app not built"; exit 1; }

echo "==> packaging ${ZIP}"
rm -rf dist-release && mkdir -p dist-release
cp docs/КАК_ОТКРЫТЬ.txt dist-release/ 2>/dev/null || cp scripts/КАК_ОТКРЫТЬ.txt dist-release/
cp -R target/release/bundle/macos/MediaChef.app dist-release/
( cd dist-release && zip -qry "$ZIP" MediaChef.app КАК_ОТКРЫТЬ.txt )

DMG="MediaChef_${VER}_aarch64.dmg"
echo "==> packaging ${DMG} (hdiutil — без GUI-зависимого оформления, с инструкцией внутри)"
rm -rf dist-release/dmg-stage && mkdir -p dist-release/dmg-stage
cp -R target/release/bundle/macos/MediaChef.app dist-release/dmg-stage/
cp dist-release/КАК_ОТКРЫТЬ.txt dist-release/dmg-stage/
ln -s /Applications dist-release/dmg-stage/Applications
hdiutil create -volname "MediaChef ${VER}" -srcfolder dist-release/dmg-stage -ov -format UDZO "dist-release/${DMG}" >/dev/null

if command -v gh >/dev/null && gh auth status >/dev/null 2>&1; then
  echo "==> gh release v${VER}"
  gh release create "v${VER}" "dist-release/${ZIP}" "dist-release/${DMG}" --title "MediaChef ${VER}" \
    --notes "macOS (Apple Silicon). Первый запуск: правый клик → Открыть, либо xattr -cr. Требует brew install ffmpeg whisper-cpp. Инструкция внутри архива."
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
