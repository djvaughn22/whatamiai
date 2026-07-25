// Exports for a finished reflection: copy, Markdown, JSON, snapshot,
// print, and the ONE shared continue-with-an-AI builder used by every
// mode. Nothing is ever auto-sent anywhere, and no content goes into a
// URL. Snapshots and prompts read section KINDS, never heading regexes;
// a legacy fallback keeps pre-2.0 saves working.

import type { Evidence, Reflection, Section } from "./types";
import { CONFIDENCE_LABEL, MODE_LABEL } from "./types";

function dateStr(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

// ---- privacy options ----

export type ExportOptions = {
  /** include free-written answers verbatim (default true) */
  includeWritten?: boolean;
  /** include exact dollar figures (default true) */
  includeExactFigures?: boolean;
};

export function hasWrittenContent(r: Reflection): boolean {
  return (r.evidence ?? []).some((e) => e.sensitive === "written");
}

export function hasFinancialContent(r: Reflection): boolean {
  return (r.evidence ?? []).some((e) => e.sensitive === "financial");
}

/** User-facing list of what an AI export will contain — for the preview. */
export function exportCategories(r: Reflection): string[] {
  const cats: string[] = ["The ground rules for the AI (no diagnosing, no labels, judgment stays with you)"];
  if (r.evidence?.length) cats.push("Your selections and answers from this session");
  if (hasWrittenContent(r)) cats.push("Answers you typed in your own words");
  if (hasFinancialContent(r)) cats.push("The exact dollar amounts you entered");
  if (r.sections.some((s) => s.kind === "observations" || s.kind === "interpretations")) cats.push("The observations and possibilities, with their confidence levels");
  if (r.sections.some((s) => s.kind === "challenge")) cats.push("What might challenge this reading");
  if (r.sections.some((s) => s.kind === "experiment" || s.kind === "plan")) cats.push("The experiment or plan");
  if (r.sections.some((s) => s.kind === "questions")) cats.push("The open questions");
  if (!r.evidence?.length && cats.length === 1) cats.push("The reflection summary text");
  return cats;
}

// ---- redaction helpers ----

function scrubFigures(text: string): string {
  return text.replace(/\$[\d,]+(?:\.\d+)?/g, "[amount kept private]");
}

function scrubWritten(text: string, r: Reflection): string {
  let out = text;
  for (const e of r.evidence ?? []) {
    if (e.sensitive !== "written") continue;
    for (const v of [e.sourceAnswer, e.statement]) {
      if (v && v.length >= 3) out = out.split(v).join("[kept private]");
    }
  }
  return out;
}

function applyOptions(text: string, r: Reflection, opts?: ExportOptions): string {
  let out = text;
  if (opts?.includeExactFigures === false) out = scrubFigures(out);
  if (opts?.includeWritten === false) out = scrubWritten(out, r);
  return out;
}

function evidenceLine(e: Evidence, opts?: ExportOptions): string | null {
  if (opts?.includeWritten === false && e.sensitive === "written") return e.redactedStatement ?? null;
  if (opts?.includeExactFigures === false && e.sensitive === "financial") return e.redactedStatement ?? scrubFigures(e.statement);
  return e.statement;
}

// ---- shared section-to-text rendering ----

function sectionLines(r: Reflection, s: Section, opts?: ExportOptions): string[] {
  const lines: string[] = [];
  const pool = r.evidence ?? [];
  const ev = (ids: string[]) =>
    ids
      .map((id) => pool.find((e) => e.id === id))
      .filter((e): e is Evidence => !!e)
      .map((e) => evidenceLine(e, opts))
      .filter((l): l is string => !!l);

  if (s.kind === "facts" && pool.length) {
    for (const e of pool) {
      const l = evidenceLine(e, opts);
      if (l) lines.push(`- ${l}`);
    }
    if (s.note) lines.push(`(${s.note})`);
    return lines;
  }

  for (const p of s.paragraphs ?? []) lines.push(p);
  for (const b of s.bullets ?? []) lines.push(`- ${b}`);

  for (const o of s.observations ?? []) {
    lines.push(`- ${o.statement} [${CONFIDENCE_LABEL[o.confidence]}]`);
    const based = ev(o.evidenceIds);
    if (based.length) lines.push(`  (based on: ${based.join("; ")})`);
  }

  for (const i of s.interpretations ?? []) {
    lines.push(`- One possibility: ${i.possibility} [${CONFIDENCE_LABEL[i.confidence]}]`);
    const based = ev(i.evidenceIds);
    if (based.length) lines.push(`  (appeared because: ${based.join("; ")})`);
    if (i.alternative) lines.push(`  Another possibility: ${i.alternative}`);
    if (i.checkQuestion) lines.push(`  A question to test it: ${i.checkQuestion}`);
  }

  if (s.experiment) {
    const x = s.experiment;
    lines.push(`${x.title}: ${x.action}`);
    lines.push(`Why this connects: ${x.rationale}`);
    lines.push(`How long: ${x.duration}`);
    if (x.observe.length) lines.push(`What to observe: ${x.observe.join("; ")}`);
    if (x.busyVersion) lines.push(`Busy-day version: ${x.busyVersion}`);
    if (x.minimumVersion) lines.push(`Minimum version: ${x.minimumVersion}`);
    if (x.permissionToAdjust) lines.push(x.permissionToAdjust);
  }

  if (s.note && s.kind !== "facts") lines.push(`(${s.note})`);
  return lines;
}

export function toMarkdown(r: Reflection, opts?: ExportOptions): string {
  const lines: string[] = [`# ${r.title}`, "", `*${MODE_LABEL[r.mode]} — ${dateStr(r.createdAt)} — WhatAmIAI.com*`, ""];
  for (const s of r.sections) {
    lines.push(`## ${s.heading}`, "");
    for (const l of sectionLines(r, s, opts)) lines.push(l.startsWith("- ") ? l : l, "");
  }
  return applyOptions(lines.join("\n").replace(/\n{3,}/g, "\n\n"), r, opts);
}

export function toPlainText(r: Reflection, opts?: ExportOptions): string {
  const lines: string[] = [r.title, `${MODE_LABEL[r.mode]} — ${dateStr(r.createdAt)}`, ""];
  for (const s of r.sections) {
    lines.push(s.heading.toUpperCase(), "");
    for (const l of sectionLines(r, s, opts)) lines.push(l.replace(/^- /, "• "));
    lines.push("");
  }
  return applyOptions(lines.join("\n"), r, opts);
}

// ---- snapshot (typed, with legacy fallback) ----

function firstText(s: Section | undefined): string {
  if (!s) return "";
  if (s.paragraphs?.[0]) return s.paragraphs[0];
  if (s.bullets?.[0]) return s.bullets[0];
  if (s.observations?.[0]) return s.observations[0].statement;
  if (s.interpretations?.[0]) return `One possibility: ${s.interpretations[0].possibility}`;
  return "";
}

/** Short version for pasting into a text or email. Never auto-sent. */
export function toSnapshot(r: Reflection): string {
  const byKind = (k: Section["kind"]) => r.sections.find((s) => s.kind === k);

  const summarySection = byKind("summary") ?? r.sections[0];
  const summaryLine = firstText(summarySection);

  const expSection = byKind("experiment") ?? byKind("plan");
  let stepLine = expSection?.experiment?.action ?? firstText(expSection);
  if (!stepLine) {
    // legacy fallback for pre-2.0 reflections
    const legacy = r.sections.find((s) => /next step|experiment/i.test(s.heading));
    stepLine = legacy?.paragraphs?.[0] ?? legacy?.bullets?.[0] ?? "";
  }

  const qSection = byKind("questions");
  const questionLine = qSection?.bullets?.[0] ?? "";

  return [
    `${r.title} (${dateStr(r.createdAt)})`,
    r.safetyFlagged ? "A safety concern came up in this reflection — real support comes before any of the rest." : "",
    summaryLine,
    stepLine ? `Next: ${stepLine}` : "",
    questionLine ? `Worth asking: ${questionLine}` : "",
    "— from a private reflection on whatamiai.com",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function toJSONExport(r: Reflection): string {
  // meta is internal plumbing for the combined view; keep exports clean.
  const { meta: _meta, ...rest } = r;
  return JSON.stringify(rest, null, 2);
}

// ---- the ONE continue-with-an-AI builder ----

export const AI_GROUND_RULES = [
  "Do not diagnose me, label me, or assign me a personality type.",
  "Keep observations clearly separate from facts.",
  "Use \"one possibility\" rather than claiming to know the reason.",
  "Do not claim to know my motives, my mental health, or what I should do with my life.",
  "Ask clarifying questions before drawing conclusions.",
  "Challenge the reflection summary and my assumptions.",
  "Point out where the evidence is weak or incomplete.",
  "Recommend the appropriate real person for high-stakes issues.",
  "Keep the judgment calls with me.",
];

export const AI_OPENING_INSTRUCTION =
  "Begin with one or two high-value clarifying questions before extending the interpretation. Do not repeat a question I have already answered in the material below.";

export function toAIPrompt(r: Reflection, opts?: ExportOptions): string {
  return [
    `I completed a guided self-reflection (${MODE_LABEL[r.mode]} on whatamiai.com, ${dateStr(r.createdAt)}) and I'd like your help thinking it through further.`,
    "",
    "Ground rules for this conversation:",
    ...AI_GROUND_RULES.map((g) => `- ${g}`),
    "",
    AI_OPENING_INSTRUCTION,
    "",
    "Here is my reflection:",
    "",
    toPlainText(r, opts),
  ].join("\n");
}

// ---- download/copy helpers ----

export function downloadFile(filename: string, content: string, type = "text/plain"): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function safeFilename(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "reflection";
}
