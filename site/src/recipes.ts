// Каталог рецептов, прочитанный из тех же YAML, что собирает приложение.
//
// Смысл именно в общем источнике: названия, описания и алиасы уже переведены
// на десять языков и проверены тестами ядра (catalog.rs требует заголовок и
// алиасы на каждую локаль). Копировать их в тексты сайта означало бы завести
// вторую правду, которая разойдётся с первой на следующем же рецепте.
//
// Чтение синхронное и на этапе сборки: страницы статические, в рантайме этого
// кода нет. Ошибка в YAML валит сборку — так и задумано, лучше упасть здесь,
// чем выложить каталог с пустой карточкой.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parse } from "yaml";
import { LOCALES, type Locale } from "./content";

/**
 * Каталог ищем подъёмом от рабочего каталога, а не от `import.meta.url`:
 * на этапе генерации страниц модуль уже собран и лежит в site/dist/pages,
 * так что относительный путь от файла указал бы в site/dist/recipes.
 * Дно цикла — корень тома, поэтому «не нашли» кончается внятной ошибкой,
 * а не бесконечным подъёмом.
 */
function findRecipeDir(): string {
  let dir = resolve(process.cwd());
  for (;;) {
    const candidate = join(dir, "recipes");
    if (existsSync(join(candidate, "extract-audio-mp3.yaml"))) return candidate;
    const up = dirname(dir);
    if (up === dir) throw new Error("не нашёл каталог recipes/ ни в одном родителе " + process.cwd());
    dir = up;
  }
}

const DIR = findRecipeDir();

/** Строка, переведённая на все локали: в YAML это блок `en: … ru: …`. */
type LocMap = Record<string, string>;
type LocList = Record<string, string[]>;

interface RawParam {
  key: string;
  type: string;
  values?: string[];
  default?: string;
  label: LocMap;
}

interface RawRecipe {
  id: string;
  category: string;
  title: LocMap;
  aliases: LocList;
  description: LocMap;
  input: { types: string[] };
  params?: RawParam[];
  output: { ext: string; suffix?: string };
  seo?: { slug: string; priority: "high" | "medium" | "low" };
}

export interface RecipeParam {
  label: string;
  values: string[];
  fallback?: string;
}

export interface Recipe {
  id: string;
  category: string;
  /** Приоритет из YAML: каталог ставит частое выше редкого. */
  priority: "high" | "medium" | "low";
  accepts: string[];
  ext: string;
  title(locale: Locale): string;
  description(locale: Locale): string;
  aliases(locale: Locale): string[];
  params(locale: Locale): RecipeParam[];
}

/** Английский — эталон: ядро требует его у каждой строки, поэтому он всегда есть. */
function pick(map: LocMap | undefined, locale: Locale): string {
  return map?.[locale] ?? map?.en ?? "";
}

const RANK = { high: 0, medium: 1, low: 2 } as const;

function load(): Recipe[] {
  const files = readdirSync(DIR).filter((f) => f.endsWith(".yaml")).sort();
  const out = files.map((file) => {
    const raw = parse(readFileSync(join(DIR, file), "utf8")) as RawRecipe;
    for (const field of ["id", "category", "title", "description", "input", "output"] as const) {
      if (!raw?.[field]) throw new Error(`recipes/${file}: нет поля ${field}`);
    }
    // Ядро гарантирует перевод на каждую локаль; проверяем и здесь, потому что
    // сайт собирается отдельно от Rust-тестов и молча отдал бы английский.
    for (const locale of LOCALES) {
      if (!raw.title[locale]) throw new Error(`recipes/${file}: нет title.${locale}`);
      if (!raw.description[locale]) throw new Error(`recipes/${file}: нет description.${locale}`);
    }
    return {
      id: raw.id,
      category: raw.category,
      priority: raw.seo?.priority ?? "low",
      accepts: raw.input.types,
      ext: raw.output.ext,
      title: (l: Locale) => pick(raw.title, l),
      description: (l: Locale) => pick(raw.description, l),
      aliases: (l: Locale) => raw.aliases?.[l] ?? raw.aliases?.en ?? [],
      params: (l: Locale) =>
        (raw.params ?? []).map((p) => ({
          label: pick(p.label, l),
          values: p.values ?? [],
          fallback: p.default,
        })),
    } satisfies Recipe;
  });

  // Внутри категории — сначала то, что ищут чаще: приоритет из seo-блока.
  return out.sort((a, b) => RANK[a.priority] - RANK[b.priority] || a.id.localeCompare(b.id));
}

export const RECIPES: Recipe[] = load();

/**
 * Разделы каталога. Категорий из YAML десять, и восемь из них — по одному
 * рецепту: страница из восьми заголовков над одинокой карточкой читается плохо.
 * Поэтому на сайте они сведены в четыре раздела по смыслу результата, а
 * исходная категория осталась плашкой на самой карточке — так человек, пришедший
 * из поиска, увидит в приложении ровно то же слово.
 *
 * Ключи слева — все категории из recipes/*.yaml. Новая категория без строки
 * здесь валит сборку: лучше упасть, чем тихо потерять рецепт из каталога.
 */
const BUCKET: Record<string, SectionId> = {
  transcribe: "speech",
  "convert-video": "video",
  compress: "video",
  cut: "video",
  geometry: "video",
  gif: "video",
  "audio-in-video": "video",
  extract: "audio",
  "convert-audio": "audio",
  advanced: "advanced",
};

export type SectionId = "speech" | "video" | "audio" | "advanced";

/** Порядок разделов на странице: от крупного к мелкому. */
export const SECTION_ORDER: SectionId[] = ["speech", "video", "audio", "advanced"];

export const SECTIONS: { id: SectionId; recipes: Recipe[] }[] = (() => {
  const groups = new Map<SectionId, Recipe[]>();
  for (const r of RECIPES) {
    const id = BUCKET[r.category];
    if (!id) throw new Error(`recipes/${r.id}: категория «${r.category}» не отнесена к разделу каталога`);
    const list = groups.get(id);
    if (list) list.push(r);
    else groups.set(id, [r]);
  }
  return SECTION_ORDER.filter((id) => groups.has(id)).map((id) => ({ id, recipes: groups.get(id)! }));
})();

export const RECIPE_COUNT = RECIPES.length;
