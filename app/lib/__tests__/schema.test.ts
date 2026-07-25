import { beforeEach, describe, expect, it } from "vitest";
import { normalizeReflection, listSaved, saveReflection } from "../storage";
import { evidenceFor, MODE_LABEL, type Reflection } from "../types";
import { MODE_DEFS, modeDef } from "../modes";

// minimal localStorage stub — storage.ts only needs these three
function stubStorage() {
  const m = new Map<string, string>();
  (globalThis as Record<string, unknown>).window = globalThis;
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
  return m;
}

const LEGACY: Reflection = {
  id: "old-1",
  mode: "situation",
  title: "Situation — a decision",
  createdAt: 1700000000000,
  sections: [
    { heading: "The read", paragraphs: ["Old paragraph."] },
    { heading: "One step for the next 7 days", paragraphs: ["Old step."] },
  ],
};

describe("normalizeReflection", () => {
  it("renders legacy saves unchanged", () => {
    const r = normalizeReflection(JSON.parse(JSON.stringify(LEGACY)));
    expect(r).not.toBeNull();
    expect(r!.sections).toHaveLength(2);
    expect(r!.sections[0].kind).toBeUndefined();
    expect(r!.sections[0].paragraphs).toEqual(["Old paragraph."]);
  });

  it("keeps upgraded saves intact", () => {
    const r = normalizeReflection({
      ...LEGACY,
      id: "new-1",
      schemaVersion: 2,
      evidence: [{ id: "ev-1", statement: "You selected: Late-night use" }],
      sections: [{ heading: "Facts", kind: "facts", bullets: ["You selected: Late-night use"] }],
    });
    expect(r!.schemaVersion).toBe(2);
    expect(r!.evidence).toHaveLength(1);
    expect(r!.sections[0].kind).toBe("facts");
  });

  it("coerces unknown section kinds to custom", () => {
    const r = normalizeReflection({ ...LEGACY, sections: [{ heading: "X", kind: "hologram", paragraphs: ["p"] }] });
    expect(r!.sections[0].kind).toBe("custom");
  });

  it("drops malformed sections and reflections gracefully", () => {
    expect(normalizeReflection(null)).toBeNull();
    expect(normalizeReflection("junk")).toBeNull();
    expect(normalizeReflection({ id: "x" })).toBeNull();
    const r = normalizeReflection({ ...LEGACY, sections: [{ nope: true }, { heading: "OK" }] });
    expect(r!.sections).toHaveLength(1);
  });

  it("maps unknown modes to combined instead of crashing", () => {
    const r = normalizeReflection({ ...LEGACY, mode: "astrology" });
    expect(r!.mode).toBe("combined");
  });
});

describe("saved-list migration behavior", () => {
  beforeEach(() => stubStorage());

  it("survives malformed storage", () => {
    localStorage.setItem("wai3-saved-v1", "{not json");
    expect(listSaved()).toEqual([]);
    localStorage.setItem("wai3-saved-v1", JSON.stringify({ an: "object" }));
    expect(listSaved()).toEqual([]);
  });

  it("preserves legacy items alongside new ones", () => {
    localStorage.setItem("wai3-saved-v1", JSON.stringify([LEGACY, { broken: true }]));
    saveReflection({ ...LEGACY, id: "new-2", schemaVersion: 2 });
    const all = listSaved();
    expect(all.map((r) => r.id)).toEqual(["new-2", "old-1"]);
  });
});

describe("evidence lookup", () => {
  it("skips unknown ids and never throws", () => {
    const r: Reflection = { ...LEGACY, evidence: [{ id: "a", statement: "S" }] };
    expect(evidenceFor(r, ["a", "ghost"]).map((e) => e.statement)).toEqual(["S"]);
    expect(evidenceFor(LEGACY, ["a"])).toEqual([]);
  });
});

describe("mode registry", () => {
  it("covers every mode with a consistent canonical label", () => {
    const ids = MODE_DEFS.map((m) => m.id);
    for (const mode of Object.keys(MODE_LABEL)) expect(ids).toContain(mode);
    for (const def of MODE_DEFS) expect(def.label).toBe(MODE_LABEL[def.id]);
  });

  it("registers the three clarified labels", () => {
    expect(modeDef("habits").label).toBe("7-Day Habit Starter");
    expect(modeDef("phone").label).toBe("Intentional Phone Use");
    expect(modeDef("react").label).toBe("How Do I React?");
  });

  it("declares storage keys for every persistent mode", () => {
    for (const id of ["habits", "react", "phone", "combined"] as const) {
      expect(modeDef(id).storageKeys.length).toBeGreaterThan(0);
    }
  });
});
