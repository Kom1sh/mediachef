import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import goldenJson from "../../../fixtures/ipc-recipe.golden.json";
import { buildIndex, normalize, search } from "./search";
import type { MediaType, Param, Recipe } from "./types";

const dir = path.resolve(__dirname, "../../../recipes");
const recipes = fs.readdirSync(dir).filter(f => f.endsWith(".yaml"))
  .map(f => yaml.load(fs.readFileSync(path.join(dir, f), "utf8")) as Recipe);
const index = buildIndex(recipes);

describe("normalize", () => {
  it("maps russian format names to latin", () => {
    expect(normalize("перевод МП3 в текст")).toBe("перевод mp3 в текст");
    expect(normalize("гифка")).toBe("gifка");
  });
});

describe("search", () => {
  it("finds extract-audio by russian alias", () => {
    expect(search(index, "вытащить звук")[0].id).toBe("extract-audio-mp3");
  });
  it("finds gif recipe by english", () => {
    expect(search(index, "make gif")[0].id).toBe("video-to-gif");
  });
  // Spec §14 acceptance query, verbatim: this exact phrase must put the gif
  // recipe first, not merely somewhere in the results.
  it("puts video-to-gif first for the acceptance query", () => {
    expect(search(index, "video to gif")[0].id).toBe("video-to-gif");
  });
  // Spec §5/§14 acceptance query, verbatim: the phrase a Russian user actually
  // types when they want a transcript has to land on the transcription recipe
  // first — normalize() latinises "мп3", the alias carries the rest.
  it("finds transcription by the spec's acceptance query", () => {
    expect(search(index, "перевод мп3 в текст")[0].id).toBe("transcribe-to-txt");
  });
  it("tolerates typo", () => {
    expect(search(index, "extrct audio").some(r => r.id === "extract-audio-mp3")).toBe(true);
  });

  /* Russian says "перевод" for both *transcription* ("перевод аудио в текст" —
     write down what was said) and *translation* ("перевод на английский" — say it
     in another language), so the two recipe families compete for one word. An
     alias parked on the wrong one silently hijacks the other's queries: this table
     is the measured routing, pinned, because getting it wrong is invisible in the
     Rust tests and costs the user the recipe they were looking for. */
  const ROUTING: [string, string][] = [
    ["перевод мп3 в текст", "transcribe-to-txt"],
    ["перевод аудио в текст", "transcribe-to-txt"],
    ["перевести аудио в текст", "transcribe-to-txt"],
    ["перевод речи в текст", "transcribe-to-txt"],
    ["текст из аудио", "transcribe-to-txt"],
    ["перевод видео в текст", "video-to-text"],
    ["перевести видео в текст", "video-to-text"],
    ["текст из видео", "video-to-text"],
    // the translation family keeps its own phrasings — "на английский" is the tell
    ["перевести аудио на английский", "translate-to-en-txt"],
    ["перевод аудио на английский текст", "translate-to-en-txt"],
  ];
  it.each(ROUTING)("routes %j to %s", (q, id) => {
    expect(search(index, q)[0].id).toBe(id);
  });
  it("filters by media type", () => {
    const audioOnly = search(index, "", "audio");
    expect(audioOnly.some(r => r.id === "convert-mp3-wav")).toBe(true);
    expect(audioOnly.some(r => r.id === "resize-720p")).toBe(false);
  });
});

/* IPC contract, TypeScript half. `app/core/src/catalog.rs` asserts this same
   golden file equals `serde_json::to_value(&bundled()[0])`, so the JSON below is
   literally what `invoke("recipes")` delivers. The assignment is the compile-time
   check: TypeScript widens every JSON string to `string`, so the three enum-shaped
   fields are re-narrowed here, and every other field has to line up with the
   hand-written mirror in types.ts — a field renamed or dropped on the Rust side
   surfaces as a missing property, not as a runtime surprise in the app. */
const golden: Recipe = {
  ...goldenJson,
  engine: goldenJson.engine as Recipe["engine"],
  input: { types: goldenJson.input.types as MediaType[] },
  params: goldenJson.params.map(p => ({ ...p, type: p.type as Param["type"] })),
};

describe("ipc golden recipe", () => {
  it("carries the field names and lowercase enums the mirror expects", () => {
    expect(golden.id).toBe("compress-video-crf");
    expect(golden.engine).toBe("ffmpeg");
    expect(golden.input.types).toEqual(["video"]);
    // `type` is Rust's `r#type` renamed on the wire — the rename is easy to lose.
    expect(golden.params[0].type).toBe("enum");
    expect(golden.output.ext).toBe("mp4");
    expect(golden.output.suffix).toBe("compressed");
    for (const s of [golden.engine, golden.params[0].type, ...golden.input.types]) {
      expect(s).toBe(s.toLowerCase());
    }
  });

  it("spells absent options as null rather than dropping the key", () => {
    expect(golden.params[0].min).toBeNull();
    expect(golden.params[0].unit).toBeNull();
    expect("min" in golden.params[0]).toBe(true);
  });

  it("is consumable by the search index as shipped", () => {
    expect(search(buildIndex([golden]), "compress video")[0].id).toBe("compress-video-crf");
  });
});
