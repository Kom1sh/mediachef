import { APP_ICON, NAV, type NavKey } from "../lib/icons";

/** Which screen the shell is showing. Aliased from the icon map's key type so
 *  the nav and its icons are the same three names by construction. */
export type Tab = NavKey;

const ORDER: readonly Tab[] = ["main", "models", "settings"];
// English for now: T3 replaces these with `t()` once the dictionary exists.
const LABEL: Record<Tab, string> = { main: "Convert", models: "Models", settings: "Settings" };

/**
 * The 80px rail. Icons carry the navigation; the labels under them are a
 * courtesy that gets out of the way below 800px, where a rail and a word are
 * competing for the same pixels — so every button states its name in
 * `aria-label` unconditionally: a `display:none` span contributes nothing to the
 * accessible name, and `title` alone is a weak, inconsistently announced
 * fallback. The width and the two-line allowance are sized for Russian
 * («Конвертация» arrives with T3), not for the English labels below.
 */
export function Sidebar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const Logo = APP_ICON;
  return (
    <nav aria-label="Sections" className="flex h-full flex-col items-center gap-1 border-r border-line bg-card py-3">
      <div className="mb-3 flex flex-col items-center gap-1">
        <Logo className="size-6 text-basil" aria-hidden />
        {/* Unbounded, and only here: the display face is the shop sign, not a UI
            font. Tight tracking is what fits nine wide glyphs into the rail. */}
        <span className="font-display text-[9px] font-semibold tracking-[-0.04em] text-ink max-[800px]:hidden">
          MediaChef
        </span>
      </div>
      {ORDER.map(t => {
        const Icon = NAV[t];
        const on = tab === t;
        return (
          <button
            key={t} type="button" onClick={() => onTab(t)} title={LABEL[t]} aria-label={LABEL[t]}
            aria-current={on ? "page" : undefined}
            className={`flex w-16 flex-col items-center gap-1 rounded-lg px-1 py-2 text-center text-[10px] font-medium leading-tight ${
              on ? "bg-card-2 text-ink" : "text-ink-2 hover:bg-card-2 hover:text-ink"
            }`}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            {/* Breaking inside a word is the lesser evil at this width: a long
                Russian label would otherwise push out of the rail. */}
            <span className="[overflow-wrap:anywhere] max-[800px]:hidden">{LABEL[t]}</span>
          </button>
        );
      })}
    </nav>
  );
}
