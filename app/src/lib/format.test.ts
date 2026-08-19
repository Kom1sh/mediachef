import { describe, expect, it } from "vitest";
import { basename, duration, size } from "./format";

const EN = { kb: "KB", mb: "MB", gb: "GB" };
const RU = { kb: "КБ", mb: "МБ", gb: "ГБ" };

describe("size", () => {
  it("prints kilobytes under a megabyte", () => {
    expect(size(300_000, EN)).toBe("300 KB");
    expect(size(40_000, EN)).toBe("40 KB");
    expect(size(999_000, EN)).toBe("999 KB");
  });

  // A file with bytes in it is never "0": that reads as an empty file, or as a
  // probe that failed, rather than as a small subtitle track.
  it("rounds a sub-kilobyte file up to 1, and only an empty one to 0", () => {
    expect(size(400, EN)).toBe("1 KB");
    expect(size(1, EN)).toBe("1 KB");
    expect(size(0, EN)).toBe("0 KB");
  });

  it("prints megabytes with one decimal below 10 MB, whole above", () => {
    expect(size(1_000_000, EN)).toBe("1.0 MB");
    expect(size(1_500_000, EN)).toBe("1.5 MB");
    expect(size(4_400_000, EN)).toBe("4.4 MB");
    expect(size(10_000_000, EN)).toBe("10 MB");
    expect(size(74_300_000, EN)).toBe("74 MB");
  });

  it("switches to gigabytes at 1 GB, with one decimal", () => {
    expect(size(1_000_000_000, EN)).toBe("1.0 GB");
    expect(size(3_210_000_000, EN)).toBe("3.2 GB");
    // Just under the boundary stays in megabytes — the rounding there is the
    // formatter's own, so it is worth pinning rather than assuming.
    expect(size(999_000_000, EN)).toBe("999 MB");
  });

  it("takes the unit words as given, so the caller can pass a locale's own", () => {
    expect(size(300_000, RU)).toBe("300 КБ");
    expect(size(74_300_000, RU)).toBe("74 МБ");
    expect(size(3_210_000_000, RU)).toBe("3.2 ГБ");
  });
});

describe("duration", () => {
  it("is a two-field clock under an hour", () => {
    expect(duration(0)).toBe("00:00");
    expect(duration(5)).toBe("00:05");
    expect(duration(90)).toBe("01:30");
    expect(duration(3599)).toBe("59:59");
  });

  it("grows an hours field from an hour up", () => {
    expect(duration(3600)).toBe("1:00:00");
    expect(duration(5400)).toBe("1:30:00");
    expect(duration(37_230)).toBe("10:20:30");
  });

  it("rounds to the nearest second", () => {
    expect(duration(59.6)).toBe("01:00");
    expect(duration(12.2)).toBe("00:12");
  });

  // An ETA is extrapolated, so a stale clock can go negative between two ticks.
  it("clamps a negative clock to zero", () => {
    expect(duration(-7)).toBe("00:00");
  });
});

describe("basename", () => {
  it("takes the last segment of a unix path", () => {
    expect(basename("/Users/me/Videos/holiday.mp4")).toBe("holiday.mp4");
    expect(basename("/holiday.mp4")).toBe("holiday.mp4");
  });

  // The reason this function exists: five call sites spelled it `split("/")`, which
  // on Windows finds no separator and hands the card an entire path.
  it("takes the last segment of a windows path", () => {
    expect(basename("C:\\Users\\me\\Videos\\holiday.mp4")).toBe("holiday.mp4");
    // Mixed separators are legal on Windows and do turn up in hand-typed paths.
    expect(basename("C:/Users/me\\holiday.mp4")).toBe("holiday.mp4");
    expect(basename("\\\\server\\share\\clip.mkv")).toBe("clip.mkv");
  });

  it("leaves a bare name alone", () => {
    expect(basename("holiday.mp4")).toBe("holiday.mp4");
    expect(basename("")).toBe("");
  });

  // A directory rather than a file, which none of the callers can be handed — pinned
  // because it is the one input where "the last segment" has two defensible answers,
  // and this is the one the `split` it replaced gave.
  it("answers empty for a path that ends in a separator", () => {
    expect(basename("/Users/me/Videos/")).toBe("");
  });

  it("keeps a name with spaces, dots and non-latin letters whole", () => {
    expect(basename("/Users/me/Мои видео/отпуск 2026.final.mp4")).toBe("отпуск 2026.final.mp4");
  });
});
