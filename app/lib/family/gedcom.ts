// GEDCOM 5.5.1 import and export. Import and export are always available,
// on every plan: a family's data belongs to the family.
//
// Import keeps every person, family link, event, note and source citation it
// can read. Sources whose titles show they are someone else's online tree
// ("Public Member Trees", "FamilySearch Family Tree") come in as clues, so
// the evidence audit shows how much of an imported tree rests on records.
// Export writes standard tags only, plus QUAY on citations so other programs
// keep the evidence strength.

import { parseDate, toGedcomDate } from "./dates";
import { redactLiving } from "./living";
import { makeId } from "./ops";
import {
  emptyData,
  type Citation,
  type FactType,
  type FamilyData,
  type Fact,
  type Id,
  type InfoKind,
  type MatchStatus,
  type ParentKind,
  type Person,
  type Relationship,
  type Source,
  type SourceKind,
  type Workspace,
} from "./types";

export interface GedLine {
  level: number;
  xref?: string;
  tag: string;
  value: string;
  children: GedLine[];
}

export function parseGedcomLines(text: string): GedLine[] {
  const roots: GedLine[] = [];
  const stack: GedLine[] = [];
  const rows = text.replace(/^﻿/, "").split(/\r\n|\r|\n/);
  for (const row of rows) {
    if (!row.trim()) continue;
    const m = row.match(/^\s*(\d+)\s+(?:(@[^@]+@)\s+)?([A-Za-z0-9_]+)(?:\s(.*))?$/);
    if (!m) continue;
    const level = Number(m[1]);
    const raw = m[4] ?? "";
    const value = /^@[^@\s]+@$/.test(raw.trim()) ? raw.trim() : raw.replace(/@@/g, "@");
    const line: GedLine = { level, xref: m[2], tag: m[3].toUpperCase(), value, children: [] };
    if (line.tag === "CONC" || line.tag === "CONT") {
      const parent = stack[level - 1];
      if (parent) parent.value += (line.tag === "CONT" ? "\n" : "") + line.value;
      continue;
    }
    while (stack.length > level) stack.pop();
    if (level === 0) roots.push(line);
    else stack[level - 1]?.children.push(line);
    stack[level] = line;
  }
  return roots;
}

const child = (l: GedLine, tag: string) => l.children.find((c) => c.tag === tag);
const kids = (l: GedLine, tag: string) => l.children.filter((c) => c.tag === tag);

const EVENT_TAGS: Record<string, FactType> = {
  BIRT: "birth",
  CHR: "baptism",
  BAPM: "baptism",
  DEAT: "death",
  BURI: "burial",
  CREM: "burial",
  RESI: "residence",
  CENS: "residence",
  IMMI: "immigration",
  EMIG: "emigration",
  NATU: "naturalization",
  OCCU: "occupation",
  EDUC: "education",
  RELI: "religion",
  _MILT: "military",
  _MIL: "military",
  MILI: "military",
  EVEN: "other",
  FACT: "other",
};

const TREE_TITLE = /(public member trees|member trees|family trees?|oneworldtree|world family tree|familysearch family tree|ancestral file|geni|wikitree|myheritage family tree|user[- ]submitted)/i;

export interface ImportSummary {
  people: number;
  families: number;
  facts: number;
  sources: number;
  citations: number;
  treeSources: number;
  mediaSkipped: number;
  fromProgram?: string;
  warnings: string[];
}

