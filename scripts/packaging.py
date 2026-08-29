#!/usr/bin/env python3
"""Пересобирает манифесты пакетных менеджеров под конкретную версию.

Зачем отдельный скрипт: каналов три, а данные у них одни и те же — версия,
имена файлов в релизе и их sha256. Руками это расходится на второй же версии,
и расходится тихо: манифест с чужим хешем не ставится, а узнаёшь об этом от
пользователя.

Запуск после того, как релиз опубликован (файлы должны лежать на месте):

    python3 scripts/packaging.py            # версия из tauri.conf.json
    python3 scripts/packaging.py 0.7.0

Хеши считаются потоково по настоящим файлам релиза: на диск ничего не ложится,
но и подставить хеш от другой сборки невозможно.

Отправку в чужие репозитории скрипт не делает — только пишет файлы. Что и куда
отправлять, решает человек: PR в microsoft/winget-pkgs виден публично и
отзывается тяжелее, чем создаётся.
"""
from __future__ import annotations  # системный Python на macOS — 3.9, там нет `str | None`

import hashlib
import json
import pathlib
import sys
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
REPO = "Kom1sh/mediachef"
HOMEPAGE = "https://mediachef.app/"
LICENSE = "GPL-3.0-only"
IDENT = "Kom1sh.MediaChef"
SCHEMA = "1.12.0"

# Одно предложение на всё: длинные описания в пакетных менеджерах обрезаются
# по-разному, и обрезанное должно оставаться осмысленным.
SUMMARY = "Convert video and audio and transcribe speech to text on your own computer"
DESCRIPTION = (
    "MediaChef turns FFmpeg and Whisper into recipe cards: convert video and audio, "
    "pull the sound out of a clip, transcribe a recording to text. Everything runs "
    "locally — nothing is uploaded, there is no size limit and no account."
)
TAGS = ["ffmpeg", "whisper", "video", "audio", "converter", "transcription",
        "subtitles", "offline", "mp4", "mp3"]


def sha256_of(url: str) -> str | None:
    """Хеш файла по адресу, без записи на диск — поставки весят до 180 МБ.

    None, если файла в релизе нет. Это не всегда ошибка: портативный zip под
    Windows появился позже остальных поставок, и на старых тегах его не будет —
    тогда честнее пропустить один манифест, чем не собрать ни одного.
    """
    h = hashlib.sha256()
    try:
        with urllib.request.urlopen(url) as r:
            for chunk in iter(lambda: r.read(1 << 20), b""):
                h.update(chunk)
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise
    return h.hexdigest()


