// Who is related to whom. Parent links and partner links are the only stored
// relationships; siblings, grandparents and cousins are worked out from them.

import type { FamilyData, Id, Person, Relationship } from "./types";

export function livePeople(data: FamilyData): Person[] {
  return Object.values(data.people).filter((p) => !p.mergedInto);
}

export function relsOf(data: FamilyData, id: Id): Relationship[] {
  return Object.values(data.relationships).filter((r) => r.a === id || r.b === id);
}

export function parentLinks(data: FamilyData, childId: Id): Relationship[] {
  return Object.values(data.relationships).filter((r) => r.type === "parent" && r.b === childId);
}

export function childLinks(data: FamilyData, parentId: Id): Relationship[] {
  return Object.values(data.relationships).filter((r) => r.type === "parent" && r.a === parentId);
}

export function partnerLinks(data: FamilyData, id: Id): Relationship[] {
  return Object.values(data.relationships).filter((r) => r.type === "partner" && (r.a === id || r.b === id));
}

export function parentsOf(data: FamilyData, id: Id): Id[] {
  return parentLinks(data, id).map((r) => r.a);
}

export function childrenOf(data: FamilyData, id: Id): Id[] {
  return childLinks(data, id).map((r) => r.b);
}

export function partnersOf(data: FamilyData, id: Id): Id[] {
  return partnerLinks(data, id).map((r) => (r.a === id ? r.b : r.a));
}

export type Sibling = { id: Id; shared: number; half: boolean };

export function siblingsOf(data: FamilyData, id: Id): Sibling[] {
  const mine = new Set(parentsOf(data, id));
  if (!mine.size) return [];
  const seen = new Map<Id, number>();
  for (const p of mine) {
    for (const c of childrenOf(data, p)) {
      if (c === id) continue;
      seen.set(c, (seen.get(c) ?? 0) + 1);
    }
  }
  // Half siblings share exactly one parent while a different other parent is
  // on record. With only one parent known on either side, we can't tell.
  return [...seen.entries()].map(([sid, shared]) => {
    const theirs = parentsOf(data, sid).length;
    return { id: sid, shared, half: shared === 1 && (mine.size > 1 || theirs > 1) };
  });
}

/** Ancestors with their generation distance (1 = parent). Stops at loops. */
export function ancestorsWithDepth(data: FamilyData, id: Id, maxDepth = 30): Map<Id, number> {
  const out = new Map<Id, number>();
  let frontier = [id];
  for (let depth = 1; depth <= maxDepth && frontier.length; depth++) {
    const next: Id[] = [];
    for (const f of frontier) {
      for (const p of parentsOf(data, f)) {
        if (p === id || out.has(p)) continue;
        out.set(p, depth);
        next.push(p);
      }
    }
    frontier = next;
  }
  return out;
}

export function descendantsWithDepth(data: FamilyData, id: Id, maxDepth = 30): Map<Id, number> {
  const out = new Map<Id, number>();
  let frontier = [id];
  for (let depth = 1; depth <= maxDepth && frontier.length; depth++) {
    const next: Id[] = [];
    for (const f of frontier) {
      for (const c of childrenOf(data, f)) {
        if (c === id || out.has(c)) continue;
        out.set(c, depth);
        next.push(c);
      }
    }
    frontier = next;
  }
  return out;
}

/** Would linking parent → child create a loop (a person as their own ancestor)? */
export function wouldCreateLoop(data: FamilyData, parentId: Id, childId: Id): boolean {
  if (parentId === childId) return true;
  return ancestorsWithDepth(data, parentId).has(childId);
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function greats(n: number, base: string): string {
  // n = 1 → base, 2 → "great-base", 3 → "2nd great-base"
  if (n <= 1) return base;
  if (n === 2) return `great-${base}`;
  return `${ordinal(n - 1)} great-${base}`;
}

function gendered(sex: Person["sex"], female: string, male: string, neutral: string): string {
  return sex === "female" ? female : sex === "male" ? male : neutral;
}

/** "your grandmother", "your 1st cousin once removed", or "" when not related by blood. */
export function kinshipTo(data: FamilyData, selfId: Id | undefined, otherId: Id): string {
  if (!selfId || selfId === otherId) return selfId === otherId ? "you" : "";
  const sex = data.people[otherId]?.sex;
  if (partnersOf(data, selfId).includes(otherId)) return gendered(sex, "your wife or partner", "your husband or partner", "your spouse or partner");
  const up = ancestorsWithDepth(data, selfId);
  const k0 = up.get(otherId);
  if (k0 !== undefined) {
    if (k0 === 1) return `your ${gendered(sex, "mother", "father", "parent")}`;
    return `your ${greats(k0 - 1, gendered(sex, "grandmother", "grandfather", "grandparent"))}`;
  }
  const down = descendantsWithDepth(data, selfId);
  const m0 = down.get(otherId);
  if (m0 !== undefined) {
    if (m0 === 1) return `your ${gendered(sex, "daughter", "son", "child")}`;
    return `your ${greats(m0 - 1, gendered(sex, "granddaughter", "grandson", "grandchild"))}`;
  }
  // nearest common ancestor
  const theirs = ancestorsWithDepth(data, otherId);
  let best: { k: number; m: number } | null = null;
  for (const [anc, k] of up) {
    const m = theirs.get(anc);
    if (m === undefined) continue;
    if (!best || k + m < best.k + best.m) best = { k, m };
  }
  if (!best) return "";
  const { k, m } = best;
  if (k === 1 && m === 1) return `your ${gendered(sex, "sister", "brother", "sibling")}`;
  if (k === 1) {
    if (m === 2) return `your ${gendered(sex, "niece", "nephew", "niece or nephew")}`;
    return `your ${greats(m - 2, gendered(sex, "grandniece", "grandnephew", "grandniece or grandnephew"))}`;
  }
  if (m === 1) {
    const base = gendered(sex, "aunt", "uncle", "aunt or uncle");
    return k === 2 ? `your ${base}` : `your ${greats(k - 1, base)}`;
  }
  const degree = Math.min(k, m) - 1;
  const removed = Math.abs(k - m);
  const r = removed === 0 ? "" : removed === 1 ? " once removed" : removed === 2 ? " twice removed" : ` ${removed} times removed`;
  return `your ${ordinal(degree)} cousin${r}`;
}

/** Generation number relative to a focus person: parents +1, children -1. */
export function generationOf(data: FamilyData, focusId: Id, id: Id): number | undefined {
  if (focusId === id) return 0;
  const up = ancestorsWithDepth(data, focusId).get(id);
  if (up !== undefined) return up;
  const down = descendantsWithDepth(data, focusId).get(id);
  if (down !== undefined) return -down;
  return undefined;
}
