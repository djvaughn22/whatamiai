// The evidence engine. Every label a person sees is worked out here from the
// citations attached to a fact or relationship. Rules, in order:
//
//   1. Facts that disagree with another active fact of the same kind
//      (two birth dates that can't both be true) are "conflicting" until the
//      person picks one with a reason. The chosen one is then judged normally.
//   2. A confirmed citation giving information made at the time  → verified
//   3. A confirmed later / second-hand citation                   → supported
//   4. A family memory                                            → recollection
//   5. Only records that MIGHT be about this person               → possible
//   6. Nothing attached                                           → unknown
//
// Other people's online trees and AI suggestions are clues: they can never
// lift a fact above "possible", whatever the citation says.
// No percentages anywhere. The reasons list says why a label was given.

import { datesCompatible } from "./dates";
import { placesCompatible } from "./places";
import type { Citation, EvidenceLevel, Fact, FactType, FamilyData, Id, InfoKind, MatchStatus } from "./types";

export const LEVELS: EvidenceLevel[] = ["verified", "supported", "recollection", "possible", "conflicting", "unknown"];

export const LEVEL_INFO: Record<EvidenceLevel, { label: string; icon: string; explain: string }> = {
  verified: {
    label: "Verified",
    icon: "✓",
    explain: "A record made at the time by someone who was there confirms it, and it's been checked against this person.",
  },
  supported: {
    label: "Supported",
    icon: "◐",
    explain: "A later or second-hand record supports it: a census age, an obituary, an index, a published family history.",
  },
  recollection: {
    label: "Family memory",
    icon: "❝",
    explain: "Someone in the family remembers it or was told it. Worth keeping, not yet backed by a record.",
  },
  possible: {
    label: "Possible match",
    icon: "?",
    explain: "A record might be about this person, or the only support is someone else's tree or an AI suggestion. Not confirmed.",
  },
  conflicting: {
    label: "Records disagree",
    icon: "!",
    explain: "Two or more versions can't both be true. Pick one and say why, or keep the question open.",
  },
  unknown: {
    label: "No source yet",
    icon: "○",
    explain: "Nothing is attached. Treat it as unproven until a record or a family memory is added.",
  },
};

export const INFO_LABEL: Record<InfoKind, { label: string; help: string }> = {
  primary: {
    label: "Made at the time",
    help: "Created at or near the event by someone who was there: a birth certificate for a birth, a marriage register for a marriage, an enlistment record for military service.",
  },
  secondary: {
    label: "Later or second-hand",
    help: "Written later or by someone repeating it: an age in a census, an obituary, the birth date on a death certificate, an index, a published family history.",
  },
  recollection: {
    label: "Family memory",
    help: "What a relative remembers or was told.",
  },
};

export const MATCH_LABEL: Record<MatchStatus, string> = {
  confirmed: "Checked: this record is about this person",
  possible: "Not sure yet: might be about this person",
};

/** Fact kinds where only one version can be true. */
const SINGLE_VALUED = new Set<FactType>(["birth", "death", "baptism", "burial", "marriage", "divorce"]);

export function citationsForFact(data: FamilyData, factId: Id): Citation[] {
  return Object.values(data.citations).filter((c) => c.factId === factId);
}

export function citationsForRelationship(data: FamilyData, relId: Id): Citation[] {
  return Object.values(data.citations).filter((c) => c.relationshipId === relId);
}

/** Records saved against a person but not yet tied to a fact. */
export function looseCitations(data: FamilyData, personId: Id): Citation[] {
  return Object.values(data.citations).filter((c) => c.personId === personId && !c.factId && !c.relationshipId);
}

function isClueOnly(data: FamilyData, c: Citation): boolean {
  const kind = data.sources[c.sourceId]?.kind;
  return kind === "tree" || kind === "ai";
}

export function levelFromCitations(data: FamilyData, cites: Citation[]): EvidenceLevel {
  const strong = cites.filter((c) => !isClueOnly(data, c));
  if (strong.some((c) => c.match === "confirmed" && c.info === "primary")) return "verified";
  if (strong.some((c) => c.match === "confirmed" && c.info === "secondary")) return "supported";
  if (strong.some((c) => c.info === "recollection")) return "recollection";
  if (cites.length) return "possible";
  return "unknown";
}

/** Other active facts this one can't agree with. */
export function conflictingFacts(data: FamilyData, fact: Fact): Fact[] {
  if (fact.rejected || !SINGLE_VALUED.has(fact.type)) return [];
  return Object.values(data.facts).filter((f) => {
    if (f.id === fact.id || f.rejected || f.type !== fact.type) return false;
    const same = (fact.personId && f.personId === fact.personId) || (fact.relationshipId && f.relationshipId === fact.relationshipId);
    if (!same) return false;
    return !datesCompatible(f.date, fact.date) || !placesCompatible(f.place, fact.place);
  });
}

