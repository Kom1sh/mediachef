#!/usr/bin/env python3
"""Собирает latest.json — манифест, по которому обновляются установленные копии.

Живёт отдельным файлом, а не строкой внутри workflow, ровно по одной причине:
его можно запустить руками и посмотреть, что получится, не выкатывая тег.

Ждёт на входе распакованные артефакты сборок в sigs/sig-<os>-<arch>/ и переменные
окружения TAG и REPO. Пишет latest.json рядом с собой в рабочем каталоге.
"""
import json
import os
import pathlib
import sys
from datetime import datetime, timezone

# Ровно те тройки, которые мы собираем. Список явный, а не выведенный из папок:
# пропавшая сборка должна валить релиз, а не тихо ужимать манифест до двух
# платформ — иначе пользователи третьей никогда не узнают об обновлении.
EXPECTED = {"darwin-aarch64", "linux-x86_64", "windows-x86_64"}

root = pathlib.Path(__file__).resolve().parent.parent
tag = os.environ.get("TAG", "")
repo = os.environ.get("REPO", "")
if not tag or not repo:
    sys.exit("нужны переменные окружения TAG и REPO")

version = json.loads((root / "app/src-tauri/tauri.conf.json").read_text(encoding="utf8"))["version"]
base = f"https://github.com/{repo}/releases/download/{tag}"

sigs_dir = pathlib.Path("sigs")
if not sigs_dir.is_dir():
    sys.exit("нет каталога sigs/ — сначала download-artifact")

platforms = {}
for d in sorted(p for p in sigs_dir.iterdir() if p.is_dir()):
    key = d.name.removeprefix("sig-")
    found = list(d.glob("*.sig"))
    if len(found) != 1:
        sys.exit(f"{key}: ожидал одну подпись, нашёл {[s.name for s in found]}")
    sig = found[0]
    # Имя пакета выводим из имени подписи, а не собираем по шаблону: так манифест
    # не разъедется с тем, как Tauri на самом деле назвал файл.
    asset = sig.name[: -len(".sig")]
    platforms[key] = {"signature": sig.read_text(encoding="utf8").strip(), "url": f"{base}/{asset}"}

missing = EXPECTED - platforms.keys()
if missing:
    sys.exit(f"нет подписей для {', '.join(sorted(missing))}")
extra = platforms.keys() - EXPECTED
if extra:
    sys.exit(f"неизвестные платформы в артефактах: {', '.join(sorted(extra))}")

manifest = {
    "version": version,
    "notes": (root / "docs/RELEASE_NOTES.md").read_text(encoding="utf8").strip(),
    "pub_date": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "platforms": platforms,
}

pathlib.Path("latest.json").write_text(
    json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf8"
)
print(f"latest.json для {version} ({tag}):")
for key, p in sorted(platforms.items()):
    print(f"  {key:16} {p['url']}")
