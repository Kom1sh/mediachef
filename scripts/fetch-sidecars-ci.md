# Sidecar pins: what is pinned, where, and how to bump it

MediaChef ships its own engines. `bundle.externalBin` in
`app/src-tauri/tauri.conf.json` copies `app/src-tauri/binaries/<bin>-<triple>`
next to the compiled executable, and `locate` (`app/core/src/locate.rs`) prefers
that copy over anything on the machine. Nothing is downloaded at runtime: the
engines are acquired at **build** time by one script per runner, and every
download is pinned by URL **and** sha256.

| Platform | Triple | Acquisition script | Cache key | Where they end up |
|---|---|---|---|---|
| macOS arm64 | `aarch64-apple-darwin` | `scripts/fetch-sidecars.sh` | `sidecars-aarch64-apple-darwin-${{ hashFiles('scripts/fetch-sidecars.sh') }}` | `MediaChef.app/Contents/MacOS/` |
| Linux x64 | `x86_64-unknown-linux-gnu` | `scripts/fetch-sidecars-linux.sh` | `sidecars-x86_64-unknown-linux-gnu-${{ hashFiles(...linux.sh) }}` | AppImage `usr/bin/`, deb `/usr/bin/` |
| Windows x64 | `x86_64-pc-windows-msvc` | `scripts/fetch-sidecars-windows.ps1` | `sidecars-x86_64-pc-windows-msvc-${{ hashFiles(...windows.ps1) }}` | NSIS install dir, next to `mediachef.exe` |

The macOS key and script are shared verbatim with the `rust-tauri` job in
`.github/workflows/ci.yml`, so CI and release read the same cache entry — a
release cut right after a green CI run fetches nothing and builds nothing.

## ffmpeg / ffprobe — prebuilt, never compiled here

| | macOS arm64 | Linux x64 | Windows x64 |
|---|---|---|---|
| Version | `9.0.1` | `n9.0.1-6-g9d4ca21220` | `n9.0.1-6-g9d4ca21220` |
| Builder | ffmpeg.martin-riedl.de (release build, GPL) | BtbN/FFmpeg-Builds `linux64-gpl` | BtbN/FFmpeg-Builds `win64-gpl` |
| Release | `download/macos/arm64/1787073674_9.0.1` | tag `autobuild-2026-08-19-19-21` | tag `autobuild-2026-08-19-19-21` |
| Archive | `ffmpeg.zip` + `ffprobe.zip` (separate) | `ffmpeg-n9.0.1-6-g9d4ca21220-linux64-gpl-9.0.tar.xz` | `ffmpeg-n9.0.1-6-g9d4ca21220-win64-gpl-9.0.zip` |
| Archive sha256 | `8287a1b2…07fe` / `102a26b8…741a` | `281e0717…c69c5` | `cd46a932…1274` |
| ffmpeg sha256 | `393e4c39…1611` | `a2c66e99…d1df` | `52abe576…76cb` |
| ffprobe sha256 | `7abc49fb…71bc` | `138a6f60…0202` | `b0e3dbee…70ad6` |
| Pins live in | `scripts/fetch-sidecars.sh:28-33` | `scripts/fetch-sidecars-linux.sh:31-37` | `scripts/fetch-sidecars-windows.ps1:34-40` |

Notes:

- **Two shas per binary on purpose.** The archive is verified after download and
  the extracted binary is verified again before it enters `binaries/`; the
  installed file's sha is what makes the script idempotent (and self-healing: a
  corrupted `binaries/ffmpeg-*` simply gets replaced on the next run).
- **Both sha sources agree.** Each pinned value was computed locally from the
  actual download *and* compared with the checksum the builder publishes —
  `checksums.sha256` among BtbN's release assets, and `<file>.zip.sha256` next
  to each martin-riedl zip. Verified 2026-08-19.
- **No floating tags.** BtbN also publishes a release tagged `latest`, and
  assets whose names carry "master" and "latest" in place of a version; both
  change contents under a stable URL and neither may be used here. The pin must
  be an `autobuild-YYYY-MM-DD-HH-MM` tag.
  `n9.0.1-6-g9d4ca21220` is the newest *version line* in that release (it also
  carries a master snapshot `N-126217-ge1e325235e` and an `n8.1.2-44` line,
  which we do not use).
- **BtbN prunes old autobuilds.** The releases list currently reaches back to
  `autobuild-2024-09-30-15-36`, but retention is theirs, not ours: if a pinned
  tag ever 404s, re-pin to a fresh versioned release (never to `latest`) and
  redo the sha cross-check.
