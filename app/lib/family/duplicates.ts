// Finding and merging people entered twice. Candidates come with the plain
// reasons they were flagged, never a made-up match percentage. Merging moves
// every fact, source link, relationship, note and file to the person kept,
// and leaves the other record behind as a pointer, so nothing is lost.

import { datesCompatible } from "./dates";
import { activeFacts, givenMatch, nameFacts, surnameMatch, displayName } from "./names";
import { childrenOf, parentsOf, partnersOf, livePeople } from "./graph";
import { PatchBuilder, type Env } from "./ops";
import type { Citation, FamilyData, Fact, Hypothesis, Id, LeadState, Media, Patch, Person, Relationship, Story } from "./types";

export interface DuplicateCandidate {
  a: Id;
  b: Id;
  reasons: string[];
}

function datedFact(data: FamilyData, id: Id, type: Fact["type"]) {
  return activeFacts(data, id).find((f) => f.type === type && f.date?.y !== undefined);
}

export function findDuplicates(data: FamilyData): DuplicateCandidate[] {
  const people = livePeople(data);
  const out: DuplicateCandidate[] = [];
  for (let i = 0; i < people.length; i++) {
    for (let j = i + 1; j < people.length; j++) {
      const a = people[i].id;
      const b = people[j].id;
      const reasons = whySame(data, a, b);
      if (reasons) out.push({ a, b, reasons });
    }
  }
  return out;
}

/** The reasons two people might be one, or null when they shouldn't be flagged. */
export function whySame(data: FamilyData, a: Id, b: Id): string[] | null {
  if (directlyLinked(data, a, b)) return null;
  const sa = data.people[a]?.sex;
  const sb = data.people[b]?.sex;
  if (sa && sb && sa !== "unknown" && sb !== "unknown" && sa !== sb) return null;
  const na = nameFacts(data, a);
  const nb = nameFacts(data, b);
  let given: ReturnType<typeof givenMatch> = null;
  let sur: ReturnType<typeof surnameMatch> = null;
  for (const x of na) {
    for (const y of nb) {
      const g = givenMatch(x.given, y.given);
      const s = surnameMatch(x.surname, y.surname);
      if (g && s && (!given || rank(g) < rank(given))) {
        given = g;
        sur = s;
      }
    }
  }
  if (!given || !sur) return null;
  const reasons: string[] = [];
  reasons.push(sur === "same" ? "Same surname" : "Surnames sound alike (same Soundex code)");
  reasons.push(given === "same" ? "Same first name" : given === "nickname" ? "First names are a common name and nickname pair" : given === "initial" ? "One first name is an initial of the other" : "One first name is a short form of the other");
  const ba = datedFact(data, a, "birth");
  const bb = datedFact(data, b, "birth");
  if (ba && bb) {
    if (!datesCompatible(ba.date, bb.date)) return null;
    reasons.push("Birth dates overlap");
  }
  const da = datedFact(data, a, "death");
  const db = datedFact(data, b, "death");
  if (da && db) {
    if (!datesCompatible(da.date, db.date)) return null;
    reasons.push("Death dates overlap");
  }
  const sharedParents = parentsOf(data, a).filter((p) => parentsOf(data, b).includes(p));
  if (sharedParents.length) reasons.push(`Same parent${sharedParents.length > 1 ? "s" : ""} on record (${sharedParents.map((p) => displayName(data, p)).join(", ")})`);
  const sharedPartners = partnersOf(data, a).filter((p) => partnersOf(data, b).includes(p));
  if (sharedPartners.length) reasons.push(`Same spouse or partner on record (${sharedPartners.map((p) => displayName(data, p)).join(", ")})`);
  // A name alone is too weak: need dates that agree or a shared relative.
  const strong = (ba && bb) || (da && db) || sharedParents.length || sharedPartners.length;
  if (!strong) return null;
  return reasons;
}

function rank(g: NonNullable<ReturnType<typeof givenMatch>>): number {
  return ["same", "nickname", "prefix", "initial"].indexOf(g);
}

