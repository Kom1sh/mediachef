# MediaChef (working title)

FFmpeg for humans + local transcription. Open-core, GPL-3.0, fully offline.

## Dev setup (macOS)

```bash
brew install ffmpeg          # the app shells out to ffmpeg/ffprobe on PATH
cd app && npm i && npm run tauri dev
```

FFmpeg is a runtime requirement, not a bundled dependency: without `ffmpeg` and
`ffprobe` on `PATH` the app still starts, but probing a file and running a job
both fail with "FFmpeg binary not found". Override the lookup with
`MEDIACHEF_FFMPEG` / `MEDIACHEF_FFPROBE` (absolute paths to the binaries) — the
env vars win over `PATH`, then `bin/<arch>-<os>/`, then `PATH`.

## Transcription (whisper)

Transcription recipes shell out to whisper.cpp's CLI the same way the rest of the
app shells out to ffmpeg:

```bash
brew install whisper-cpp     # provides `whisper-cli` on PATH
```

Models are not bundled — the app downloads them on request (Models screen) into
its app-data directory, `~/Library/Application Support/com.mediachef.dev/models`
on macOS, as `ggml-<id>.bin`. Overrides:

- `MEDIACHEF_WHISPER` — absolute path to a `whisper-cli` binary, winning over
  `PATH` exactly like `MEDIACHEF_FFMPEG` does.
- `MEDIACHEF_MODELS_DIR` — a models directory for the **tests and the smoke
  runner only**. The app itself always uses its app-data directory, so pointing
  this at a checked-out model dir cannot change what a user's install reads.

The end-to-end whisper tests are `#[ignore]`d, because they need the binary, a
model and a voice fixture that a bare CI box has none of. Run them explicitly:

```bash
./fixtures/make.sh                                   # builds fixtures/speech.wav via `say`
export MEDIACHEF_MODELS_DIR="$HOME/Library/Application Support/com.mediachef.dev/models"
cargo test -p mediachef-core transcribe -- --ignored  # transcribe + cancel, needs ggml-tiny.bin
cargo run -p mediachef-core --bin smoke               # now also runs the 8 whisper recipes
```

Without those three things the smoke runner prints one `SKIP <recipe> (reason)`
line per whisper recipe and still exits 0 — the ffmpeg lane is what it hard-fails
on. That is exactly the ubuntu CI job's situation: `speech.wav` needs a TTS voice
(`say` on macOS, `espeak-ng` otherwise) and whisper-cpp is a brew formula, so the
whisper lane is covered by the macOS job, which installs whisper-cpp and keeps a
cached `ggml-tiny.bin`.

## Settings

The Settings screen writes one JSON file into the app-data directory, next to
`models/` — `~/Library/Application Support/com.mediachef.dev/settings.json` on
macOS:

| Row | Key(s) | Values | Notes |
| --- | --- | --- | --- |
| Language | `language` | `system` \| `en` \| `ru` | `system` follows the OS locale; switching re-renders the whole UI, no restart |
| Theme | `theme` | `system` \| `light` \| `dark` | applied immediately |
| Output folder | `output_mode`, `output_dir` | `beside` \| `fixed` | `fixed` without a folder is demoted to `beside` |
| Notifications | `notifications` | `true` \| `false` | desktop alert when a job finishes |
| Parallel conversions | `ffmpeg_workers` | `1`–`3` | read once when the lane workers spawn, so it lands after a restart |

The file is sanitized on the way in as well as on the way out, so a hand-edited
`ffmpeg_workers: 99` is read as `3` rather than honoured, and an unparseable file
or an unknown key falls back to the defaults above instead of stopping the app.

## Tests

Generate the media fixtures once — the core suite and the smoke runner both
read them, and they are gitignored on purpose:

```bash
./fixtures/make.sh           # writes fixtures/tiny.{mp4,mp3,png} with ffmpeg,
                             # plus speech.wav where a TTS voice exists
```

Then:

```bash
cargo test -p mediachef-core                        # core: recipes, template, runner, probe
cargo test --manifest-path app/src-tauri/Cargo.toml # queue state machine (no ffmpeg needed)
cargo run -p mediachef-core --bin smoke             # every ffmpeg recipe (+ whisper, see above)
cd app && npm test                                  # vitest: 56 tests in 4 files —
                                                    # search + IPC golden, i18n,
                                                    # formatting, component render
cd app && npm run typecheck                         # tsc on the browser, test and node programs
```

Lint gates, same as CI: `cargo fmt --check`,
`cargo clippy -p mediachef-core -- -D warnings`, `cargo clippy -p mediachef -- -D warnings`.

`fixtures/ipc-recipe.golden.json` pins the JSON shape of a `Recipe` as it
crosses IPC; both `cargo test -p mediachef-core` and `npm test` assert against
it. Regenerate it deliberately after an intentional shape change:
`UPDATE_GOLDEN=1 cargo test -p mediachef-core`.

Spec: docs in the parent monorepo (superpowers specs, 2026-08-18-mediachef-design).
