// Every change to a family is one of these operations. Each returns a Patch
// (records to write, records to delete, and a change-history line), so the
// screen and the browser database are updated together and every edit is
// listed in the person's history. Pure functions: easy to test.

import { parseDate } from "./dates";
import { displayName } from "./names";
import { wouldCreateLoop } from "./graph";
import type {
  Change,
  Citation,
  EntityName,
  Fact,
  FactType,
  FamilyData,
  Hypothesis,
  Id,
  InfoKind,
  LeadState,
  LeadStatus,
  MatchStatus,
  Media,
  ParentKind,
  PartnerStatus,
  Patch,
  Person,
  Relationship,
  Sex,
  Source,
  SourceKind,
  Story,
  Workspace,
} from "./types";

export interface Env {
  now?: string;
  newId?: () => string;
}

export function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export class PatchBuilder {
  patch: Patch = { put: {}, del: {}, changes: [] };
  readonly now: string;
  readonly newId: () => string;
  constructor(readonly data: FamilyData, env: Env = {}) {
    this.now = env.now ?? new Date().toISOString();
    this.newId = env.newId ?? makeId;
  }
  put<T extends { id: Id }>(entity: EntityName, obj: T) {
    (this.patch.put[entity] ??= {})[obj.id] = obj;
    return obj;
  }
  del(entity: EntityName, id: Id) {
    (this.patch.del[entity] ??= []).push(id);
  }
  log(action: Change["action"], entity: Change["entity"], entityId: Id, summary: string) {
    this.patch.changes.push({ id: this.newId(), at: this.now, action, entity, entityId, summary });
  }
  /** Read a record as it will be after this patch so far. */
  get<T>(entity: EntityName, id: Id): T | undefined {
    if (this.patch.del[entity]?.includes(id)) return undefined;
    const pending = this.patch.put[entity]?.[id];
    return (pending ?? (this.data[entity] as Record<Id, unknown>)[id]) as T | undefined;
  }
}

/** Join patches made one after another (each against the data after the last). */
export function combine(...patches: Patch[]): Patch {
  const out: Patch = { put: {}, del: {}, changes: [] };
  for (const p of patches) {
    for (const [e, recs] of Object.entries(p.put) as [EntityName, Record<Id, unknown>][]) out.put[e] = { ...(out.put[e] ?? {}), ...recs };
    for (const [e, ids] of Object.entries(p.del) as [EntityName, Id[]][]) {
      out.del[e] = [...(out.del[e] ?? []), ...ids];
      for (const id of ids) if (out.put[e]) delete out.put[e]![id];
    }
    out.changes.push(...p.changes);
    if (p.workspace) out.workspace = p.workspace;
  }
  return out;
}

/** Apply a patch to in-memory data. Returns new objects; never mutates. */
export function applyPatch(data: FamilyData, patch: Patch): FamilyData {
  const next: FamilyData = { ...data, changes: [...data.changes, ...patch.changes] };
  if (patch.workspace) next.workspace = patch.workspace;
  const touched = new Set<EntityName>([...(Object.keys(patch.put) as EntityName[]), ...(Object.keys(patch.del) as EntityName[])]);
  for (const e of touched) {
    const table = { ...(data[e] as Record<Id, unknown>) };
    for (const [id, obj] of Object.entries(patch.put[e] ?? {})) table[id] = obj;
    for (const id of patch.del[e] ?? []) delete table[id];
    (next as unknown as Record<string, unknown>)[e] = table;
  }
  return next;
}

export function newWorkspace(name: string, kind: Workspace["kind"], env: Env = {}): Workspace {
  const now = env.now ?? new Date().toISOString();
  return { id: (env.newId ?? makeId)(), name, kind, schema: 1, createdAt: now, updatedAt: now };
}

// ── sources ────────────────────────────────────────────────────────────────

export const FAMILY_MEMORY_TITLE = "Family memory (entered by you)";