- **The two ffmpeg lines are deliberately different builders.** martin-riedl is
  the only source of static macOS arm64 builds; BtbN is the standard source for
  linux64/win64. Versions happen to agree at 9.0.1 today; they are not required
  to, and NOTICE must list them separately (see below).

## whisper.cpp — built from source, same tag everywhere

Tag `v1.7.6`, cloned from `https://github.com/ggml-org/whisper.cpp.git`
(`ggerganov/whisper.cpp` only survives as a GitHub redirect, and a pin must not
depend on a redirect). Every script re-checks that the clone's HEAD really
carries that tag. Build takes 2-4 min on a cold runner; the `binaries/` cache is
what keeps it off the critical path.

| | macOS arm64 | Linux x64 | Windows x64 |
|---|---|---|---|
| cmake flags | `-DGGML_METAL=ON -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF -DGGML_NATIVE=OFF -DGGML_OPENMP=OFF` | same minus `GGML_METAL` | same, plus `-DCMAKE_POLICY_DEFAULT_CMP0091=NEW -DCMAKE_MSVC_RUNTIME_LIBRARY=MultiThreaded` |
| SIMD baseline | compiler default for `arm64-apple-darwin`: NEON + DOTPROD + FMA + FP16 vector arithmetic, **no** i8mm/SVE/SME | `-msse4.2 -mavx -mavx2 -mfma -mf16c -mbmi2` (Haswell, 2013) | `/arch:AVX2` (implies FMA + F16C) |
| Accelerators | Metal (shaders embedded in the binary) + Accelerate BLAS | CPU only | CPU only |
| Pins live in | `scripts/fetch-sidecars.sh:50,54` | `scripts/fetch-sidecars-linux.sh:52,54` | `scripts/fetch-sidecars-windows.ps1:62,64` |

Why each flag:

- `BUILD_SHARED_LIBS=OFF` — without it whisper-cli links `libwhisper`/`libggml*`
  (`.dylib`/`.so`/`.dll`), which are not next to the executable in a bundle. The
  briefed flags alone did **not** produce a static binary; this is required on
  all three platforms.
- `GGML_OPENMP=OFF` — otherwise the binary picks up `libgomp.so.1` (gcc),
  `vcomp140.dll` (MSVC, a redist) or a brew `libomp.dylib` that happens to be on
  the build machine. whisper.cpp has its own thread pool.
- `GGML_NATIVE=OFF` — ggml defaults it to **ON**, which means `-march=native` /
  `-mcpu=native`: the shipped binary would carry whatever instruction set the
  *runner* had, and crash with SIGILL on anything older (a linux runner with
  AVX-512 shipping to an AVX2 user; an M4 runner emitting i8mm/SME an M1 lacks).
  With it off, `ggml/CMakeLists.txt` flips `INS_ENB` on and enables its own fixed
  set instead (`GGML_SSE42/AVX/AVX2/FMA/F16C/BMI2` on x86, nothing extra on ARM),
  which is identical on every runner. Verified on macOS: with the flag set, the
  `ggml-cpu` target compiles with no `-mcpu`/`-march` argument at all and cmake
  reports DOTPROD/FMA/FP16_VECTOR_ARITHMETIC — the M1-compatible set.
- `CMAKE_MSVC_RUNTIME_LIBRARY=MultiThreaded` (Windows) — static CRT, so users
  need no "Visual C++ Redistributable". **It does nothing on its own here**:
  whisper.cpp declares `cmake_minimum_required(VERSION 3.5)`, which leaves policy
  CMP0091 unset, and with the OLD behaviour the abstraction is ignored while
  `/MD` stays in `CMAKE_C_FLAGS_RELEASE`. Hence
  `CMAKE_POLICY_DEFAULT_CMP0091=NEW` right next to it.
- Windows also builds with `--config Release`: cmake picks the Visual Studio
  generator by default, and that one is multi-config, where `CMAKE_BUILD_TYPE`
  decides nothing.

Linux floor: whisper-cli is built on `ubuntu-22.04`, so it needs glibc 2.35+ —
the same floor the app itself already has via `libwebkit2gtk-4.1`.

## The stamp, and why a flag change rebuilds

A locally built binary has no sha to pin, so idempotency is a stamp file
`binaries/.whisper-cli-<triple>.stamp` holding the tag **and a hash of the cmake
flag list**. Editing a flag therefore forces a rebuild — otherwise "changed the
flags, re-ran, nothing happened". The same hash is why the *cache* key is
`hashFiles(<script>)`: any pin or flag edit lands in a fresh cache entry, and
only for the platform whose script changed.

