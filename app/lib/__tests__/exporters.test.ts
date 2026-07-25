import { describe, expect, it } from "vitest";
import { AI_GROUND_RULES, exportCategories, toAIPrompt, toMarkdown, toPlainText, toSnapshot } from "../exporters";
import type { Reflection } from "../types";

const LEGACY: Reflection = {
  id: "l1",
  mode: "patterns",
  title: "Overall patterns",
  createdAt: 1700000000000,
  sections: [
    { heading: "How you currently operate", paragraphs: ["Legacy summary line."] },
    { heading: "One 30-day experiment", paragraphs: ["Legacy experiment action."] },
  ],
};

const TYPED: Reflection = {
  id: "t1",
  mode: "money",
  title: "Money Check",
  createdAt: 1700000000000,
  schemaVersion: 2,
  evidence: [
    { id: "e-income", statement: "Take-home: $4,200 a month", sensitive: "financial", redactedStatement: "Take-home: entered (exact amount kept private)", sourceAnswer: "4200" },
    { id: "e-note", statement: "In your words: “worried about the card”", sensitive: "written", redactedStatement: "A written note (kept private)", sourceAnswer: "worried about the card" },
    { id: "e-track", statement: "Do you know where last month went — you selected: Honestly, no" },
  ],
  sections: [
    { heading: "Your numbers, plainly", kind: "facts", note: "Estimates are fine." },
    { heading: "The shape this could fit", kind: "interpretations", interpretations: [{ id: "i1", possibility: "the picture may be a visibility gap", evidenceIds: ["e-track"], confidence: "plausible", alternative: "the month may just be atypical", checkQuestion: "Was this month normal?" }] },
    { heading: "What might challenge this reading", kind: "challenge", paragraphs: ["One month may be atypical."] },
    { heading: "A 7-day experiment", kind: "experiment", experiment: { title: "Watch the week", action: "Write down every dollar for 7 days", rationale: "You said you don't know where last month went", duration: "7 days", observe: ["Where the money actually goes"], minimumVersion: "Track one day", busyVersion: "Photo receipts only" } },
    { heading: "Open questions", kind: "questions", bullets: ["Which expense surprised you?"] },
  ],
};

describe("toSnapshot (typed)", () => {
  it("finds the next action via kind, not heading", () => {
    const s = toSnapshot(TYPED);
    expect(s).toContain("Next: Write down every dollar for 7 days");
    expect(s).toContain("Worth asking: Which expense surprised you?");
  });

  it("survives arbitrary heading renames", () => {
    const renamed: Reflection = { ...TYPED, sections: TYPED.sections.map((x) => ({ ...x, heading: "Renamed " + Math.random() })) };
    expect(toSnapshot(renamed)).toContain("Next: Write down every dollar for 7 days");
  });

  it("keeps the legacy regex fallback for old saves", () => {
    const s = toSnapshot(LEGACY);
    expect(s).toContain("Legacy summary line.");
    expect(s).toContain("Next: Legacy experiment action.");
  });
});

describe("toAIPrompt (single shared builder)", () => {
  it("includes every ground rule and the opening instruction", () => {
    const p = toAIPrompt(TYPED);
    for (const g of AI_GROUND_RULES) expect(p).toContain(g);
    expect(p).toContain("Begin with one or two high-value clarifying questions");
    expect(p).toContain("Money Check");
  });

  it("carries evidence, confidence, alternative, challenge, and experiment", () => {
    const p = toAIPrompt(TYPED);
    expect(p).toContain("Take-home: $4,200 a month");
    expect(p).toContain("A plausible pattern");
    expect(p).toContain("Another possibility: the month may just be atypical");
    expect(p).toContain("One month may be atypical.");
    expect(p).toContain("Busy-day version: Photo receipts only");
  });

  it("excludes exact figures on request", () => {
    const p = toAIPrompt(TYPED, { includeExactFigures: false });
    expect(p).not.toContain("$4,200");
    expect(p).toContain("exact amount kept private");
  });

  it("excludes written answers on request", () => {
    const p = toAIPrompt(TYPED, { includeWritten: false });
    expect(p).not.toContain("worried about the card");
    expect(p).toContain("A written note (kept private)");
  });

  it("never renders internal evidence ids", () => {
    for (const text of [toAIPrompt(TYPED), toPlainText(TYPED), toMarkdown(TYPED), toSnapshot(TYPED)]) {
      expect(text).not.toMatch(/\be-income\b|\be-note\b|\be-track\b|\bi1\b/);
    }
  });
});

describe("export preview categories", () => {
  it("names financial and written content when present", () => {
    const cats = exportCategories(TYPED).join(" | ");
    expect(cats).toContain("exact dollar amounts");
    expect(cats).toContain("your own words");
  });

  it("stays simple for legacy reflections", () => {
    const cats = exportCategories(LEGACY);
    expect(cats.length).toBeLessThanOrEqual(2);
  });
});
