import { describe, expect, it } from "vitest";
import { ageAt, dateRange, datesCompatible, formatDate, parseDate, toGedcomDate } from "../dates";
import { givenMatch, soundex, surnameMatch } from "../names";
import { placesCompatible, resolvePlace, usStateOf, countryOf, type StateGaz } from "../places";
import { assessFact, assessRelationship, treeAudit } from "../evidence";
import { buildExampleFamily } from "../example";
import { findDuplicates, mergePeople } from "../duplicates";
import { applyPatch, addPerson, addFact, addCitation, addSource, addRelationship, chooseFact, removePerson } from "../ops";
import { exportGedcom, importGedcom, parseGedcomLines } from "../gedcom";
import { isLiving, redactLiving } from "../living";
import { kinshipTo, siblingsOf } from "../graph";
import { researchPlan } from "../research";
import { buildStory, storyText } from "../stories";
import { buildAiPrompt } from "../aiPrompt";
import { emptyData, type FamilyData } from "../types";
import { displayName } from "../names";
import { parseLocResponse, newspaperUrl, searchNewspapers, resetLocLimiter, LocLimitError } from "../loc";
import { readBackup, toBackup, withFreshIds } from "../backupJson";
import { legsFor, stopsFor } from "../journey";

let n = 0;
const env = () => ({ now: "2026-11-15T00:00:00.000Z", newId: () => `t${++n}` });
const blank = (): FamilyData => emptyData({ id: "w", name: "Test", kind: "mine", schema: 1, createdAt: "x", updatedAt: "x" });
const byName = (d: FamilyData, name: string) => Object.keys(d.people).find((id) => displayName(d, id) === name)!;

describe("dates", () => {
  it("reads the forms genealogists write", () => {
    expect(parseDate("abt 1918")).toMatchObject({ kind: "about", y: 1918 });
    expect(parseDate("about 1918")).toMatchObject({ kind: "about", y: 1918 });
    expect(parseDate("c. 1918")).toMatchObject({ kind: "about", y: 1918 });
    expect(parseDate("1918?")).toMatchObject({ kind: "about", y: 1918 });
    expect(parseDate("BEF 1861")).toMatchObject({ kind: "before", y: 1861 });
    expect(parseDate("after 1900")).toMatchObject({ kind: "after", y: 1900 });
    expect(parseDate("BET 1900 AND 1905")).toMatchObject({ kind: "between", y: 1900, y2: 1905 });
    expect(parseDate("1900-1905")).toMatchObject({ kind: "between", y: 1900, y2: 1905 });
    expect(parseDate("1910s")).toMatchObject({ kind: "between", y: 1910, y2: 1919 });
    expect(parseDate("12 Mar 1942")).toMatchObject({ kind: "exact", y: 1942, m: 3, d: 12 });
    expect(parseDate("March 12, 1942")).toMatchObject({ kind: "exact", y: 1942, m: 3, d: 12 });
    expect(parseDate("1942-03-12")).toMatchObject({ kind: "exact", y: 1942, m: 3, d: 12 });
    expect(parseDate("3/12/1942")).toMatchObject({ kind: "exact", y: 1942, m: 3, d: 12 });
    expect(parseDate("Mar 1942")).toMatchObject({ kind: "exact", y: 1942, m: 3 });
    expect(parseDate("FROM 1940 TO 1945")).toMatchObject({ kind: "between", y: 1940, y2: 1945 });
    expect(parseDate("sometime long ago")).toMatchObject({ kind: "unknown" });
    expect(parseDate("")).toBeUndefined();
  });
  it("keeps the typed text and formats plainly", () => {
    expect(parseDate("abt 1918")!.text).toBe("abt 1918");
    expect(formatDate(parseDate("12 MAR 1942"))).toBe("12 Mar 1942");
    expect(formatDate(parseDate("1900-1905"))).toBe("1900–1905");
    expect(toGedcomDate(parseDate("about 1918"))).toBe("ABT 1918");
    expect(toGedcomDate(parseDate("between 1900 and 1905"))).toBe("BET 1900 AND 1905");
  });
  it("knows when two dates can't both be right", () => {
    expect(datesCompatible(parseDate("1918"), parseDate("about 1919"))).toBe(true);
    expect(datesCompatible(parseDate("6 May 1864"), parseDate("May 1868"))).toBe(false);
    expect(datesCompatible(parseDate("before 1861"), parseDate("1870"))).toBe(false);
    expect(dateRange(parseDate("unknown"))).toBeUndefined();
  });
  it("gives honest ages", () => {
    expect(ageAt(parseDate("12 Mar 1918"), parseDate("7 Dec 1941"))).toBe("23");
    expect(ageAt(parseDate("1918"), parseDate("7 Dec 1941"))).toBe("22 or 23");
  });
});