/** The one source that holds what the person knows from family. */
function familyMemorySource(b: PatchBuilder): Source {
  const existing = Object.values(b.data.sources).find((s) => s.kind === "interview" && s.title === FAMILY_MEMORY_TITLE);
  if (existing) return existing;
  const pending = Object.values(b.patch.put.sources ?? {}).find((s) => (s as Source).title === FAMILY_MEMORY_TITLE) as Source | undefined;
  if (pending) return pending;
  return b.put<Source>("sources", {
    id: b.newId(),
    title: FAMILY_MEMORY_TITLE,
    kind: "interview",
    repository: "Your own knowledge and what relatives told you",
    note: "Add who told you and when on each memory, where you can.",
    createdAt: b.now,
    updatedAt: b.now,
  });
}

export type SourceInput = Partial<Omit<Source, "id" | "createdAt" | "updatedAt">> & { title: string; kind: SourceKind };

export function addSource(data: FamilyData, input: SourceInput, env?: Env): { patch: Patch; id: Id } {
  const b = new PatchBuilder(data, env);
  const s = b.put<Source>("sources", { ...input, id: b.newId(), title: input.title.trim() || "Untitled source", createdAt: b.now, updatedAt: b.now });
  b.log("add", "sources", s.id, `Added source: ${s.title}`);
  return { patch: b.patch, id: s.id };
}

export function updateSource(data: FamilyData, id: Id, changes: Partial<Source>, env?: Env): Patch {
  const b = new PatchBuilder(data, env);
  const s = data.sources[id];
  if (!s) return b.patch;
  b.put<Source>("sources", { ...s, ...changes, id, updatedAt: b.now });
  b.log("edit", "sources", id, `Edited source: ${changes.title ?? s.title}`);
  return b.patch;
}

/** Removes a source and every citation that points to it. */
export function removeSource(data: FamilyData, id: Id, env?: Env): Patch {
  const b = new PatchBuilder(data, env);
  const s = data.sources[id];
  if (!s) return b.patch;
  for (const c of Object.values(data.citations)) if (c.sourceId === id) b.del("citations", c.id);
  b.del("sources", id);
  b.log("remove", "sources", id, `Removed source: ${s.title}`);
  return b.patch;
}

// ── citations ──────────────────────────────────────────────────────────────

export type CitationInput = {
  sourceId: Id;
  factId?: Id;
  relationshipId?: Id;
  personId?: Id;
  info: InfoKind;
  match: MatchStatus;
  detail?: string;
  excerpt?: string;
  note?: string;
};

export function addCitation(data: FamilyData, input: CitationInput, env?: Env): { patch: Patch; id: Id } {
  const b = new PatchBuilder(data, env);
  const c = b.put<Citation>("citations", { ...input, id: b.newId(), createdAt: b.now });
  const what = input.factId ? "a fact" : input.relationshipId ? "a relationship" : "a person";
  b.log("add", "citations", c.id, `Attached ${data.sources[input.sourceId]?.title ?? "a source"} to ${what}`);
  return { patch: b.patch, id: c.id };
}

export function updateCitation(data: FamilyData, id: Id, changes: Partial<Citation>, env?: Env): Patch {
  const b = new PatchBuilder(data, env);
  const c = data.citations[id];
  if (!c) return b.patch;
  b.put<Citation>("citations", { ...c, ...changes, id });
  const what = changes.match === "confirmed" && c.match !== "confirmed" ? "Confirmed a record match" : "Edited evidence";
  b.log("edit", "citations", id, `${what}: ${data.sources[c.sourceId]?.title ?? "source"}`);
  return b.patch;
}

export function removeCitation(data: FamilyData, id: Id, env?: Env): Patch {
  const b = new PatchBuilder(data, env);
  const c = data.citations[id];
  if (!c) return b.patch;
  b.del("citations", id);
  b.log("remove", "citations", id, `Detached ${data.sources[c.sourceId]?.title ?? "a source"}`);
  return b.patch;
}

// ── people and facts ───────────────────────────────────────────────────────

/** How the person knows what they typed when adding someone. */
export type KnownHow = "memory" | "unsure";

export type PersonInput = {
  given?: string;
  surname?: string;
  nickname?: string;
  sex?: Sex;
  living?: "yes" | "no";
  isSelf?: boolean;
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  knownHow?: KnownHow;
  memoryNote?: string;
};

