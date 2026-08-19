import { useId } from "react";
import { Flame, SearchX, type LucideIcon } from "lucide-react";
import { categoryIcon, categoryTint } from "../lib/icons";
import { categoryLabel, loc, useLocale, useT } from "../lib/i18n";
import type { Recipe } from "../lib/types";

/**
 * The shelf that opens the browse view. A hand-picked six rather than the most
 * clicked six: there is no usage data on a fresh install, and these are the jobs
 * the app was built to make one-click — a transcript, subtitles, the audio out of
 * a video, a smaller file, a gif, a container swap.
 *
 * Ids that no longer exist in the catalog simply do not render (the shelf is
 * looked up in the list it is shown beside), so a renamed recipe costs a slot and
 * never a blank card.
 */
const POPULAR: readonly string[] = [
  "transcribe-to-txt",
  "video-subtitles-srt",
  "extract-audio-mp3",
  "compress-video-crf",
  "video-to-gif",
  "convert-mp4-mkv",
];

/** One recipe. The icon tile carries the category, so a card is recognisable
 *  before its title is read — and the same tile appears on the form the card
 *  opens, which is what makes the two feel like one object. */
function RecipeCard({ recipe, onPick }: { recipe: Recipe; onPick: () => void }) {
  // Recipe text lives in the catalog, not in the dictionary, so the card needs the
  // locale itself rather than a key.
  const locale = useLocale();
  const Icon = categoryIcon(recipe.category);
  return (
    <button type="button" onClick={onPick}
      className="flex w-full items-start gap-3 rounded-xl border border-line bg-card p-3 text-left transition hover:border-basil hover:shadow-sm">
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${categoryTint(recipe.category)}`}>
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{loc(recipe.title, locale)}</span>
        <span className="mt-0.5 line-clamp-2 block text-xs text-ink-2">{loc(recipe.description, locale)}</span>
      </span>
    </button>
  );
}

/** A titled shelf of cards. The count is the section's own promise: it is taken
 *  from the array being rendered, not computed a second way, so a header can
 *  never disagree with the cards under it. */
function Section({ icon: Icon, label, recipes, onPick }: {
  icon: LucideIcon;
  label: string;
  recipes: Recipe[];
  onPick: (r: Recipe) => void;
}) {
  // A `<section>` is only a landmark once it has a name, and until it has one it is
  // a plain box: the shelves would be an undifferentiated run of buttons to anyone
  // navigating by region. Pointing the section at its own heading names it without
  // writing the label twice — and `useId` is what keeps the reference unique when
  // fourteen of these render on one screen.
  const headingId = useId();
  return (
    <section className="flex flex-col gap-2" aria-labelledby={headingId}>
      <h3 id={headingId} className="flex items-center gap-2 text-xs font-semibold text-ink-2">
        <Icon className="size-4 shrink-0" aria-hidden />
        <span className="min-w-0 truncate">{label}</span>
        {/* tabular numerals: the counts sit in a column down the page and would
            otherwise jitter between 1 and 8. `text-ink` rather than inheriting the
            heading's `ink-2`: on the `card-2` pill that pair measures 4.25:1 in the
            light theme, under the 4.5 small text has to clear. */}
        <span className="shrink-0 rounded-full bg-card-2 px-1.5 text-[10px] text-ink tabular-nums">{recipes.length}</span>
      </h3>
      <Cards recipes={recipes} onPick={onPick} />
    </section>
  );
}

/** Two columns where the middle column can afford them. The board is the window
 *  minus the 88px rail, the 360px queue and 32px of padding — 280px at the 760px
 *  minimum, where two columns would leave a word per line, and ~520px at 1000px,
 *  where each of the two has room for a title. */
function Cards({ recipes, onPick }: { recipes: Recipe[]; onPick: (r: Recipe) => void }) {
  return (
    <div className="grid grid-cols-1 gap-2 min-[1000px]:grid-cols-2">
      {recipes.map(r => <RecipeCard key={r.id} recipe={r} onPick={() => onPick(r)} />)}
    </div>
  );
}

/**
 * The browse view, in two modes.
 *
 * With an empty query it is a catalogue: the popular shelf first, then one section
 * per category. With a query it is a result list — flat, in relevance order, which
 * is the one thing grouping would destroy.
 *
 * `recipes` arrives already filtered by what the active file can be cooked into
 * (`search()` does it), and every section here is a slice of that same array — so
 * "does this recipe fit my file" is answered in exactly one place and the shelf
 * cannot offer a transcription for a subtitle file.
 */
export function RecipeList({ recipes, query, onPick, onClearSearch }: {
  recipes: Recipe[];
  /** The search box's text — the switch between catalogue and results, and what
   *  decides whether "nothing found" has a search worth clearing. */
  query: string;
  onPick: (r: Recipe) => void;
  onClearSearch: () => void;
}) {
  const t = useT();
  const locale = useLocale();
  const searching = query.trim() !== "";

  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <SearchX className="size-7 text-ink-2" aria-hidden />
        <p className="text-sm text-ink-2">{t("nothingFound")}</p>
        {/* Only with a query to clear. An empty query that found nothing means the
            file itself has no recipes — a button that emptied an empty box would
            be an offer to fix the wrong thing. */}
        {searching && (
          <button type="button" onClick={onClearSearch}
            className="rounded-lg border border-line bg-card px-3 py-1.5 text-sm font-medium transition hover:border-basil">
            {t("clearSearch")}
          </button>
        )}
      </div>
    );
  }

  if (searching) return <Cards recipes={recipes} onPick={onPick} />;

  const byId = new Map(recipes.map(r => [r.id, r]));
  const popular = POPULAR.map(id => byId.get(id)).filter((r): r is Recipe => r !== undefined);

  // A Map keyed by category, filled in the order the categories are met — which is
  // the order `search()` sorted them into. Section order therefore follows the
  // list rather than being sorted a second, divergent time here.
  const byCategory = new Map<string, Recipe[]>();
  for (const r of recipes) {
    const shelf = byCategory.get(r.category);
    if (shelf) shelf.push(r);
    else byCategory.set(r.category, [r]);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* The popular six stay in their categories below as well: the shelf is a
          short cut, not a partition, and a recipe that vanished from its own
          category because it was popular would be missing from the only place a
          user knows to look for it. */}
      {popular.length > 0 && <Section icon={Flame} label={t("popular")} recipes={popular} onPick={onPick} />}
      {[...byCategory].map(([category, shelf]) => (
        <Section key={category} icon={categoryIcon(category)} label={categoryLabel(category, locale)}
          recipes={shelf} onPick={onPick} />
      ))}
    </div>
  );
}
