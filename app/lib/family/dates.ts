// Genealogy dates: "about 1918", "bef 1861", "Mar 1942", "1900-1905", "1910s",
// and GEDCOM phrases (ABT, BEF, AFT, BET ... AND ..., FROM ... TO ...).
// The text a person typed is always kept; the parsed parts are for sorting,
// overlap checks and export.

import type { FuzzyDate } from "./types";

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const GED_MONTHS = MONTHS.map((m) => m.toUpperCase());
const SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** How far "about" reaches either side, in years. */
export const ABOUT_YEARS = 2;

type Core = { y: number; m?: number; d?: number };

function monthOf(word: string): number | undefined {
  const w = word.toLowerCase().replace(/\.$/, "");
  if (w === "sept") return 9;
  const i = MONTHS.findIndex((m) => w.startsWith(m) && (w.length === 3 || "january february march april may june july august september october november december".includes(w)));
  return i >= 0 ? i + 1 : undefined;
}

function validYear(y: number) {
  return Number.isInteger(y) && y >= 1000 && y <= 2100;
}

function validCore(c: Core | undefined): Core | undefined {
  if (!c || !validYear(c.y)) return undefined;
  if (c.m !== undefined && (c.m < 1 || c.m > 12)) return undefined;
  if (c.d !== undefined && (c.d < 1 || c.d > 31 || c.m === undefined)) return undefined;
  return c;
}

/** One calendar date with no qualifier. */
function parseCore(raw: string): Core | undefined {
  const s = raw.trim().replace(/,/g, " ").replace(/\s+/g, " ");
  let m: RegExpMatchArray | null;
  if ((m = s.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/))) return validCore({ y: +m[1], m: +m[2], d: m[3] ? +m[3] : undefined });
  if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) return validCore({ y: +m[3], m: +m[1], d: +m[2] });
  if ((m = s.match(/^(\d{1,2})\/(\d{4})$/))) return validCore({ y: +m[2], m: +m[1] });
  if ((m = s.match(/^(\d{1,2}) ([a-z.]+) (\d{4})$/i))) {
    const mo = monthOf(m[2]);
    return mo ? validCore({ y: +m[3], m: mo, d: +m[1] }) : undefined;
  }
  if ((m = s.match(/^([a-z.]+) (\d{1,2}) (\d{4})$/i))) {
    const mo = monthOf(m[1]);
    return mo ? validCore({ y: +m[3], m: mo, d: +m[2] }) : undefined;
  }
  if ((m = s.match(/^([a-z.]+) (\d{4})$/i))) {
    const mo = monthOf(m[1]);
    return mo ? validCore({ y: +m[2], m: mo }) : undefined;
  }
  if ((m = s.match(/^(\d{4})$/))) return validCore({ y: +m[1] });
  return undefined;
}

/** Parse what a person typed or a GEDCOM DATE value. Returns undefined for blank input.
 *  Unreadable text becomes kind "unknown" with the text kept. */
