import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { buildIndex, normalize, search } from "./search";
import type { Recipe } from "./types";

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
  it("tolerates typo", () => {
    expect(search(index, "extrct audio").some(r => r.id === "extract-audio-mp3")).toBe(true);
  });
  it("filters by media type", () => {
    const audioOnly = search(index, "", "audio");
    expect(audioOnly.some(r => r.id === "convert-mp3-wav")).toBe(true);
    expect(audioOnly.some(r => r.id === "resize-720p")).toBe(false);
  });
});