function addFactInto(b: PatchBuilder, fields: Omit<Fact, "id" | "createdAt" | "updatedAt">): Fact {
  return b.put<Fact>("facts", { ...fields, id: b.newId(), createdAt: b.now, updatedAt: b.now });
}

function citeMemory(b: PatchBuilder, factId: Id, note?: string) {
  const src = familyMemorySource(b);
  b.put<Citation>("citations", { id: b.newId(), sourceId: src.id, factId, info: "recollection", match: "confirmed", note: note?.trim() || undefined, createdAt: b.now });
}

export function addPerson(data: FamilyData, input: PersonInput, env?: Env): { patch: Patch; id: Id } {
  const b = new PatchBuilder(data, env);
  const person = b.put<Person>("people", {
    id: b.newId(),
    sex: input.sex ?? "unknown",
    living: input.living,
    isSelf: input.isSelf || undefined,
    createdAt: b.now,
    updatedAt: b.now,
  });
  const memory = input.knownHow === "memory";
  const given = input.given?.trim();
  const surname = input.surname?.trim();
  if (given || surname) {
    const f = addFactInto(b, { personId: person.id, type: "name", given, surname, nickname: input.nickname?.trim() || undefined, preferred: true });
    if (memory) citeMemory(b, f.id, input.memoryNote);
  }
  const events: [FactType, string | undefined, string | undefined][] = [
    ["birth", input.birthDate, input.birthPlace],
    ["death", input.deathDate, input.deathPlace],
  ];
  for (const [type, date, place] of events) {
    if (!date?.trim() && !place?.trim()) continue;
    const f = addFactInto(b, { personId: person.id, type, date: parseDate(date), place: place?.trim() || undefined });
    if (memory) citeMemory(b, f.id, input.memoryNote);
  }
  if (input.isSelf) {
    for (const p of Object.values(data.people)) if (p.isSelf) b.put<Person>("people", { ...p, isSelf: undefined, updatedAt: b.now });
  }
  const name = [given, surname].filter(Boolean).join(" ") || "Unnamed person";
  b.log("add", "people", person.id, `Added ${name}`);
  if (!data.workspace.focusPersonId) b.patch.workspace = { ...data.workspace, focusPersonId: person.id, updatedAt: b.now };
  return { patch: b.patch, id: person.id };
}

export function updatePerson(data: FamilyData, id: Id, changes: Partial<Pick<Person, "sex" | "living" | "isSelf">>, env?: Env): Patch {
  const b = new PatchBuilder(data, env);
  const p = data.people[id];
  if (!p) return b.patch;
  const next: Person = { ...p, ...changes, updatedAt: b.now };
  if (changes.living === undefined && "living" in changes) delete next.living;
  b.put("people", next);
  if (changes.isSelf) for (const o of Object.values(data.people)) if (o.isSelf && o.id !== id) b.put<Person>("people", { ...o, isSelf: undefined, updatedAt: b.now });
  b.log("edit", "people", id, `Edited ${displayName(data, id)}`);
  return b.patch;
}

/** Removes a person with their facts, links and evidence. History keeps a line. */
export function removePerson(data: FamilyData, id: Id, env?: Env): Patch {
  const b = new PatchBuilder(data, env);
  if (!data.people[id]) return b.patch;
  const name = displayName(data, id);
  const factIds = new Set(Object.values(data.facts).filter((f) => f.personId === id).map((f) => f.id));
  const relIds = new Set(Object.values(data.relationships).filter((r) => r.a === id || r.b === id).map((r) => r.id));
  for (const f of Object.values(data.facts)) if (f.relationshipId && relIds.has(f.relationshipId)) factIds.add(f.id);
  for (const fid of factIds) b.del("facts", fid);
  for (const rid of relIds) b.del("relationships", rid);
  for (const c of Object.values(data.citations)) {
    if ((c.factId && factIds.has(c.factId)) || (c.relationshipId && relIds.has(c.relationshipId)) || c.personId === id) b.del("citations", c.id);
  }
  for (const l of Object.values(data.leads)) if (l.personId === id) b.del("leads", l.id);
  for (const h of Object.values(data.hypotheses)) if (h.personId === id) b.del("hypotheses", h.id);
  for (const m of Object.values(data.media)) {
    if (m.personIds.includes(id)) b.put<Media>("media", { ...m, personIds: m.personIds.filter((p) => p !== id) });
  }
  for (const s of Object.values(data.stories)) {
    if (s.personIds.includes(id)) b.put<Story>("stories", { ...s, personIds: s.personIds.filter((p) => p !== id), updatedAt: b.now });
  }
  b.del("people", id);
  if (data.workspace.focusPersonId === id) b.patch.workspace = { ...data.workspace, focusPersonId: undefined, updatedAt: b.now };
  b.log("remove", "people", id, `Removed ${name}`);
  return b.patch;
}