export interface Assessment {
  level: EvidenceLevel;
  citations: Citation[];
  conflictsWith: Id[];
  reasons: string[];
}

export function assessFact(data: FamilyData, factId: Id): Assessment {
  const fact = data.facts[factId];
  if (!fact) return { level: "unknown", citations: [], conflictsWith: [], reasons: [] };
  const citations = citationsForFact(data, factId);
  const base = levelFromCitations(data, citations);
  const reasons = citations.map((c) => {
    const s = data.sources[c.sourceId];
    const clue = isClueOnly(data, c) ? " (a clue, not proof)" : "";
    return `${s?.title ?? "A source"}: ${INFO_LABEL[c.info].label.toLowerCase()}, ${c.match === "confirmed" ? "checked" : "not confirmed"}${clue}`;
  });
  if (!citations.length) reasons.push("No record or family memory is attached yet.");
  const conflicts = conflictingFacts(data, fact);
  if (conflicts.length) {
    if (fact.preferred) {
      reasons.unshift(`Chosen over ${conflicts.length} other version${conflicts.length > 1 ? "s" : ""}.`);
      return { level: base, citations, conflictsWith: conflicts.map((f) => f.id), reasons };
    }
    const other = conflicts.some((f) => f.preferred);
    reasons.unshift(other ? "Another version was chosen as the best supported." : `${conflicts.length + 1} versions disagree and none has been chosen yet.`);
    return { level: "conflicting", citations, conflictsWith: conflicts.map((f) => f.id), reasons };
  }
  return { level: base, citations, conflictsWith: [], reasons };
}

export function assessRelationship(data: FamilyData, relId: Id): Assessment {
  const rel = data.relationships[relId];
  if (!rel) return { level: "unknown", citations: [], conflictsWith: [], reasons: [] };
  const citations = citationsForRelationship(data, relId);
  const base = levelFromCitations(data, citations);
  const reasons = citations.map((c) => `${data.sources[c.sourceId]?.title ?? "A source"}: ${INFO_LABEL[c.info].label.toLowerCase()}`);
  if (!citations.length) reasons.push("Nothing yet shows this relationship. Add a record that names them together.");
  if (rel.type === "parent" && (rel.kind ?? "unknown") !== "adopted" && rel.kind !== "step" && rel.kind !== "foster" && rel.kind !== "guardian") {
    // More than two birth parents, or two of the same recorded sex, can't all be right.
    const birthParents = Object.values(data.relationships).filter(
      (r) => r.type === "parent" && r.b === rel.b && (r.kind === "biological" || r.kind === undefined || r.kind === "unknown"),
    );
    const sameSex = birthParents.filter((r) => r.id !== rel.id && data.people[r.a]?.sex && data.people[r.a]?.sex !== "unknown" && data.people[r.a]?.sex === data.people[rel.a]?.sex);
    if (birthParents.length > 2 || sameSex.length) {
      const others = (birthParents.length > 2 ? birthParents.filter((r) => r.id !== rel.id) : sameSex).map((r) => r.id);
      reasons.unshift("Another person is also recorded as this birth parent. One of the links is probably wrong.");
      return { level: "conflicting", citations, conflictsWith: others, reasons };
    }
  }
  return { level: base, citations, conflictsWith: [], reasons };
}

export type LevelCounts = Record<EvidenceLevel, number>;

export function zeroCounts(): LevelCounts {
  return { verified: 0, supported: 0, recollection: 0, possible: 0, conflicting: 0, unknown: 0 };
}

export function personCounts(data: FamilyData, personId: Id): LevelCounts {
  const out = zeroCounts();
  for (const f of Object.values(data.facts)) {
    if (f.personId !== personId || f.rejected || f.type === "name") continue;
    out[assessFact(data, f.id).level]++;
  }
  return out;
}

/** The whole tree at a glance: how much of it rests on records. */
export function treeAudit(data: FamilyData) {
  const facts = zeroCounts();
  const rels = zeroCounts();
  let total = 0;
  for (const f of Object.values(data.facts)) {
    if (f.rejected || f.type === "name") continue;
    if (f.personId && data.people[f.personId]?.mergedInto) continue;
    facts[assessFact(data, f.id).level]++;
    total++;
  }
  for (const r of Object.values(data.relationships)) rels[assessRelationship(data, r.id).level]++;
  const people = Object.values(data.people).filter((p) => !p.mergedInto);
  const peopleWithoutSource = people.filter((p) => {
    const c = personCounts(data, p.id);
    return c.verified + c.supported + c.recollection === 0;
  }).length;
  return { facts, relationships: rels, totalFacts: total, people: people.length, peopleWithoutSource };
}
