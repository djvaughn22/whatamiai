import { describe, expect, it } from "vitest";
import { assessSafety, assessSafetyAll, checkSafety, SAFETY_COPY } from "../safety";
import { analyzePrompts, composeMirrorResult } from "../mirrorEngine";

describe("category detection", () => {
  it("detects each category", () => {
    expect(assessSafety("I don't want to be here anymore, no reason to live")?.kind).toBe("self");
    expect(assessSafety("he threatens me and has a gun")?.kind).toBe("danger");
    expect(assessSafety("my partner hits me when he's angry")?.kind).toBe("abuse");
    expect(assessSafety("chest pain since this morning")?.kind).toBe("medical");
    expect(assessSafety("panic attacks every night, can't stop crying")?.kind).toBe("crisis");
    expect(assessSafety("I got arrested and my court date is next week")?.kind).toBe("legal");
    expect(assessSafety("we're behind on rent and facing eviction")?.kind).toBe("financial");
  });

  it("every category has support copy", () => {
    for (const kind of ["self", "danger", "abuse", "medical", "crisis", "legal", "financial"] as const) {
      expect(SAFETY_COPY[kind].lead.length).toBeGreaterThan(10);
      expect(SAFETY_COPY[kind].lines.length).toBeGreaterThan(1);
    }
  });

  it("category-specific referrals point at the right kind of professional", () => {
    expect(SAFETY_COPY.legal.lines.join(" ")).toContain("attorney");
    expect(SAFETY_COPY.financial.lines.join(" ")).toContain("211");
    expect(SAFETY_COPY.medical.lines.join(" ")).toContain("healthcare professional");
    expect(SAFETY_COPY.crisis.lines.join(" ")).toContain("988");
    expect(SAFETY_COPY.abuse.lines.join(" ")).toContain("1-800-799-7233");
  });
});

describe("levels", () => {
  it("escalates immediate danger", () => {
    expect(assessSafety("I am about to hurt myself tonight")?.level).toBe("immediate");
    expect(assessSafety("he has a knife and I'm not safe")?.level).toBe("immediate");
    expect(assessSafety("chest pain right now")?.level).toBe("immediate");
  });

  it("keeps informational mentions from interrupting", () => {
    const h = assessSafety("I watched a documentary about suicide prevention week");
    expect(h?.level).toBe("mention");
    expect(checkSafety("I watched a documentary about suicide prevention week")).toBeNull();
  });

  it("picks the most serious hit across texts", () => {
    const h = assessSafetyAll(["research about domestic violence statistics", "he threatens me"]);
    expect(h).toEqual({ kind: "danger", level: "immediate" });
  });
});

describe("false positives", () => {
  const HARMLESS = [
    "this deadline is killing me",
    "my feet are killing me after the gym",
    "I'd kill for a coffee right now",
    "fix the dead code in my project",
    "help me kill this background process",
    "the battery died again",
    "I'm dead tired of this bug",
    "planning our budget for a vacation",
    "how do I pay off my car loan faster",
    "write a court scene for my novel",
    "my sourdough starter died",
  ];
  it.each(HARMLESS)("does not trigger on: %s", (t) => {
    expect(checkSafety(t)).toBeNull();
  });
});

describe("/mirror runs the shared safety pass", () => {
  it("flags pasted prompts and records the category", () => {
    const a = analyzePrompts(["help me plan a launch", "lately I can't stop crying and have panic attacks"]);
    const r = composeMirrorResult(a);
    expect(r.safetyFlagged).toBe(true);
    expect(r.meta?.safetyKind).toBe("crisis");
  });

  it("flags free-text follow-up answers too", () => {
    const a = analyzePrompts(["help me write an email", "fix my css grid"]);
    const r = composeMirrorResult(a, { matters_offscreen: "honestly we're behind on rent and facing eviction" });
    expect(r.safetyFlagged).toBe(true);
    expect(r.meta?.safetyKind).toBe("financial");
  });

  it("does not flag ordinary technical prompt sets", () => {
    const a = analyzePrompts(["why does my css grid overflow", "this deadline is killing me", "rewrite this email"]);
    const r = composeMirrorResult(a);
    expect(r.safetyFlagged).toBeFalsy();
  });

  it("labels pasted AI analysis instead of repackaging it", () => {
    const a = analyzePrompts(["You fear abandonment and always push people away", "help me plan dinner"]);
    const r = composeMirrorResult(a);
    const s = r.sections.find((x) => x.heading === "Pasted analysis, not confirmed fact");
    expect(s).toBeTruthy();
    expect(s!.paragraphs![0]).toContain("not as facts about you");
    // the claim must never be restated as a WhatAmIAI claim outside that labeled section
    const elsewhere = r.sections.filter((x) => x !== s).flatMap((x) => [...(x.paragraphs ?? []), ...(x.bullets ?? [])]).join(" ");
    expect(elsewhere).not.toMatch(/you fear abandonment/i);
  });
});
