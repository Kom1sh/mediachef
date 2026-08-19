import { loc, useLocale, useT } from "../lib/i18n";
import type { Recipe } from "../lib/types";

export function RecipeList({ recipes, onPick }: { recipes: Recipe[]; onPick: (r: Recipe) => void }) {
  const t = useT();
  // Recipe text lives in the catalog, not in the dictionary, so the card needs the
  // locale itself rather than a key.
  const locale = useLocale();
  return (
    <div className="grid grid-cols-2 gap-2">
      {recipes.map(r => (
        <button key={r.id} onClick={() => onPick(r)}
          className="rounded-lg border border-neutral-700 p-3 text-left hover:border-blue-500">
          <div className="text-sm font-medium">{loc(r.title, locale)}</div>
          <div className="mt-0.5 line-clamp-2 text-xs text-neutral-400">{loc(r.description, locale)}</div>
        </button>
      ))}
      {recipes.length === 0 && <div className="col-span-2 text-sm text-neutral-500">{t("nothingFound")}</div>}
    </div>
  );
}
