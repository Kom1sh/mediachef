# MediaChef (working title)

FFmpeg for humans + local transcription. Open-core, GPL-3.0, fully offline.

## Dev setup (macOS)

```bash
brew install ffmpeg          # dev lane only: fixtures/make.sh and the test
                             # binaries take PATH — not what a release runs
./scripts/fetch-sidecars.sh  # engines that ship inside the app → app/src-tauri/binaries/
cd app && npm i && npm run tauri dev
```

## Sidecars — the engines that ship

A MediaChef release carries its own `ffmpeg`, `ffprobe` and `whisper-cli`, so a
user installs nothing. `bundle.externalBin` in `tauri.conf.json` makes tauri's
build script copy `app/src-tauri/binaries/<bin>-<triple>` next to the compiled
executable, and it hard-errors when a file is missing. The sidecars are
therefore a **build** prerequisite, not just a packaging one: anything touching
the `mediachef` crate — `npm run tauri dev|build`, `cargo build|test|check|clippy`
on `app/src-tauri` — needs `./scripts/fetch-sidecars.sh` (~130MB, macOS/arm64,
pinned versions) run once first. `mediachef-core` on its own has no such
dependency.

Those copies land in `target/debug/` and `target/release/`, and the lookup checks
the directory of the running executable *before* `PATH`, so in a dev tree too
anything built into the target dir root — the smoke runner, the `tauri dev` app —
runs the pinned engines rather than Homebrew's. That is deliberate (dev exercises
what ships); test binaries live one level down in `target/debug/deps/` and still
take `PATH`, which is the whole reason the `brew install` lines in this README
exist. Full order: `MEDIACHEF_FFMPEG` / `MEDIACHEF_FFPROBE` /
`MEDIACHEF_WHISPER` (absolute paths, and the escape hatch when you need a
specific binary) → next to the executable → `bin/<arch>-<os>/` → `PATH` →
Homebrew prefixes. With none of them resolving, the app still starts, but probing
a file and running a job both fail with "The bundled FFmpeg engine is missing or
damaged".

One acquisition script per platform, each pinning every download by URL **and**
sha256 — nothing floats, and nothing is fetched at runtime:

| Platform | Script |
| --- | --- |
| macOS arm64 | `./scripts/fetch-sidecars.sh` — the one you run locally, and the very same one CI and release run |
| Linux x64 | `scripts/fetch-sidecars-linux.sh` — run by the release runner (or by you, on that platform) |
| Windows x64 | `scripts/fetch-sidecars-windows.ps1` — same, in PowerShell |

ffmpeg and ffprobe are prebuilt downloads; `whisper-cli` is compiled from a
pinned whisper.cpp tag (2-4 min on a cold runner, cached in CI). All three
scripts are idempotent and self-healing: a second run re-verifies the shas,
prints a `BINARY / VERSION / STATE` table and does nothing else, while a
corrupted or half-written binary in `binaries/` is simply replaced.

**`scripts/fetch-sidecars-ci.md` is the registry**: which version is pinned
where, which line of which script holds it, why each cmake flag is there, what
the self-checks assert, and the step-by-step bump procedure. Read it before
touching a pin — and note that a bump also has to land in `NOTICE.md`, which
carries the licenses and the GPL source offers for the bundled binaries.

## Transcription (whisper)

Transcription recipes shell out to whisper.cpp's CLI the same way the rest of the
app shells out to ffmpeg:

```bash
brew install whisper-cpp     # dev lane: `whisper-cli` on PATH for the test binaries
```

That brew formula is **not** what ships — a release runs the pinned `whisper-cli`
from `binaries/` (see Sidecars) — it is here because the tests below run out of
`target/debug/deps/`, one level below the sidecar copies, and so still resolve
through `PATH`.

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

## Dictation (wave 5.1 — internal, macOS only)

Hold a global hotkey anywhere, speak, press it again, and the text lands in your
clipboard. Recognition is the same local whisper.cpp the recipes use, so nothing
is uploaded and nothing is billed per minute.

**It is off by default and has no UI yet.** The Dictation screen arrives in wave
5.2; for now it is configured by hand, in the `dictation` block of the same
`settings.json`:

```json
{
  "dictation": {
    "enabled": true,
    "hotkey": "Ctrl+Shift+D",
    "model": "small",
    "language": "",
    "dictionary": "MediaChef, ffmpeg, whisper, хоткей, кодек, битрейт",
    "delivery": "clipboard",
    "history_depth": 0
  }
}
```

