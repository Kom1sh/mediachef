import { useState } from "react";
import { Bell, FolderOpen, Gauge, Languages, Palette } from "lucide-react";
import { pickFolder } from "../lib/ipc";
import type { AppSettings } from "../lib/types";
import type { LucideIcon } from "lucide-react";

/** One option of a segmented control: the stored value and the word for it. */
interface Choice<T extends string> {
  value: T;
  label: string;
}

// English for now, like the rail's labels: T3 replaces every string here with
// `t()` once the dictionary exists. The language *names* stay in their own
// language either way — a Russian speaker looking for the switch is looking for
// "Русский", not for whatever the current UI calls it.
const LANGUAGES: readonly Choice<AppSettings["language"]>[] = [
  { value: "system", label: "System" },
  { value: "en", label: "English" },
  { value: "ru", label: "Русский" },
];
const THEMES: readonly Choice<AppSettings["theme"]>[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];
const MODES: readonly Choice<AppSettings["output_mode"]>[] = [
  { value: "beside", label: "Next to input" },
  { value: "fixed", label: "Fixed folder" },
];
const WORKERS: readonly Choice<string>[] = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
];

/**
 * A segmented control built on real radio inputs.
 *
 * The inputs are visually hidden rather than replaced by buttons, which buys the
 * whole native contract for free: one tab stop for the group, arrow keys moving
 * between options, and a screen reader announcing "2 of 3" without a line of
 * ARIA bookkeeping. `role="radiogroup"` is here only to give the set a name —
 * the grouping itself comes from the shared `name`.
 */
function Segmented<T extends string>({
  name,
  label,
  value,
  choices,
  onPick,
}: {
  name: string;
  label: string;
  value: T;
  choices: readonly Choice<T>[];
  onPick: (v: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex flex-wrap gap-1 rounded-lg border border-line bg-card-2 p-1"
    >
      {choices.map(c => {
        const on = c.value === value;
        return (
          <label
            key={c.value}
            // The focus ring is an *outline with an offset*, matching the global
            // `:focus-visible` rule — and not a `ring`, which would draw basil
            // directly against the basil chip of the option that is already
            // selected, i.e. exactly the option keyboard focus lands on first.
            className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${
              on ? "bg-basil text-basil-ink" : "text-ink-2 hover:bg-card hover:text-ink"
            }`}
          >
            <input
              type="radio" name={name} value={c.value} checked={on} className="sr-only"
              onChange={() => onPick(c.value)}
            />
            {c.label}
          </label>
        );
      })}
    </div>
  );
}

/** An on/off switch. `role="switch"` on a button, so Space and Enter work and the
 *  state is announced as on/off rather than as "pressed". */
function Switch({ label, on, onToggle }: { label: string; on: boolean; onToggle: (v: boolean) => void }) {
  return (
    <button
      type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onToggle(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
        on ? "border-basil bg-basil" : "border-line bg-card-2"
      }`}
    >
      {/* The knob takes `basil-ink` when on — the token that exists precisely to
          be legible on basil — and `ink-2` when off, which reads against the
          card-2 track in both themes. */}
      <span
        className={`absolute top-0.5 size-4 rounded-full transition-all ${
          on ? "left-6 bg-basil-ink" : "left-1 bg-ink-2"
        }`}
      />
    </button>
  );
}

/** One setting: icon tile, name, one-line explanation, control. `footer` is a
 *  full-width line below them, for a control that needs the room (the output
 *  path). The row wraps rather than squeezing, so a narrow window stacks it. */
function Row({
  icon: Icon,
  label,
  hint,
  children,
  footer,
}: {
  icon: LucideIcon;
  label: string;
  hint: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-card p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card-2 text-ink-2">
          <Icon className="size-4.5" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-ink">{label}</span>
          <span className="block text-xs text-ink-2">{hint}</span>
        </span>
      </div>
      {children}
      {footer}
    </div>
  );
}

/**
 * The Settings screen. Owns no state of its own beyond a dialog error: every
 * change is handed straight to `onChange`, which saves it and adopts whatever
 * Rust says was actually stored.
 */
export function SettingsPanel({
  settings: s,
  onChange,
  error,
}: {
  settings: AppSettings;
  onChange: (s: AppSettings) => void;
  /** A failed save, shown where the user just clicked. */
  error?: string;
}) {
  const [pickError, setPickError] = useState("");

  // Choosing a folder implies the fixed mode: picking a destination and then
  // having the files land somewhere else would be nonsense.
  const choose = async () => {
    try {
      const dir = await pickFolder();
      setPickError("");
      if (dir) onChange({ ...s, output_mode: "fixed", output_dir: dir });
    } catch (e) {
      setPickError(String(e));
    }
  };

  // "Fixed" with no folder is not a configuration — Rust's `sanitize` demotes it
  // back to "beside" — so the radio asks for a folder instead of flipping and
  // then springing back when the save answers.
  const pickMode = (mode: AppSettings["output_mode"]) => {
    if (mode === "beside") onChange({ ...s, output_mode: "beside" });
    else if (s.output_dir) onChange({ ...s, output_mode: "fixed" });
    else void choose();
  };

  const notice = error || pickError;
  return (
    <section className="min-h-0 overflow-y-auto p-4">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
        <h1 className="text-base font-bold text-ink">Settings</h1>
        {notice ? (
          <p className="rounded-lg border border-tomato bg-card p-2 text-xs text-tomato">{notice}</p>
        ) : null}

        <Row icon={Languages} label="Language" hint="«System» follows your OS.">
          <Segmented
            name="mc-language" label="Language" value={s.language} choices={LANGUAGES}
            onPick={language => onChange({ ...s, language })}
          />
        </Row>

        <Row icon={Palette} label="Theme" hint="Applies immediately.">
          <Segmented
            name="mc-theme" label="Theme" value={s.theme} choices={THEMES}
            onPick={theme => onChange({ ...s, theme })}
          />
        </Row>

        <Row
          icon={FolderOpen} label="Output folder" hint="Where finished files are written."
          footer={
            s.output_mode === "fixed" ? (
              <div className="flex w-full items-center gap-2 border-t border-line pt-3">
                <span
                  className="min-w-0 flex-1 truncate font-mono text-[11px] text-ink-2"
                  title={s.output_dir ?? ""}
                >
                  {s.output_dir}
                </span>
                <button
                  type="button" onClick={() => void choose()}
                  className="shrink-0 rounded-md border border-line bg-card-2 px-2 py-1 text-xs font-semibold text-ink hover:bg-paper"
                >
                  Change…
                </button>
              </div>
            ) : undefined
          }
        >
          <Segmented
            name="mc-output" label="Output folder" value={s.output_mode} choices={MODES}
            onPick={pickMode}
          />
        </Row>

        <Row icon={Bell} label="Notifications" hint="A desktop alert when a job finishes.">
          <Switch
            label="Notifications" on={s.notifications}
            onToggle={notifications => onChange({ ...s, notifications })}
          />
        </Row>

        <Row
          icon={Gauge} label="Parallel conversions"
          // The one setting that is not live, and it says so where it is set
          // rather than in a release note: the workers are spawned once, at boot.
          hint="How many ffmpeg jobs run at once. Takes effect after a restart."
        >
          <Segmented
            name="mc-workers" label="Parallel conversions" value={String(s.ffmpeg_workers)}
            choices={WORKERS}
            onPick={v => onChange({ ...s, ffmpeg_workers: Number(v) })}
          />
        </Row>
      </div>
    </section>
  );
}
