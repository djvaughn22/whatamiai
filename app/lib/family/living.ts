// Living people are private by default. A person counts as living unless
// someone marked them deceased, a death or burial is recorded, or they were
// born more than 110 years ago. When in doubt, protect.

import { dateRange } from "./dates";
import { activeFacts, primaryName } from "./names";
import { estimateBirth } from "./estimate";
import type { FamilyData, Id } from "./types";

export const PRESUME_DECEASED_AFTER_YEARS = 110;

export type LivingStatus = { living: boolean; why: string };

export function livingStatus(data: FamilyData, personId: Id, now = new Date()): LivingStatus {
  const p = data.people[personId];
  if (!p) return { living: false, why: "" };
  if (p.living === "no") return { living: false, why: "Marked as deceased." };
  if (p.living === "yes") return { living: true, why: "Marked as living." };
  const facts = activeFacts(data, personId);
  if (facts.some((f) => f.type === "death" || f.type === "burial")) return { living: false, why: "A death or burial is recorded." };
  const birth = facts.find((f) => f.type === "birth" || f.type === "baptism");
  const r = dateRange(birth?.date);
  const year = now.getUTCFullYear();
  if (r && r[1] < year - PRESUME_DECEASED_AFTER_YEARS) return { living: false, why: `Born more than ${PRESUME_DECEASED_AFTER_YEARS} years ago.` };
  if (r) return { living: true, why: "Born within the last 110 years with no death recorded, so treated as living." };
  const est = estimateBirth(data, personId);
  if (est && est.range[1] < year - PRESUME_DECEASED_AFTER_YEARS) return { living: false, why: `Born before ${est.range[1]} (${est.basis}).` };
  return { living: true, why: "No birth or death date yet, so treated as living to be safe." };
}

export function isLiving(data: FamilyData, personId: Id): boolean {
  return livingStatus(data, personId).living;
}

/** The name to show anywhere a living person must stay private. */
export function privateLabel(data: FamilyData, personId: Id): string {
  const { surname } = primaryName(data, personId);
  return surname ? `Living ${surname}` : "Living person";
}

/** Copy of the data with living people's details removed, for sharing.
 *  Their place in the tree stays so the structure still makes sense. */
export function redactLiving(data: FamilyData): FamilyData {
  const living = new Set(Object.keys(data.people).filter((id) => isLiving(data, id)));
  const facts: FamilyData["facts"] = {};
  for (const f of Object.values(data.facts)) {
    if (f.personId && living.has(f.personId)) {
      if (f.type === "name") facts[f.id] = { ...f, given: "Living", nickname: undefined, note: undefined };
      continue;
    }
    if (f.relationshipId) {
      const rel = data.relationships[f.relationshipId];
      if (rel && (living.has(rel.a) || living.has(rel.b))) continue;
    }
    facts[f.id] = f;
  }
  const citations: FamilyData["citations"] = {};
  for (const c of Object.values(data.citations)) {
    if (c.factId && !facts[c.factId]) continue;
    if (c.personId && living.has(c.personId)) continue;
    citations[c.id] = c;
  }
  const media: FamilyData["media"] = {};
  for (const m of Object.values(data.media)) if (!m.personIds.some((id) => living.has(id))) media[m.id] = m;
  const hypotheses: FamilyData["hypotheses"] = {};
  for (const h of Object.values(data.hypotheses)) if (!h.personId || !living.has(h.personId)) hypotheses[h.id] = h;
  const leads: FamilyData["leads"] = {};
  for (const l of Object.values(data.leads)) if (!living.has(l.personId)) leads[l.id] = l;
  return { ...data, facts, citations, media, hypotheses, leads, changes: [] };
}
