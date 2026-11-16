// Birth-year estimates from relatives, for people with no dates of their own.
// Always labeled as estimates wherever they are shown. Generous on purpose:
// parents are taken to be 15 to 50 years older than their children, and
// spouses within 15 years of each other.

import { dateRange } from "./dates";
import { activeFacts, displayName } from "./names";
import type { FamilyData, Id } from "./types";

export interface BirthEstimate {
  range: [number, number];
  /** "estimated from Erik Lindqvist's birth" */
  basis: string;
}

function ownBirth(data: FamilyData, id: Id): [number, number] | undefined {
  const facts = activeFacts(data, id);
  const b = facts.find((f) => f.type === "birth" && f.preferred) ?? facts.find((f) => f.type === "birth") ?? facts.find((f) => f.type === "baptism");
  return dateRange(b?.date);
}

export function estimateBirth(data: FamilyData, id: Id): BirthEstimate | undefined {
  const rels = Object.values(data.relationships);
  const bounds: { lo: number; hi: number; who: Id }[] = [];
  for (const r of rels) {
    if (r.type === "parent" && r.a === id) {
      const c = ownBirth(data, r.b);
      if (c) bounds.push({ lo: c[0] - 50, hi: c[1] - 15, who: r.b });
    }
    if (r.type === "parent" && r.b === id) {
      const p = ownBirth(data, r.a);
      if (p) bounds.push({ lo: p[0] + 15, hi: p[1] + 50, who: r.a });
    }
  }
  if (!bounds.length) {
    for (const r of rels) {
      if (r.type !== "partner" || (r.a !== id && r.b !== id)) continue;
      const other = r.a === id ? r.b : r.a;
      const sp = ownBirth(data, other);
      if (sp) bounds.push({ lo: sp[0] - 15, hi: sp[1] + 15, who: other });
    }
  }
  if (!bounds.length) return undefined;
  const lo = Math.max(...bounds.map((b) => b.lo));
  const hi = Math.min(...bounds.map((b) => b.hi));
  if (hi <= lo) return undefined;
  const names = [...new Set(bounds.map((b) => displayName(data, b.who)))];
  return { range: [Math.floor(lo), Math.ceil(hi)], basis: `estimated from ${names.slice(0, 2).join(" and ")}'s ${names.length > 1 ? "births" : "birth"}` };
}
