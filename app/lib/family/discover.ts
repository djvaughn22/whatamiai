// Discover: where to look for one person the visitor types in, without a tree.
//
// The same research engine as a person's page in My Family, run on a family
// that exists only in memory for this one search. Nothing is stored. What the
// visitor typed becomes facts with no source yet: Discover never knows how
// they know it, so it never labels it as anything stronger.

import { addFact, addPerson, applyPatch, combine, newWorkspace, type Env, type PersonInput } from "./ops";
import { newspaperQueryFor, openQuestions, profileOf, researchPlan, type Lead, type Profile } from "./research";
import { emptyData, type FamilyData, type Id, type Patch, type Sex } from "./types";

export type DiscoverInput = {
  given: string;
  surname: string;
  /** a year ("1918") or anything the date parser reads ("about 1918", "12 Mar 1918") */
  born: string;
  died: string;
  bornPlace: string;
  /** where they lived, when it's not where they were born */
  livedPlace: string;
  sex: Sex;
};

export const EMPTY_DISCOVER: DiscoverInput = { given: "", surname: "", born: "", died: "", bornPlace: "", livedPlace: "", sex: "unknown" };

/** A bare year reads as "about" that year, the way people mean it. */
function roughDate(s: string): string | undefined {
  const t = s.trim();
  if (!t) return undefined;
  return /^\d{4}$/.test(t) ? `about ${t}` : t;
}

export function hasName(i: DiscoverInput): boolean {
  return !!(i.given.trim() || i.surname.trim());
}

/** The person as My Family would store them, every fact with no source yet. */
export function toPersonInput(i: DiscoverInput): PersonInput {
  return {
    given: i.given,
    surname: i.surname,
    sex: i.sex,
    birthDate: roughDate(i.born),
    birthPlace: i.bornPlace,
    deathDate: roughDate(i.died),
    knownHow: "unsure",
  };
}

/** The edit that adds this person (and where they lived) to a family, as one
 *  patch: Discover applies it to a scratch family, "Keep" commits it to the
 *  visitor's own. */
export function discoveredPatch(data: FamilyData, i: DiscoverInput, env?: Env): { patch: Patch; id: Id } {
  const p = addPerson(data, toPersonInput(i), env);
  const lived = i.livedPlace.trim();
  if (!lived || lived === i.bornPlace.trim()) return p;
  const f = addFact(applyPatch(data, p.patch), { personId: p.id, type: "residence", place: lived }, {}, env);
  return { patch: combine(p.patch, f.patch), id: p.id };
}

export type DiscoverResult = {
  profile: Profile;
  plan: Lead[];
  questions: string[];
  newspaper: ReturnType<typeof newspaperQueryFor>;
};

/** The research plan for someone typed in. Nothing is saved anywhere. */
export function discover(i: DiscoverInput, env?: Env): DiscoverResult | null {
  if (!hasName(i)) return null;
  const scratch = emptyData(newWorkspace("Discover", "mine", env));
  const { patch, id } = discoveredPatch(scratch, i, env);
  const data = applyPatch(scratch, patch);
  const profile = profileOf(data, id);
  return { profile, plan: researchPlan(data, id), questions: openQuestions(data, id), newspaper: newspaperQueryFor(profile) };
}