export function importGedcom(text: string, name: string, env: { now?: string; newId?: () => string } = {}): { data: FamilyData; summary: ImportSummary } {
  const now = env.now ?? new Date().toISOString();
  const newId = env.newId ?? makeId;
  const ws: Workspace = { id: newId(), name, kind: "mine", schema: 1, createdAt: now, updatedAt: now };
  const data = emptyData(ws);
  const roots = parseGedcomLines(text);
  const summary: ImportSummary = { people: 0, families: 0, facts: 0, sources: 0, citations: 0, treeSources: 0, mediaSkipped: 0, warnings: [] };
  const head = roots.find((r) => r.tag === "HEAD");
  if (head) summary.fromProgram = child(head, "SOUR")?.children.find((c) => c.tag === "NAME")?.value || child(head, "SOUR")?.value || undefined;
  if (!roots.some((r) => r.tag === "INDI")) summary.warnings.push("No people were found in this file. Is it a GEDCOM file?");

  const repoNames = new Map<string, string>();
  for (const r of roots) if (r.tag === "REPO" && r.xref) repoNames.set(r.xref, child(r, "NAME")?.value ?? "");

  const sourceIds = new Map<string, Id>();
  for (const r of roots) {
    if (r.tag !== "SOUR" || !r.xref) continue;
    const title = child(r, "TITL")?.value || child(r, "ABBR")?.value || "Untitled source";
    const kind: SourceKind = TREE_TITLE.test(title) ? "tree" : guessKind(title);
    if (kind === "tree") summary.treeSources++;
    const repoRef = child(r, "REPO")?.value;
    const url = child(r, "_URL")?.value || child(r, "WWW")?.value || child(r, "URL")?.value || findUrl(child(r, "NOTE")?.value);
    const s: Source = {
      id: newId(),
      title,
      kind,
      repository: (repoRef && repoNames.get(repoRef)) || child(r, "AUTH")?.value || undefined,
      url: url || undefined,
      citation: child(r, "PUBL")?.value || undefined,
      note: [child(r, "TEXT")?.value, child(r, "NOTE")?.value].filter(Boolean).join("\n") || undefined,
      createdAt: now,
      updatedAt: now,
    };
    data.sources[s.id] = s;
    sourceIds.set(r.xref, s.id);
    summary.sources++;
  }

  const inline = (title: string): Id => {
    const existing = Object.values(data.sources).find((s) => s.title === title);
    if (existing) return existing.id;
    const s: Source = { id: newId(), title, kind: TREE_TITLE.test(title) ? "tree" : guessKind(title), createdAt: now, updatedAt: now };
    data.sources[s.id] = s;
    summary.sources++;
    return s.id;
  };

  const cite = (line: GedLine, target: Partial<Pick<Citation, "factId" | "relationshipId" | "personId">>) => {
    for (const s of kids(line, "SOUR")) {
      const sourceId = s.value.startsWith("@") ? sourceIds.get(s.value.trim()) : inline(s.value.trim() || "Untitled source");
      if (!sourceId) continue;
      const quay = child(s, "QUAY")?.value?.trim();
      const { info, match } = fromQuay(quay);
      const c: Citation = {
        id: newId(),
        sourceId,
        ...target,
        info,
        match,
        detail: child(s, "PAGE")?.value || undefined,
        excerpt: child(s, "DATA") ? child(child(s, "DATA")!, "TEXT")?.value || undefined : child(s, "TEXT")?.value || undefined,
        note: child(s, "NOTE")?.value || undefined,
        createdAt: now,
      };
      data.citations[c.id] = c;
      summary.citations++;
    }
  };

  const personIds = new Map<string, Id>();
  const pedigree = new Map<string, ParentKind>(); // `${indiXref}|${famXref}` → kind
  for (const r of roots) {
    if (r.tag !== "INDI" || !r.xref) continue;
    const p: Person = { id: newId(), sex: sexOf(child(r, "SEX")?.value), createdAt: now, updatedAt: now };
    const notes = kids(r, "NOTE").map((n) => n.value).filter((v) => v && !v.startsWith("@"));
    if (notes.length) p.notes = notes.join("\n\n");
    data.people[p.id] = p;
    personIds.set(r.xref, p.id);
    summary.people++;
    kids(r, "NAME").forEach((n, i) => {
      const parts = splitName(n.value);
      const f: Fact = {
        id: newId(),
        personId: p.id,
        type: "name",
        given: child(n, "GIVN")?.value || parts.given || undefined,
        surname: child(n, "SURN")?.value || parts.surname || undefined,
        nickname: child(n, "NICK")?.value || undefined,
        note: child(n, "TYPE")?.value ? `Name type: ${child(n, "TYPE")!.value}` : undefined,
        preferred: i === 0,
        createdAt: now,
        updatedAt: now,
      };
      data.facts[f.id] = f;
      cite(n, { factId: f.id });
    });
    for (const ev of r.children) {
      const type = EVENT_TAGS[ev.tag];
      if (!type) continue;
      const evType = (child(ev, "TYPE")?.value ?? "").trim();
      let finalType: FactType = type;
      if (type === "other" || type === "military") {
        if (/milit|service|war\b|army|navy|marine|air force|coast guard/i.test(evType)) finalType = "military";
        else if (/family memory|family story/i.test(evType)) finalType = "memory";
      }
      const described = ["occupation", "education", "religion", "military", "other", "memory"].includes(finalType);
      const value = described ? ev.value.trim() || (finalType === "other" ? evType : "") || undefined : undefined;
      const typeNote = finalType === "other" && evType && ev.value.trim() && !/^(other|event)$/i.test(evType) ? `Event type: ${evType}` : "";
      const f: Fact = {
        id: newId(),
        personId: p.id,
        type: finalType,
        value: value?.trim() || undefined,
        date: parseDate(child(ev, "DATE")?.value),
        place: child(ev, "PLAC")?.value || undefined,
        note: [ev.tag === "CENS" ? "Census entry" : "", typeNote, child(ev, "NOTE")?.value ?? ""].filter(Boolean).join("\n") || undefined,
        createdAt: now,
        updatedAt: now,
      };
      data.facts[f.id] = f;
      summary.facts++;
      cite(ev, { factId: f.id });
    }
    cite(r, { personId: p.id });
    summary.mediaSkipped += kids(r, "OBJE").length;
    for (const famc of kids(r, "FAMC")) {
      const pedi = child(famc, "PEDI")?.value?.toLowerCase();
      if (pedi) pedigree.set(`${r.xref}|${famc.value.trim()}`, pedi === "adopted" ? "adopted" : pedi === "foster" ? "foster" : pedi === "birth" ? "biological" : "unknown");
    }
  }

  const xrefOf = new Map<Id, string>();
  for (const [x, id] of personIds) xrefOf.set(id, x);

  for (const r of roots) {
    if (r.tag !== "FAM" || !r.xref) continue;
    summary.families++;
    const parents = [child(r, "HUSB")?.value, child(r, "WIFE")?.value].map((x) => (x ? personIds.get(x.trim()) : undefined)).filter((x): x is Id => !!x);
    let partnerRel: Relationship | undefined;
    if (parents.length === 2) {
      const marr = child(r, "MARR");
      const div = child(r, "DIV");
      partnerRel = { id: newId(), type: "partner", a: parents[0], b: parents[1], status: div ? "divorced" : marr ? "married" : "unknown", createdAt: now, updatedAt: now };
      data.relationships[partnerRel.id] = partnerRel;
      cite(r, { relationshipId: partnerRel.id });
      for (const [tag, type] of [["MARR", "marriage"], ["DIV", "divorce"]] as const) {
        for (const ev of kids(r, tag)) {
          const f: Fact = { id: newId(), relationshipId: partnerRel.id, type, date: parseDate(child(ev, "DATE")?.value), place: child(ev, "PLAC")?.value || undefined, note: child(ev, "NOTE")?.value || undefined, createdAt: now, updatedAt: now };
          data.facts[f.id] = f;
          summary.facts++;
          cite(ev, { factId: f.id });
        }
      }
    }
    for (const c of kids(r, "CHIL")) {
      const childId = personIds.get(c.value.trim());
      if (!childId) continue;
      const famKind = pedigree.get(`${xrefOf.get(childId)}|${r.xref}`);
      parents.forEach((pid, i) => {
        const rel = child(c, i === 0 ? "_FREL" : "_MREL")?.value?.toLowerCase();
        const kind: ParentKind = rel ? (rel.startsWith("adopt") ? "adopted" : rel.startsWith("step") ? "step" : rel.startsWith("foster") ? "foster" : rel.startsWith("natural") || rel.startsWith("birth") ? "biological" : "unknown") : famKind ?? "biological";
        const link: Relationship = { id: newId(), type: "parent", a: pid, b: childId, kind, createdAt: now, updatedAt: now };
        data.relationships[link.id] = link;
      });
    }
  }
  if (summary.mediaSkipped) summary.warnings.push(`${summary.mediaSkipped} photo or document link${summary.mediaSkipped > 1 ? "s were" : " was"} in the file. GEDCOM files don't carry the pictures themselves, so add them here from your device.`);
  const first = Object.values(data.people)[0];
  if (first) data.workspace.focusPersonId = first.id;
  return { data, summary };
}

