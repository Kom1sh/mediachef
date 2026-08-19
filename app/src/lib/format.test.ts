import { describe, expect, it } from "vitest";
import { duration, size } from "./format";

describe("size", () => {
  it("prints megabytes below a gigabyte, without decimals", () => {
    expect(size(0, "GB", "MB")).toBe("0 MB");
    expect(size(1_500_000, "GB", "MB")).toBe("2 MB");
    expect(size(74_300_000, "GB", "MB")).toBe("74 MB");
  });

  it("switches to gigabytes at 1 GB, with one decimal", () => {
    expect(size(1_000_000_000, "GB", "MB")).toBe("1.0 GB");
    expect(size(3_210_000_000, "GB", "MB")).toBe("3.2 GB");
    // Just under the boundary stays in megabytes — the rounding there is the
    // formatter's own, so it is worth pinning rather than assuming.
    expect(size(999_000_000, "GB", "MB")).toBe("999 MB");
  });

  it("takes the unit words as given, so the caller can pass a locale's own", () => {
    expect(size(74_300_000, "ГБ", "МБ")).toBe("74 МБ");
    expect(size(3_210_000_000, "ГБ", "МБ")).toBe("3.2 ГБ");
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