export function parseDate(input: string | undefined | null): FuzzyDate | undefined {
  if (input == null) return undefined;
  const text = String(input).trim();
  if (!text) return undefined;
  let s = text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/^int\s+(.+?)\s*\(.*\)$/, "$1") // GEDCOM interpreted date
    .replace(/\(.*\)$/, "")
    .trim();
  if (/^(unknown|unk\.?|\?+|n\/a|not known)$/.test(s)) return { kind: "unknown", text };

  let about = false;
  if (s.endsWith("?")) {
    about = true;
    s = s.slice(0, -1).trim();
  }

  let m: RegExpMatchArray | null;
  // between / from-to / ranges
  if ((m = s.match(/^(?:bet\.?|between|from)\s+(.+?)\s+(?:and|to|-|–|—)\s+(.+)$/)) || (m = s.match(/^(\d{4}(?:[-/ ][a-z0-9]+)*?)\s*(?:–|—|\bto\b)\s*(.+)$/))) {
    const a = parseCore(m[1]);
    let b = parseCore(m[2]);
    if (a && !b && /^\d{2}$/.test(m[2].trim())) b = { y: Math.floor(a.y / 100) * 100 + +m[2].trim() };
    if (a && b) return { kind: "between", y: a.y, m: a.m, d: a.d, y2: b.y, m2: b.m, d2: b.d, text };
  }
  if ((m = s.match(/^(\d{4})\s*-\s*(\d{2}|\d{4})$/))) {
    const y1 = +m[1];
    const y2 = m[2].length === 2 ? Math.floor(y1 / 100) * 100 + +m[2] : +m[2];
    if (validYear(y1) && validYear(y2) && y2 > y1) return { kind: "between", y: y1, y2, text };
  }
  if ((m = s.match(/^(\d{3})0'?s$/))) {
    const y = +m[1] * 10;
    if (validYear(y)) return { kind: "between", y, y2: y + 9, text };
  }
  if ((m = s.match(/^(?:from)\s+(.+)$/))) {
    const c = parseCore(m[1]);
    if (c) return { kind: "after", ...c, text };
  }
  if ((m = s.match(/^(?:to)\s+(.+)$/))) {
    const c = parseCore(m[1]);
    if (c) return { kind: "before", ...c, text };
  }
  if ((m = s.match(/^(?:bef\.?|before|by)\s+(.+)$/))) {
    const c = parseCore(m[1]);
    if (c) return { kind: "before", ...c, text };
  }
  if ((m = s.match(/^(?:aft\.?|after)\s+(.+)$/))) {
    const c = parseCore(m[1]);
    if (c) return { kind: "after", ...c, text };
  }
  if ((m = s.match(/^(?:abt\.?|about|approx\.?|approximately|around|circa|ca\.?|c\.|c|~|est\.?|estimated|cal\.?|calculated)\s*(.+)$/))) {
    const c = parseCore(m[1]);
    if (c) return { kind: "about", ...c, text };
  }
  const c = parseCore(s);
  if (c) return { kind: about ? "about" : "exact", ...c, text };
  return { kind: "unknown", text };
}

function coreText(y?: number, m?: number, d?: number): string {
  if (y === undefined) return "";
  if (m && d) return `${d} ${SHORT[m - 1]} ${y}`;
  if (m) return `${SHORT[m - 1]} ${y}`;
  return String(y);
}

/** Plain reading form: "about 1918", "12 Mar 1942", "1900–1905". */
export function formatDate(fd: FuzzyDate | undefined): string {
  if (!fd) return "";
  switch (fd.kind) {
    case "exact":
      return coreText(fd.y, fd.m, fd.d);
    case "about":
      return `about ${coreText(fd.y, fd.m, fd.d)}`;
    case "before":
      return `before ${coreText(fd.y, fd.m, fd.d)}`;
    case "after":
      return `after ${coreText(fd.y, fd.m, fd.d)}`;
    case "between":
      if (!fd.m && !fd.m2) return `${fd.y}–${fd.y2}`;
      return `between ${coreText(fd.y, fd.m, fd.d)} and ${coreText(fd.y2, fd.m2, fd.d2)}`;
    default:
      return fd.text || "date unknown";
  }
}

function coreRange(y: number, m?: number, d?: number): [number, number] {
  if (m && d) {
    const v = y + (m - 1) / 12 + (d - 1) / 366;
    return [v, v + 1 / 366];
  }
  if (m) return [y + (m - 1) / 12, y + m / 12];
  return [y, y + 1];
}

/** The span of time a date could mean, in decimal years [from, to). */
export function dateRange(fd: FuzzyDate | undefined): [number, number] | undefined {
  if (!fd || fd.y === undefined || fd.kind === "unknown") return undefined;
  const [lo, hi] = coreRange(fd.y, fd.m, fd.d);
  switch (fd.kind) {
    case "exact":
      return [lo, hi];
    case "about":
      return [lo - ABOUT_YEARS, hi + ABOUT_YEARS];
    case "before":
      return [lo - 100, lo];
    case "after":
      return [hi, hi + 100];
    case "between": {
      const [, hi2] = coreRange(fd.y2 ?? fd.y, fd.m2, fd.d2);
      return [lo, Math.max(hi, hi2)];
    }
  }
  return undefined;
}

/** A number for ordering events. Undated sorts last. */
export function sortKey(fd: FuzzyDate | undefined): number {
  if (!fd || fd.y === undefined || fd.kind === "unknown") return Number.POSITIVE_INFINITY;
  const [lo, hi] = coreRange(fd.y, fd.m, fd.d);
  if (fd.kind === "before") return lo - 0.001;
  if (fd.kind === "after") return hi;
  if (fd.kind === "between") {
    const r = dateRange(fd)!;
    return (r[0] + r[1]) / 2;
  }
  return (lo + hi) / 2;
}

/** Could these two dates describe the same moment? */
export function datesCompatible(a: FuzzyDate | undefined, b: FuzzyDate | undefined): boolean {
  const ra = dateRange(a);
  const rb = dateRange(b);
  if (!ra || !rb) return true;
  return ra[0] < rb[1] && rb[0] < ra[1];
}

/** The year to print in a short life span like "1918–1994". */
export function displayYear(fd: FuzzyDate | undefined): string {
  if (!fd || fd.y === undefined || fd.kind === "unknown") return "";
  if (fd.kind === "about") return `c.${fd.y}`;
  if (fd.kind === "before") return `bef.${fd.y}`;
  if (fd.kind === "after") return `aft.${fd.y}`;
  if (fd.kind === "between") return `${fd.y}–${fd.y2}`;
  return String(fd.y);
}

/** GEDCOM 5.5.1 DATE value. */
export function toGedcomDate(fd: FuzzyDate | undefined): string {
  if (!fd) return "";
  const core = (y?: number, m?: number, d?: number) => {
    if (y === undefined) return "";
    if (m && d) return `${d} ${GED_MONTHS[m - 1]} ${y}`;
    if (m) return `${GED_MONTHS[m - 1]} ${y}`;
    return String(y);
  };
  switch (fd.kind) {
    case "exact":
      return core(fd.y, fd.m, fd.d);
    case "about":
      return `ABT ${core(fd.y, fd.m, fd.d)}`;
    case "before":
      return `BEF ${core(fd.y, fd.m, fd.d)}`;
    case "after":
      return `AFT ${core(fd.y, fd.m, fd.d)}`;
    case "between":
      return `BET ${core(fd.y, fd.m, fd.d)} AND ${core(fd.y2, fd.m2, fd.d2)}`;
    default:
      return fd.text ? `(${fd.text.replace(/[()]/g, "")})` : "";
  }
}

/** Age at an event, from a birth date. "22", "about 22", "21–23", or "". */
export function ageAt(birth: FuzzyDate | undefined, at: FuzzyDate | undefined): string {
  const b = dateRange(birth);
  const e = dateRange(at);
  if (!b || !e) return "";
  const lo = Math.max(0, Math.floor(e[0] - b[1]));
  const hi = Math.max(0, Math.floor(e[1] - b[0]));
  if (lo === hi) return String(lo);
  if (hi - lo === 1) return `${lo} or ${hi}`;
  if (hi - lo <= 4) return `about ${Math.round((lo + hi) / 2)}`;
  return `${lo}–${hi}`;
}

export function todayIso(now = new Date()): string {
  return now.toISOString();
}