export type FactInput = Omit<Fact, "id" | "createdAt" | "updatedAt" | "date"> & { date?: string };

export function addFact(data: FamilyData, input: FactInput, opts: { knownHow?: KnownHow; memoryNote?: string } = {}, env?: Env): { patch: Patch; id: Id } {
  const b = new PatchBuilder(data, env);
  const { date, ...rest } = input;
  const f = addFactInto(b, { ...rest, date: parseDate(date), place: rest.place?.trim() || undefined, value: rest.value?.trim() || undefined });
  if (opts.knownHow === "memory") citeMemory(b, f.id, opts.memoryNote);
  const who = input.personId ? displayName(data, input.personId) : "a couple";
  b.log("add", "facts", f.id, `Added ${input.type} for ${who}`);
  return { patch: b.patch, id: f.id };
}

export function updateFact(data: FamilyData, id: Id, changes: Partial<FactInput>, env?: Env): Patch {
  const b = new PatchBuilder(data, env);
  const f = data.facts[id];
  if (!f) return b.patch;
  const { date, ...rest } = changes;
  const next: Fact = { ...f, ...rest, id, updatedAt: b.now };
  if (date !== undefined) next.date = parseDate(date);
  b.put("facts", next);
  b.log("edit", "facts", id, `Edited ${f.type}${f.personId ? ` for ${displayName(data, f.personId)}` : ""}`);
  return b.patch;
}

export function removeFact(data: FamilyData, id: Id, env?: Env): Patch {
  const b = new PatchBuilder(data, env);
  const f = data.facts[id];
  if (!f) return b.patch;
  for (const c of Object.values(data.citations)) if (c.factId === id) b.del("citations", c.id);
  b.del("facts", id);
  b.log("remove", "facts", id, `Removed ${f.type}${f.personId ? ` for ${displayName(data, f.personId)}` : ""}`);
  return b.patch;
}

/** Records disagree: keep this version as the best supported, with a reason. */
export function chooseFact(data: FamilyData, id: Id, reason: string, peers: Id[], env?: Env): Patch {
  const b = new PatchBuilder(data, env);
  const f = data.facts[id];
  if (!f) return b.patch;
  b.put<Fact>("facts", { ...f, preferred: true, note: reason.trim() ? [f.note, `Chosen because: ${reason.trim()}`].filter(Boolean).join("\n") : f.note, updatedAt: b.now });
  for (const pid of peers) {
    const p = data.facts[pid];
    if (p?.preferred) b.put<Fact>("facts", { ...p, preferred: false, updatedAt: b.now });
  }
  b.log("resolve", "facts", id, `Chose one ${f.type} version${f.personId ? ` for ${displayName(data, f.personId)}` : ""}${reason.trim() ? `: ${reason.trim()}` : ""}`);
  return b.patch;
}

export function rejectFact(data: FamilyData, id: Id, reason: string, env?: Env): Patch {
  const b = new PatchBuilder(data, env);
  const f = data.facts[id];
  if (!f) return b.patch;
  b.put<Fact>("facts", { ...f, preferred: false, rejected: { reason: reason.trim() || "Marked as wrong", at: b.now }, updatedAt: b.now });
  b.log("resolve", "facts", id, `Set aside a ${f.type} version${reason.trim() ? `: ${reason.trim()}` : ""}`);
  return b.patch;
}

