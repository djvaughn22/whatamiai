import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { composeHabitsResult, currentStreak, markToday, todayMarked } from "../habitsEngine";

function fakeStorage() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
}

describe("habit streak uses the local calendar day", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", fakeStorage());
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("an 11:30pm local tap counts as today, whatever the UTC date is", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 14, 23, 30)); // local Oct 14, 11:30pm
    const s = markToday("move");
    expect(s.days).toEqual(["2026-10-14"]);
    expect(todayMarked(s)).toBe(true);
    expect(currentStreak(s)).toBe(1);
  });

  it("consecutive local days make a streak; a gap resets it", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 13, 0, 5));
    markToday("move");
    vi.setSystemTime(new Date(2026, 9, 14, 23, 55));
    const s = markToday("move");
    expect(currentStreak(s)).toBe(2);
    vi.setSystemTime(new Date(2026, 9, 17, 12, 0));
    expect(currentStreak(s)).toBe(0);
  });
});

describe("habit result copy", () => {
  it("keeps the pronoun I capitalised inside quoted choices", () => {
    const r = composeHabitsResult({ goalId: "move", level: 1, obstacle: "I forget", when: "Evening" });
    const text = JSON.stringify(r);
    expect(text).toContain("“I forget”");
    expect(text).toContain("“I move some, not consistently”");
    expect(text).not.toContain("“i ");
  });
});

describe("loadStreak tolerates malformed storage", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {});
  });
  afterEach(() => vi.unstubAllGlobals());

  it("returns null for garbage and sane numbers for a bad best", async () => {
    const { loadStreak } = await import("../habitsEngine");
    const store = fakeStorage();
    vi.stubGlobal("localStorage", store);
    store.setItem("wai-habit-streak-v1", "{not json");
    expect(loadStreak()).toBeNull();
    store.setItem("wai-habit-streak-v1", JSON.stringify({ goalId: "move", days: ["2026-10-14", 7, null], best: "x" }));
    expect(loadStreak()).toEqual({ goalId: "move", days: ["2026-10-14"], best: 0 });
  });
});
