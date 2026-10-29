// Backup, restore, and erase for everything WhatAmIAI keeps in this browser.
// Data lives in localStorage only, so clearing browser data or switching
// phones loses it — a backup file is the one way to carry it over.
//
// Rules:
// - KEPT_KEYS must list every localStorage key the app writes. Erase and
//   backup both read it, so a missing key means "erase" leaves data behind.
// - Restore never deletes or overwrites: saved reflections merge by id, and
//   other items are only filled in where this browser has none.
// - Pasted Mirror prompts (sessionStorage) are never in a backup.

import { normalizeReflection } from "./storage";

export const SAVED_KEY = "wai3-saved-v1";
export const KEPT_KEYS = [
  SAVED_KEY,
  "wai-habit-streak-v1",
  "wai-phone-plan-v1",
  "wai-react-v1",
  "wai-money-draft-v1",
  "wai3-patterns-draft",
  "wai3-situation-draft",
] as const;
const SESSION_KEYS = ["wai3-mirror-session"];

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type Backup = { app: "whatamiai"; version: 1; exportedAt: string; items: Record<string, unknown> };

export function buildBackup(store: Store, now = new Date()): Backup {
  const items: Record<string, unknown> = {};
  for (const k of KEPT_KEYS) {
    const raw = store.getItem(k);
    if (raw == null) continue;
    try {
      items[k] = JSON.parse(raw);
    } catch {
      // unreadable entry — leave it out rather than export garbage
    }
  }
  return { app: "whatamiai", version: 1, exportedAt: now.toISOString(), items };
}

export function countKept(store: Store): number {
  return KEPT_KEYS.filter((k) => store.getItem(k) != null).length;
}

export type RestoreResult = { ok: true; added: number; filled: string[]; skipped: string[] } | { ok: false; error: string };

export function restoreBackup(store: Store, text: string): RestoreResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file isn't a WhatAmIAI backup (it couldn't be read)." };
  }
  const b = data as Partial<Backup> | null;
  if (!b || b.app !== "whatamiai" || !b.items || typeof b.items !== "object") {
    return { ok: false, error: "That file isn't a WhatAmIAI backup." };
  }
  let added = 0;
  const filled: string[] = [];
  const skipped: string[] = [];
  for (const k of KEPT_KEYS) {
    if (!(k in b.items)) continue;
    const incoming = (b.items as Record<string, unknown>)[k];
    if (k === SAVED_KEY) {
      if (!Array.isArray(incoming)) continue;
      let current: unknown[] = [];
      try {
        const parsed = JSON.parse(store.getItem(k) ?? "[]");
        if (Array.isArray(parsed)) current = parsed;
      } catch {}
      const have = new Set(current.map((r) => (r as { id?: unknown })?.id));
      const fresh = incoming.filter((r) => normalizeReflection(r) && !have.has((r as { id: string }).id));
      if (fresh.length) {
        store.setItem(k, JSON.stringify([...current, ...fresh]));
        added += fresh.length;
      }
      continue;
    }
    if (store.getItem(k) != null) skipped.push(k);
    else {
      store.setItem(k, JSON.stringify(incoming));
      filled.push(k);
    }
  }
  return { ok: true, added, filled, skipped };
}

export function eraseAll(store: Store, session?: Store): void {
  for (const k of KEPT_KEYS) store.removeItem(k);
  if (session) for (const k of SESSION_KEYS) session.removeItem(k);
}

export const KEY_LABEL: Record<string, string> = {
  "wai-habit-streak-v1": "habit streak",
  "wai-phone-plan-v1": "phone week",
  "wai-react-v1": "How Do I React? picks",
  "wai-money-draft-v1": "Money Check numbers",
  "wai3-patterns-draft": "Patterns answers in progress",
  "wai3-situation-draft": "Situation answers in progress",
};
