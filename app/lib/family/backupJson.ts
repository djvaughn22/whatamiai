// The complete backup: every record in a workspace, lossless, as one JSON file.
// GEDCOM is for moving between programs; this file is for keeping everything,
// including evidence labels, research progress, ideas and stories.

import { makeId } from "./ops";
import { ENTITY_NAMES, emptyData, type FamilyData, type Id, type Workspace } from "./types";

export const BACKUP_APP = "whatamiai-family";

export interface FamilyBackup {
  app: typeof BACKUP_APP;
  version: 1;
  exportedAt: string;
  data: FamilyData;
  /** media files as data: URLs, only when the person chose to include them */
  files?: Record<Id, string>;
}

export function toBackup(data: FamilyData, files?: Record<Id, string>, now = new Date()): FamilyBackup {
  return { app: BACKUP_APP, version: 1, exportedAt: now.toISOString(), data, ...(files && Object.keys(files).length ? { files } : {}) };
}

export type ReadResult = { ok: true; backup: FamilyBackup } | { ok: false; error: string };

export function readBackup(text: string): ReadResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file couldn't be read as a WhatAmIAI family backup." };
  }
  const b = raw as Partial<FamilyBackup> | null;
  if (!b || b.app !== BACKUP_APP || !b.data || typeof b.data !== "object" || !b.data.workspace) {
    return { ok: false, error: "That file isn't a WhatAmIAI family backup." };
  }
  for (const e of ENTITY_NAMES) {
    const t = (b.data as unknown as Record<string, unknown>)[e];
    if (t !== undefined && (typeof t !== "object" || Array.isArray(t))) return { ok: false, error: "The backup file is damaged." };
  }
  return { ok: true, backup: b as FamilyBackup };
}

/** A copy with fresh ids everywhere, so it can sit beside the original. */
export function withFreshIds(src: FamilyData, name: string, newId: () => string = makeId): { data: FamilyData; idMap: Map<Id, Id> } {
  const map = new Map<Id, Id>();
  const id = (old: Id | undefined) => {
    if (!old) return old;
    if (!map.has(old)) map.set(old, newId());
    return map.get(old)!;
  };
  const now = new Date().toISOString();
  const ws: Workspace = { ...src.workspace, id: newId(), name, kind: src.workspace.kind === "example" ? "example" : "mine", focusPersonId: id(src.workspace.focusPersonId), updatedAt: now };
  const out = emptyData(ws);
  const remap = <T extends Record<string, unknown>>(o: T, keys: string[]): T => {
    const copy: Record<string, unknown> = { ...o };
    for (const k of keys) {
      const v = copy[k];
      if (typeof v === "string") copy[k] = id(v);
      else if (Array.isArray(v)) copy[k] = v.map((x) => (typeof x === "string" ? id(x) : x));
    }
    return copy as T;
  };
  const tables: [keyof FamilyData, string[]][] = [
    ["people", ["id", "mergedInto"]],
    ["facts", ["id", "personId", "relationshipId"]],
    ["relationships", ["id", "a", "b"]],
    ["sources", ["id"]],
    ["citations", ["id", "sourceId", "factId", "relationshipId", "personId"]],
    ["leads", ["id", "personId"]],
    ["hypotheses", ["id", "personId"]],
    ["media", ["id", "personIds", "sourceId"]],
    ["stories", ["id", "personIds"]],
  ];
  for (const [table, keys] of tables) {
    const from = (src[table] ?? {}) as unknown as Record<Id, Record<string, unknown>>;
    const to: Record<Id, unknown> = {};
    for (const rec of Object.values(from)) {
      const r = remap(rec, keys);
      to[r.id as string] = r;
    }
    (out as unknown as Record<string, unknown>)[table] = to;
  }
  out.changes = (src.changes ?? []).map((c) => ({ ...c, id: newId(), entityId: map.get(c.entityId) ?? c.entityId }));
  return { data: out, idMap: map };
}