export function restoreFact(data: FamilyData, id: Id, env?: Env): Patch {
  const b = new PatchBuilder(data, env);
  const f = data.facts[id];
  if (!f) return b.patch;
  const next = { ...f, updatedAt: b.now };
  delete next.rejected;
  b.put("facts", next);
  b.log("resolve", "facts", id, `Brought back a ${f.type} version`);
  return b.patch;
}

// ── relationships ──────────────────────────────────────────────────────────

export type RelError = "loop" | "duplicate" | "self" | "missing";

export function addRelationship(
  data: FamilyData,
  input: { type: "parent" | "partner"; a: Id; b: Id; kind?: ParentKind; status?: PartnerStatus; knownHow?: KnownHow; memoryNote?: string },
  env?: Env,
): { patch: Patch; id?: Id; error?: RelError } {
  const b = new PatchBuilder(data, env);
  if (input.a === input.b) return { patch: b.patch, error: "self" };
  if (!data.people[input.a] || !data.people[input.b]) return { patch: b.patch, error: "missing" };
  const dup = Object.values(data.relationships).some(
    (r) => r.type === input.type && ((r.a === input.a && r.b === input.b) || (input.type === "partner" && r.a === input.b && r.b === input.a)),
  );
  if (dup) return { patch: b.patch, error: "duplicate" };
  if (input.type === "parent" && wouldCreateLoop(data, input.a, input.b)) return { patch: b.patch, error: "loop" };
  const rel = b.put<Relationship>("relationships", {
    id: b.newId(),
    type: input.type,
    a: input.a,
    b: input.b,
    kind: input.type === "parent" ? input.kind ?? "biological" : undefined,
    status: input.type === "partner" ? input.status ?? "unknown" : undefined,
    createdAt: b.now,
    updatedAt: b.now,
  });
  if (input.knownHow === "memory") {
    const src = familyMemorySource(b);
    b.put<Citation>("citations", { id: b.newId(), sourceId: src.id, relationshipId: rel.id, info: "recollection", match: "confirmed", note: input.memoryNote?.trim() || undefined, createdAt: b.now });
  }
  const an = displayName(data, input.a);
  const bn = displayName(data, input.b);
  b.log("add", "relationships", rel.id, input.type === "parent" ? `Linked ${an} as a parent of ${bn}` : `Linked ${an} and ${bn} as a couple`);
  return { patch: b.patch, id: rel.id };
}

export function updateRelationship(data: FamilyData, id: Id, changes: Partial<Pick<Relationship, "kind" | "status" | "note">>, env?: Env): Patch {
  const b = new PatchBuilder(data, env);
  const r = data.relationships[id];
  if (!r) return b.patch;
  b.put<Relationship>("relationships", { ...r, ...changes, updatedAt: b.now });
  b.log("edit", "relationships", id, `Edited the link between ${displayName(data, r.a)} and ${displayName(data, r.b)}`);
  return b.patch;
}

export function removeRelationship(data: FamilyData, id: Id, env?: Env): Patch {
  const b = new PatchBuilder(data, env);
  const r = data.relationships[id];
  if (!r) return b.patch;
  for (const c of Object.values(data.citations)) if (c.relationshipId === id) b.del("citations", c.id);
  for (const f of Object.values(data.facts)) {
    if (f.relationshipId !== id) continue;
    b.del("facts", f.id);
    for (const c of Object.values(data.citations)) if (c.factId === f.id) b.del("citations", c.id);
  }
  b.del("relationships", id);
  b.log("remove", "relationships", id, `Removed the link between ${displayName(data, r.a)} and ${displayName(data, r.b)}`);
  return b.patch;
}

// ── research, ideas, media, stories, focus ─────────────────────────────────

export function setLead(data: FamilyData, personId: Id, key: string, status: LeadStatus, note: string | undefined, env?: Env): Patch {
  const b = new PatchBuilder(data, env);
  const existing = Object.values(data.leads).find((l) => l.personId === personId && l.key === key);
  const lead: LeadState = { id: existing?.id ?? b.newId(), personId, key, status, note: note?.trim() || existing?.note, updatedAt: b.now };
  b.put("leads", lead);
  const words: Record<LeadStatus, string> = { todo: "to do", nothing: "searched, nothing found", found: "found something", skip: "skipped" };
  b.log("edit", "leads", lead.id, `Research for ${displayName(data, personId)}: ${key} — ${words[status]}`);
  return b.patch;
}

