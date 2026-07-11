// Safety detection for free-text answers.
// When something here matches, the UI shows calm, direct help resources
// instead of (or ahead of) the normal reflection output. This tool must
// never respond to a safety concern with reflection prompts alone.

export type SafetyKind = "self" | "danger" | "abuse" | "medical";

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
];

export function checkSafety(text: string): SafetyKind | null {
  if (!text) return null;
  for (const c of CHECKS) if (c.re.test(text)) return c.kind;
  return null;
}

/** Scan every free-text answer at once. */
export function checkSafetyAll(texts: string[]): SafetyKind | null {
  for (const t of texts) {
    const k = checkSafety(t);
    if (k) return k;
  }
  return null;
}

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
      "A website cannot assess symptoms. A doctor can — please contact one.",
    ],
  },
};
