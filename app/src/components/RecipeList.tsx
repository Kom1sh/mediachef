import type { Recipe } from "../lib/types";

export function RecipeList({ recipes, onPick }: { recipes: Recipe[]; onPick: (r: Recipe) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {recipes.map(r => (
        <button key={r.id} onClick={() => onPick(r)}
          className="rounded-lg border border-neutral-700 p-3 text-left hover:border-blue-500">
          <div className="text-sm font-medium">{r.title.en}</div>
          <div className="mt-0.5 line-clamp-2 text-xs text-neutral-400">{r.description.en}</div>
        </button>
      ))}
      {recipes.length === 0 && <div className="col-span-2 text-sm text-neutral-500">Nothing found</div>}
    </div>
  );
}
