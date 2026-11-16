// The story engine: turns recorded facts into readable paragraphs with
// numbered source notes. Rules it never breaks:
//   • every sentence about the family comes from a recorded fact, and its
//     notes point to that fact's sources;
//   • family memories are quoted or introduced as memories, never restated
//     as record facts;
//   • possible matches and unsourced details appear only when the person asks,
//     and are marked in the sentence itself;
//   • when records disagree, the story says so and shows each version;
//   • no invented dialogue, feelings, motives or scenes. History appears as
//     separate context with its own source, never as something the family did;
//   • living people are not described.
// What's missing is listed at the end as open questions.

import { assessFact, assessRelationship, INFO_LABEL } from "./evidence";
import { sortKey, formatDate } from "./dates";
import { activeFacts, displayName, primaryName, normalize, soundex } from "./names";
import { ancestorsWithDepth, childLinks, parentLinks, partnerLinks, livePeople, partnersOf } from "./graph";
import { isLiving, privateLabel } from "./living";
import { countryOf, placesCompatible, usStateOf } from "./places";
import { eventsFor, type HistoryEvent } from "./history";
import { openQuestions } from "./research";
import type { Citation, EvidenceLevel, Fact, FactType, FamilyData, FuzzyDate, Id, Story, StoryTemplate } from "./types";

export type Seg = { t: string } | { n: number[] };
export interface StoryPara {
  segs: Seg[];
  kind?: "intro" | "memory" | "context" | "disagree";
}
export interface StoryNote {
  n: number;
  title: string;
  detail?: string;
  url?: string;
  label: string;
}
export interface StoryDoc {
  title: string;
  paras: StoryPara[];
  notes: StoryNote[];
  gaps: string[];
  /** people the story is about who are living and so were left out */
  hiddenLiving: number;
}