Not cached: the whisper clone and its build tree. Under a key shared by all runs
they would be dead weight — the built binary is the artifact worth keeping.

## What is asserted, and what stays unproven

Each script, on **every** invocation (including a no-op run over a restored
cache): the pinned shas of the installed ffmpeg/ffprobe, `ffmpeg -version`,
`ffprobe -version`, `whisper-cli --help`, and a linkage check —

- macOS: `otool -L` must show nothing outside `/usr/lib` and `/System`;
- Linux: `ldd` must show nothing outside `libc/libm/libpthread/libdl/librt/
  libstdc++/libgcc_s/ld-linux/linux-vdso` (no libgomp — OpenMP is off; BtbN's
  ffmpeg is a fully static ELF and legitimately has no dependencies at all), plus
  an ELF-magic check so a placeholder cannot pass as "statically linked", and any
  `=> not found` is a failure;
- Windows: there is no cheap `dumpbin` without a Developer Command Prompt, so
  the check reads the PE and looks for the import names `VCRUNTIME140`,
  `MSVCP140` and `VCOMP140` — a dynamically linked CRT (or OpenMP) cannot hide,
  since the DLL name sits in the import table as plain ASCII. Our *own*
  `whisper.dll`/`ggml*.dll` are deliberately not on that list: running the exe
  proves their absence, because Windows refuses to load a PE whose imports
  cannot be resolved and the sidecar directory holds nothing but three `.exe`
  files. Residual risk: this is a substring scan, not a real import-table walk,
  and only `whisper-cli.exe` is scanned (ffmpeg/ffprobe are 145MB each and their
  self-containment is a property of BtbN's build, evidenced by `-version`).

On top of that, `.github/workflows/release.yml` runs the engines **out of the
built artifact** — the only thing that proves externalBin actually copied them,
that the triple suffix got stripped and that the exec bit survived: macOS from
`MediaChef.app/Contents/MacOS/`, Linux from both an `--appimage-extract`ed
AppImage and a `dpkg -x`ed deb, Windows from `target/release/` next to
`mediachef.exe` (installing the NSIS package on the runner is not worth it —
that layout is what NSIS copies into Program Files).

## Two notes for later work

1. **Signing asymmetry (breaks first when notarization arrives, wave 6).** On
   macOS the pinned ffmpeg/ffprobe arrive already signed by their builder with a
   hardened runtime — `Developer ID Application: Martin Riedl (KU3N25YGLU)`,
   `flags=0x10000(runtime)` — while our whisper-cli is `flags=0x20002(adhoc,
   linker-signed)`, `TeamIdentifier=not set`. Unsigned is harmless today (the
   whole app is unsigned and users clear the quarantine flag by hand), but a
   notarized build must re-sign all three with our own identity, and a
   third-party hardened-runtime signature is exactly the kind of thing that
   fails `codesign --deep` / notarization in confusing ways. Windows and Linux
   sidecars are unsigned throughout.
2. **NOTICE must list the ffmpeg builds separately.** macOS ships ffmpeg
   **9.0.1** from `https://ffmpeg.martin-riedl.de/download/macos/arm64/1787073674_9.0.1`;
   Linux and Windows ship **n9.0.1-6-g9d4ca21220** from
   `https://github.com/BtbN/FFmpeg-Builds/releases/tag/autobuild-2026-08-19-19-21`
   (`linux64-gpl` / `win64-gpl`). Both are GPL builds, so the GPL-3.0 notice
   needs upstream sources (ffmpeg.org, tag `n9.0.1`) plus the build recipes
   (the two builder projects). whisper.cpp is MIT, tag `v1.7.6`, from
   `https://github.com/ggml-org/whisper.cpp`.

## Bumping a pin

1. Pick the new release (BtbN: a versioned `autobuild-*` tag, never `latest`;
   martin-riedl: a *release* build, not a snapshot).
2. Download the artifact, `shasum -a 256` / `Get-FileHash` it, and compare with
   the builder's published checksum file. Both must agree.
3. Extract the binaries and hash those too.
4. Edit the pin block of the one script involved (line numbers in the tables
   above) — version, URL, archive sha, per-binary shas.
5. Run it locally if you are on that platform (`./scripts/fetch-sidecars.sh` on
   macOS); on the other two, CI is the first run. The cache key follows the
   script hash, so the refetch happens by itself.
6. Update `NOTICE.md` versions and links in the same commit.