describe("names and places", () => {
  it("matches the way record indexes do", () => {
    expect(soundex("Lindqvist")).toBe(soundex("Lindquist"));
    expect(soundex("Benton")).toBe(soundex("Bentin"));
    expect(soundex("Ashcraft")).toBe("A261");
    expect(givenMatch("Dorothy", "Dotty")).toBe("nickname");
    expect(givenMatch("Ruth", "Ruthie")).toBe("nickname");
    expect(givenMatch("Harold", "H.")).toBe("initial");
    expect(surnameMatch("Kowalski", "Kowalsky")).toBe("sound");
    expect(givenMatch("Mary", "Robert")).toBeNull();
  });
  it("compares place strings by their parts", () => {
    expect(placesCompatible("Sedalia, MO", "Sedalia, Pettis County, Missouri, USA")).toBe(true);
    expect(placesCompatible("Missouri", "Sedalia, Pettis Co., Mo.")).toBe(true);
    expect(placesCompatible("Warsaw, Missouri", "Sedalia, Missouri")).toBe(false);
    expect(placesCompatible("Missouri", "Illinois")).toBe(false);
    expect(usStateOf("Sedalia, Mo.")).toBe("MO");
    expect(countryOf("Calabria, Italy")).toBe("Italy");
    expect(countryOf("Kalmar län, Sweden")).toBe("Sweden");
    expect(countryOf("Trois-Rivières, Quebec, Canada")).toBe("Canada");
  });
  it("puts places on the map no more precisely than the data allows", async () => {
    const mo: StateGaz = { p: [["Sedalia", 38.7071, -93.2353], ["Warsaw", 38.2464, -93.3818]], c: [["Pettis", 38.7283, -93.2853], ["Benton", 38.2948, -93.2878]] };
    const loaders = { state: async (s: string) => (s === "MO" ? mo : null) };
    expect(await resolvePlace("Sedalia, Pettis, Missouri", loaders)).toMatchObject({ precision: "town", lat: 38.7071 });
    expect(await resolvePlace("Pettis County, Missouri", loaders)).toMatchObject({ precision: "county" });
    expect(await resolvePlace("Somewhere, Missouri", loaders)).toMatchObject({ precision: "region", label: "Missouri" });
    expect(await resolvePlace("Calabria, Italy", loaders)).toMatchObject({ precision: "region", country: "Italy" });
    expect(await resolvePlace("Naples, Italy", loaders)).toMatchObject({ precision: "town" });
    expect(await resolvePlace("Italy", { ...loaders, countryCenter: () => [12.5, 42.8] })).toMatchObject({ precision: "country" });
    expect(await resolvePlace("", loaders)).toBeNull();
  });
});