export const TEMPLATES: Record<StoryTemplate, { label: string; needs: string; people: 0 | 1 | 2 }> = {
  life: { label: "The life of one person", needs: "Pick a person.", people: 1 },
  "how-met": { label: "How a couple met", needs: "Pick both people.", people: 2 },
  journey: { label: "A family's journey to America", needs: "Pick the people who made the journey.", people: 1 },
  generations: { label: "Generations in one place", needs: "Name a place, like a state or county.", people: 0 },
  military: { label: "Our family's military service", needs: "Uses everyone with service on record.", people: 0 },
  surname: { label: "The story of a surname", needs: "Name the surname.", people: 0 },
  "two-lines": { label: "How two family lines came together", needs: "Pick the couple who joined the lines.", people: 2 },
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function datePhrase(fd: FuzzyDate | undefined): string {
  if (!fd || fd.y === undefined || fd.kind === "unknown") return "";
  const core = (y?: number, m?: number, d?: number) => (m && d ? `${d} ${MONTHS[m - 1]} ${y}` : m ? `${MONTHS[m - 1]} ${y}` : `${y}`);
  const c = core(fd.y, fd.m, fd.d);
  switch (fd.kind) {
    case "exact":
      return fd.m && fd.d ? `on ${c}` : `in ${c}`;
    case "about":
      return `about ${c}`;
    case "before":
      return `before ${c}`;
    case "after":
      return `after ${c}`;
    case "between":
      return `between ${c} and ${core(fd.y2, fd.m2, fd.d2)}`;
  }
  return "";
}

const at = (place?: string) => (place ? ` in ${place}` : "");
const sp = (s: string) => (s ? ` ${s}` : "");

class Notes {
  list: StoryNote[] = [];
  private keys = new Map<string, number>();
  constructor(private data: FamilyData) {}
  cite(cites: Citation[]): number[] {
    const out: number[] = [];
    for (const c of cites) {
      const s = this.data.sources[c.sourceId];
      if (!s) continue;
      const key = `${c.sourceId}|${c.detail ?? ""}`;
      let n = this.keys.get(key);
      if (!n) {
        n = this.list.length + 1;
        this.keys.set(key, n);
        const clue = s.kind === "tree" || s.kind === "ai";
        this.list.push({
          n,
          title: s.title,
          detail: [c.detail, s.repository].filter(Boolean).join(". ") || undefined,
          url: s.url,
          label: clue ? "A clue, not proof" : `${INFO_LABEL[c.info].label}${c.match === "possible" ? ", not yet confirmed" : ""}`,
        });
      }
      if (!out.includes(n)) out.push(n);
    }
    return out;
  }
  context(e: HistoryEvent): number[] {
    const key = `ctx|${e.id}`;
    let n = this.keys.get(key);
    if (!n) {
      n = this.list.length + 1;
      this.keys.set(key, n);
      this.list.push({ n, title: e.title, detail: e.sourceName, url: e.source, label: "Historical context" });
    }
    return [n];
  }
}

const RANK: EvidenceLevel[] = ["verified", "supported", "recollection", "possible", "unknown", "conflicting"];

interface Ctx {
  data: FamilyData;
  notes: Notes;
  include: boolean;
  used: Set<Id>;
}

/** The fact to tell for a single-valued kind, or a disagreement paragraph. */
function pick(ctx: Ctx, personId: Id | undefined, relId: Id | undefined, types: FactType[]): { fact?: Fact; level?: EvidenceLevel; cites: Citation[]; disagree?: StoryPara } {
  const facts = Object.values(ctx.data.facts).filter((f) => !f.rejected && types.includes(f.type) && (personId ? f.personId === personId : f.relationshipId === relId));
  if (!facts.length) return { cites: [] };
  const assessed = facts.map((f) => ({ f, a: assessFact(ctx.data, f.id) }));
  const chosen = assessed.find((x) => x.f.preferred && x.a.level !== "conflicting");
  const open = assessed.filter((x) => x.a.level === "conflicting");
  if (!chosen && open.length > 1) {
    open.forEach((x) => ctx.used.add(x.f.id));
    const who = personId ? displayName(ctx.data, personId) : "they";
    const verb = types[0] === "birth" || types[0] === "baptism" ? "was born" : types[0] === "death" || types[0] === "burial" ? "died" : "married";
    const segs: Seg[] = [{ t: `Records disagree about when or where ${who} ${verb}: ` }];
    open.forEach((x, i) => {
      segs.push({ t: `${i ? (i === open.length - 1 ? " or " : ", ") : ""}${[formatDate(x.f.date), x.f.place].filter(Boolean).join(", ") || "an undated version"}` });
      const n = ctx.notes.cite(x.a.citations);
      if (n.length) segs.push({ n });
    });
    segs.push({ t: ". No version has been chosen yet." });
    return { cites: [], disagree: { segs, kind: "disagree" } };
  }
  const best = chosen ?? assessed.sort((x, y) => RANK.indexOf(x.a.level) - RANK.indexOf(y.a.level))[0];
  ctx.used.add(best.f.id);
  // compatible facts of the same kind corroborate: cite them too
  const extra = assessed.filter((x) => x !== best && x.a.level !== "conflicting").flatMap((x) => (ctx.used.add(x.f.id), x.a.citations));
  return { fact: best.f, level: best.a.level, cites: [...best.a.citations, ...extra] };
}

function tellable(ctx: Ctx, level: EvidenceLevel | undefined): boolean {
  if (!level) return false;
  if (level === "possible" || level === "unknown") return ctx.include;
  return true;
}

/** Wrap a plain statement in the wording its evidence allows. */
function phrase(level: EvidenceLevel, statement: string): string {
  if (level !== "recollection") return statement;
  // "In 1945, he was living…" → "Family memory says that in 1945 he was living…"
  const s = (statement.charAt(0).toLowerCase() + statement.slice(1)).replace(/^((?:in|about|on|before|after|between) [^,]{1,30}), /, "$1 ");
  return `Family memory says that ${s}`;
}

function suffix(level: EvidenceLevel): string {
  if (level === "possible") return " (from a record not yet confirmed as this person)";
  if (level === "unknown") return " (no source yet)";
  return "";
}

function sentence(ctx: Ctx, level: EvidenceLevel, statement: string, cites: Citation[]): Seg[] {
  const segs: Seg[] = [{ t: `${phrase(level, statement)}${suffix(level)}.` }];
  const n = ctx.notes.cite(cites);
  if (n.length) segs.push({ n });
  segs.push({ t: " " });
  return segs;
}

function nameOf(ctx: Ctx, id: Id): string {
  return isLiving(ctx.data, id) ? privateLabel(ctx.data, id) : displayName(ctx.data, id);
}

function pronounOf(ctx: Ctx, id: Id): string {
  const s = ctx.data.people[id]?.sex;
  return s === "female" ? "She" : s === "male" ? "He" : "They";
}

function birthSegs(ctx: Ctx, id: Id, withParents: boolean): Seg[] {
  const segs: Seg[] = [];
  const name = nameOf(ctx, id);
  const b = pick(ctx, id, undefined, ["birth"]);
  const bap = b.fact ? null : pick(ctx, id, undefined, ["baptism"]);
  if (b.disagree) segs.push(...b.disagree.segs, { t: " " });
  else if (b.fact && tellable(ctx, b.level)) segs.push(...sentence(ctx, b.level!, `${name} was born${sp(datePhrase(b.fact.date))}${at(b.fact.place)}`, b.cites));
  else if (bap?.fact && tellable(ctx, bap.level)) segs.push(...sentence(ctx, bap.level!, `${name} was baptized${sp(datePhrase(bap.fact.date))}${at(bap.fact.place)}`, bap.cites));
  if (withParents) {
    const links = parentLinks(ctx.data, id).filter((r) => !isLiving(ctx.data, r.a));
    const told = links.map((r) => ({ r, a: assessRelationship(ctx.data, r.id) })).filter((x) => tellable(ctx, x.a.level) && x.a.level !== "conflicting");
    if (told.length) {
      const level = told.map((x) => x.a.level).sort((x, y) => RANK.indexOf(y) - RANK.indexOf(x))[0];
      const names = told.map((x) => nameOf(ctx, x.r.a)).join(" and ");
      const kind = told.every((x) => x.r.kind === "adopted") ? "adoptive parents" : told.length > 1 ? "parents" : "parent";
      segs.push(...sentence(ctx, level, `${pronounOf(ctx, id) === "They" ? `${name}'s` : pronounOf(ctx, id) === "She" ? "Her" : "His"} ${kind} ${told.length > 1 ? "were" : "was"} ${names}`, told.flatMap((x) => x.a.citations)));
    }
  }
  return segs;
}

function lifeEventSegs(ctx: Ctx, id: Id, types: FactType[], before?: number): Seg[] {
  const name = nameOf(ctx, id);
  const he = pronounOf(ctx, id);
  const facts = activeFacts(ctx.data, id)
    .filter((f) => types.includes(f.type) && !ctx.used.has(f.id) && (before === undefined || sortKey(f.date) < before))
    .sort((a, b) => sortKey(a.date) - sortKey(b.date));
  const segs: Seg[] = [];
  facts.forEach((f, i) => {
    const a = assessFact(ctx.data, f.id);
    if (!tellable(ctx, a.level) || a.level === "conflicting") return;
    ctx.used.add(f.id);
    const subject = i === 0 ? name : he;
    const when = datePhrase(f.date);
    let s = "";
    switch (f.type) {
      case "residence":
        s = when ? `${capital(when)}, ${lower(subject)} was living${at(f.place)}` : `${subject} lived${at(f.place) || " at an unrecorded place"}`;
        break;
      case "military":
        s = `${subject} served${f.value ? ` in the ${f.value.replace(/^the\s+/i, "")}` : " in the military"}${sp(when)}${f.place ? ` (${f.place})` : ""}`;
        break;
      case "occupation":
        s = `${subject === he ? `${he === "They" ? "Their" : he === "She" ? "Her" : "His"}` : `${name}'s`} occupation was recorded as “${f.value ?? "unstated"}”${sp(when)}${at(f.place)}`;
        break;
      case "immigration":
        s = `${subject} arrived${at(f.place)}${sp(when)}`;
        break;
      case "emigration":
        s = `${subject} left${at(f.place).replace(" in ", " ")}${sp(when)}`;
        break;
      case "naturalization":
        s = `${subject} became a citizen${sp(when)}${at(f.place)}`;
        break;
      case "education":
        s = `${subject}'s schooling is recorded as “${f.value ?? ""}”${sp(when)}${at(f.place)}`;
        break;
      case "religion":
        s = `${subject}'s religion is recorded as ${f.value ?? "unstated"}${sp(when)}`;
        break;
      case "other":
        s = `Also recorded for ${name}: ${f.value ?? "an event"}${f.date ? ` (${formatDate(f.date)})` : ""}${at(f.place)}`;
        break;
      default:
        return;
    }
    segs.push(...sentence(ctx, a.level, s, a.citations));
  });
  return segs;
}

function capital(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function lower(s: string) {
  return s === "He" || s === "She" || s === "They" ? s.toLowerCase() : s;
}

function marriageSegs(ctx: Ctx, a: Id, b: Id): Seg[] {
  const rel = partnerLinks(ctx.data, a).find((r) => r.a === b || r.b === b);
  if (!rel) return [];
  const m = pick(ctx, undefined, rel.id, ["marriage"]);
  const names = `${nameOf(ctx, a)} and ${nameOf(ctx, b)}`;
  if (m.disagree) return [...m.disagree.segs, { t: " " }];
  if (m.fact && tellable(ctx, m.level)) return sentence(ctx, m.level!, `${names} married${sp(datePhrase(m.fact.date))}${at(m.fact.place)}`, m.cites);
  const ra = assessRelationship(ctx.data, rel.id);
  if (tellable(ctx, ra.level) && ra.level !== "conflicting") {
    const word = rel.status === "married" ? "were married" : rel.status === "divorced" ? "were married and later divorced" : "were a couple";
    return sentence(ctx, ra.level, `${names} ${word}`, ra.citations);
  }
  return [];
}

function deathSegs(ctx: Ctx, id: Id): Seg[] {
  if (isLiving(ctx.data, id)) return [];
  const segs: Seg[] = [];
  const name = nameOf(ctx, id);
  const d = pick(ctx, id, undefined, ["death"]);
  if (d.disagree) segs.push(...d.disagree.segs, { t: " " });
  else if (d.fact && tellable(ctx, d.level)) segs.push(...sentence(ctx, d.level!, `${name} died${sp(datePhrase(d.fact.date))}${at(d.fact.place)}`, d.cites));
  const bu = pick(ctx, id, undefined, ["burial"]);
  if (bu.fact && tellable(ctx, bu.level)) segs.push(...sentence(ctx, bu.level!, `${segs.length ? pronounOf(ctx, id) : name} was buried${sp(datePhrase(bu.fact.date))}${at(bu.fact.place)}`, bu.cites));
  return segs;
}

function memoryParas(ctx: Ctx, factFilter: (f: Fact) => boolean): StoryPara[] {
  return Object.values(ctx.data.facts)
    .filter((f) => f.type === "memory" && !f.rejected && factFilter(f) && !ctx.used.has(f.id))
    .map((f) => {
      ctx.used.add(f.id);
      const a = assessFact(ctx.data, f.id);
      const who = a.citations.map((c) => c.note).filter(Boolean)[0];
      const n = ctx.notes.cite(a.citations);
      const segs: Seg[] = [{ t: `Family memory: “${(f.value ?? "").trim()}”${who ? ` (${who})` : ""}` }];
      if (n.length) segs.push({ n });
      return { segs, kind: "memory" as const };
    });
}

function contextParas(ctx: Ctx, people: Id[], max = 3, range?: [number, number]): StoryPara[] {
  const scopes = new Set<string>(["US"]);
  let from = Infinity;
  let to = -Infinity;
  for (const id of people) {
    for (const f of activeFacts(ctx.data, id)) {
      if (f.place) {
        const st = usStateOf(f.place);
        if (st) scopes.add(st);
        const c = countryOf(f.place);
        if (c) scopes.add(c);
      }
      const k = sortKey(f.date);
      if (Number.isFinite(k) && (f.type === "birth" || f.type === "death" || f.type === "residence" || f.type === "military" || f.type === "immigration")) {
        from = Math.min(from, k);
        to = Math.max(to, k);
      }
    }
  }
  if (range) [from, to] = range;
  if (!Number.isFinite(from)) return [];
  // the biggest events of the period first, then told in date order
  const events = eventsFor([...scopes], from, to, ["history"])
    .sort((a, b) => (b.weight ?? 1) - (a.weight ?? 1) || a.start - b.start)
    .slice(0, max)
    .sort((a, b) => a.start - b.start);
  return events.map((e) => ({ segs: [{ t: `${e.text}` }, { n: ctx.notes.context(e) }], kind: "context" as const }));
}

function paraFrom(segs: Seg[]): StoryPara[] {
  return segs.some((s) => "t" in s && s.t.trim()) ? [{ segs }] : [];
}

function storyPeople(data: FamilyData, story: Story): Id[] {
  return story.personIds.filter((id) => data.people[id] && !data.people[id].mergedInto);
}

export function buildStory(data: FamilyData, story: Story): StoryDoc {
  const ctx: Ctx = { data, notes: new Notes(data), include: !!story.includeUnconfirmed, used: new Set() };
  const paras: StoryPara[] = [];
  const gaps: string[] = [];
  let hiddenLiving = 0;
  if (story.intro?.trim()) paras.push({ segs: [{ t: story.intro.trim() }], kind: "intro" });
  const ids = storyPeople(data, story);
  const living = ids.filter((id) => isLiving(data, id));
  hiddenLiving = living.length;
  const subjects = ids.filter((id) => !isLiving(data, id));

  const life = (id: Id, opts: { parents?: boolean } = {}) => {
    paras.push(...paraFrom(birthSegs(ctx, id, opts.parents !== false)));
    paras.push(...paraFrom(lifeEventSegs(ctx, id, ["residence", "immigration", "emigration", "naturalization", "military", "occupation", "education", "religion", "other"])));
    for (const pid of partnersOf(data, id)) {
      if (isLiving(data, pid)) continue;
      paras.push(...paraFrom(marriageSegs(ctx, id, pid)));
    }
    const kids = childLinks(data, id)
      .filter((r) => !isLiving(data, r.b))
      .map((r) => ({ r, a: assessRelationship(data, r.id) }))
      .filter((x) => tellable(ctx, x.a.level) && x.a.level !== "conflicting");
    if (kids.length) {
      const segs: Seg[] = [{ t: "Children on record: " }];
      kids.forEach((x, i) => {
        segs.push({ t: `${i ? ", " : ""}${nameOf(ctx, x.r.b)}${x.a.level === "recollection" ? " (by family memory)" : suffix(x.a.level)}` });
        const n = ctx.notes.cite(x.a.citations);
        if (n.length) segs.push({ n });
      });
      segs.push({ t: "." });
      paras.push({ segs });
    }
    paras.push(...paraFrom(deathSegs(ctx, id)));
    paras.push(...memoryParas(ctx, (f) => f.personId === id));
  };

  switch (story.template) {
    case "life": {
      const id = subjects[0];
      if (!id) break;
      life(id);
      paras.push(...contextParas(ctx, [id]));
      gaps.push(...openQuestions(data, id));
      break;
    }
    case "how-met": {
      const [a, b] = subjects;
      if (!a || !b) break;
      const rel = partnerLinks(data, a).find((r) => r.a === b || r.b === b);
      const marriage = rel ? Object.values(data.facts).find((f) => f.relationshipId === rel.id && f.type === "marriage" && !f.rejected) : undefined;
      const cutoff = marriage ? sortKey(marriage.date) : undefined;
      for (const id of [a, b]) {
        paras.push(...paraFrom(birthSegs(ctx, id, false)));
        paras.push(...paraFrom(lifeEventSegs(ctx, id, ["residence", "military", "occupation", "immigration"], Number.isFinite(cutoff ?? NaN) ? cutoff : undefined)));
      }
      if (rel) paras.push(...memoryParas(ctx, (f) => f.relationshipId === rel.id));
      paras.push(...memoryParas(ctx, (f) => (f.personId === a || f.personId === b) && /\bmet\b|meet|dance|introduc/i.test(f.value ?? "")));
      paras.push(...paraFrom(marriageSegs(ctx, a, b)));
      paras.push(...contextParas(ctx, [a, b], 2, cutoff !== undefined && Number.isFinite(cutoff) ? [cutoff - 6, cutoff] : undefined));
      const hasMeetingRecord = Object.values(data.facts).some((f) => !f.rejected && f.type !== "memory" && (f.relationshipId === rel?.id || f.personId === a || f.personId === b) && /\bmet\b|meet/i.test(`${f.value ?? ""} ${f.note ?? ""}`));
      if (!hasMeetingRecord) gaps.push(`No record yet shows where or how ${nameOf(ctx, a)} and ${nameOf(ctx, b)} first met.`);
      if (!marriage) gaps.push("No marriage record is attached yet.");
      break;
    }
    case "journey": {
      for (const id of subjects) {
        paras.push(...paraFrom(birthSegs(ctx, id, false)));
        paras.push(...paraFrom(lifeEventSegs(ctx, id, ["emigration", "immigration", "naturalization", "residence", "occupation"])));
        paras.push(...memoryParas(ctx, (f) => f.personId === id));
        const facts = activeFacts(data, id);
        if (!facts.some((f) => f.type === "immigration" || f.type === "emigration")) gaps.push(`When and where did ${nameOf(ctx, id)} arrive? No arrival record is attached yet.`);
        if (!facts.some((f) => f.type === "naturalization") && facts.some((f) => f.type === "immigration")) gaps.push(`Did ${nameOf(ctx, id)} become a citizen? Naturalization papers often name the hometown.`);
      }
      paras.push(...contextParas(ctx, subjects, 3));
      break;
    }
    case "generations": {
      const place = story.place?.trim() ?? "";
      if (!place) break;
      const inPlace = livePeople(data)
        .filter((p) => !isLiving(data, p.id))
        .map((p) => ({ id: p.id, facts: activeFacts(data, p.id).filter((f) => f.place && placeMatches(f.place, place) && f.type !== "name") }))
        .filter((x) => x.facts.length);
      inPlace.sort((x, y) => Math.min(...x.facts.map((f) => sortKey(f.date))) - Math.min(...y.facts.map((f) => sortKey(f.date))));
      const gens = countGenerations(data, inPlace.map((x) => x.id));
      for (const x of inPlace) {
        const segs: Seg[] = [{ t: `${nameOf(ctx, x.id)}: ` }];
        x.facts.sort((a, b) => sortKey(a.date) - sortKey(b.date)).forEach((f, i) => {
          const a = assessFact(data, f.id);
          if (!tellable(ctx, a.level)) return;
          const what = f.type === "birth" ? "born" : f.type === "death" ? "died" : f.type === "burial" ? "buried" : f.type === "residence" ? "lived" : f.type === "marriage" ? "married" : f.type;
          segs.push({ t: `${i ? "; " : ""}${what}${at(f.place)}${f.date ? ` (${formatDate(f.date)})` : ""}${a.level === "recollection" ? ", by family memory" : suffix(a.level)}` });
          const n = ctx.notes.cite(a.citations);
          if (n.length) segs.push({ n });
        });
        segs.push({ t: "." });
        paras.push({ segs });
      }
      if (inPlace.length) paras.unshift({ segs: [{ t: `${inPlace.length} ${inPlace.length === 1 ? "person" : "people"} in this tree, across ${gens} generation${gens === 1 ? "" : "s"}, have records${at(place)}.` }] });
      else gaps.push(`No one in this tree has a recorded fact${at(place)} yet.`);
      break;
    }
    case "military": {
      const people = livePeople(data).filter((p) => !isLiving(data, p.id) && activeFacts(data, p.id).some((f) => f.type === "military"));
      for (const p of people) paras.push(...paraFrom(lifeEventSegs(ctx, p.id, ["military"])));
      paras.push(...contextParas(ctx, people.map((p) => p.id), 3));
      if (!people.length) gaps.push("No military service is recorded yet.");
      else gaps.push("Service files for anyone who left the military more than 62 years ago can be ordered from the National Personnel Records Center.");
      break;
    }
    case "surname": {
      const name = story.surname?.trim() ?? "";
      if (!name) break;
      const code = soundex(name);
      const bearers = livePeople(data).filter((p) => {
        const n = primaryName(data, p.id).surname;
        return n && (normalize(n) === normalize(name) || soundex(n) === code);
      });
      const dated = bearers
        .filter((p) => !isLiving(data, p.id))
        .map((p) => ({ id: p.id, birth: activeFacts(data, p.id).find((f) => f.type === "birth" && f.date?.y !== undefined) }))
        .filter((x) => x.birth)
        .sort((x, y) => sortKey(x.birth!.date) - sortKey(y.birth!.date));
      if (dated[0]) {
        const a = assessFact(data, dated[0].birth!.id);
        paras.push({ segs: sentence(ctx, a.level, `The earliest ${name} in this tree with a dated birth is ${nameOf(ctx, dated[0].id)}, born${sp(datePhrase(dated[0].birth!.date))}${at(dated[0].birth!.place)}`, a.citations) });
      }
      const places = new Map<string, number>();
      for (const p of bearers) {
        for (const f of activeFacts(data, p.id)) {
          if (!f.place) continue;
          const st = usStateOf(f.place);
          const where = st ? st : countryOf(f.place);
          if (where) places.set(where, (places.get(where) ?? 0) + 1);
        }
      }
      if (places.size) paras.push({ segs: [{ t: `The name appears in records from ${[...places.keys()].map(placeLabel).join(", ")}.` }] });
      paras.push({ segs: [{ t: `This story doesn't say what the name means or where it first began. That needs a published source, such as a surname dictionary. Add one as a source to include it.` }], kind: "context" });
      if (!bearers.length) gaps.push(`No one in this tree has the surname ${name} yet.`);
      break;
    }
    case "two-lines": {
      const [a, b] = subjects;
      if (!a || !b) break;
      for (const id of [a, b]) {
        const anc = [...ancestorsWithDepth(data, id).entries()].filter(([x]) => !isLiving(data, x)).sort((x, y) => y[1] - x[1]);
        const oldest = anc[0];
        if (oldest) {
          const birth = activeFacts(data, oldest[0]).find((f) => f.type === "birth");
          const lvl = birth ? assessFact(data, birth.id) : undefined;
          const where = birth ? `${sp(datePhrase(birth.date))}${at(birth.place)}` : "";
          paras.push({ segs: [{ t: `${nameOf(ctx, id)}'s line goes back ${oldest[1]} generation${oldest[1] > 1 ? "s" : ""} in this tree, to ${nameOf(ctx, oldest[0])}${where ? `, born${where}` : ""}${lvl && lvl.level === "recollection" ? ", by family memory" : lvl ? suffix(lvl.level) : ""}.` }, ...(lvl && ctx.notes.cite(lvl.citations).length ? [{ n: ctx.notes.cite(lvl.citations) }] : [])] });
        } else {
          gaps.push(`No ancestors of ${nameOf(ctx, id)} are in the tree yet.`);
        }
        paras.push(...paraFrom(birthSegs(ctx, id, true)));
      }
      paras.push(...paraFrom(marriageSegs(ctx, a, b)));
      break;
    }
  }
  return { title: story.title, paras, notes: ctx.notes.list, gaps: [...new Set(gaps)], hiddenLiving };
}

function placeMatches(factPlace: string, wanted: string): boolean {
  // "Missouri" matches "Sedalia, Pettis Co., Mo."; "Pettis County, Missouri" matches towns in it
  return placesCompatible(factPlace, wanted) && (normalize(factPlace).includes(normalize(wanted).split(",")[0]) || usStateOf(factPlace) === usStateOf(wanted) || countryOf(factPlace) === countryOf(wanted));
}

function placeLabel(code: string): string {
  if (/^[A-Z]{2}$/.test(code)) {
    return code === "US" ? "the United States" : code;
  }
  return code === "United States of America" ? "the United States" : code;
}

function countGenerations(data: FamilyData, ids: Id[]): number {
  if (!ids.length) return 0;
  const set = new Set(ids);
  let best = 1;
  for (const id of ids) {
    for (const [anc, depth] of ancestorsWithDepth(data, id)) if (set.has(anc)) best = Math.max(best, depth + 1);
  }
  return best;
}

/** A suggested title for a new story. */
export function suggestTitle(data: FamilyData, template: StoryTemplate, personIds: Id[], place?: string, surname?: string): string {
  const n = (i: number) => (personIds[i] ? (isLiving(data, personIds[i]) ? privateLabel(data, personIds[i]) : displayName(data, personIds[i])) : "");
  switch (template) {
    case "life":
      return `The life of ${n(0) || "…"}`;
    case "how-met":
      return `How ${primaryName(data, personIds[0] ?? "").given || n(0) || "…"} and ${primaryName(data, personIds[1] ?? "").given || n(1) || "…"} met`;
    case "journey":
      return `${primaryName(data, personIds[0] ?? "").surname || "Our"} family's journey`;
    case "generations":
      return `Generations in ${place || "…"}`;
    case "military":
      return "Our family's military service";
    case "surname":
      return `The ${surname || "…"} name in our records`;
    case "two-lines": {
      const a = primaryName(data, personIds[0] ?? "").surname;
      const b = primaryName(data, personIds[1] ?? "").surname;
      return `How the ${a || "…"} and ${b || "…"} families came together`;
    }
  }
}

/** Plain text, for copying or downloading. Notes at the end. */
export function storyText(doc: StoryDoc): string {
  const lines: string[] = [doc.title, ""];
  for (const p of doc.paras) {
    const text = p.segs.map((s) => ("t" in s ? s.t : `[${s.n.join(",")}]`)).join("").replace(/\s+/g, " ").trim();
    lines.push(p.kind === "context" ? `Context: ${text}` : text, "");
  }
  if (doc.gaps.length) {
    lines.push("Still unknown:");
    for (const g of doc.gaps) lines.push(`- ${g}`);
    lines.push("");
  }
  if (doc.notes.length) {
    lines.push("Sources:");
    for (const n of doc.notes) lines.push(`${n.n}. ${n.title}${n.detail ? `. ${n.detail}` : ""}. ${n.label}.${n.url ? ` ${n.url}` : ""}`);
  }
  return lines.join("\n");
}
