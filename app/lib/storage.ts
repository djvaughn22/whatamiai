// Local-first storage. Everything stays in this browser.
//
// Privacy rules (do not weaken):
// - Pasted AI prompts (Mirror mode) live in sessionStorage only — gone when
//   the tab closes — unless the user explicitly saves the *analysis*.
// - Situation/Patterns drafts autosave to localStorage so a refresh never
//   destroys an in-progress reflection.
// - Nothing here is ever sent to a server, logged, or put in a URL.

import type { Reflection } from "./types";

const SAVED_KEY = "wai3-saved-v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ---- saved reflections ----

export function listSaved(): Reflection[] {
  if (typeof window === "undefined") return [];
  return safeParse<Reflection[]>(localStorage.getItem(SAVED_KEY), []);
}

export function saveReflection(r: Reflection): void {
  const all = listSaved().filter((x) => x.id !== r.id);
  all.unshift(r);
  localStorage.setItem(SAVED_KEY, JSON.stringify(all));
}

export function renameReflection(id: string, title: string): void {
  const all = listSaved().map((x) => (x.id === id ? { ...x, title } : x));
  localStorage.setItem(SAVED_KEY, JSON.stringify(all));
}

export function deleteReflection(id: string): void {
  const all = listSaved().filter((x) => x.id !== id);
  localStorage.setItem(SAVED_KEY, JSON.stringify(all));
}

export function clearAllSaved(): void {
  localStorage.removeItem(SAVED_KEY);
}

// ---- in-progress drafts ----

export function loadDraft<T>(key: string, session = false): T | null {
  if (typeof window === "undefined") return null;
  const store = session ? sessionStorage : localStorage;
  return safeParse<T | null>(store.getItem(key), null);
}

export function saveDraft<T>(key: string, value: T, session = false): void {
  if (typeof window === "undefined") return;
  const store = session ? sessionStorage : localStorage;
  store.setItem(key, JSON.stringify(value));
}

export function clearDraft(key: string, session = false): void {
  if (typeof window === "undefined") return;
  const store = session ? sessionStorage : localStorage;
  store.removeItem(key);
}