def write(path: pathlib.Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf8")
    print(f"  {path.relative_to(ROOT)}")


# ── Homebrew ────────────────────────────────────────────────────────────────
# Casks/ в корне репозитория, а не отдельный tap-репозиторий: `brew tap` умеет
# брать произвольный адрес, и второй репозиторий, который придётся обновлять
# отдельным коммитом, того не стоит. В homebrew-cask пойдём, когда проект
# наберёт их порог известности.
def cask(version: str, sha: str) -> str:
    return f'''cask "mediachef" do
  version "{version}"
  sha256 "{sha}"

  url "https://github.com/{REPO}/releases/download/v#{{version}}/MediaChef-#{{version}}-macos-arm64.zip"
  name "MediaChef"
  desc "{SUMMARY}"
  homepage "{HOMEPAGE}"

  # Сборка одна, под Apple Silicon. На Intel brew честно откажется вместо того,
  # чтобы поставить неработающее.
  depends_on arch: :arm64

  app "MediaChef.app"

  # Сертификата Apple у сборки пока нет, поэтому карантин, который вешает на
  # скачанное сам macOS, снять некому — без этого система скажет, что приложение
  # повреждено. Показываем ту же команду, что лежит в КАК_ОТКРЫТЬ.txt в архиве.
  caveats <<~EOS
    MediaChef is not signed with an Apple certificate yet. If macOS says the app
    is damaged, clear the quarantine flag once:

      xattr -cr /Applications/MediaChef.app

  EOS

  zap trash: [
    "~/Library/Application Support/com.mediachef.dev",
    "~/Library/WebKit/com.mediachef.dev",
  ]
end
'''


# ── Scoop ───────────────────────────────────────────────────────────────────
# Портативный zip, а не установщик: Scoop распаковывает в свой каталог и сам же
# обновляет, а прогонять через него NSIS-инсталлятор — значит завести две
# системы, каждая из которых считает, что владеет установкой.
def scoop(version: str, sha: str, base: str, asset: str) -> str:
    return json.dumps({
        "version": version,
        "description": SUMMARY,
        "homepage": HOMEPAGE,
        "license": LICENSE,
        "architecture": {"64bit": {"url": f"{base}/{asset}", "hash": sha}},
        "bin": "mediachef.exe",
        "shortcuts": [["mediachef.exe", "MediaChef"]],
        "checkver": {"github": f"https://github.com/{REPO}"},
        "autoupdate": {
            "architecture": {
                "64bit": {
                    "url": f"https://github.com/{REPO}/releases/download/v$version"
                           f"/MediaChef-$version-windows-x64.zip",
                },
            },
        },
    }, ensure_ascii=False, indent=4) + "\n"


# ── winget ──────────────────────────────────────────────────────────────────
# Три файла по схеме 1.12.0. Лежат у нас, а уезжают отдельным PR в
# microsoft/winget-pkgs, в manifests/k/Kom1sh/MediaChef/<версия>/.
def winget_version(version: str) -> str:
    return f'''# yaml-language-server: $schema=https://aka.ms/winget-manifest.version.{SCHEMA}.schema.json
PackageIdentifier: {IDENT}
PackageVersion: "{version}"
DefaultLocale: en-US
ManifestType: version
ManifestVersion: {SCHEMA}
'''


def winget_locale(version: str) -> str:
    tags = "\n".join(f"  - {t}" for t in TAGS)
    return f'''# yaml-language-server: $schema=https://aka.ms/winget-manifest.defaultLocale.{SCHEMA}.schema.json
PackageIdentifier: {IDENT}
PackageVersion: "{version}"
PackageLocale: en-US
Publisher: Kom1sh
PublisherUrl: https://github.com/Kom1sh
PublisherSupportUrl: https://github.com/{REPO}/issues
PackageName: MediaChef
PackageUrl: {HOMEPAGE}
License: {LICENSE}
LicenseUrl: https://www.gnu.org/licenses/gpl-3.0.html
ShortDescription: {SUMMARY}
Description: >-
  {DESCRIPTION}
Tags:
{tags}
ReleaseNotesUrl: https://github.com/{REPO}/releases/tag/v{version}
ManifestType: defaultLocale
ManifestVersion: {SCHEMA}
'''


def winget_installer(version: str, sha: str, base: str, asset: str) -> str:
    # InstallerType: nullsoft — тогда winget сам знает про тихую установку (/S)
    # и ключи не приходится расписывать руками.
    return f'''# yaml-language-server: $schema=https://aka.ms/winget-manifest.installer.{SCHEMA}.schema.json
PackageIdentifier: {IDENT}
PackageVersion: "{version}"
Platform:
  - Windows.Desktop
MinimumOSVersion: 10.0.17763.0
InstallerType: nullsoft
Scope: user
InstallModes:
  - interactive
  - silent
  - silentWithProgress
UpgradeBehavior: install
Installers:
  - Architecture: x64
    InstallerUrl: {base}/{asset}
    InstallerSha256: {sha.upper()}
ManifestType: installer
ManifestVersion: {SCHEMA}
'''


def main() -> None:
    if len(sys.argv) > 1:
        version = sys.argv[1]
    else:
        conf = json.loads((ROOT / "app/src-tauri/tauri.conf.json").read_text(encoding="utf8"))
        version = conf["version"]

    base = f"https://github.com/{REPO}/releases/download/v{version}"
    assets = {
        "mac_zip": f"MediaChef-{version}-macos-arm64.zip",
        "win_exe": f"MediaChef_{version}_x64-setup.exe",
        "win_zip": f"MediaChef-{version}-windows-x64.zip",
    }

    print(f"считаю sha256 для v{version} (это займёт минуту):")
    digest = {}
    for key, name in assets.items():
        digest[key] = sha256_of(f"{base}/{name}")
        print(f"  {name}  {digest[key] or 'НЕТ В РЕЛИЗЕ'}")
    if not any(digest.values()):
        sys.exit(f"в релизе v{version} нет ни одной поставки — не тот тег?")

    print("\nпишу манифесты:")
    skipped = []

    if digest["mac_zip"]:
        write(ROOT / "Casks/mediachef.rb", cask(version, digest["mac_zip"]))
    else:
        skipped.append(f"Homebrew — нет {assets['mac_zip']}")

    if digest["win_zip"]:
        write(ROOT / "bucket/mediachef.json",
              scoop(version, digest["win_zip"], base, assets["win_zip"]))
    else:
        skipped.append(f"Scoop — нет {assets['win_zip']}")

    if digest["win_exe"]:
        wg = ROOT / "packaging/winget"
        write(wg / f"{IDENT}.yaml", winget_version(version))
        write(wg / f"{IDENT}.locale.en-US.yaml", winget_locale(version))
        write(wg / f"{IDENT}.installer.yaml",
              winget_installer(version, digest["win_exe"], base, assets["win_exe"]))
    else:
        skipped.append(f"winget — нет {assets['win_exe']}")

    if skipped:
        print("\nпропущено:")
        for s in skipped:
            print(f"  {s}")

    print(f"""
дальше вручную:
  homebrew  brew tap kom1sh/mediachef https://github.com/{REPO}
            brew install --cask mediachef
  scoop     scoop bucket add mediachef https://github.com/{REPO}
            scoop install mediachef
  winget    PR с packaging/winget/ в microsoft/winget-pkgs,
            в manifests/k/Kom1sh/MediaChef/{version}/
            перед отправкой: winget validate --manifest packaging/winget""")


if __name__ == "__main__":
    main()
