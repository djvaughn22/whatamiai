import { describe, expect, it } from "vitest";
import { composeReactReflection, composeReactScenarioReflection, SCENARIOS } from "../reactEngine";
import { composePhoneReflection, loadPhonePlan, PHONE_DAYS, type PhonePlan } from "../phoneEngine";
import { AI_GROUND_RULES, toAIPrompt, toSnapshot } from "../exporters";
import { findBannedClaims } from "../copyGuard";

const PLAN_V1: PhonePlan = { focus: "Late-night use", done: [0, 1], startedAt: 1700000000000 };
const PLAN_FULL: PhonePlan = {
  ...PLAN_V1,
  done: [0, 1, 2, 3, 4, 5, 6],
  day1Total: "5h 12m",
  day1Apps: "Instagram, YouTube",
  outcome: "Sleep",
  replacement: "reading before bed",
  keepUse: "maps and calls with my mom",
  day7: "total similar but I stopped checking after 10pm",
  notes: { 2: "noticed the automatic reach at red lights" },
};

describe("/react shared integration", () => {
  it("scenario prompt now flows through the ONE shared exporter", () => {
    const s = SCENARIOS[0];
    const p = toAIPrompt(composeReactScenarioReflection(s, s.options[3]));
    for (const g of AI_GROUND_RULES) expect(p).toContain(g);
    expect(p).toContain(s.setup);
    expect(p).toContain(s.options[3].text);
    expect(p).toContain("What real situation in my life does this scenario remind me of?");
  });

  it("deck reflection frames the lean as a tentative possibility with a check", () => {
    const r = composeReactReflection(["traffic", "credit", "gossip", "blamed"], { fire: 3, retreat: 1, pleaser: 0, steady: 0 });
    const lean = r.sections.find((s) => s.kind === "interpretations")!.interpretations![0];
    expect(lean.confidence).toBe("tentative");
    expect(lean.alternative).toBeTruthy();
    expect(lean.checkQuestion).toBeTruthy();
    expect(r.sections.some((s) => s.kind === "challenge")).toBe(true);
    expect(r.sections.some((s) => s.kind === "resources")).toBe(true);
  });

  it("says so honestly when there is no lean", () => {
    const r = composeReactReflection(["traffic", "credit"], { fire: 1, retreat: 1, pleaser: 0, steady: 0 });
    expect(r.sections.some((s) => s.heading === "No single lean yet")).toBe(true);
    expect(r.sections.every((s) => !s.interpretations?.length)).toBe(true);
  });
});

describe("/phone shared integration", () => {
  it("keeps loading pre-2.0 plans (no fields beyond focus/done/startedAt)", () => {
    const m = new Map<string, string>();
    (globalThis as Record<string, unknown>).window = globalThis;
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => void m.set(k, v),
      removeItem: (k: string) => void m.delete(k),
    };
    m.set("wai-phone-plan-v1", JSON.stringify(PLAN_V1));
    const p = loadPhonePlan();
    expect(p).not.toBeNull();
    expect(p!.focus).toBe("Late-night use");
    expect(p!.done).toEqual([0, 1]);
  });

  it("builds a full reflection without any optional field", () => {
    const r = composePhoneReflection(PLAN_V1);
    expect(r.mode).toBe("phone");
    expect(r.evidence!.length).toBeGreaterThanOrEqual(2);
    expect(r.sections.some((s) => s.kind === "challenge")).toBe(true);
    const snap = toSnapshot(r);
    expect(snap).toContain("Next: One small experiment per day");
  });

  it("carries optional captures as labeled, redactable evidence", () => {
    const r = composePhoneReflection(PLAN_FULL);
    const statements = r.evidence!.map((e) => e.statement).join(" | ");
    expect(statements).toContain("5h 12m");
    expect(statements).toContain("maps and calls with my mom");
    const p = toAIPrompt(r, { includeWritten: false });
    expect(p).not.toContain("5h 12m");
    expect(p).not.toContain("Instagram");
    expect(p).toContain("(kept private)");
  });

  it("required challenge line is present and success is not defined as a lower number", () => {
    const r = composePhoneReflection(PLAN_FULL);
    const challenge = r.sections.find((s) => s.kind === "challenge")!.bullets!.join(" ");
    expect(challenge).toContain("Total screen time may stay the same even if the quality or intentionality of use improves.");
    expect(challenge).toContain("The number is information, not a score.");
    expect(challenge).toContain("sleep");
  });

  it("both new modes pass the copy guard", () => {
    for (const r of [composePhoneReflection(PLAN_FULL), composeReactReflection(["traffic"], { fire: 1, retreat: 0, pleaser: 0, steady: 0 })]) {
      for (const s of r.sections) {
        const texts = [s.heading, ...(s.paragraphs ?? []), ...(s.bullets ?? []), ...(s.interpretations ?? []).flatMap((i) => [i.possibility, i.alternative ?? ""])];
        for (const t of texts) expect(findBannedClaims(t)).toEqual([]);
      }
    }
  });
});
