// The example family. EVERY PERSON AND EVERY RECORD HERE IS MADE UP.
// Real places are used so the map and the research plan have something to
// show, but no source below exists: each title says "(example)" and the
// repository is "Example archive (made up)". The family is built to show
// every evidence label, one disagreement, one duplicate to merge, two
// migrations, a couple's story and private living people.

import { applyPatch, addCitation, addFact, addHypothesis, addPerson, addRelationship, addSource, addStory, setLead, type Env, type KnownHow } from "./ops";
import { emptyData, type FactType, type FamilyData, type Id, type InfoKind, type MatchStatus, type SourceKind } from "./types";

export const EXAMPLE_NAME = "Example family (made up)";

export function buildExampleFamily(): FamilyData {
  let n = 0;
  const env: Env = { now: "2026-11-15T12:00:00.000Z", newId: () => `ex-${(++n).toString(36)}` };
  let data = emptyData({ id: "example-family", name: EXAMPLE_NAME, kind: "example", schema: 1, createdAt: env.now!, updatedAt: env.now! });
  const run = <T extends { patch: import("./types").Patch }>(r: T): T => {
    data = applyPatch(data, r.patch);
    return r;
  };

  const src = (title: string, kind: SourceKind = "record", note?: string): Id =>
    run(addSource(data, { title: `${title} (example)`, kind, repository: "Example archive (made up)", note, example: true }, env)).id;
  const cite = (sourceId: Id, target: { factId?: Id; relationshipId?: Id; personId?: Id }, info: InfoKind, match: MatchStatus = "confirmed", detail?: string, note?: string) =>
    run(addCitation(data, { sourceId, ...target, info, match, detail, note }, env));
  const person = (given: string, surname: string, sex: "female" | "male", extra: { living?: "yes" | "no"; isSelf?: boolean } = {}): Id =>
    run(addPerson(data, { given, surname, sex, ...extra }, env)).id;
  const fact = (personId: Id | undefined, type: FactType, date?: string, place?: string, value?: string, how?: KnownHow, memoryNote?: string, relationshipId?: Id): Id =>
    run(addFact(data, { personId, relationshipId, type, date, place, value }, { knownHow: how, memoryNote }, env)).id;
  const parent = (p: Id, c: Id, how?: KnownHow): Id => run(addRelationship(data, { type: "parent", a: p, b: c, kind: "biological", knownHow: how }, env)).id!;
  const couple = (a: Id, b: Id): Id => run(addRelationship(data, { type: "partner", a, b, status: "married" }, env)).id!;

  // ── Generation 1: the Lindqvists from Sweden ──
  const anders = person("Anders", "Lindqvist", "male");
  const karin = person("Karin", "Nilsdotter", "female");
  const sBirthA = src("Parish birth register, Kalmar län, Sweden");
  cite(sBirthA, { factId: fact(anders, "birth", "12 Mar 1861", "Kalmar län, Sweden") }, "primary", "confirmed", "Entry 14");
  const sEmig = src("Emigrant list, Gothenburg, 1887");
  cite(sEmig, { factId: fact(anders, "emigration", "Apr 1887", "Gothenburg, Sweden") }, "primary");
  const sShip = src("Passenger list, Port of New York, 1887");
  cite(sShip, { factId: fact(anders, "immigration", "May 1887", "New York, New York") }, "primary", "confirmed", "Line 22");
  const s1900 = src("1900 census page, Duluth, Minnesota");
  const ar = fact(anders, "residence", "1900", "Duluth, St. Louis County, Minnesota");
  cite(s1900, { factId: ar }, "primary", "confirmed", "Sheet 7A, line 31");
  cite(s1900, { factId: fact(anders, "occupation", "1900", "Duluth, Minnesota", "dock laborer") }, "primary", "confirmed", "Sheet 7A, line 31");
  const sDeathA = src("Death certificate, Duluth, 1934");
  cite(sDeathA, { factId: fact(anders, "death", "2 Jan 1934", "Duluth, Minnesota") }, "primary");
  cite(sDeathA, { factId: fact(anders, "burial", "Jan 1934", "Duluth, Minnesota") }, "primary");

  // Karin's birth: two records disagree, on purpose.
  const sDeathK = src("Death certificate, Duluth, 1940");
  cite(sDeathK, { factId: fact(karin, "birth", "6 May 1864", "Kalmar län, Sweden") }, "secondary", "confirmed", "Informant: her son Erik");
  cite(s1900, { factId: fact(karin, "birth", "May 1868", "Sweden") }, "secondary", "confirmed", "Sheet 7A, line 32");
  cite(sDeathK, { factId: fact(karin, "death", "19 Oct 1940", "Duluth, Minnesota") }, "primary");
  const ak = couple(anders, karin);
  const sMarrA = src("Marriage register, St. Louis County, Minnesota");
  cite(sMarrA, { factId: fact(undefined, "marriage", "1888", "Duluth, Minnesota", undefined, undefined, undefined, ak) }, "primary");

  // ── Generation 1: the Moreaus from Quebec ──
  const joseph = person("Joseph", "Moreau", "male");
  const marie = person("Marie-Louise", "Gagnon", "female");
  const sBap = src("Parish baptism register, Trois-Rivières, Quebec");
  cite(sBap, { factId: fact(joseph, "baptism", "4 Feb 1870", "Trois-Rivières, Quebec, Canada") }, "primary");
  const sBorder = src("Border crossing card, Detroit, 1903");
  cite(sBorder, { factId: fact(joseph, "immigration", "Jun 1903", "Detroit, Michigan") }, "primary");
  const s1910 = src("1910 census page, Detroit, Michigan");
  cite(s1910, { factId: fact(joseph, "residence", "1910", "Detroit, Wayne County, Michigan") }, "primary");
  cite(s1910, { factId: fact(joseph, "occupation", "1910", "Detroit, Michigan", "carpenter") }, "primary");
  fact(joseph, "death", "about 1938", "Detroit, Michigan", undefined, "memory", "Told by Jeanne's daughter (example)");
  cite(s1910, { factId: fact(marie, "birth", "about 1874", "Quebec, Canada") }, "secondary", "confirmed", "Age 36 in 1910");
  const sObitM = src("Obituary, Detroit newspaper, 1951", "newspaper");
  cite(sObitM, { factId: fact(marie, "death", "Mar 1951", "Detroit, Michigan") }, "secondary");
  const jm = couple(joseph, marie);
  cite(sBap, { factId: fact(undefined, "marriage", "1895", "Trois-Rivières, Quebec, Canada", undefined, undefined, undefined, jm) }, "primary", "confirmed", "Marriage entry, 1895");

  // ── Generation 2 ──
  const erik = person("Erik", "Lindqvist", "male");
  const sBirthE = src("Birth record, Duluth, 1890");
  cite(sBirthE, { factId: fact(erik, "birth", "3 Aug 1890", "Duluth, Minnesota") }, "primary");
  cite(sBirthE, { relationshipId: parent(anders, erik) }, "primary");
  cite(sBirthE, { relationshipId: parent(karin, erik) }, "primary");
  const sDraft = src("World War I draft registration card, Duluth");
  cite(sDraft, { factId: fact(erik, "other", "5 Jun 1917", "Duluth, Minnesota", "Registered for the World War I draft") }, "primary");
  fact(erik, "military", "1918", "France", "U.S. Army", "memory", "Told by his grandson (example). A draft card shows registration, not service.");
  const s1920 = src("1920 census page, Duluth, Minnesota");
  cite(s1920, { factId: fact(erik, "residence", "1920", "Duluth, Minnesota") }, "primary");
  cite(s1920, { factId: fact(erik, "occupation", "1920", "Duluth, Minnesota", "railroad clerk") }, "primary");
  cite(src("Death certificate, Duluth, 1962"), { factId: fact(erik, "death", "11 Nov 1962", "Duluth, Minnesota") }, "primary");

  const clara = person("Clara", "Hale", "female");
  cite(src("1900 census page, Marietta, Ohio"), { factId: fact(clara, "birth", "1893", "Marietta, Washington County, Ohio") }, "secondary", "confirmed", "Age 7 in 1900");
  cite(src("Social Security death index entry", "website"), { factId: fact(clara, "death", "Apr 1975", "Duluth, Minnesota") }, "secondary");
  const ec = couple(erik, clara);
  const sNotice = src("Newspaper notice, Duluth, 1914", "newspaper", "Names an \"E. Lindqvist\" and \"Miss Clara Hale\". Could be them.");
  cite(sNotice, { factId: fact(undefined, "marriage", "Jun 1914", "Duluth, Minnesota", undefined, undefined, undefined, ec) }, "secondary", "possible");

  const henri = person("Henri", "Moreau", "male");
  const sBapH = src("Parish baptism register, Trois-Rivières, 1899");
  cite(sBapH, { factId: fact(henri, "baptism", "21 Sep 1899", "Trois-Rivières, Quebec, Canada") }, "primary");
  cite(sBapH, { relationshipId: parent(joseph, henri) }, "primary");
  cite(sBapH, { relationshipId: parent(marie, henri) }, "primary");
  cite(sBorder, { factId: fact(henri, "immigration", "Jun 1903", "Detroit, Michigan") }, "primary", "confirmed", "Listed with his parents");
  const s1930 = src("1930 census page, Detroit, Michigan");
  cite(s1930, { factId: fact(henri, "residence", "1930", "Detroit, Michigan") }, "primary");
  cite(s1930, { factId: fact(henri, "occupation", "1930", "Detroit, Michigan", "machinist, auto plant") }, "primary");
  cite(src("Obituary, Detroit newspaper, 1970", "newspaper"), { factId: fact(henri, "death", "1970", "Detroit, Michigan") }, "secondary");
  const rose = person("Rose", "Dumont", "female");
  cite(s1930, { factId: fact(rose, "birth", "about 1901", "Michigan") }, "secondary", "confirmed", "Age 29 in 1930");
  fact(rose, "death", "1985", "Detroit, Michigan");
  const hr = couple(henri, rose);
  cite(src("Marriage record, Wayne County, Michigan, 1922"), { factId: fact(undefined, "marriage", "1922", "Detroit, Michigan", undefined, undefined, undefined, hr) }, "primary");

  // ── Generation 3 ──
  const walter = person("Walter", "Lindqvist", "male");
  const sBirthW = src("Birth certificate, Duluth, 1921");
  cite(sBirthW, { factId: fact(walter, "birth", "17 Feb 1921", "Duluth, Minnesota") }, "primary");
  cite(sBirthW, { relationshipId: parent(erik, walter) }, "primary");
  cite(sBirthW, { relationshipId: parent(clara, walter) }, "primary");
  cite(src("Navy enlistment record, 1942"), { factId: fact(walter, "military", "between 1942 and 1945", "Pacific", "U.S. Navy") }, "primary");
  fact(walter, "residence", "1945", "San Diego, California", undefined, "memory", "Told by his daughter (example)");
  cite(src("Death index entry, 1999", "website"), { factId: fact(walter, "death", "1999", "Duluth, Minnesota") }, "secondary");

  const jeanne = person("Jeanne", "Moreau", "female");
  const sBirthJ = src("Birth record, Detroit, 1924");
  cite(sBirthJ, { factId: fact(jeanne, "birth", "9 Jun 1924", "Detroit, Michigan") }, "primary");
  cite(sBirthJ, { relationshipId: parent(henri, jeanne) }, "primary");
  cite(sBirthJ, { relationshipId: parent(rose, jeanne) }, "primary");
  cite(src("City directory, San Diego, 1944", "book"), { factId: fact(jeanne, "residence", "1944", "San Diego, California") }, "secondary");
  cite(src("Obituary, Duluth newspaper, 2008", "newspaper"), { factId: fact(jeanne, "death", "2008", "Duluth, Minnesota") }, "secondary");
  const wj = couple(walter, jeanne);
  cite(src("Marriage certificate, Detroit, 1946"), { factId: fact(undefined, "marriage", "14 Sep 1946", "Detroit, Michigan", undefined, undefined, undefined, wj) }, "primary");
  fact(undefined, "memory", undefined, "San Diego, California", "They met at a dance in San Diego in 1945, while he was on leave.", "memory", "Told by their daughter (example)", wj);

  const ruth = person("Ruth", "Lindqvist", "female");
  const s1930d = src("1930 census page, Duluth, Minnesota");
  cite(s1930d, { factId: fact(ruth, "birth", "1923", "Duluth, Minnesota") }, "secondary", "confirmed", "Age 7 in 1930");
  cite(s1930d, { relationshipId: parent(erik, ruth) }, "secondary");
  cite(s1930d, { relationshipId: parent(clara, ruth) }, "secondary");
  // The same Ruth, entered a second time from a cousin's note: a duplicate to merge.
  const ruthie = person("Ruthie", "Lindquist", "female");
  fact(ruthie, "birth", "about 1923", "Minnesota", undefined, "memory", "From a cousin's note (example)");
  parent(clara, ruthie, "memory");

  // ── Living people: private ──
  const karen = person("Karen", "Lindqvist", "female", { living: "yes" });
  fact(karen, "birth", "1951", "Duluth, Minnesota", undefined, "memory");
  parent(walter, karen, "memory");
  parent(jeanne, karen, "memory");
  const sam = person("Sam", "Lindqvist", "female", { living: "yes", isSelf: true });
  parent(karen, sam, "memory");

  // ── Ideas, research progress, stories ──
  run(addHypothesis(data, { personId: clara, text: "Clara may be the daughter of a Thomas Hale of Washington County, Ohio.", origin: "ai", basis: "An AI chat suggested this from her Marietta birthplace (example). Not checked." }, env));
  run(addHypothesis(data, { personId: anders, text: "Anders may have worked the Duluth ore docks for most of his life.", origin: "you", basis: "His 1900 occupation (example)." }, env));
  data = applyPatch(data, setLead(data, walter, "us-census-1930", "found", "Found him age 9 with his parents in Duluth (example).", env));
  data = applyPatch(data, setLead(data, erik, "ww1-draft", "found", "This is the draft card already attached (example).", env));
  data = applyPatch(data, setLead(data, clara, "us-census-1900", "nothing", "Two Clara Hales in Marietta; neither confirmed yet (example).", env));
  run(addStory(data, { template: "how-met", title: "How Walter and Jeanne met", personIds: [walter, jeanne] }, env));
  run(addStory(data, { template: "journey", title: "The Lindqvists' journey from Sweden", personIds: [anders, karin] }, env));
  run(addStory(data, { template: "military", title: "Our family's military service", personIds: [] }, env));
  data = { ...data, workspace: { ...data.workspace, focusPersonId: walter }, changes: [] };
  return data;
}
