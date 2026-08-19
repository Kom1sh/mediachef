import { APP_ICON, NAV, type NavKey } from "../lib/icons";

/** Which screen the shell is showing. Aliased from the icon map's key type so
 *  the nav and its icons are the same three names by construction. */
export type Tab = NavKey;

const ORDER: readonly Tab[] = ["main", "models", "settings"];
// English for now: T3 replaces these with `t()` once the dictionary exists.
const LABEL: Record<Tab, string> = { main: "Convert", models: "Models", settings: "Settings" };

/**
 * The 72px rail. Icons carry the navigation; the labels under them are a
 * courtesy that gets out of the way when the window is narrow (≤800px), where a
 * 72px column and a word are competing for the same pixels. `title` keeps the
 * name reachable in that state, and the icons never move.
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
            key={t} type="button" onClick={() => onTab(t)} title={LABEL[t]}
            aria-current={on ? "page" : undefined}
            className={`flex w-14 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] font-medium ${
              on ? "bg-card-2 text-ink" : "text-ink-2 hover:bg-card-2 hover:text-ink"
            }`}
          >
            <Icon className="size-5" aria-hidden />
            <span className="max-[800px]:hidden">{LABEL[t]}</span>
          </button>
        );
      })}
    </nav>
  );
}
