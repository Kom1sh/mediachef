import { describe, expect, it } from "vitest";
import { ASK_AFTER, markAnswered, recordJobDone, shouldAsk, type AskStorage } from "./ask";

/** Хранилище в памяти — то же поведение, что у `localStorage`, без webview. */
const memory = (): AskStorage & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return {
    data,
    getItem: k => data.get(k) ?? null,
    setItem: (k, v) => { data.set(k, v); },
  };
};

describe("shouldAsk", () => {
  it("waits for the threshold", () => {
    expect(shouldAsk(ASK_AFTER - 1, false)).toBe(false);
    expect(shouldAsk(ASK_AFTER, false)).toBe(true);
  });

  it("never asks someone who has answered", () => {
    expect(shouldAsk(ASK_AFTER + 10, true)).toBe(false);
  });
});

describe("recordJobDone", () => {
  it("asks on the job that crosses the threshold, not before", () => {
    const s = memory();
    const answers = Array.from({ length: ASK_AFTER }, () => recordJobDone(s));
    expect(answers.slice(0, -1).every(a => a === false)).toBe(true);
    expect(answers[answers.length - 1]).toBe(true);
  });

  it("keeps asking after later successes until answered", () => {
    const s = memory();
    for (let i = 0; i < ASK_AFTER; i++) recordJobDone(s);
    expect(recordJobDone(s)).toBe(true);
  });

  /* The whole promise of the bar: one answer — writing, starring or the cross —
     and it is gone for good, however many jobs come after. */
  it("stops for good once answered", () => {
    const s = memory();
    for (let i = 0; i < ASK_AFTER; i++) recordJobDone(s);
    markAnswered(s);
    expect(recordJobDone(s)).toBe(false);
    expect(recordJobDone(s)).toBe(false);
  });

  it("survives a restart — the count lives in storage", () => {
    const s = memory();
    for (let i = 0; i < ASK_AFTER - 1; i++) recordJobDone(s);
    // A new "session" reads the same storage.
    expect(recordJobDone(s)).toBe(true);
  });

  it("treats garbage in storage as zero", () => {
    const s = memory();
    s.setItem("mc-jobs-done", "not a number");
    for (let i = 0; i < ASK_AFTER - 1; i++) expect(recordJobDone(s)).toBe(false);
    expect(recordJobDone(s)).toBe(true);
  });

  /* Storage that throws (blocked, full, sandboxed) must mean «never ask»: with no
     counter to write, asking at all would mean asking after every single job. */
  it("never asks when storage is unavailable", () => {
    const broken: AskStorage = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
    };
    for (let i = 0; i < ASK_AFTER + 2; i++) expect(recordJobDone(broken)).toBe(false);
    expect(() => markAnswered(broken)).not.toThrow();
  });
});