export function addHypothesis(data: FamilyData, input: Omit<Hypothesis, "id" | "createdAt" | "updatedAt" | "status"> & { status?: Hypothesis["status"] }, env?: Env): { patch: Patch; id: Id } {
  const b = new PatchBuilder(data, env);
  const h = b.put<Hypothesis>("hypotheses", { ...input, text: input.text.trim(), status: input.status ?? "open", id: b.newId(), createdAt: b.now, updatedAt: b.now });
  b.log("add", "hypotheses", h.id, `Added an idea to check${input.origin === "ai" ? " (from an AI chat)" : ""}`);
  return { patch: b.patch, id: h.id };
}

export function updateHypothesis(data: FamilyData, id: Id, changes: Partial<Hypothesis>, env?: Env): Patch {
  const b = new PatchBuilder(data, env);
  const h = data.hypotheses[id];
  if (!h) return b.patch;
  b.put<Hypothesis>("hypotheses", { ...h, ...changes, id, updatedAt: b.now });
  b.log("edit", "hypotheses", id, changes.status && changes.status !== h.status ? `Marked an idea as ${changes.status}` : "Edited an idea");
  return b.patch;
}

export function removeHypothesis(data: FamilyData, id: Id, env?: Env): Patch {
  const b = new PatchBuilder(data, env);
  if (!data.hypotheses[id]) return b.patch;
  b.del("hypotheses", id);
  b.log("remove", "hypotheses", id, "Removed an idea");
  return b.patch;
}

export function addMediaRecord(data: FamilyData, input: Omit<Media, "id" | "createdAt">, env?: Env): { patch: Patch; id: Id } {
  const b = new PatchBuilder(data, env);
  const m = b.put<Media>("media", { ...input, id: b.newId(), createdAt: b.now });
  b.log("add", "media", m.id, `Added a file: ${input.name}`);
  return { patch: b.patch, id: m.id };
}

export function removeMediaRecord(data: FamilyData, id: Id, env?: Env): Patch {
  const b = new PatchBuilder(data, env);
  const m = data.media[id];
  if (!m) return b.patch;
  b.del("media", id);
  b.log("remove", "media", id, `Removed a file: ${m.name}`);
  return b.patch;
}

export function addStory(data: FamilyData, input: Omit<Story, "id" | "createdAt" | "updatedAt">, env?: Env): { patch: Patch; id: Id } {
  const b = new PatchBuilder(data, env);
  const s = b.put<Story>("stories", { ...input, id: b.newId(), createdAt: b.now, updatedAt: b.now });
  b.log("add", "stories", s.id, `Started a story: ${input.title}`);
  return { patch: b.patch, id: s.id };
}

export function updateStory(data: FamilyData, id: Id, changes: Partial<Story>, env?: Env): Patch {
  const b = new PatchBuilder(data, env);
  const s = data.stories[id];
  if (!s) return b.patch;
  b.put<Story>("stories", { ...s, ...changes, id, updatedAt: b.now });
  b.log("edit", "stories", id, `Edited the story: ${changes.title ?? s.title}`);
  return b.patch;
}

export function removeStory(data: FamilyData, id: Id, env?: Env): Patch {
  const b = new PatchBuilder(data, env);
  const s = data.stories[id];
  if (!s) return b.patch;
  b.del("stories", id);
  b.log("remove", "stories", id, `Removed the story: ${s.title}`);
  return b.patch;
}

export function setFocus(data: FamilyData, personId: Id, env?: Env): Patch {
  const now = env?.now ?? new Date().toISOString();
  return { put: {}, del: {}, changes: [], workspace: { ...data.workspace, focusPersonId: personId, updatedAt: now } };
}

export function renameWorkspace(data: FamilyData, name: string, env?: Env): Patch {
  const b = new PatchBuilder(data, env);
  b.patch.workspace = { ...data.workspace, name: name.trim() || data.workspace.name, updatedAt: b.now };
  b.log("edit", "workspace", data.workspace.id, `Renamed the family to ${name.trim()}`);
  return b.patch;
}
