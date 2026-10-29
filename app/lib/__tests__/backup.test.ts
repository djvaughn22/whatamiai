import { describe, expect, it } from "vitest";
import { buildBackup, eraseAll, KEPT_KEYS, restoreBackup } from "../backup";
import { daysThisWeek } from "../habitsEngine";

function mem(init: Record<string, string> = {}) {
  const m = new Map(Object.entries(init));
  return { m, getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
}
const refl = (id: string) => ({ id, mode: "situation", title: id, createdAt: 1, sections: [{ heading: "h" }] });

describe("backup", () => {
  it("round-trips every kept key into an empty browser", () => {
    const a = mem({ "wai3-saved-v1": JSON.stringify([refl("a")]), "wai-phone-plan-v1": '{"x":1}', other: "nope" });
    const b = mem();
    const r = restoreBackup(b, JSON.stringify(buildBackup(a)));
    expect(r).toMatchObject({ ok: true, added: 1, filled: ["wai-phone-plan-v1"] });
    expect(b.m.has("other")).toBe(false);
  });
  it("never overwrites or removes existing data", () => {
    const a = mem({ "wai3-saved-v1": JSON.stringify([refl("a"), refl("b")]), "wai-phone-plan-v1": '{"x":1}' });
    const b = mem({ "wai3-saved-v1": JSON.stringify([refl("a"), refl("c")]), "wai-phone-plan-v1": '{"x":2}' });
    const r = restoreBackup(b, JSON.stringify(buildBackup(a)));
    expect(r).toMatchObject({ ok: true, added: 1, skipped: ["wai-phone-plan-v1"] });
    expect(JSON.parse(b.m.get("wai3-saved-v1")!).map((x: { id: string }) => x.id)).toEqual(["a", "c", "b"]);
    expect(b.m.get("wai-phone-plan-v1")).toBe('{"x":2}');
  });
  it("rejects files that aren't backups", () => {
    expect(restoreBackup(mem(), "hello").ok).toBe(false);
    expect(restoreBackup(mem(), '{"app":"other","items":{}}').ok).toBe(false);
  });
  it("erase removes every kept key and the Mirror session", () => {
    const init = Object.fromEntries(KEPT_KEYS.map((k) => [k, "1"]));
    const a = mem({ ...init, unrelated: "keep" });
    const s = mem({ "wai3-mirror-session": "x" });
    eraseAll(a, s);
    expect([...a.m.keys()]).toEqual(["unrelated"]);
    expect(s.m.size).toBe(0);
  });
  it("lists every localStorage key the app writes", async () => {
    const { execSync } = await import("node:child_process");
    const found = execSync(`grep -rhoE '"wai3?-[a-z-]+-(v1|draft|session)"' app --include=*.ts --include=*.tsx --exclude-dir=__tests__`).toString().split("\n").filter(Boolean).map((s) => s.slice(1, -1));
    for (const k of new Set(found)) if (k !== "wai3-mirror-session") expect(KEPT_KEYS as readonly string[]).toContain(k);
  });
});

describe("daysThisWeek", () => {
  it("counts marked days in the last 7 including today", () => {
    const f = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
    expect(daysThisWeek({ goalId: "g", best: 0, days: [f(0), f(2), f(6), f(7)] })).toBe(3);
  });
});
