import { APP_ICON, NAV, type NavKey } from "../lib/icons";
import { useT, type TKey } from "../lib/i18n";

/** Which screen the shell is showing. Aliased from the icon map's key type so
 *  the nav and its icons are the same three names by construction. */
export type Tab = NavKey;

const ORDER: readonly Tab[] = ["main", "models", "settings"];
/** Dictionary key per screen — the words themselves live in i18n.tsx. */
const LABEL: Record<Tab, TKey> = { main: "navConvert", models: "navModels", settings: "navSettings" };

/**
 * The 88px rail. Icons carry the navigation; the labels under them are a
 * courtesy that gets out of the way below 800px, where a rail and a word are
 * competing for the same pixels — so every button states its name in
 * `aria-label` unconditionally: a `display:none` span contributes nothing to the
 * accessible name.
 *
 * No `title` alongside it. With an `aria-label` present, `title` is demoted to
 * the *description*, which is announced after the name — so a rail button would
 * say "Конвертация, Конвертация" to a screen reader for no gain: the label is
 * already visible, and hidden only at a width where the tooltip is the least of
 * the user's problems.
 *
 * The width is set by the longest Russian label, measured rather than guessed:
 * «Конвертация» is 63.4px at 10px Manrope-500, so the button is `w-20` (80px,
 * 72px inside its padding) and the rail 88px around it. The 80px rail this
 * started as left the label 56px and broke the word across two lines as
 * «Конвертац/ия».
 *
 * The focus ring is a hair tighter than that arithmetic looks: 88px minus the 1px
 * `border-r` leaves an 87px content box, so a centred 80px button has 3.5px on
 * each side and the ring wants 4 (2px outline at 2px offset). Its outermost half
 * pixel therefore sits *on* the rail's own border on the right and at the window
 * edge on the left — the ring reads as flush with the rail rather than inset
 * inside it, which is cosmetic and was measured, not assumed. A 76px button would
 * inset it fully and still hold the label (68px of room for 63.4), at the cost of
 * a narrower active pill.
 */
export function Sidebar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const t = useT();
  const Logo = APP_ICON;
  return (
    <nav aria-label={t("navSections")} className="flex h-full flex-col items-center gap-1 border-r border-line bg-card py-3">
      <div className="mb-3 flex flex-col items-center gap-1">
        <Logo className="size-6 text-basil" aria-hidden />
        {/* Unbounded, and only here: the display face is the shop sign, not a UI
            font. Tight tracking is what fits nine wide glyphs into the rail. */}
        <span className="font-display text-[9px] font-semibold tracking-[-0.04em] text-ink max-[800px]:hidden">
          {t("appName")}
        </span>
      </div>
      {/* `id`, not `t` — the parameter would shadow the translator. */}
      {ORDER.map(id => {
        const Icon = NAV[id];
        const on = tab === id;
        const label = t(LABEL[id]);
        return (
          <button
            key={id} type="button" onClick={() => onTab(id)} aria-label={label}
            aria-current={on ? "page" : undefined}
            className={`flex w-20 flex-col items-center gap-1 rounded-lg px-1 py-2 text-center text-[10px] font-medium leading-tight ${
              on ? "bg-card-2 text-ink" : "text-ink-2 hover:bg-card-2 hover:text-ink"
            }`}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            {/* The rail is wide enough for every label this app has, so the break
                rule is a backstop rather than the normal case: a longer word in a
                future locale should fold inside itself rather than push the rail
                out of shape. */}
            <span className="[overflow-wrap:anywhere] max-[800px]:hidden">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