function guessKind(title: string): SourceKind {
  if (/census|certificate|register|record|draft|enlist|passenger|manifest|naturali[sz]ation|index|death|birth|marriage|baptism|probate|deed|military/i.test(title)) return "record";
  if (/newspaper|gazette|times|herald|journal|tribune|obituar/i.test(title)) return "newspaper";
  if (/\bhistory of\b|genealogy of|book/i.test(title)) return "book";
  if (/https?:\/\//.test(title)) return "website";
  return "record";
}

function findUrl(text: string | undefined): string | undefined {
  return text?.match(/https?:\/\/\S+/)?.[0];
}

function fromQuay(q: string | undefined): { info: InfoKind; match: MatchStatus } {
  if (q === "3") return { info: "primary", match: "confirmed" };
  if (q === "2") return { info: "secondary", match: "confirmed" };
  if (q === "1" || q === "0") return { info: "secondary", match: "possible" };
  return { info: "secondary", match: "confirmed" };
}

function toQuay(c: Citation): string {
  if (c.match !== "confirmed") return "1";
  if (c.info === "primary") return "3";
  if (c.info === "secondary") return "2";
  return "1";
}

function sexOf(v: string | undefined): Person["sex"] {
  const s = (v ?? "").trim().toUpperCase();
  return s === "M" ? "male" : s === "F" ? "female" : "unknown";
}

export function splitName(value: string): { given: string; surname: string } {
  const m = value.match(/^(.*?)\/(.*?)\/(.*)$/);
  if (m) return { given: `${m[1].trim()} ${m[3].trim()}`.trim(), surname: m[2].trim() };
  const parts = value.trim().split(/\s+/);
  if (parts.length < 2) return { given: parts[0] ?? "", surname: "" };
  return { given: parts.slice(0, -1).join(" "), surname: parts[parts.length - 1] };
}

// ── export ─────────────────────────────────────────────────────────────────

function clean(v: string): string {
  if (/^@[A-Za-z0-9_]+@$/.test(v)) return v; // a pointer, not text
  return v.replace(/@/g, "@@").replace(/\r/g, "");
}

/** One GEDCOM line, split with CONT/CONC so no line passes 240 characters. */
function emit(out: string[], level: number, tag: string, value = "", xref?: string) {
  const lines = clean(value).split("\n");
  const head = `${level}${xref ? ` ${xref}` : ""} ${tag}`;
  lines.forEach((ln, i) => {
    const chunks = ln.match(/.{1,200}/g) ?? [""];
    chunks.forEach((chunk, j) => {
      if (i === 0 && j === 0) out.push(chunk ? `${head} ${chunk}` : head);
      else out.push(`${level + 1} ${j === 0 ? "CONT" : "CONC"}${chunk ? ` ${chunk}` : ""}`);
    });
  });
}

const FACT_TAG: Partial<Record<FactType, string>> = {
  birth: "BIRT",
  baptism: "CHR",
  death: "DEAT",
  burial: "BURI",
  residence: "RESI",
  immigration: "IMMI",
  emigration: "EMIG",
  naturalization: "NATU",
  occupation: "OCCU",
  education: "EDUC",
  religion: "RELI",
};

export function exportGedcom(input: FamilyData, opts: { redactLiving?: boolean; now?: Date } = {}): string {
  const data = opts.redactLiving ? redactLiving(input) : input;
  const now = opts.now ?? new Date();
  const out: string[] = [];
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  emit(out, 0, "HEAD");
  emit(out, 1, "SOUR", "WHATAMIAI");
  emit(out, 2, "NAME", "WhatAmIAI");
  emit(out, 2, "VERS", "1.0");
  emit(out, 1, "DATE", `${now.getUTCDate()} ${months[now.getUTCMonth()]} ${now.getUTCFullYear()}`);
  emit(out, 1, "GEDC");
  emit(out, 2, "VERS", "5.5.1");
  emit(out, 2, "FORM", "LINEAGE-LINKED");
  emit(out, 1, "CHAR", "UTF-8");
  if (opts.redactLiving) emit(out, 1, "NOTE", "Details of living people were removed before sharing.");

  const people = Object.values(data.people).filter((p) => !p.mergedInto).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  const iref = new Map<Id, string>(people.map((p, i) => [p.id, `@I${i + 1}@`]));
  const usedSources = new Set(Object.values(data.citations).map((c) => c.sourceId));
  const sources = Object.values(data.sources).filter((s) => usedSources.has(s.id)).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  const sref = new Map<Id, string>(sources.map((s, i) => [s.id, `@S${i + 1}@`]));
  const citesFor = (pred: (c: Citation) => boolean) => Object.values(data.citations).filter(pred);
  const writeCites = (level: number, cites: Citation[]) => {
    for (const c of cites) {
      const ref = sref.get(c.sourceId);
      if (!ref) continue;
      emit(out, level, "SOUR", ref);
      if (c.detail) emit(out, level + 1, "PAGE", c.detail);
      if (c.excerpt) {
        emit(out, level + 1, "DATA");
        emit(out, level + 2, "TEXT", c.excerpt);
      }
      emit(out, level + 1, "QUAY", toQuay(c));
      const notes = [c.note, c.info === "recollection" ? "Family memory" : "", c.match === "possible" ? "Not yet confirmed as this person" : ""].filter(Boolean).join(". ");
      if (notes) emit(out, level + 1, "NOTE", notes);
    }
  };
  const writeEvent = (level: number, tag: string, f: Fact) => {
    const date = toGedcomDate(f.date);
    const hasDetail = date || f.place || f.note || f.value;
    const lineValue = ["OCCU", "EDUC", "RELI", "EVEN"].includes(tag) ? f.value ?? "" : hasDetail ? "" : "Y";
    emit(out, level, tag, lineValue);
    if (tag === "EVEN") emit(out, level + 1, "TYPE", f.type === "military" ? "Military service" : f.type === "memory" ? "Family memory" : "Other");
    if (date) emit(out, level + 1, "DATE", date);
    if (f.place) emit(out, level + 1, "PLAC", f.place);
    const notes = [f.note ?? "", f.rejected ? `Set aside: ${f.rejected.reason}` : ""].filter(Boolean).join("\n");
    if (notes) emit(out, level + 1, "NOTE", notes);
    writeCites(level + 1, citesFor((c) => c.factId === f.id));
  };

  // Families: one per couple, plus one per parent set that isn't a recorded couple.
  type Fam = { key: string; parents: Id[]; partner?: Relationship; children: { id: Id; kind: ParentKind }[] };
  const fams = new Map<string, Fam>();
  const keyOf = (ids: Id[]) => [...ids].sort().join("+");
  for (const r of Object.values(data.relationships)) {
    if (r.type !== "partner" || !iref.has(r.a) || !iref.has(r.b)) continue;
    const key = keyOf([r.a, r.b]);
    fams.set(key, { key, parents: [r.a, r.b], partner: r, children: [] });
  }
  for (const p of people) {
    const links = Object.values(data.relationships).filter((r) => r.type === "parent" && r.b === p.id && iref.has(r.a));
    const groups = new Map<string, Relationship[]>();
    for (const l of links) {
      const g = l.kind === "adopted" || l.kind === "foster" || l.kind === "step" || l.kind === "guardian" ? l.kind : "birth";
      groups.set(g, [...(groups.get(g) ?? []), l]);
    }
    for (const [, ls] of groups) {
      for (let i = 0; i < ls.length; i += 2) {
        const pair = ls.slice(i, i + 2);
        const key = keyOf(pair.map((l) => l.a));
        const fam = fams.get(key) ?? { key, parents: pair.map((l) => l.a), children: [] };
        fam.children.push({ id: p.id, kind: pair[0].kind ?? "unknown" });
        fams.set(key, fam);
      }
    }
  }
  const famList = [...fams.values()];
  const fref = new Map<string, string>(famList.map((f, i) => [f.key, `@F${i + 1}@`]));

  for (const p of people) {
    const ref = iref.get(p.id)!;
    emit(out, 0, "INDI", "", ref);
    const facts = Object.values(data.facts).filter((f) => f.personId === p.id);
    const names = facts.filter((f) => f.type === "name").sort((a, b) => Number(!!b.preferred) - Number(!!a.preferred));
    for (const n of names) {
      emit(out, 1, "NAME", `${n.given ?? ""} /${n.surname ?? ""}/`.trim());
      if (n.given) emit(out, 2, "GIVN", n.given);
      if (n.surname) emit(out, 2, "SURN", n.surname);
      if (n.nickname) emit(out, 2, "NICK", n.nickname);
      writeCites(2, citesFor((c) => c.factId === n.id));
    }
    emit(out, 1, "SEX", p.sex === "male" ? "M" : p.sex === "female" ? "F" : "U");
    for (const f of facts.filter((x) => x.type !== "name").sort((a, b) => (a.date?.y ?? 9999) - (b.date?.y ?? 9999))) {
      const tag = FACT_TAG[f.type] ?? "EVEN";
      writeEvent(1, tag, f);
    }
    for (const fam of famList) {
      const c = fam.children.find((x) => x.id === p.id);
      if (c) {
        emit(out, 1, "FAMC", fref.get(fam.key)!);
        if (c.kind === "adopted" || c.kind === "foster") emit(out, 2, "PEDI", c.kind);
        else if (c.kind === "biological") emit(out, 2, "PEDI", "birth");
      }
      if (fam.parents.includes(p.id)) emit(out, 1, "FAMS", fref.get(fam.key)!);
    }
    if (p.notes) emit(out, 1, "NOTE", p.notes);
    writeCites(1, citesFor((c) => c.personId === p.id && !c.factId && !c.relationshipId));
  }

  for (const fam of famList) {
    emit(out, 0, "FAM", "", fref.get(fam.key));
    const [x, y] = fam.parents;
    const sx = data.people[x]?.sex;
    const sy = y ? data.people[y]?.sex : undefined;
    const husbFirst = !(sx === "female" || sy === "male");
    const husb = husbFirst ? x : y;
    const wife = husbFirst ? y : x;
    if (husb) emit(out, 1, "HUSB", iref.get(husb)!);
    if (wife) emit(out, 1, "WIFE", iref.get(wife)!);
    for (const c of fam.children) emit(out, 1, "CHIL", iref.get(c.id)!);
    if (fam.partner) {
      for (const f of Object.values(data.facts).filter((f) => f.relationshipId === fam.partner!.id)) {
        writeEvent(1, f.type === "marriage" ? "MARR" : f.type === "divorce" ? "DIV" : "EVEN", f);
      }
      writeCites(1, citesFor((c) => c.relationshipId === fam.partner!.id));
    }
  }

  for (const s of sources) {
    emit(out, 0, "SOUR", "", sref.get(s.id));
    emit(out, 1, "TITL", s.title);
    if (s.repository) emit(out, 1, "AUTH", s.repository);
    if (s.citation) emit(out, 1, "PUBL", s.citation);
    const note = [s.url ? `URL: ${s.url}` : "", s.recordId ? `Record ID: ${s.recordId}` : "", s.date ? `Date: ${s.date}` : "", s.accessed ? `Accessed: ${s.accessed.slice(0, 10)}` : "", s.kind === "tree" ? "Someone else's family tree: a clue, not proof." : "", s.kind === "ai" ? "AI suggestion: a clue, not proof." : "", s.note ?? ""]
      .filter(Boolean)
      .join("\n");
    if (note) emit(out, 1, "NOTE", note);
  }
  emit(out, 0, "TRLR");
  return out.join("\n") + "\n";
}
