// Local-first storage. Everything stays in this browser.
//
// Privacy rules (do not weaken):
// - Pasted AI prompts (Mirror mode) live in sessionStorage only — gone when
//   the tab closes — unless the user explicitly saves the *analysis*.
// - Situation/Patterns drafts autosave to localStorage so a refresh never
//   destroys an in-progress reflection.
// - Nothing here is ever sent to a server, logged, or put in a URL.

import type { Mode, Reflection, Section } from "./types";
import { MODE_LABEL, SECTION_KINDS } from "./types";

const SAVED_KEY = "wai3-saved-v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ---- tolerant reader ----
// Old saves (pre-2.0) have no `kind`, `evidence`, or typed payloads and
// must render unchanged. Unknown section kinds become "custom"; malformed
// entries are dropped instead of crashing the page. Never rewrites storage.

function normalizeSection(raw: unknown): Section | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  if (typeof s.heading !== "string") return null;
  const out: Section = { heading: s.heading };
  if (typeof s.kind === "string") out.kind = (SECTION_KINDS as string[]).includes(s.kind) ? (s.kind as Section["kind"]) : "custom";
  if (Array.isArray(s.paragraphs)) out.paragraphs = s.paragraphs.filter((p): p is string => typeof p === "string");
  if (Array.isArray(s.bullets)) out.bullets = s.bullets.filter((b): b is string => typeof b === "string");
  if (typeof s.note === "string") out.note = s.note;
  if (Array.isArray(s.observations)) out.observations = s.observations as Section["observations"];
  if (Array.isArray(s.interpretations)) out.interpretations = s.interpretations as Section["interpretations"];
  if (s.experiment && typeof s.experiment === "object") out.experiment = s.experiment as Section["experiment"];
  return out;
}

export function normalizeReflection(raw: unknown): Reflection | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || typeof r.title !== "string" || !Array.isArray(r.sections)) return null;
  const mode: Mode = typeof r.mode === "string" && r.mode in MODE_LABEL ? (r.mode as Mode) : "combined";
  const sections = r.sections.map(normalizeSection).filter((s): s is Section => !!s);
  if (!sections.length) return null;
  const out: Reflection = {
    id: r.id,
    mode,
    title: r.title,
    createdAt: typeof r.createdAt === "number" ? r.createdAt : Date.now(),
    sections,
  };
  if (Array.isArray(r.evidence)) out.evidence = r.evidence as Reflection["evidence"];
  if (typeof r.safetyFlagged === "boolean") out.safetyFlagged = r.safetyFlagged;
  if (typeof r.schemaVersion === "number") out.schemaVersion = r.schemaVersion;
  if (r.meta && typeof r.meta === "object") out.meta = r.meta as Reflection["meta"];
  return out;
}

// ---- saved reflections ----

export function listSaved(): Reflection[] {
  if (typeof window === "undefined") return [];
  const raw = safeParse<unknown>(localStorage.getItem(SAVED_KEY), []);
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeReflection).filter((r): r is Reflection => !!r);
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