describe("evidence engine", () => {
  const ex = buildExampleFamily();
  it("shows all six labels in the example family", () => {
    const levels = new Set(Object.keys(ex.facts).map((id) => assessFact(ex, id).level));
    for (const l of ["verified", "supported", "recollection", "possible", "conflicting", "unknown"]) expect(levels.has(l as never)).toBe(true);
  });
  it("marks disagreeing records until one is chosen with a reason", () => {
    const karin = byName(ex, "Karin Nilsdotter");
    const births = Object.values(ex.facts).filter((f) => f.personId === karin && f.type === "birth");
    expect(births).toHaveLength(2);
    expect(births.every((f) => assessFact(ex, f.id).level === "conflicting")).toBe(true);
    const chosen = births.find((f) => f.date?.y === 1864)!;
    const other = births.find((f) => f.date?.y === 1868)!;
    const after = applyPatch(ex, chooseFact(ex, chosen.id, "Her death certificate and the parish book agree", [other.id], env()));
    expect(assessFact(after, chosen.id).level).toBe("supported");
    expect(assessFact(after, other.id).level).toBe("conflicting");
    expect(after.facts[chosen.id].note).toContain("Chosen because");
  });
  it("never lets another tree or an AI lift a fact above possible", () => {
    let d = blank();
    const p = addPerson(d, { given: "A", surname: "B", birthDate: "1900" }, env());
    d = applyPatch(d, p.patch);
    const birth = Object.values(d.facts).find((f) => f.type === "birth")!;
    const s = addSource(d, { title: "Public Member Trees", kind: "tree" }, env());
    d = applyPatch(d, s.patch);
    d = applyPatch(d, addCitation(d, { sourceId: s.id, factId: birth.id, info: "primary", match: "confirmed" }, env()).patch);
    expect(assessFact(d, birth.id).level).toBe("possible");
  });
  it("treats a family memory as a memory", () => {
    let d = blank();
    d = applyPatch(d, addPerson(d, { given: "A", surname: "B", birthDate: "about 1918", birthPlace: "Missouri", knownHow: "memory" }, env()).patch);
    const birth = Object.values(d.facts).find((f) => f.type === "birth")!;
    expect(assessFact(d, birth.id).level).toBe("recollection");
    const unsure = applyPatch(blank(), addPerson(blank(), { given: "C", surname: "D", birthDate: "1918" }, env()).patch);
    expect(assessFact(unsure, Object.values(unsure.facts).find((f) => f.type === "birth")!.id).level).toBe("unknown");
  });
  it("flags a child with two recorded birth fathers", () => {
    let d = blank();
    const ids: string[] = [];
    for (const [g, sex] of [["Kid", "male"], ["Dad1", "male"], ["Dad2", "male"]] as const) {
      const r = addPerson(d, { given: g, surname: "X", sex }, env());
      d = applyPatch(d, r.patch);
      ids.push(r.id);
    }
    const r1 = addRelationship(d, { type: "parent", a: ids[1], b: ids[0] }, env());
    d = applyPatch(d, r1.patch);
    const r2 = addRelationship(d, { type: "parent", a: ids[2], b: ids[0] }, env());
    d = applyPatch(d, r2.patch);
    expect(assessRelationship(d, r1.id!).level).toBe("conflicting");
  });
  it("refuses loops and self links", () => {
    let d = blank();
    const a = addPerson(d, { given: "A" }, env());
    d = applyPatch(d, a.patch);
    const b = addPerson(d, { given: "B" }, env());
    d = applyPatch(d, b.patch);
    d = applyPatch(d, addRelationship(d, { type: "parent", a: a.id, b: b.id }, env()).patch);
    expect(addRelationship(d, { type: "parent", a: b.id, b: a.id }, env()).error).toBe("loop");
    expect(addRelationship(d, { type: "parent", a: a.id, b: a.id }, env()).error).toBe("self");
    expect(addRelationship(d, { type: "parent", a: a.id, b: b.id }, env()).error).toBe("duplicate");
  });
  it("audits a whole tree", () => {
    const audit = treeAudit(ex);
    expect(audit.people).toBe(Object.keys(ex.people).length);
    expect(audit.facts.verified).toBeGreaterThan(10);
  });
});

