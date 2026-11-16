// Names: how a person is shown, and how two spellings are compared when
// looking for duplicates. Names are facts too (type "name"), so a maiden
// name, a married name and a nickname can each carry their own evidence.

import type { FamilyData, Fact, Id } from "./types";

export function activeFacts(data: FamilyData, personId: Id): Fact[] {
  return Object.values(data.facts).filter((f) => f.personId === personId && !f.rejected);
}

export function nameFacts(data: FamilyData, personId: Id): Fact[] {
  return activeFacts(data, personId)
    .filter((f) => f.type === "name")
    .sort((a, b) => Number(!!b.preferred) - Number(!!a.preferred) || a.createdAt.localeCompare(b.createdAt));
}

export type NameParts = { given: string; surname: string; nickname?: string };

export function primaryName(data: FamilyData, personId: Id): NameParts {
  const f = nameFacts(data, personId)[0];
  return { given: (f?.given ?? "").trim(), surname: (f?.surname ?? "").trim(), nickname: f?.nickname?.trim() || undefined };
}

export function fullName(n: NameParts): string {
  return [n.given, n.surname].filter(Boolean).join(" ").trim();
}

/** "Harold Benton", or "Unnamed person" when no name was recorded. */
export function displayName(data: FamilyData, personId: Id): string {
  return fullName(primaryName(data, personId)) || "Unnamed person";
}

export function normalize(s: string | undefined): string {
  return (s ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** American Soundex, the code most US record indexes use for surnames. */
export function soundex(s: string | undefined): string {
  const w = normalize(s).replace(/[^a-z]/g, "");
  if (!w) return "";
  const code: Record<string, string> = {
    b: "1", f: "1", p: "1", v: "1",
    c: "2", g: "2", j: "2", k: "2", q: "2", s: "2", x: "2", z: "2",
    d: "3", t: "3",
    l: "4",
    m: "5", n: "5",
    r: "6",
  };
  let out = w[0].toUpperCase();
  let prev = code[w[0]] ?? "";
  for (let i = 1; i < w.length && out.length < 4; i++) {
    const ch = w[i];
    const c = code[ch] ?? "";
    if (c && c !== prev) out += c;
    // h and w do not separate letters with the same code; vowels do
    if (ch !== "h" && ch !== "w") prev = c;
  }
  return out.padEnd(4, "0");
}

/** Common English nickname pairs. Kept short and plain on purpose. */
const NICKNAME_GROUPS: string[][] = [
  ["william", "will", "bill", "billy", "willie", "liam"],
  ["robert", "rob", "bob", "bobby", "bert"],
  ["richard", "rick", "dick", "rich"],
  ["james", "jim", "jimmy", "jamie"],
  ["john", "jack", "johnny", "jon"],
  ["joseph", "joe", "joey"],
  ["charles", "charlie", "chuck", "chas"],
  ["thomas", "tom", "tommy"],
  ["edward", "ed", "eddie", "ted", "ned"],
  ["henry", "hank", "harry", "henri"],
  ["benjamin", "ben", "benny", "benj"],
  ["alexander", "alex", "sandy"],
  ["elizabeth", "beth", "betty", "liz", "lizzie", "eliza", "bess", "bessie"],
  ["margaret", "maggie", "meg", "peggy", "marge", "margie", "greta"],
  ["catherine", "katherine", "kate", "katie", "kitty", "cathy", "kathy", "karin", "karen"],
  ["dorothy", "dot", "dottie", "dotty", "dolly", "dora"],
  ["virginia", "ginny", "ginnie", "jinny", "gin"],
  ["mary", "molly", "polly", "mae", "mamie", "maria", "marie"],
  ["ruth", "ruthie"],
  ["susan", "sue", "susie", "suzanne"],
  ["anna", "ann", "anne", "annie", "nan", "nancy"],
  ["helen", "nell", "nellie", "ellen", "elena"],
  ["frances", "fran", "fanny", "frankie"],
  ["francis", "frank", "frankie", "francesco"],
  ["giuseppe", "joseph", "peppino", "pino"],
  ["giovanni", "john", "gianni", "nino"],
  ["vincenzo", "vincent", "enzo", "vince"],
  ["jeanne", "jean", "jeannie"],
];

function nicknameGroupsFor(name: string): number[] {
  const out: number[] = [];
  NICKNAME_GROUPS.forEach((g, i) => {
    if (g.includes(name)) out.push(i);
  });
  return out;
}

export type GivenMatch = "same" | "nickname" | "initial" | "prefix";

/** How two given names relate, if at all. Compares the first given name. */
export function givenMatch(a: string | undefined, b: string | undefined): GivenMatch | null {
  const x = normalize(a).split(" ")[0] ?? "";
  const y = normalize(b).split(" ")[0] ?? "";
  if (!x || !y) return null;
  if (x === y) return "same";
  const gx = nicknameGroupsFor(x);
  if (gx.length && nicknameGroupsFor(y).some((g) => gx.includes(g))) return "nickname";
  if ((x.length === 1 && y.startsWith(x)) || (y.length === 1 && x.startsWith(y))) return "initial";
  if (x.length >= 3 && y.length >= 3 && (x.startsWith(y) || y.startsWith(x))) return "prefix";
  return null;
}

export function surnameMatch(a: string | undefined, b: string | undefined): "same" | "sound" | null {
  const x = normalize(a);
  const y = normalize(b);
  if (!x || !y) return null;
  if (x === y) return "same";
  if (soundex(x) === soundex(y)) return "sound";
  return null;
}
