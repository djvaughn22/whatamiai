// More Intentional Phone Use — a 7-day starter. Not a detox: pick the one
// type of phone use you want less of, then seven small daily experiments.
// The plan text is the owner's copy, verbatim. Progress lives in
// localStorage only, like every other mode.

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

export type PhonePlan = { focus: string; done: number[]; startedAt: number };
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

export function clearPhonePlan(): void {
  localStorage.removeItem(PLAN_KEY);
}