describe("relationships", () => {
  const ex = buildExampleFamily();
  it("names kinship from the person using the app", () => {
    const sam = Object.values(ex.people).find((p) => p.isSelf)!.id;
    expect(kinshipTo(ex, sam, byName(ex, "Walter Lindqvist"))).toBe("your grandfather");
    expect(kinshipTo(ex, sam, byName(ex, "Erik Lindqvist"))).toBe("your great-grandfather");
    expect(kinshipTo(ex, sam, byName(ex, "Anders Lindqvist"))).toBe("your 2nd great-grandfather");
    expect(kinshipTo(ex, sam, byName(ex, "Ruth Lindqvist"))).toBe("your great-aunt");
  });
  it("finds siblings", () => {
    const walter = byName(ex, "Walter Lindqvist");
    const sibs = siblingsOf(ex, walter);
    expect(sibs.map((s) => displayName(ex, s.id))).toContain("Ruth Lindqvist");
  });
});

describe("duplicates and merging", () => {
  it("finds the example duplicate with plain reasons and merges without loss", () => {
    const ex = buildExampleFamily();
    const dups = findDuplicates(ex);
    expect(dups).toHaveLength(1);
    const { a, b, reasons } = dups[0];
    expect(reasons.join(" ")).toMatch(/sound alike/);
    expect(reasons.join(" ")).toMatch(/nickname/);
    const ruth = byName(ex, "Ruth Lindqvist");
    const keep = a === ruth ? a : b;
    const drop = a === ruth ? b : a;
    const factsBefore = Object.values(ex.facts).filter((f) => f.personId === keep || f.personId === drop).length;
    const merged = applyPatch(ex, mergePeople(ex, keep, drop, env()).patch);
    expect(merged.people[drop].mergedInto).toBe(keep);
    expect(Object.values(merged.facts).filter((f) => f.personId === keep).length).toBe(factsBefore);
    // Clara → Ruth link existed on both: folded into one, its evidence kept
    const claraLinks = Object.values(merged.relationships).filter((r) => r.type === "parent" && r.b === keep && r.a === byName(ex, "Clara Hale"));
    expect(claraLinks).toHaveLength(1);
    expect(Object.values(merged.citations).filter((c) => c.relationshipId === claraLinks[0].id).length).toBe(2);
    expect(findDuplicates(merged)).toHaveLength(0);
  });
  it("won't merge a parent into a child", () => {
    const ex = buildExampleFamily();
    expect(mergePeople(ex, byName(ex, "Walter Lindqvist"), byName(ex, "Erik Lindqvist"), env()).error).toBe("linked");
  });
});

