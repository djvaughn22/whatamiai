// The earlier WhatAmIAI (seven reflection tools) kept its saves in this
// browser under these keys. The family-history version never reads or
// changes them, except when the visitor asks to download or erase them here.
// The download uses the earlier app's own backup format, so it can be
// restored into the archived app (branch archive/legacy-whatamiai).

export const LEGACY_KEYS = [
  "wai3-saved-v1",
  "wai-habit-streak-v1",
  "wai-phone-plan-v1",
  "wai-react-v1",
  "wai-money-draft-v1",
  "wai3-patterns-draft",
  "wai3-situation-draft",
] as const;
export const LEGACY_SESSION_KEYS = ["wai3-mirror-session"] as const;

type Store = Pick<Storage, "getItem" | "removeItem">;

export function legacyCount(store: Store): number {
  return LEGACY_KEYS.filter((k) => store.getItem(k) != null).length;
}

export function legacySavedCount(store: Store): number {
  try {
    const v = JSON.parse(store.getItem("wai3-saved-v1") ?? "[]");
    return Array.isArray(v) ? v.length : 0;
  } catch {
    return 0;
  }
}

export function legacyBackup(store: Store, now = new Date()) {
  const items: Record<string, unknown> = {};
  for (const k of LEGACY_KEYS) {
    const raw = store.getItem(k);
    if (raw == null) continue;
    try {
      items[k] = JSON.parse(raw);
    } catch {}
  }
  return { app: "whatamiai" as const, version: 1 as const, exportedAt: now.toISOString(), items };
}

export function legacyErase(store: Store, session?: Store): void {
  for (const k of LEGACY_KEYS) store.removeItem(k);
  if (session) for (const k of LEGACY_SESSION_KEYS) session.removeItem(k);
}
