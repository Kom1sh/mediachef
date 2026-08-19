import Fuse from "fuse.js";
import type { MediaType, Recipe } from "./types";

const RU_FORMATS: Record<string, string> = {
  "мп3": "mp3", "мп4": "mp4", "вав": "wav", "гиф": "gif",
  "мкв": "mkv", "мов": "mov", "ави": "avi", "флак": "flac",
};

export function normalize(q: string): string {
  let s = q.toLowerCase().replace(/ё/g, "е");
  for (const [ru, en] of Object.entries(RU_FORMATS)) s = s.replaceAll(ru, en);
  return s;
}

export interface SearchIndex {
  fuse: Fuse<Recipe>;
  all: Recipe[];
}

export function buildIndex(recipes: Recipe[]): SearchIndex {
  const fuse = new Fuse(recipes, {
    threshold: 0.35,
    ignoreLocation: true,
    keys: [
      { name: "title.en", weight: 2, getFn: r => normalize(r.title.en) },
      { name: "title.ru", weight: 2, getFn: r => normalize(r.title.ru) },
      { name: "aliases.en", weight: 1, getFn: r => r.aliases.en.map(normalize) },
      { name: "aliases.ru", weight: 1, getFn: r => r.aliases.ru.map(normalize) },
    ],
  });
  return { fuse, all: recipes };
}

/**
 * Does this recipe accept that media type? Exported because the batch-enqueue gate
 * asks the same question of every file in the list, and two answers to "can this
 * recipe run on this file" — one filtering the list, one arming the button — would
 * eventually disagree.
 *
 * `mt` undefined means "no type to check against" and answers `true`: for the
 * recipe list that is the unfiltered state. A caller that needs a *promise* about
 * a file (the batch gate) must therefore establish the type itself first.
 */
export function applicable(r: Recipe, mt?: MediaType): boolean {
  if (!mt) return true;
  return r.input.types.includes("any") || r.input.types.includes(mt);
}

export function search(index: SearchIndex, q: string, mediaType?: MediaType): Recipe[] {
  const base = q.trim()
    ? index.fuse.search(normalize(q)).map(x => x.item)
    : [...index.all].sort((a, b) => a.category.localeCompare(b.category));
  return base.filter(r => applicable(r, mediaType));
}
