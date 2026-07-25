// Shared types for the WhatAmIAI modes.
// Every result is a Reflection: a titled list of sections. Since
// Reflection Engine 2.0, sections can carry a semantic `kind` and typed
// payloads (evidence-backed observations, cautious interpretations,
// experiments) so exporters and snapshots never guess meaning from
// headings. All 2.0 fields are OPTIONAL — reflections saved before the
// upgrade have none of them and must keep rendering unchanged.

export type Mode = "mirror" | "situation" | "patterns" | "money" | "habits" | "react" | "phone" | "combined";

export const MODE_LABEL: Record<Mode, string> = {
  mirror: "My AI Mirror",
  situation: "My Situation",
  patterns: "My Overall Patterns",
  money: "Money Check",
  habits: "7-Day Habit Starter",
  react: "How Do I React?",
  phone: "Intentional Phone Use",
  combined: "Combined view",
};

/** Semantic purpose of a section. Unknown values are treated as "custom". */
export type SectionKind =
  | "facts"
  | "observations"
  | "interpretations"
  | "challenge"
  | "experiment"
  | "plan"
  | "questions"
  | "resources"
  | "safety"
  | "summary"
  | "custom";

export const SECTION_KINDS: SectionKind[] = [
  "facts", "observations", "interpretations", "challenge", "experiment",
  "plan", "questions", "resources", "safety", "summary", "custom",
];

/**
 * One thing the user actually said or selected during the session.
 * `statement` is user-facing; ids are internal plumbing and must never
 * be rendered.
 */
export type Evidence = {
  id: string;
  statement: string;
  sourceQuestionId?: string;
  sourcePrompt?: string;
  sourceAnswer?: string;
  /** exact figures or free-written answers the export can leave out */
  sensitive?: "financial" | "written";
  /** wording used instead of `statement` when sensitive detail is excluded */
  redactedStatement?: string;
};

export type ObservationConfidence = "direct" | "plausible" | "tentative";
export type InterpretationConfidence = "plausible" | "tentative" | "speculative";

/** User-facing confidence wording — text, never color alone. */
export const CONFIDENCE_LABEL: Record<ObservationConfidence | InterpretationConfidence, string> = {
  direct: "Directly supported by your answers",
  plausible: "A plausible pattern",
  tentative: "A tentative possibility",
  speculative: "A speculative possibility",
};

/** A cautious cross-answer observation, traceable to evidence. */
export type Observation = {
  id: string;
  statement: string;
  evidenceIds: string[];
  confidence: ObservationConfidence;
};

/**
 * One possible reading — never a verdict. Substantial interpretations
 * carry an alternative explanation and/or a question that could
 * disconfirm them.
 */
export type Interpretation = {
  id: string;
  possibility: string;
  evidenceIds: string[];
  confidence: InterpretationConfidence;
  alternative?: string;
  checkQuestion?: string;
};

/** A small evidence-gathering experiment, not a prescription. */
export type Experiment = {
  title: string;
  action: string;
  rationale: string;
  duration: string;
  observe: string[];
  minimumVersion?: string;
  busyVersion?: string;
  permissionToAdjust?: string;
};

export type Section = {
  heading: string;
  kind?: SectionKind;
  paragraphs?: string[];
  bullets?: string[];
  /** quieter closing line under the section */
  note?: string;
  observations?: Observation[];
  interpretations?: Interpretation[];
  experiment?: Experiment;
};

export type Reflection = {
  id: string;
  mode: Mode;
  title: string;
  createdAt: number;
  sections: Section[];
  /** evidence pool referenced by observations/interpretations */
  evidence?: Evidence[];
  /** set when a safety concern was detected in the answers */
  safetyFlagged?: boolean;
  /** absent = pre-2.0 reflection */
  schemaVersion?: number;
  /** small structured facts kept only for the combined view */
  meta?: Record<string, string | string[] | number | boolean>;
};

export const REFLECTION_SCHEMA_VERSION = 2;

/** Look up evidence statements for a set of ids, skipping unknown ids. */
export function evidenceFor(r: Reflection, ids: string[]): Evidence[] {
  const pool = r.evidence ?? [];
  return ids.map((id) => pool.find((e) => e.id === id)).filter((e): e is Evidence => !!e);
}

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
