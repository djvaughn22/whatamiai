import { describe, expect, it } from "vitest";
import type { Answers, Reflection } from "../types";
import { composeSituationResult, SITUATION_TYPES } from "../situationEngine";
import { composePatternsResult } from "../patternsEngine";
import { composeMoneyResult } from "../moneyEngine";
import { composeHabitsResult, HABIT_GOALS, HABIT_OBSTACLES, HABIT_WHEN } from "../habitsEngine";
import { analyzePrompts, composeMirrorResult } from "../mirrorEngine";
import { findBannedClaims } from "../copyGuard";

// ---- fixtures across every mode and pattern branch ----

const SITUATION_ANSWERS: Answers[] = [
  { duration: "Weeks", deadline: "It feels urgent, but no date is set", waiting: "Nothing — I could act now", friend: "I'd have a rough idea", tried: ["Thought about it a lot"] }, // phantom deadline
  { duration: "Weeks", deadline: "No", waiting: "Confidence", friend: "I know exactly what I'd say", tried: ["Made a list"] }, // already known
  { duration: "Months", deadline: "No", waiting: "Certainty", friend: "Honestly, no idea", tried: ["Talked to someone"] }, // certainty wait
  { duration: "Months", deadline: "No", waiting: "Permission", friend: "I'd have a rough idea", tried: [] }, // permission slip
  { duration: "A year or more", deadline: "No", waiting: "Not sure", friend: "I'd have a rough idea", tried: ["Avoided it"] }, // slow leak
  { duration: "Weeks", deadline: "No", waiting: "Information", friend: "I'd have a rough idea", tried: ["Looked for answers online"] }, // missing fact
  { duration: "Days", deadline: "No", waiting: "Not sure", friend: "I'd have a rough idea", tried: [], feeling: ["Angry", "Hurt"] }, // fresh cut
  { duration: "Months", deadline: "No", waiting: "Not sure", friend: "I'd have a rough idea", tried: ["Thought about it a lot", "Made a list", "Prayed about it"] }, // overthought loop
  { duration: "Weeks", deadline: "Not sure", waiting: "Not sure", friend: "I'd have a rough idea", tried: ["Nothing yet"], name_it: "deciding whether to move" }, // crossroads
];

const PATTERN_ANSWERS: Answers[] = [
  { start_finish: "I start a lot and finish a little", stops: "Something newer pulled me away", decide_speed: "Small ones fast, big ones I sit on", seek: "Reassurance from someone", pressure: ["Scattered", "Irritable"], conflict_style: "Avoid it as long as possible", conflict_hard: "Setting a boundary", balance: "I take on too much", time: "Screens and scrolling", distraction: "Scrolling", respond: "Jump to fixing it", wrong: "I defend first, adjust later", asked_for: "fixing things around the house", matters: "my family", gets_best: "Honestly, no" },
  { start_finish: "I start carefully and finish most of it", decide_speed: "Fast — sometimes too fast", seek: "Quiet time to think", conflict_style: "Address it directly", wrong: "I adjust quickly", gets_best: "Some weeks" },
];

const MONEY_INPUTS = [
  { income: 3000, essentials: 2800, debt: 500, stress: "Debt", track: "The big stuff, yes", surprise: "It goes on a credit card" }, // underwater
  { income: 4000, essentials: 2000, debt: 1200, stress: "Debt", track: "The big stuff, yes", surprise: "Covered from savings" }, // debt drag
  { income: 4000, essentials: 2000, debt: 300, stress: "It disappears and I don't know where", track: "Honestly, no", surprise: "Covered from savings" }, // fog
  { income: 4000, essentials: 2000, debt: 300, stress: "No plan — just vibes", track: "The big stuff, yes", surprise: "It goes on a credit card" }, // tightrope
  { income: 4000, essentials: 2000, debt: 300, stress: "Impulse spending", track: "Yes, roughly to the dollar", surprise: "Covered from savings" }, // leaky bucket
  { income: 4000, essentials: 2000, debt: 300, stress: "Money fights at home", track: "Yes, roughly to the dollar", surprise: "Covered from savings" }, // two-ledger
  { income: 4000, essentials: 1800, debt: 200, stress: "No plan — just vibes", track: "Yes, roughly to the dollar", surprise: "Covered from savings" }, // quiet surplus
];

const MIRROR_SETS = [
  ["plan my product launch", "make a roadmap for the app", "outline the marketing plan", "draft a schedule for the quarter", "plan the next sprint", "help me organize my week", "make a checklist for the release", "plan a strategy for growth"],
  ["am I overreacting about my boss", "is this email okay to send", "tell me I'm doing okay", "was I wrong in that argument", "is it normal to feel this way", "should I take the job", "should I move cities", "help me decide between two cars", "should I text her back"],
];