| Key | Values | Notes |
| --- | --- | --- |
| `enabled` | `true` \| `false` | off by default; the hotkey is not registered at all until you turn it on |
| `hotkey` | e.g. `Ctrl+Shift+D` | always a combination — a lone modifier cannot be a global shortcut |
| `model` | `tiny` \| `base` \| `small` \| `large-v3-turbo` | `small` by default: the recipes use it too, so it is usually already on disk |
| `language` | `""` \| `auto` \| a language code | empty means "same as the interface language" |
| `dictionary` | free text, ≤400 chars | fixes how names and jargon are spelled; see below |
| `delivery` | `clipboard` | the only value on macOS, permanently — see below |
| `history_depth` | `0`–`100` | `0` by default: nothing dictated is written to disk |

Restart the app after editing — the hotkey is registered at startup.

**The dictionary earns its place.** It is passed to whisper as an initial
prompt, and on our measurement it turned «медиашиф» and «ходкий» into
«MediaChef» and «хоткей» at a cost of 0.04 s. The cap is 400 characters because
whisper's real limit is in *tokens* (`n_text_ctx/2`, about 224): 398 characters
of Cyrillic already cost 185 tokens, while the same 400 characters of Latin text
cost roughly a third of that. Whisper truncates an over-long prompt **silently**,
so the app counts for you.

**No auto-paste on macOS, and that is permanent.** Typing the text into the
focused window needs the Accessibility permission, which macOS ties to the
executable's code signature — and an unsigned build's signature changes with
every update, so the permission would quietly stop working. Auto-paste ships on
Windows in wave 5.3. The microphone permission is re-requested after updates for
the same reason; that one is a single dialog and survivable.

## Installing (the channels we publish to)

```bash
# macOS — Apple Silicon
brew tap kom1sh/mediachef https://github.com/Kom1sh/mediachef
brew install --cask mediachef

# Windows
winget install Kom1sh.MediaChef
scoop bucket add mediachef https://github.com/Kom1sh/mediachef && scoop install mediachef
```

The Homebrew cask and the Scoop bucket live in this repository — `Casks/` and
`bucket/` at the root, which is where both tools look after a `tap`/`bucket add`
of an arbitrary URL. That saves two satellite repositories that would need a
second commit on every release. The winget manifests under `packaging/winget/`
are a staging copy: the real ones go to `microsoft/winget-pkgs` by pull request.

All three are regenerated from the published release, never by hand:

```bash
python3 scripts/packaging.py          # version from tauri.conf.json
python3 scripts/packaging.py 0.7.0
```

It streams each asset from the release page to compute its sha256, so a manifest
cannot end up describing a build that was never published. A manifest whose
asset is missing from that release is skipped with a line saying which.

## Updating in place

The app checks `releases/latest/download/latest.json` once at start and offers
what it finds; Settings has a manual check. Two properties are worth knowing
before touching any of it:

- **The check at start is silent about failure.** No network, run from source,
  installed from a `.deb` — none of those are things the user asked about, so
  none of them produce a message. Only the button in Settings answers out loud.
- **The private signing key is required to build a release.**
  `bundle.createUpdaterArtifacts` is on, so `tauri build` signs the update
  packages and fails without a key. The `preflight` job in `release.yml` checks
  the secret is present before spending twenty minutes on three runners.

The keypair was generated with `tauri signer generate`. The public half is in
`app/src-tauri/tauri.conf.json` under `plugins.updater.pubkey`; the private half
belongs in exactly two places — the repository secret and an offline backup:

```bash
gh secret set TAURI_SIGNING_PRIVATE_KEY < ~/.tauri/mediachef.key
```

Losing it means no installed copy can ever be updated again: the public key is
baked into every build that is already out there, and a package signed by a new
key is rejected by design.

`scripts/make-latest-json.py` builds the manifest in the `updater` job from the
three `.sig` files the platform jobs produce. It derives each package name from
its signature's filename rather than rebuilding it from a template, so the
manifest cannot drift from whatever Tauri actually named the file, and it fails
if any of the three platforms is missing rather than quietly publishing a
manifest that leaves one of them behind.

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
cargo test --manifest-path app/src-tauri/Cargo.toml # queue state machine; the app crate
                                                    # only *builds* with the sidecars in
                                                    # place, see Sidecars
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
