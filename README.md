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

## Tests

Generate the media fixtures once — the core suite and the smoke runner both
read them, and they are gitignored on purpose:

```bash
./fixtures/make.sh           # writes fixtures/tiny.{mp4,mp3,png} with ffmpeg
```

Then:

```bash
cargo test -p mediachef-core                        # core: recipes, template, runner, probe
cargo test --manifest-path app/src-tauri/Cargo.toml # queue state machine (no ffmpeg needed)
cargo run -p mediachef-core --bin smoke             # runs EVERY bundled recipe through ffmpeg
cd app && npm test                                  # search + IPC contract (vitest)
cd app && npm run typecheck                         # tsc on the browser, test and node programs
```

Lint gates, same as CI: `cargo fmt --check`,
`cargo clippy -p mediachef-core -- -D warnings`, `cargo clippy -p mediachef -- -D warnings`.

`fixtures/ipc-recipe.golden.json` pins the JSON shape of a `Recipe` as it
crosses IPC; both `cargo test -p mediachef-core` and `npm test` assert against
it. Regenerate it deliberately after an intentional shape change:
`UPDATE_GOLDEN=1 cargo test -p mediachef-core`.

Spec: docs in the parent monorepo (superpowers specs, 2026-08-18-mediachef-design).