describe("GEDCOM", () => {
  const sample = [
    "0 HEAD",
    "1 SOUR FTM",
    "2 NAME Family Tree Maker",
    "1 GEDC",
    "2 VERS 5.5.1",
    "0 @I1@ INDI",
    "1 NAME Harold /Benton/",
    "1 SEX M",
    "1 BIRT",
    "2 DATE ABT 1918",
    "2 PLAC Sedalia, Pettis, Missouri, USA",
    "2 SOUR @S1@",
    "3 PAGE Sheet 4B",
    "3 QUAY 2",
    "1 EVEN U.S. Marine Corps",
    "2 TYPE Military Service",
    "2 DATE 1943",
    "1 NOTE A long note that",
    "2 CONC  continues here",
    "2 CONT and a second line",
    "1 FAMS @F1@",
    "0 @I2@ INDI",
    "1 NAME Example /Person/",
    "1 SEX F",
    "1 BIRT",
    "2 DATE 1920",
    "2 SOUR @S2@",
    "1 FAMS @F1@",
    "0 @I3@ INDI",
    "1 NAME Child /Benton/",
    "1 FAMC @F1@",
    "0 @F1@ FAM",
    "1 HUSB @I1@",
    "1 WIFE @I2@",
    "1 CHIL @I3@",
    "1 MARR",
    "2 DATE 1944",
    "2 PLAC California",
    "0 @S1@ SOUR",
    "1 TITL 1920 United States Federal Census",
    "0 @S2@ SOUR",
    "1 TITL Ancestry Family Trees",
    "0 OBJE",
    "0 TRLR",
  ].join("\r\n");

  it("parses lines with CONC and CONT", () => {
    const roots = parseGedcomLines(sample);
    const indi = roots.find((r) => r.xref === "@I1@")!;
    expect(indi.children.find((c) => c.tag === "NOTE")!.value).toBe("A long note that continues here\nand a second line");
  });
  it("imports people, families, events and evidence, flagging tree sources", () => {
    const { data, summary } = importGedcom(sample, "Imported", env());
    expect(summary.people).toBe(3);
    expect(summary.families).toBe(1);
    expect(summary.treeSources).toBe(1);
    expect(summary.fromProgram).toBe("Family Tree Maker");
    const harold = byName(data, "Harold Benton");
    const birth = Object.values(data.facts).find((f) => f.personId === harold && f.type === "birth")!;
    expect(birth.date).toMatchObject({ kind: "about", y: 1918 });
    expect(assessFact(data, birth.id).level).toBe("supported");
    const mil = Object.values(data.facts).find((f) => f.personId === harold && f.type === "military")!;
    expect(mil.value).toBe("U.S. Marine Corps");
    const other = byName(data, "Example Person");
    const ob = Object.values(data.facts).find((f) => f.personId === other && f.type === "birth")!;
    expect(assessFact(data, ob.id).level).toBe("possible");
    expect(Object.values(data.relationships).filter((r) => r.type === "parent")).toHaveLength(2);
    expect(Object.values(data.facts).some((f) => f.type === "marriage" && f.place === "California")).toBe(true);
  });
  it("round-trips the example family without losing people, links or citations", () => {
    const ex = buildExampleFamily();
    const ged = exportGedcom(ex, { now: new Date("2026-11-15T00:00:00Z") });
    expect(ged.startsWith("0 HEAD")).toBe(true);
    expect(ged.trim().endsWith("0 TRLR")).toBe(true);
    expect(ged.split("\n").every((l) => l.length <= 255)).toBe(true);
    const back = importGedcom(ged, "Back", env()).data;
    expect(Object.keys(back.people).length).toBe(Object.keys(ex.people).length);
    expect(Object.values(back.relationships).filter((r) => r.type === "partner").length).toBe(Object.values(ex.relationships).filter((r) => r.type === "partner").length);
    expect(Object.values(back.relationships).filter((r) => r.type === "parent").length).toBe(Object.values(ex.relationships).filter((r) => r.type === "parent").length);
    const level = (d: FamilyData) => treeAudit(d).facts;
    expect(level(back).verified).toBe(level(ex).verified);
    expect(level(back).conflicting).toBe(level(ex).conflicting);
  });
  it("removes living people's details from a shared export", () => {
    const ex = buildExampleFamily();
    const ged = exportGedcom(ex, { redactLiving: true });
    expect(ged).not.toContain("Karen");
    expect(ged).toContain("Living");
    expect(ged).toContain("Walter");
  });
});

