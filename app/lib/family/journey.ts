// The family journey: where each person was, in order, and the moves between.
// A move between two places counts as DOCUMENTED only when records place the
// person at both ends. Anything else is drawn as inferred: we know the two
// places, not the route or the timing.

import { assessFact } from "./evidence";
import { sortKey } from "./dates";
import { activeFacts } from "./names";
import { parentsOf } from "./graph";
import { placesCompatible } from "./places";
import type { EvidenceLevel, Fact, FamilyData, Id } from "./types";

export interface Stop {
  personId: Id;
  fact: Fact;
  key: number;
  place: string;
  level: EvidenceLevel;
}

export interface Leg {
  personId: Id;
  from: Stop;
  to: Stop;
  documented: boolean;
  /** a move between a parent's place and a child's birthplace */
  generational?: boolean;
}

const PLACE_TYPES = new Set(["birth", "baptism", "residence", "immigration", "emigration", "naturalization", "military", "occupation", "education", "death", "burial", "other"]);
const STRONG = new Set<EvidenceLevel>(["verified", "supported"]);

export function stopsFor(data: FamilyData, personId: Id): Stop[] {
  const out: Stop[] = [];
  const facts: Fact[] = [...activeFacts(data, personId)];
  for (const r of Object.values(data.relationships)) {
    if (r.type !== "partner" || (r.a !== personId && r.b !== personId)) continue;
    for (const f of Object.values(data.facts)) if (f.relationshipId === r.id && !f.rejected && f.type === "marriage") facts.push(f);
  }
  for (const f of facts) {
    if (!f.place || !(PLACE_TYPES.has(f.type) || f.type === "marriage")) continue;
    const level = assessFact(data, f.id).level;
    if (level === "conflicting" && !f.preferred) continue;
    out.push({ personId, fact: f, key: sortKey(f.date), place: f.place, level });
  }
  // undated stops keep a sensible order: birth first, death and burial last
  const weight = (t: string) => (t === "birth" || t === "baptism" ? -1e6 : t === "death" || t === "burial" ? 1e6 : 0);
  return out.sort((a, b) => (Number.isFinite(a.key) ? a.key : weight(a.fact.type)) - (Number.isFinite(b.key) ? b.key : weight(b.fact.type)));
}

/** "Duluth, Minnesota" and "Duluth, St. Louis County, Minnesota" are one place. */
function samePlace(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase() || placesCompatible(a, b);
}

export function legsFor(stops: Stop[]): Leg[] {
  const legs: Leg[] = [];
  for (let i = 1; i < stops.length; i++) {
    const from = stops[i - 1];
    const to = stops[i];
    if (samePlace(from.place, to.place)) continue;
    legs.push({ personId: to.personId, from, to, documented: STRONG.has(from.level) && STRONG.has(to.level) });
  }
  return legs;
}

/** Moves between generations: from a parent's last place before a child's
 *  birth to the child's birthplace. Always inferred. */
export function generationLegs(data: FamilyData, people: Id[]): Leg[] {
  const set = new Set(people);
  const legs: Leg[] = [];
  for (const child of people) {
    const birth = stopsFor(data, child).find((s) => s.fact.type === "birth" || s.fact.type === "baptism");
    if (!birth) continue;
    for (const parent of parentsOf(data, child)) {
      if (!set.has(parent)) continue;
      const before = stopsFor(data, parent).filter((s) => !Number.isFinite(birth.key) || !Number.isFinite(s.key) || s.key <= birth.key);
      const last = before[before.length - 1];
      if (!last || samePlace(last.place, birth.place)) continue;
      legs.push({ personId: child, from: last, to: birth, documented: false, generational: true });
    }
  }
  return legs;
}
