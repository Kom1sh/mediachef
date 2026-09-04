# NOTICE — third-party components bundled with MediaChef

MediaChef is free software licensed under the **GNU General Public License,
version 3** (`GPL-3.0-only`; full text in `LICENSE`). Complete source code:
<https://github.com/Kom1sh/mediachef>.

Every MediaChef distribution carries the media engines it needs, so a user never
has to install ffmpeg or whisper by hand. Those engines are **unmodified**
third-party builds, shipped as separate executables next to the application
binary and invoked as child processes — MediaChef does not link against them.
This file lists them one entry per distinct build, because macOS and
Windows/Linux get FFmpeg from different builders.

## Bundled binaries

| Build | Files | Ships in | License |
| --- | --- | --- | --- |
| FFmpeg **9.0.1**, macOS arm64 static build by ffmpeg.martin-riedl.de | `ffmpeg`, `ffprobe` | macOS (Apple Silicon): `.app`, `.dmg`, `.zip` | GPL v3 |
| FFmpeg **n9.0.1-11-ge47273f4d9** from BtbN/FFmpeg-Builds (`win64-gpl`, `linux64-gpl`) | `ffmpeg(.exe)`, `ffprobe(.exe)` | Windows installer; Linux AppImage and `.deb` | GPL v3 |
| whisper.cpp **v1.7.6**, compiled from source in our CI | `whisper-cli(.exe)` | all three platforms | MIT |

### FFmpeg 9.0.1 — macOS arm64 (builder: Martin Riedl)

- Obtained from
  <https://ffmpeg.martin-riedl.de/download/macos/arm64/1787073674_9.0.1/ffmpeg.zip>
  and
  <https://ffmpeg.martin-riedl.de/download/macos/arm64/1787073674_9.0.1/ffprobe.zip>,
  pinned by SHA-256 in `scripts/fetch-sidecars.sh`.
- Upstream source: FFmpeg 9.0.1, tag `n9.0.1` — <https://ffmpeg.org/download.html>,
  <https://github.com/FFmpeg/FFmpeg/releases/tag/n9.0.1>.
- Build recipe: <https://git.martin-riedl.de/ffmpeg/build-script>.
- License: **GPL v3**. The shipped binary's own `-version` output reports
  `--enable-gpl --enable-version3` and no `--enable-nonfree`: `--enable-gpl`
  makes the build GPL rather than LGPL, and `--enable-version3` makes that GPL
  version 3. It also reports `--enable-openssl`; OpenSSL 3 is Apache-2.0
  licensed and therefore GPLv3-compatible, which is why no non-free flag is
  needed and why the result stays redistributable.

### FFmpeg n9.0.1-11-ge47273f4d9 — Windows x64, Linux x64 (builder: BtbN)

- Obtained from release
  <https://github.com/BtbN/FFmpeg-Builds/releases/tag/autobuild-2026-09-03-13-17>
  — assets `ffmpeg-n9.0.1-11-ge47273f4d9-win64-gpl-9.0.zip` and
  `ffmpeg-n9.0.1-11-ge47273f4d9-linux64-gpl-9.0.tar.xz`, pinned by SHA-256 in
  `scripts/fetch-sidecars-windows.ps1` and `scripts/fetch-sidecars-linux.sh`.
- Upstream source: the version string is `git describe` output, so the exact
  revision is FFmpeg commit `9d4ca21220`, six commits after tag `n9.0.1` on the
  9.0 release branch — <https://github.com/FFmpeg/FFmpeg/commit/9d4ca21220>.
- Build recipe: <https://github.com/BtbN/FFmpeg-Builds>. Its `*-gpl` variants
  configure with `--enable-gpl --enable-version3` and ship `COPYING.GPLv3`
  (see `variants/defaults-gpl.sh` there).
- License: **GPL v3**.

### whisper.cpp v1.7.6 (includes ggml)

- Source: <https://github.com/ggml-org/whisper.cpp> at tag `v1.7.6`, cloned and
  compiled without modification. The cmake flags per platform are listed in
  `scripts/fetch-sidecars-ci.md`; they change how the binary is built, not what
  it is.
- License: **MIT** (`LICENSE` in that repository), which also covers the ggml
  code vendored there.

## GPL compliance

FFmpeg here is GPL software and MediaChef is GPL-3.0 — compatible licenses — and
this section is the source offer that comes with distributing GPL binaries. The
complete corresponding source for everything a MediaChef release contains:

- **FFmpeg** — the project at <https://ffmpeg.org/download.html>, at the exact
  revisions named above (`n9.0.1` for macOS, commit `9d4ca21220` for
  Windows/Linux). The scripts that turned that source into the binaries we ship
  are public too: <https://git.martin-riedl.de/ffmpeg/build-script> (macOS) and
  <https://github.com/BtbN/FFmpeg-Builds> (Windows, Linux).
- **whisper.cpp** — <https://github.com/ggml-org/whisper.cpp>, tag `v1.7.6`.
- **MediaChef** — <https://github.com/Kom1sh/mediachef>.

Neither engine is patched by us, so there is no delta to publish beyond those
references. Should any of those links go dark, open an issue in
<https://github.com/Kom1sh/mediachef> and we will hand over the corresponding
source for the exact revision we shipped. Every download URL and SHA-256 pin
lives in
`scripts/fetch-sidecars.sh`, `scripts/fetch-sidecars-linux.sh` and
`scripts/fetch-sidecars-windows.ps1`, documented in
`scripts/fetch-sidecars-ci.md`.

## Not bundled

Speech-recognition models are **not** part of any distribution. The app
downloads the model you pick, on request (Models screen), from
<https://huggingface.co/ggerganov/whisper.cpp> into its own app-data directory;
each model file carries the license of its publisher. Removing the model
directory leaves the app itself intact.