function allReflections(): Reflection[] {
  const out: Reflection[] = [];
  for (let i = 0; i < SITUATION_ANSWERS.length; i++) out.push(composeSituationResult(SITUATION_TYPES[i % SITUATION_TYPES.length].id, SITUATION_ANSWERS[i]));
  for (const a of PATTERN_ANSWERS) out.push(composePatternsResult(a));
  for (const m of MONEY_INPUTS) out.push(composeMoneyResult(m));
  for (const g of HABIT_GOALS) for (const o of [HABIT_OBSTACLES[0], HABIT_OBSTACLES[5]]) out.push(composeHabitsResult({ goalId: g.id, level: 1, obstacle: o, when: HABIT_WHEN[0] }));
  for (const set of MIRROR_SETS) out.push(composeMirrorResult(analyzePrompts(set)));
  out.push(composeMirrorResult(analyzePrompts(MIRROR_SETS[1]), { accurate: "Honestly, not much of it", start_complete: "Starting", proxy: "Maybe", matters_offscreen: "my marriage" }));
  return out;
}

function allStrings(r: Reflection): string[] {
  const out: string[] = [r.title];
  for (const s of r.sections) {
    out.push(s.heading, s.note ?? "", ...(s.paragraphs ?? []), ...(s.bullets ?? []));
    for (const o of s.observations ?? []) out.push(o.statement);
    for (const i of s.interpretations ?? []) out.push(i.possibility, i.alternative ?? "", i.checkQuestion ?? "");
    if (s.experiment) out.push(s.experiment.title, s.experiment.action, s.experiment.rationale, ...s.experiment.observe, s.experiment.busyVersion ?? "", s.experiment.minimumVersion ?? "", s.experiment.permissionToAdjust ?? "");
  }
  for (const e of r.evidence ?? []) out.push(e.statement, e.redactedStatement ?? "");
  return out.filter(Boolean);
}

const REFLECTIONS = allReflections();

describe("Reflection Engine 2.0 contract (every mode, every branch)", () => {
  it.each(REFLECTIONS.map((r) => [r.title, r] as const))("%s — carries evidence and v2 schema", (_t, r) => {
    expect(r.schemaVersion).toBe(2);
    expect(r.evidence!.length).toBeGreaterThan(0);
  });

  it.each(REFLECTIONS.map((r) => [r.title, r] as const))("%s — every referenced evidence id exists", (_t, r) => {
    const ids = new Set((r.evidence ?? []).map((e) => e.id));
    for (const s of r.sections) {
      for (const o of s.observations ?? []) for (const id of o.evidenceIds) expect(ids.has(id)).toBe(true);
      for (const i of s.interpretations ?? []) for (const id of i.evidenceIds) expect(ids.has(id)).toBe(true);
    }
  });

  it.each(REFLECTIONS.map((r) => [r.title, r] as const))("%s — substantial interpretations are challengeable", (_t, r) => {
    for (const s of r.sections) {
      for (const i of s.interpretations ?? []) {
        expect(i.alternative || i.checkQuestion, `${i.id} lacks alternative and checkQuestion`).toBeTruthy();
        expect(["plausible", "tentative", "speculative"]).toContain(i.confidence);
      }
    }
  });

  it.each(REFLECTIONS.map((r) => [r.title, r] as const))("%s — has a result-specific challenge section", (_t, r) => {
    expect(r.sections.some((s) => s.kind === "challenge")).toBe(true);
  });

  it.each(REFLECTIONS.map((r) => [r.title, r] as const))("%s — has a typed experiment or plan", (_t, r) => {
    expect(r.sections.some((s) => s.kind === "experiment" || s.kind === "plan")).toBe(true);
  });

  it("challenge sections differ across modes (no single generic disclaimer)", () => {
    const texts = new Set(
      ["situation", "patterns", "money", "habits", "mirror"].map((mode) => {
        const r = REFLECTIONS.find((x) => x.mode === mode)!;
        return (r.sections.find((s) => s.kind === "challenge")!.bullets ?? []).join(" ");
      })
    );
    expect(texts.size).toBe(5);
  });

  it.each(REFLECTIONS.map((r) => [r.title, r] as const))("%s — never renders internal ids", (_t, r) => {
    for (const text of allStrings(r)) {
      expect(text).not.toMatch(/\b(ev|int|obs)-[a-z_0-9]+\b/i);
    }
  });
});

describe("copy guard — no product-authored overreach in any composed output", () => {
  it.each(REFLECTIONS.map((r) => [r.title, r] as const))("%s", (_t, r) => {
    for (const text of allStrings(r)) {
      const hits = findBannedClaims(text);
      expect(hits, `"${text.slice(0, 90)}" hit: ${hits.join(", ")}`).toEqual([]);
    }
  });

  it("still permits (and labels) user-supplied wording", () => {
    const r = composePatternsResult({ ...PATTERN_ANSWERS[0], asked_for: "my anxiety and my ADHD, deep down" });
    const facts = (r.evidence ?? []).map((e) => e.statement).join(" ");
    expect(facts).toContain("in your words");
    for (const text of allStrings(r)) expect(findBannedClaims(text)).toEqual([]);
  });
});