describe("privacy", () => {
  it("presumes living unless there's reason not to", () => {
    let d = blank();
    const a = addPerson(d, { given: "Old", birthDate: "1850" }, env());
    d = applyPatch(d, a.patch);
    const b = addPerson(d, { given: "Young", birthDate: "1990" }, env());
    d = applyPatch(d, b.patch);
    const c = addPerson(d, { given: "Unknown" }, env());
    d = applyPatch(d, c.patch);
    expect(isLiving(d, a.id)).toBe(false);
    expect(isLiving(d, b.id)).toBe(true);
    expect(isLiving(d, c.id)).toBe(true);
    const r = redactLiving(d);
    expect(Object.values(r.facts).some((f) => f.personId === b.id && f.type === "birth")).toBe(false);
  });
  it("keeps living people out of AI prompts by default", () => {
    const ex = buildExampleFamily();
    const walter = byName(ex, "Walter Lindqvist");
    const prompt = buildAiPrompt(ex, walter);
    expect(prompt).toContain("Do not invent");
    expect(prompt).not.toContain("Karen");
    expect(prompt).toContain("Living Lindqvist");
  });
  it("removes a person with everything attached", () => {
    const ex = buildExampleFamily();
    const rose = byName(ex, "Rose Dumont");
    const d = applyPatch(ex, removePerson(ex, rose, env()));
    expect(d.people[rose]).toBeUndefined();
    expect(Object.values(d.facts).some((f) => f.personId === rose)).toBe(false);
    expect(Object.values(d.relationships).some((r) => r.a === rose || r.b === rose)).toBe(false);
  });
});

describe("research plan", () => {
  it("suggests places to look that fit the person's dates and places, never records", () => {
    let d = blank();
    const p = addPerson(d, { given: "Harold", surname: "Benton", sex: "male", birthDate: "about 1918", birthPlace: "Sedalia, Missouri", knownHow: "memory", living: "no" }, env());
    d = applyPatch(d, p.patch);
    d = applyPatch(d, addFact(d, { personId: p.id, type: "military", value: "U.S. Marine Corps", date: "1943" }, { knownHow: "memory" }, env()).patch);
    const plan = researchPlan(d, p.id);
    const keys = plan.map((l) => l.key);
    for (const k of ["us-census-1920", "us-census-1930", "us-census-1940", "us-census-1950", "us-census-1950-nara", "ww2-draft", "nprc-ompf", "usmc-muster-rolls", "mo-death-certificates", "ssdi", "findagrave", "loc-newspapers"]) expect(keys).toContain(k);
    expect(keys).not.toContain("us-census-1910");
    expect(keys).not.toContain("ww1-draft");
    const c1940 = plan.find((l) => l.key === "us-census-1940")!;
    expect(c1940.url).toContain("f.collectionId=2000219");
    expect(c1940.why).toMatch(/would have been/);
    expect(plan.find((l) => l.key === "nprc-ompf")!.why).toMatch(/not part of the 1973/);
    expect(plan.find((l) => l.key === "usmc-muster-rolls")!.access).toBe("subscription");
    for (const l of plan) expect(`${l.title} ${l.why}`).not.toMatch(/\bfound\b|\bwe found\b|record of (him|her)/i);
  });
  it("points immigrants to arrival and old-country records", () => {
    const ex = buildExampleFamily();
    const keys = researchPlan(ex, byName(ex, "Anders Lindqvist")).map((l) => l.key);
    expect(keys).toContain("ellis-island");
    expect(keys).toContain("riksarkivet");
  });
});

