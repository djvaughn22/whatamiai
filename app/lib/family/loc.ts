// Library of Congress, Chronicling America: digitized U.S. newspaper pages,
// 1770–1963. The loc.gov JSON API needs no key and allows cross-site
// requests, so the search runs from the visitor's own browser: WhatAmIAI's
// server never sees what anyone searches for.
//
// The Library asks API users to stay under 20 requests a minute (more gets a
// one-hour block): https://www.loc.gov/apis/json-and-yaml/working-within-limits/
// This client allows 8 searches a minute per tab and caches repeats.
// The Library's search can take from a few seconds to over a minute; the
// screen says so, offers Cancel, and links the same search on loc.gov.
// A hit means the words appear on a page. It is NOT a match to a person until
// someone reads the page and decides.

import { stateName } from "./places";

export interface NewspaperHit {
  id: string;
  /** "St. Louis Palladium (St. Louis, Mo.)" */
  paper: string;
  /** ISO date of the issue */
  date: string;
  page?: number;
  city?: string;
  state?: string;
  url: string;
  thumb?: string;
  snippet?: string;
}

export interface NewspaperQuery {
  text: string;
  /** two-letter US state code */
  state?: string;
  from?: number;
  to?: number;
  page?: number;
}

export interface NewspaperResult {
  hits: NewspaperHit[];
  total: number;
  page: number;
  pages: number;
}

export class LocLimitError extends Error {
  constructor(public waitSeconds: number) {
    super(`Please wait about ${waitSeconds} seconds before searching again.`);
  }
}

const PER_PAGE = 20;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;
const recent: number[] = [];
const cache = new Map<string, NewspaperResult>();

export function newspaperUrl(q: NewspaperQuery, json = true): string {
  const params = new URLSearchParams();
  params.set("q", q.text.trim());
  if (q.from || q.to) params.set("dates", `${q.from ?? 1770}/${q.to ?? 1963}`);
  if (q.state) params.set("fa", `location_state:${stateName(q.state).toLowerCase()}`);
  if (json) {
    params.set("fo", "json");
    params.set("c", String(PER_PAGE));
    // only the two parts we read: about 50 KB instead of about 2 MB
    params.set("at", "results,pagination");
  }
  if (q.page && q.page > 1) params.set("sp", String(q.page));
  return `https://www.loc.gov/collections/chronicling-america/?${params.toString()}`;
}

function titleCase(s: string): string {
  return s.replace(/\b([a-z])([a-z']*)/g, (_, a: string, b: string) => a.toUpperCase() + b).replace(/\b(Of|The|And|In|On|At)\b/g, (w, _x, i: number) => (i === 0 ? w : w.toLowerCase()));
}

function snippetOf(text: string | undefined, terms: string[]): string | undefined {
  if (!text) return undefined;
  const flat = text.replace(/\s+/g, " ");
  const lower = flat.toLowerCase();
  let at = -1;
  for (const t of terms) {
    const i = lower.indexOf(t.toLowerCase());
    if (i >= 0 && (at < 0 || i < at)) at = i;
  }
  if (at < 0) return undefined;
  const start = Math.max(0, at - 90);
  const end = Math.min(flat.length, at + 140);
  return `${start > 0 ? "…" : ""}${flat.slice(start, end).trim()}${end < flat.length ? "…" : ""}`;
}

type LocItem = {
  id?: string;
  url?: string;
  date?: string;
  partof_title?: string[];
  location_city?: string[];
  location_state?: string[];
  image_url?: string[];
  description?: string[];
  number_page?: string[];
  page_id?: string;
};

export function parseLocResponse(json: unknown, q: NewspaperQuery): NewspaperResult {
  const d = json as { results?: LocItem[]; pagination?: { total?: number; of?: number; current?: number } };
  const terms = q.text
    .replace(/["']/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
  const hits: NewspaperHit[] = (d.results ?? [])
    .filter((r) => r.url && r.date)
    .map((r) => ({
      id: r.page_id ?? r.id ?? r.url!,
      paper: titleCase((r.partof_title?.[0] ?? "Newspaper").replace(/\s+\d{4}-[\d?]{2,4}$/, "")),
      date: r.date!,
      page: r.number_page?.[0] ? Number(r.number_page[0]) : undefined,
      city: r.location_city?.[0] ? titleCase(r.location_city[0]) : undefined,
      state: r.location_state?.[0] ? titleCase(r.location_state[0]) : undefined,
      url: r.url!.replace(/^http:/, "https:"),
      thumb: r.image_url?.find((u) => u.includes("pct:6.25")) ?? r.image_url?.[0],
      snippet: snippetOf(r.description?.join(" "), terms),
    }));
  const total = d.pagination?.of ?? hits.length;
  return { hits, total, page: d.pagination?.current ?? q.page ?? 1, pages: Math.max(1, Math.ceil(total / PER_PAGE)) };
}

export async function searchNewspapers(q: NewspaperQuery, fetchImpl: typeof fetch = fetch, now = Date.now(), signal?: AbortSignal): Promise<NewspaperResult> {
  if (!q.text.trim()) return { hits: [], total: 0, page: 1, pages: 1 };
  const url = newspaperUrl(q);
  const cached = cache.get(url);
  if (cached) return cached;
  while (recent.length && now - recent[0] > WINDOW_MS) recent.shift();
  if (recent.length >= MAX_PER_WINDOW) throw new LocLimitError(Math.ceil((WINDOW_MS - (now - recent[0])) / 1000));
  recent.push(now);
  const res = await fetchImpl(url, { headers: { Accept: "application/json" }, signal });
  if (res.status === 429) throw new LocLimitError(60);
  if (!res.ok) throw new Error(`The Library of Congress search didn't answer (status ${res.status}). Try again in a minute.`);
  const type = res.headers.get("content-type") ?? "";
  if (!type.includes("json")) throw new Error("The Library of Congress asked for a pause (it sometimes shows a check page). Try again in a few minutes.");
  const result = parseLocResponse(await res.json(), q);
  cache.set(url, result);
  return result;
}

/** For tests. */
export function resetLocLimiter() {
  recent.length = 0;
  cache.clear();
}
