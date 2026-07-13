// Shared types for the three WhatAmIAI modes.
// Every result is a Reflection: a titled list of plain-text sections.
// Engines compose sections; the UI, storage, and exporters never need to
// know which mode produced them.

export type Mode = "mirror" | "situation" | "patterns" | "money" | "habits" | "combined";

export const MODE_LABEL: Record<Mode, string> = {
  mirror: "My AI Mirror",
  situation: "My Situation",
  patterns: "My Overall Patterns",
  money: "Money Check",
  habits: "7-Day Starter",
  combined: "Combined view",
};

export type Section = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  /** quieter closing line under the section */
  note?: string;
};

export type Reflection = {
  id: string;
  mode: Mode;
  title: string;
  createdAt: number;
  sections: Section[];
  /** set when a safety concern was detected in the answers */
  safetyFlagged?: boolean;
  /** small structured facts kept only for the combined view */
  meta?: Record<string, string | string[] | number | boolean>;
};

/** One answer is a string (text/choice) or string[] (chips). */
export type Answers = Record<string, string | string[]>;

export type Question = {
  id: string;
  /** short area label shown above the question, e.g. "The facts" */
  area: string;
  label: string;
  help?: string;
  kind: "choice" | "chips" | "text";
  options?: string[];
  maxChips?: number;
  placeholder?: string;
  /** hide the question unless this returns true */
  showIf?: (a: Answers) => boolean;
};

export function answerText(a: Answers, id: string): string {
  const v = a[id];
  if (Array.isArray(v)) return v.join(", ");
  return (v ?? "").trim();
}

export function has(a: Answers, id: string): boolean {
  return answerText(a, id).length > 0;
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