describe("stories", () => {
  const ex = buildExampleFamily();
  const story = (template: "how-met" | "journey" | "life" | "military" | "generations" | "surname" | "two-lines", people: string[], extra = {}) =>
    buildStory(ex, { id: "s", template, title: "T", personIds: people.map((p) => byName(ex, p)), createdAt: "", updatedAt: "", ...extra });

  it("tells how a couple met from records, quoting the family memory as a memory", () => {
    const doc = story("how-met", ["Walter Lindqvist", "Jeanne Moreau"]);
    const text = storyText(doc);
    expect(text).toContain("Walter Lindqvist and Jeanne Moreau married on 14 September 1946 in Detroit, Michigan.");
    expect(text).toContain("Family memory: “They met at a dance in San Diego in 1945, while he was on leave.”");
    expect(doc.gaps.join(" ")).toMatch(/No record yet shows where or how/);
    expect(doc.notes.length).toBeGreaterThan(2);
  });
  it("says when records disagree instead of picking one", () => {
    const text = storyText(story("journey", ["Karin Nilsdotter"]));
    expect(text).toMatch(/Records disagree about when or where Karin Nilsdotter was born/);
  });
  it("leaves out unconfirmed details unless asked, and marks them when included", () => {
    const off = storyText(story("life", ["Erik Lindqvist"]));
    expect(off).not.toMatch(/not yet confirmed as this person/);
    const on = storyText(story("life", ["Erik Lindqvist"], { includeUnconfirmed: true }));
    expect(on).toMatch(/Erik Lindqvist and Clara Hale married in June 1914 in Duluth, Minnesota \(from a record not yet confirmed as this person\)/);
  });
  it("never writes feelings, dialogue or living people's details", () => {
    for (const t of ["life", "how-met", "journey", "military"] as const) {
      const text = storyText(story(t, t === "how-met" ? ["Walter Lindqvist", "Jeanne Moreau"] : ["Walter Lindqvist"]));
      const withoutMemories = text.replace(/Family memory: “[^”]*”/g, "");
      expect(withoutMemories).not.toMatch(/\b(felt|loved|happy|sad|proud|afraid|frightened|longed|dreamed|heart|said|told him|told her)\b/i);
      expect(text).not.toContain("Karen");
    }
  });
  it("counts generations in a place and keeps surname meaning honest", () => {
    const gens = storyText(story("generations", [], { place: "Minnesota" }));
    expect(gens).toMatch(/across 3 generations, have records in Minnesota/);
    const sur = storyText(story("surname", [], { surname: "Lindqvist" }));
    expect(sur).toMatch(/doesn't say what the name means/);
    expect(sur).toMatch(/The earliest Lindqvist in this tree with a dated birth is Anders Lindqvist/);
  });
});

describe("journey", () => {
  it("documents a move only when records place the person at both ends", () => {
    const ex = buildExampleFamily();
    const legs = legsFor(stopsFor(ex, byName(ex, "Anders Lindqvist")));
    expect(legs.length).toBeGreaterThanOrEqual(2);
    expect(legs[0]).toMatchObject({ documented: true });
    const wl = legsFor(stopsFor(ex, byName(ex, "Walter Lindqvist")));
    expect(wl.some((l) => !l.documented && l.to.place.startsWith("San Diego"))).toBe(true);
  });
});

describe("backup", () => {
  it("round-trips and can sit beside the original", () => {
    const ex = buildExampleFamily();
    const read = readBackup(JSON.stringify(toBackup(ex)));
    expect(read.ok).toBe(true);
    const copy = withFreshIds(ex, "Copy").data;
    expect(copy.workspace.id).not.toBe(ex.workspace.id);
    expect(Object.keys(copy.people).length).toBe(Object.keys(ex.people).length);
    expect(Object.keys(copy.people).some((id) => ex.people[id])).toBe(false);
    expect(treeAudit(copy).facts).toEqual(treeAudit(ex).facts);
    expect(readBackup("{}").ok).toBe(false);
    expect(readBackup("not json").ok).toBe(false);
  });
});

describe("Library of Congress newspapers", () => {
  it("builds the documented loc.gov search", () => {
    const url = newspaperUrl({ text: "Benton Sedalia", state: "MO", from: 1850, to: 1922 });
    expect(url).toContain("https://www.loc.gov/collections/chronicling-america/?");
    expect(url).toContain("fa=location_state%3Amissouri");
    expect(url).toContain("dates=1850%2F1922");
    expect(url).toContain("fo=json");
    expect(url).toContain("at=results%2Cpagination");
    expect(newspaperUrl({ text: "a" }, false)).not.toContain("fo=json");
  });
  it("reads results and shows a snippet around the words", () => {
    const r = parseLocResponse(
      {
        results: [
          {
            url: "http://www.loc.gov/resource/sn84020235/1907-06-15/ed-1/?sp=3",
            date: "1907-06-15",
            partof_title: ["st. louis palladium (st. louis, mo.) 1903-19??"],
            location_city: ["saint louis"],
            location_state: ["missouri"],
            number_page: ["0000000003"],
            description: ["lots of words before the name and then Benton of Sedalia visited friends here and more words after"],
            page_id: "p1",
          },
        ],
        pagination: { of: 1, current: 1 },
      },
      { text: "Benton Sedalia" },
    );
    expect(r.hits[0]).toMatchObject({ paper: "St. Louis Palladium (St. Louis, Mo.)", page: 3, state: "Missouri" });
    expect(r.hits[0].url.startsWith("https://")).toBe(true);
    expect(r.hits[0].snippet).toContain("Benton of Sedalia");
  });
  it("stays well under the Library's rate limit", async () => {
    resetLocLimiter();
    const fake = (async () => new Response(JSON.stringify({ results: [], pagination: { of: 0 } }), { headers: { "content-type": "application/json" } })) as unknown as typeof fetch;
    for (let i = 0; i < 8; i++) await searchNewspapers({ text: `word${i}` }, fake, 1000);
    await expect(searchNewspapers({ text: "one more" }, fake, 1000)).rejects.toBeInstanceOf(LocLimitError);
    await expect(searchNewspapers({ text: "word1" }, fake, 1000)).resolves.toBeTruthy(); // cached
  });
});

describe("story wording", () => {
  it("introduces memories plainly and keeps place commas", () => {
    const ex = buildExampleFamily();
    const walter = Object.keys(ex.people).find((id) => displayName(ex, id) === "Walter Lindqvist")!;
    const jeanne = Object.keys(ex.people).find((id) => displayName(ex, id) === "Jeanne Moreau")!;
    const text = storyText(buildStory(ex, { id: "s", template: "how-met", title: "T", personIds: [walter, jeanne], createdAt: "", updatedAt: "" }));
    expect(text).toContain("Family memory says that in 1945 he was living in San Diego, California.");
    expect(text).toContain("served in the U.S. Navy between 1942 and 1945 (Pacific).");
    expect(text).toMatch(/Context: .*(World War II|Pearl Harbor|war)/i);
    expect(text).not.toMatch(/quotas/);
  });
});

describe("estimates from relatives", () => {
  it("reads early, mid and late centuries and decades", () => {
    expect(parseDate("early 1900s")).toMatchObject({ kind: "between", y: 1900, y2: 1929 });
    expect(parseDate("late 1800s")).toMatchObject({ kind: "between", y: 1870, y2: 1899 });
    expect(parseDate("early 1910s")).toMatchObject({ kind: "between", y: 1910, y2: 1913 });
  });
  it("treats an undated parent of someone born long ago as deceased and plans census searches", () => {
    let d = blank();
    const kid = addPerson(d, { given: "Harold", surname: "Benton", sex: "male", birthDate: "about 1918" }, env());
    d = applyPatch(d, kid.patch);
    const dad = addPerson(d, { given: "Amos", surname: "Benton", sex: "male" }, env());
    d = applyPatch(d, dad.patch);
    d = applyPatch(d, addRelationship(d, { type: "parent", a: dad.id, b: kid.id }, env()).patch);
    d = applyPatch(d, addFact(d, { personId: dad.id, type: "residence", place: "Sedalia, Missouri" }, { knownHow: "memory" }, env()).patch);
    expect(isLiving(d, dad.id)).toBe(false);
    const plan = researchPlan(d, dad.id);
    const keys = plan.map((l) => l.key);
    expect(keys).toContain("us-census-1900");
    expect(keys).toContain("mo-death-certificates");
    expect(keys).not.toContain("living-note");
    expect(plan.find((l) => l.key === "us-census-1900")!.why).toMatch(/estimated from Harold Benton's birth/);
  });
});