function directlyLinked(data: FamilyData, a: Id, b: Id): boolean {
  return parentsOf(data, a).includes(b) || childrenOf(data, a).includes(b) || partnersOf(data, a).includes(b);
}

export type MergeError = "same" | "missing" | "linked";

/** Merge `dropId` into `keepId`. */
export function mergePeople(data: FamilyData, keepId: Id, dropId: Id, env?: Env): { patch: Patch; error?: MergeError } {
  const b = new PatchBuilder(data, env);
  if (keepId === dropId) return { patch: b.patch, error: "same" };
  const keep = data.people[keepId];
  const drop = data.people[dropId];
  if (!keep || !drop) return { patch: b.patch, error: "missing" };
  if (directlyLinked(data, keepId, dropId)) return { patch: b.patch, error: "linked" };
  const keepName = displayName(data, keepId);
  const dropName = displayName(data, dropId);

  for (const f of Object.values(data.facts)) {
    if (f.personId !== dropId) continue;
    // a second name fact should not compete with the kept person's main name
    b.put<Fact>("facts", { ...f, personId: keepId, preferred: f.type === "name" ? false : f.preferred, updatedAt: b.now });
  }
  for (const c of Object.values(data.citations)) if (c.personId === dropId) b.put<Citation>("citations", { ...c, personId: keepId });

  // Relationships: repoint, then fold duplicates into the one already there.
  const existing = Object.values(data.relationships).filter((r) => r.a === keepId || r.b === keepId);
  for (const r of Object.values(data.relationships)) {
    if (r.a !== dropId && r.b !== dropId) continue;
    const moved: Relationship = { ...r, a: r.a === dropId ? keepId : r.a, b: r.b === dropId ? keepId : r.b, updatedAt: b.now };
    const twin = existing.find(
      (e) => e.type === moved.type && ((e.a === moved.a && e.b === moved.b) || (moved.type === "partner" && e.a === moved.b && e.b === moved.a)),
    );
    if (twin) {
      for (const c of Object.values(data.citations)) if (c.relationshipId === r.id) b.put<Citation>("citations", { ...c, relationshipId: twin.id });
      for (const f of Object.values(data.facts)) if (f.relationshipId === r.id) b.put<Fact>("facts", { ...f, relationshipId: twin.id, updatedAt: b.now });
      b.del("relationships", r.id);
    } else {
      b.put("relationships", moved);
    }
  }
  for (const l of Object.values(data.leads)) {
    if (l.personId !== dropId) continue;
    const clash = Object.values(data.leads).find((k) => k.personId === keepId && k.key === l.key);
    if (clash) b.del("leads", l.id);
    else b.put<LeadState>("leads", { ...l, personId: keepId, updatedAt: b.now });
  }
  for (const h of Object.values(data.hypotheses)) if (h.personId === dropId) b.put<Hypothesis>("hypotheses", { ...h, personId: keepId, updatedAt: b.now });
  for (const m of Object.values(data.media)) {
    if (m.personIds.includes(dropId)) b.put<Media>("media", { ...m, personIds: [...new Set(m.personIds.map((p) => (p === dropId ? keepId : p)))] });
  }
  for (const s of Object.values(data.stories)) {
    if (s.personIds.includes(dropId)) b.put<Story>("stories", { ...s, personIds: [...new Set(s.personIds.map((p) => (p === dropId ? keepId : p)))], updatedAt: b.now });
  }
  b.put<Person>("people", { ...drop, mergedInto: keepId, updatedAt: b.now });
  b.put<Person>("people", {
    ...keep,
    sex: keep.sex && keep.sex !== "unknown" ? keep.sex : drop.sex,
    living: keep.living ?? drop.living,
    isSelf: keep.isSelf || drop.isSelf || undefined,
    updatedAt: b.now,
  });
  if (data.workspace.focusPersonId === dropId) b.patch.workspace = { ...data.workspace, focusPersonId: keepId, updatedAt: b.now };
  b.log("merge", "people", keepId, `Merged ${dropName} into ${keepName}`);
  return { patch: b.patch };
}
