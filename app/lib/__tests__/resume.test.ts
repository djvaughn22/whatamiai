import { describe, expect, it } from "vitest";
import { draftResumes } from "../resume";
import { PATTERN_QUESTIONS } from "../patternsEngine";

function store(items: Record<string, string>) {
  return { getItem: (k: string) => (k in items ? items[k] : null) };
}

describe("draftResumes", () => {
  it("is empty for a first visit", () => {
    expect(draftResumes(store({}))).toEqual([]);
  });

  it("ignores drafts with nothing answered (Money Check saves one on open)", () => {
    const s = store({
      "wai-money-draft-v1": JSON.stringify({ income: "", essentials: "", debt: "", stress: "", track: "", surprise: "" }),
      "wai3-situation-draft": JSON.stringify({ type: "other", answers: {}, idx: 0 }),
      "wai-react-v1": JSON.stringify({ done: [], tallies: {} }),
    });
    expect(draftResumes(s)).toEqual([]);
  });

  it("offers each tool with real progress, with counts", () => {
    const s = store({
      "wai3-situation-draft": JSON.stringify({ type: "other", answers: { a: 1, b: 2 }, idx: 2 }),
      "wai3-patterns-draft": JSON.stringify({ answers: { q1: 1 }, idx: 1 }),
      "wai-money-draft-v1": JSON.stringify({ income: "2400", essentials: "" }),
      "wai-react-v1": JSON.stringify({ done: ["x"], tallies: {} }),
    });
    expect(draftResumes(s)).toEqual([
      { href: "/situation", label: "🧭 My Situation", detail: "2 answers in, keep going" },
      { href: "/patterns", label: "🔁 My Overall Patterns", detail: `1 of ${PATTERN_QUESTIONS.length} answered` },
      { href: "/money", label: "💵 Money Check", detail: "Your numbers are still here" },
      { href: "/react", label: "⚡ How Do I React?", detail: "1 card done" },
    ]);
  });

  it("skips damaged data and a store that throws", () => {
    expect(draftResumes(store({ "wai3-patterns-draft": "{oops" }))).toEqual([]);
    expect(draftResumes({ getItem: () => { throw new Error("blocked"); } })).toEqual([]);
  });
});
