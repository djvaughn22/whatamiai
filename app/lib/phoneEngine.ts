// More Intentional Phone Use — a 7-day starter. Not a detox: pick the one
// type of phone use you want less of, then seven small daily experiments.
// The plan text is the owner's copy, verbatim. Progress lives in
// localStorage only, like every other mode.

import type { Evidence, Reflection } from "./types";
import { newId, REFLECTION_SCHEMA_VERSION } from "./types";

export const PHONE_FOCUS_OPTIONS = [
  "Social scrolling",
  "Repeated checking",
  "Late-night use",
  "Phone during time with people",
];

export type PhoneDay = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
  note?: string;
};

export const PHONE_DAYS: PhoneDay[] = [
  {
    title: "Day 1 — Observe",
    paragraphs: ["Open Screen Time or Digital Wellbeing. Write down:"],
    bullets: [
      "total screen time",
      "your two most-used apps",
      "one time of day when phone use felt least intentional",
    ],
    note: "The number is information, not a score.",
  },
  {
    title: "Day 2 — Remove one interruption",
    paragraphs: [
      "Silence notifications from one app that regularly pulls you in.",
      "Keep calls, direct messages, and anything genuinely important to you.",
    ],
  },
  {
    title: "Day 3 — Add one pause",
    paragraphs: [
      "Move the most distracting app off your home screen.",
      "Before opening it, ask: “Did I choose this, or did I arrive here automatically?”",
    ],
    note: "You do not have to stop. Just notice.",
  },
  {
    title: "Day 4 — Protect one moment",
    paragraphs: [
      "Choose one short phone-free period: a meal, a walk, a conversation, the first 30 minutes after work, or the final 30 minutes before sleep.",
      "Put the phone somewhere you cannot reach without standing up.",
    ],
  },
  {
    title: "Day 5 — Test the environment",
    paragraphs: [
      "Try grayscale, an app limit, Focus Mode, or logging out of one distracting app.",
      "Choose only one. The goal is to learn which type of friction helps you.",
    ],
  },
  {
    title: "Day 6 — Plan the replacement",
    paragraphs: [
      "Pick one realistic thing to do during the time you normally reach for the phone. It could be talking to someone, reading, walking, praying, resting, listening to music, working on a project, or simply doing nothing for a few minutes.",
      "The replacement should be something you genuinely want—not something that merely sounds productive.",
    ],
  },
  {
    title: "Day 7 — Review",
    paragraphs: ["Compare today with Day 1. Ask:"],
    bullets: [
      "Which phone use felt worthwhile?",
      "Which use felt automatic?",
      "What changed when I added friction?",
      "Did reduced phone time improve anything that matters to me?",
    ],
    note: "Choose one rule to keep for another week.",
  },
];

export const PHONE_PRINCIPLES = [
  {
    title: "Make the experiment small enough to repeat",
    text: "A small boundary used consistently may teach you more than an ambitious restriction you abandon.",
  },
  {
    title: "Do not treat one difficult day as evidence of failure",
    text: "Resume the experiment the next day without punishment or doubling the work.",
  },
];

export const PHONE_POSSIBILITY = [
  "One possibility is that your phone is not the main problem but the easiest available response to boredom, stress, avoidance, or unstructured time.",
  "Another possibility is that the phone is mostly useful and only one or two patterns need changing.",
];

export const PHONE_NEXT_QUESTION = {
  lead: "The next question is not simply, “How do I lower the number?” It is:",
  question: "“What kind of phone use do I want less of, and what do I want that time or attention to serve instead?”",
};

export const PHONE_REFLECTION_QUESTIONS = [
  "Which phone use would you be disappointed to lose?",
  "Which phone use rarely feels worth it afterward?",
  "What tends to happen immediately before you begin scrolling?",
  "What part of your day would feel most improved by a phone boundary?",
  "Would you rather reduce total use, reduce interruptions, improve sleep, or become more intentional?",
];

// ---- local plan progress ----
// 2.0 adds OPTIONAL capture fields (Day 1 numbers, desired outcome,
// replacement, per-day notes, Day 7 comparison). All additive: plans saved
// before the upgrade keep loading, and nothing is required.

export type PhonePlan = {
  focus: string;
  done: number[];
  startedAt: number;
  /** optional captures — never required */
  day1Total?: string;
  day1Apps?: string;
  outcome?: string;
  keepUse?: string;
  replacement?: string;
  notes?: Record<number, string>;
  day7?: string;
};

export const PHONE_OUTCOMES = ["Sleep", "Attention", "Relationships", "Work", "Prayer", "Rest"];

const PLAN_KEY = "wai-phone-plan-v1";

export function loadPhonePlan(): PhonePlan | null {
  if (typeof window === "undefined") return null;
  try {
    const p = JSON.parse(localStorage.getItem(PLAN_KEY) ?? "");
    if (p && typeof p.focus === "string" && Array.isArray(p.done)) return p as PhonePlan;
  } catch {}
  return null;
}

export function startPhonePlan(focus: string): PhonePlan {
  const p: PhonePlan = { focus, done: [], startedAt: Date.now() };
  localStorage.setItem(PLAN_KEY, JSON.stringify(p));
  return p;
}

export function togglePhoneDay(plan: PhonePlan, dayIndex: number): PhonePlan {
  const done = plan.done.includes(dayIndex)
    ? plan.done.filter((d) => d !== dayIndex)
    : [...plan.done, dayIndex];
  const p: PhonePlan = { ...plan, done };
  localStorage.setItem(PLAN_KEY, JSON.stringify(p));
  return p;
}

