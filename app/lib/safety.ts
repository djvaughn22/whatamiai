// Shared safety pipeline for free-text and high-stakes content.
// Deterministic matching may trigger a notice, but is never presented as
// diagnosis or understanding. Three levels keep the response proportionate:
//   immediate — emergency framing first, before anything else
//   concern   — calm category-specific support ahead of the reflection
//   mention   — informational reference; no interruption
// When something at concern level or above matches, the UI shows help
// resources instead of (or ahead of) the normal reflection output. This
// tool must never respond to a safety concern with reflection prompts alone.

export type SafetyKind = "self" | "danger" | "abuse" | "medical" | "crisis" | "legal" | "financial";
export type SafetyLevel = "immediate" | "concern" | "mention";
export type SafetyHit = { kind: SafetyKind; level: SafetyLevel };

const CHECKS: { kind: SafetyKind; re: RegExp }[] = [
  {
    kind: "self",
    re: /\b(suicid\w*|kill(ing)? myself|end(ing)? (it all|my life)|self[- ]?harm|hurt(ing)? myself|cutting myself|don'?t want to (live|be here|wake up)|no reason to live|better off dead|want to die)\b/i,
  },
  {
    kind: "danger",
    re: /\b(not safe|in danger|going to hurt (me|us)|kill (me|us|him|her|them|someone)|hurt (someone|him|her|them)|threatens? (me|us|to)|threatening (me|us)|has a (gun|knife|weapon))\b/i,
  },
  {
    kind: "abuse",
    re: /\b(abus(e|ed|es|ive|ing)|hits? me|hitting me|beat(s|ing)? me|molest\w*|assault\w*|rap(e|ed|ing)\b)\b/i,
  },
  {
    kind: "medical",
    re: /\b(chest pain|can'?t breathe|overdos\w*|seizure|stroke symptoms?)\b/i,
  },
  {
    kind: "crisis",
    re: /\b(panic attacks?|nervous breakdown|mental breakdown|can'?t stop crying|can'?t (cope|function|take (it|this) anymore)|falling apart)\b/i,
  },
  {
    kind: "legal",
    re: /\b(arrested|warrant out|lawsuit|being sued|suing (me|us)|court date|probation|parole|deport(ation|ed)|custody battle|restraining order|going to jail|prison time|criminal charges?|dui\b|felony)\b/i,
  },
  {
    kind: "financial",
    re: /\b(can'?t (pay|make|afford) (rent|the rent|the mortgage|the bills|my bills)|behind on (rent|the mortgage|bills|payments)|eviction|evicted|foreclos\w*|bankrupt\w*|repossess\w*|shut(ting)? off (the )?(power|electric|electricity|water|utilities)|debt collector|wage garnish\w*|no money for (food|groceries))\b/i,
  },
];

/** Distinguish talking ABOUT a topic from being in it. */
const INFORMATIONAL = /\b(awareness|prevention (month|week|program)|documentary|podcast about|article (about|on)|news (story|about)|statistics|research(ing)? (about|on)|history of|hotline number for a friend)\b/i;

/** Signs the matched concern is happening now. */
const IMMEDIATE = /\b(right now|tonight|about to|as we speak|happening now|going to (kill|hurt|end))\b/i;

export function assessSafety(text: string): SafetyHit | null {
  if (!text) return null;
  for (const c of CHECKS) {
    if (!c.re.test(text)) continue;
    if (INFORMATIONAL.test(text)) return { kind: c.kind, level: "mention" };
    if (c.kind === "medical" || IMMEDIATE.test(text)) return { kind: c.kind, level: "immediate" };
    if (c.kind === "danger") return { kind: c.kind, level: "immediate" };
    return { kind: c.kind, level: "concern" };
  }
  return null;
}

const LEVEL_RANK: Record<SafetyLevel, number> = { immediate: 3, concern: 2, mention: 1 };

/** Scan several texts at once; the most serious hit wins. */
export function assessSafetyAll(texts: string[]): SafetyHit | null {
  let best: SafetyHit | null = null;
  for (const t of texts) {
    const h = assessSafety(t);
    if (h && (!best || LEVEL_RANK[h.level] > LEVEL_RANK[best.level])) best = h;
  }
  return best;
}

/**
 * Back-compatible single-kind check: returns the kind only when it is
 * worth interrupting for (concern or immediate — never a bare mention).
 */
export function checkSafety(text: string): SafetyKind | null {
  const h = assessSafety(text);
  return h && h.level !== "mention" ? h.kind : null;
}

/** Scan every free-text answer at once. */
export function checkSafetyAll(texts: string[]): SafetyKind | null {
  const h = assessSafetyAll(texts);
  return h && h.level !== "mention" ? h.kind : null;
}

export const IMMEDIATE_LEAD =
  "This sounds like it may be happening right now. If so, call 911 (or your local emergency number) before anything else on this page.";

export const SAFETY_COPY: Record<SafetyKind, { lead: string; lines: string[] }> = {
  self: {
    lead: "Some of what you wrote sounds heavier than a reflection tool should carry alone.",
    lines: [
      "If you are thinking about harming yourself, call or text 988 (Suicide & Crisis Lifeline, US) — it's free and answered by real people, 24/7.",
      "You can also text HOME to 741741 (Crisis Text Line).",
      "If you are in immediate danger, call 911.",
      "Tell one person who can be physically with you. You don't have to explain everything — \"I'm not okay and I don't want to be alone right now\" is enough.",
    ],
  },
  danger: {
    lead: "It sounds like safety may be at risk. That comes before any reflection.",
    lines: [
      "If you or someone else is in immediate danger, call 911 now.",
      "If it isn't safe to call, text 911 where available, or text HOME to 741741.",
      "Get somewhere safe and tell a person who can be physically present with you.",
    ],
  },
  abuse: {
    lead: "What you described may involve abuse. That is not yours to fix with a reflection exercise, and it is not your fault.",
    lines: [
      "National Domestic Violence Hotline (US): call 1-800-799-7233 or text START to 88788, 24/7 and confidential.",
      "If you are in immediate danger, call 911.",
      "Do not confront a person who hurts you on your own because a website suggested honesty. Talk with a professional or advocate first — they will help you do this safely.",
      "Childhelp Hotline (US), if a child is involved: 1-800-422-4453.",
    ],
  },
  medical: {
    lead: "Part of what you wrote sounds like it could be a medical emergency.",
    lines: [
      "If this is happening now, call 911 or go to the nearest emergency room.",
      "A website cannot assess symptoms. A licensed healthcare professional can — please contact one.",
    ],
  },
  crisis: {
    lead: "Some of what you wrote sounds like more than everyday stress — it sounds like a crisis moment.",
    lines: [
      "Call or text 988 (Suicide & Crisis Lifeline, US) — it's for any mental-health crisis, not only thoughts of self-harm, and it's answered 24/7.",
      "You can also text HOME to 741741 (Crisis Text Line).",
      "A licensed counselor or therapist is the right kind of ongoing help for what you described — a reflection tool is not.",
      "If you can, tell one steady person near you what's happening today.",
    ],
  },
  legal: {
    lead: "Part of what you described sounds like a legal matter.",
    lines: [
      "A licensed attorney is the right person for this — many offer free first consultations.",
      "If cost is the barrier: LawHelp.org lists free legal-aid programs by state, and dialing 211 can point to local services.",
      "Nothing on this site is legal advice.",
    ],
  },
  financial: {
    lead: "Part of what you described sounds like a financial emergency — that deserves real help, not just reflection.",
    lines: [
      "Dial 211 (United Way) for free local help with rent, utilities, food, and assistance programs.",
      "The NFCC at 1-800-388-2227 connects you with nonprofit credit counselors, free or nearly free.",
      "For foreclosure, bankruptcy, or a debt-collection lawsuit, a licensed attorney or a HUD-approved housing counselor is the right help.",
    ],
  },
};
