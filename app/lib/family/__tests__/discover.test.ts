import { describe, expect, it } from "vitest";
import { discover, discoveredPatch, EMPTY_DISCOVER, toPersonInput } from "../discover";
import { assessFact } from "../evidence";
import { applyPatch, newWorkspace } from "../ops";
import { emptyData } from "../types";

// Everyone here is made up.
const env = (() => {
  let n = 0;
  return { now: "2026-11-19T00:00:00.000Z", newId: () => `t${++n}` };
})();

const sven = { ...EMPTY_DISCOVER, given: "Sven", surname: "Ekdahl", born: "1890", bornPlace: "Sweden", livedPlace: "Duluth, Minnesota", sex: "male" as const };

describe("Discover", () => {
  it("needs a name and nothing else", () => {
    expect(discover(EMPTY_DISCOVER, env)).toBeNull();
    expect(discover({ ...EMPTY_DISCOVER, surname: "Ekdahl" }, env)).not.toBeNull();
  });

  it("reads a bare year as 'about' that year", () => {
    expect(toPersonInput(sven).birthDate).toBe("about 1890");
    expect(toPersonInput({ ...sven, born: "12 Mar 1890" }).birthDate).toBe("12 Mar 1890");
    expect(toPersonInput({ ...sven, died: "" }).deathDate).toBeUndefined();
  });

  it("gives a research plan from what was typed, without a tree", () => {
    const r = discover(sven, env)!;
    expect(r.profile.name).toBe("Sven Ekdahl");
    expect(r.profile.states).toContain("MN");
    expect(r.profile.bornAbroad).toBe("Sweden");
    const groups = new Set(r.plan.map((l) => l.group));
    expect(groups.has("Census")).toBe(true);
    expect(groups.has("Immigration")).toBe(true);
    expect(r.plan.every((l) => l.url.startsWith("https://"))).toBe(true);
    expect(r.newspaper).toEqual({ text: '"Sven Ekdahl"', state: "MN", from: expect.any(Number), to: expect.any(Number) });
    expect(r.newspaper.from!).toBeGreaterThanOrEqual(1770);
    expect(r.newspaper.to!).toBeLessThanOrEqual(1963);
  });

  it("searches for the birth year that was typed", () => {
    const r = discover(sven, env)!;
    expect(r.profile.birthYear).toBe(1890);
    const hints = r.plan.map((l) => l.searchFor ?? "").filter((t) => t.includes("born about"));
    expect(hints.length).toBeGreaterThan(5);
    expect(hints.every((t) => t.includes("born about 1890"))).toBe(true);
    expect(discover({ ...sven, born: "12 Mar 1890" }, env)!.profile.birthYear).toBe(1890);
  });

  it("asks the open questions a researcher would", () => {
    const r = discover(sven, env)!;
    expect(r.questions.some((q) => q.includes("parents"))).toBe(true);
    expect(r.questions.some((q) => q.includes("come to America"))).toBe(true);
  });

  it("keeps typed facts with no source yet, never stronger", () => {
    const base = emptyData(newWorkspace("Mine", "mine", env));
    const { patch, id } = discoveredPatch(base, sven, env);
    const data = applyPatch(base, patch);
    const facts = Object.values(data.facts).filter((f) => f.personId === id);
    expect(facts.map((f) => f.type).sort()).toEqual(["birth", "name", "residence"]);
    expect(Object.keys(data.citations)).toHaveLength(0);
    for (const f of facts) expect(assessFact(data, f.id).level).toBe("unknown");
  });

  it("adds where they lived only when it differs from where they were born", () => {
    const base = emptyData(newWorkspace("Mine", "mine", env));
    const same = applyPatch(base, discoveredPatch(base, { ...sven, livedPlace: "Sweden" }, env).patch);
    expect(Object.values(same.facts).some((f) => f.type === "residence")).toBe(false);
  });

  it("leaves the visitor's own family alone until they keep someone", () => {
    const base = emptyData(newWorkspace("Mine", "mine", env));
    const before = JSON.stringify(base);
    discover(sven, env);
    discoveredPatch(base, sven, env);
    expect(JSON.stringify(base)).toBe(before);
  });
});