export function updatePhonePlan(plan: PhonePlan, patch: Partial<PhonePlan>): PhonePlan {
  const p: PhonePlan = { ...plan, ...patch };
  localStorage.setItem(PLAN_KEY, JSON.stringify(p));
  return p;
}

export function clearPhonePlan(): void {
  localStorage.removeItem(PLAN_KEY);
}

// ---- Reflection snapshot (shared save/export/AI, behind the same UI) ----

export function composePhoneReflection(plan: PhonePlan): Reflection {
  const doneCount = plan.done.length;
  const evidence: Evidence[] = [
    { id: "ev-focus", statement: `The phone use you chose to reduce — you selected: ${plan.focus.toLowerCase()}`, sourceAnswer: plan.focus },
    { id: "ev-days", statement: `Days marked done so far: ${doneCount} of ${PHONE_DAYS.length}` },
  ];
  const opt = (id: string, label: string, v?: string) => {
    if (v?.trim()) evidence.push({ id, statement: `${label} — in your words: “${v.trim()}”`, sourceAnswer: v.trim(), sensitive: "written", redactedStatement: `${label} (kept private)` });
  };
  if (plan.outcome) evidence.push({ id: "ev-outcome", statement: `What you want the reclaimed time to serve — you selected: ${plan.outcome.toLowerCase()}`, sourceAnswer: plan.outcome });
  opt("ev-day1-total", "Day 1 screen-time number", plan.day1Total);
  opt("ev-day1-apps", "Day 1 two most-used apps", plan.day1Apps);
  opt("ev-keep", "Phone use worth keeping", plan.keepUse);
  opt("ev-replace", "The replacement you picked", plan.replacement);
  opt("ev-day7", "Day 7, compared with Day 1", plan.day7);
  const noteCount = Object.values(plan.notes ?? {}).filter((n) => n.trim()).length;
  if (noteCount) evidence.push({ id: "ev-notes", statement: `You added ${noteCount} daily note${noteCount === 1 ? "" : "s"} along the way` });

  const sections: Reflection["sections"] = [
    {
      heading: "What you selected",
      kind: "summary",
      paragraphs: [
        `You want to spend less time on your phone — specifically, less ${plan.focus.toLowerCase()}. ${doneCount} of ${PHONE_DAYS.length} days are marked done.`,
        "This plan does not assume that all screen time is harmful. Its purpose is to help you notice which phone use you choose and which phone use seems to happen automatically.",
      ],
    },
    { heading: "What you told it", kind: "facts", note: "Only what you selected or wrote — nothing inferred." },
    {
      heading: "The seven days",
      kind: "plan",
      bullets: PHONE_DAYS.map((d, i) => `${d.title}${plan.done.includes(i) ? " — done" : ""}`),
    },
    {
      heading: "The week, as an experiment",
      kind: "experiment",
      experiment: {
        title: "Seven small days",
        action: `One small experiment per day, aimed at less ${plan.focus.toLowerCase()} — observe, remove one interruption, add one pause, protect one moment, test friction, plan the replacement, review.`,
        rationale: plan.outcome
          ? `You chose ${plan.focus.toLowerCase()} as the one use to reduce, and said the reclaimed time should serve ${plan.outcome.toLowerCase()}.`
          : `You chose ${plan.focus.toLowerCase()} as the one use to reduce — the week is aimed at exactly that, not at all screen time.`,
        duration: "7 days",
        observe: ["Which phone use felt worthwhile", "Which use felt automatic", "What changed when you added friction"],
        busyVersion: "Protect one phone-free moment — that's the whole day.",
        minimumVersion: "Notice one automatic reach for the phone. Just notice.",
        permissionToAdjust: "Do not treat one difficult day as evidence of failure. Resume the experiment the next day without punishment or doubling the work.",
      },
    },
    {
      heading: "A possibility to examine",
      kind: "interpretations",
      interpretations: [
        {
          id: "int-phone",
          possibility: "your phone is not the main problem but the easiest available response to boredom, stress, avoidance, or unstructured time.",
          evidenceIds: ["ev-focus"],
          confidence: "tentative",
          alternative: "Another possibility is that the phone is mostly useful and only one or two patterns need changing.",
          checkQuestion: PHONE_NEXT_QUESTION.question,
        },
      ],
    },
    {
      heading: "What might challenge this reading",
      kind: "challenge",
      bullets: [
        "Total screen time may stay the same even if the quality or intentionality of use improves.",
        "One week may not establish a general pattern.",
        plan.outcome
          ? `You said this should serve ${plan.outcome.toLowerCase()} — the screen-time number may not measure that outcome at all.`
          : "The measured number may not represent the outcome that actually matters to you.",
        "The number is information, not a score.",
      ],
    },
    { heading: "Continue the reflection", kind: "questions", bullets: [...PHONE_REFLECTION_QUESTIONS] },
    {
      heading: "Two principles",
      kind: "custom",
      paragraphs: PHONE_PRINCIPLES.map((p) => `${p.title}: ${p.text.charAt(0).toLowerCase()}${p.text.slice(1)}`),
    },
  ];

  return {
    id: newId(),
    mode: "phone",
    title: `Intentional Phone Use — less ${plan.focus.toLowerCase()}`,
    createdAt: Date.now(),
    schemaVersion: REFLECTION_SCHEMA_VERSION,
    evidence,
    sections,
    meta: { focus: plan.focus, daysDone: doneCount, outcome: plan.outcome ?? "" },
  };
}
