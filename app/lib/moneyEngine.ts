// Money Check — three numbers, three taps, then the real math.
// Deterministic, all local: margin per month and per day, essentials and
// debt share, a named money pattern, one blind spot, one 7-day move.
// If the math says underwater, it says so plainly — structural problem,
// not a willpower failure — and points at real help.

import type { Evidence, Reflection, Section } from "./types";
import { newId, REFLECTION_SCHEMA_VERSION } from "./types";

export type MoneyInputs = {
  income: number; // monthly take-home
  essentials: number; // rent/mortgage, utilities, groceries, transport, insurance
  debt: number; // monthly debt payments (cards, loans, not the mortgage above)
  stress: string;
  track: string;
  surprise: string;
};

export const MONEY_STRESS = [
  "It disappears and I don't know where",
  "Debt",
  "Not enough coming in",
  "Impulse spending",
  "Money fights at home",
  "No plan — just vibes",
];

export const MONEY_TRACK = ["Yes, roughly to the dollar", "The big stuff, yes", "Honestly, no"];

export const MONEY_SURPRISE = [
  "Covered from savings",
  "It goes on a credit card",
  "I'd borrow from someone",
  "It would sink the month",
];

type MoneyPattern = {
  emoji: string;
  name: string;
  read: string[];
  blindspot: string;
  step: string;
};

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

function detectPattern(m: MoneyInputs): MoneyPattern {
  const margin = m.income - m.essentials - m.debt;
  const debtPct = m.income > 0 ? (m.debt / m.income) * 100 : 0;
  const noCushion = m.surprise !== "Covered from savings";

  if (m.income <= 0 || margin < 0)
    return {
      emoji: "🌊",
      name: "The Underwater Month",
      read: [
        `Your numbers say the month costs more than it brings in${m.income > 0 ? ` — about ${money(-margin)} more` : ""}. Hear this first: that is a structural problem, not a willpower problem. No amount of skipping coffee closes a gap between rent and a paycheck.`,
        "Structural problems have structural moves: raising income, renegotiating the big fixed costs (housing, car, debt terms), or getting real help with both. Small-purchase guilt is a distraction at this depth — put it down.",
      ],
      blindspot: "One possibility worth checking: shame keeps many people in this position silent, and silent people don't reach the help that actually exists. Running the numbers at all was the opposite of avoidance.",
      step: "Two calls this week: dial 211 (United Way — free, local help with bills, housing, and assistance programs) and the NFCC at 1-800-388-2227 (nonprofit credit counseling, free or nearly free). Fifteen minutes each. That's the whole assignment.",
    };

  if (debtPct >= 25)
    return {
      emoji: "⚓",
      name: "The Debt Drag",
      read: [
        `About ${Math.round(debtPct)}% of your take-home — ${money(m.debt)} a month — leaves before you get a vote. That's the drag: you're not bad with money, you're hauling an anchor with it.`,
        "The good news about debt as the main problem: it's the most solvable one on this page. Debt has math, math has endings, and every payment from here on can be aimed instead of scattered.",
      ],
      blindspot: "Minimum payments are designed to feel like progress while mostly buying time. If you've been paying minimums faithfully and the balances barely move, that's the design working — on you.",
      step: "This week, list every debt: balance, rate, minimum. Then pick a target — smallest balance (snowball, fastest win) or highest rate (avalanche, cheapest) — and send it every spare dollar while the rest get minimums. One target. The list itself takes 20 minutes.",
    };

  if (m.track === "Honestly, no" || m.stress === "It disappears and I don't know where")
    return {
      emoji: "🌫️",
      name: "The Fog",
      read: [
        `Here's what your numbers say: about ${money(margin)} a month should be left over after essentials and debt — roughly ${money(margin / 30)} a day. And here's what you said: you don't really know where it goes. That gap between should and did is the fog.`,
        "The fog isn't a character flaw — nobody can steer what they can't see, and modern money is deliberately frictionless and invisible. The fix isn't discipline. It's visibility. Discipline comes almost free once you can see.",
      ],
      blindspot: "You may believe you have a spending problem when you actually have a seeing problem. Most people who start tracking find one or two specific leaks — not a hundred small sins — and the guilt they'd been carrying was aimed at the wrong things.",
      step: "For 7 days, write down every dollar that leaves — a note on your phone is plenty, ten seconds a purchase. Don't change anything yet. Don't budget yet. Just watch. Day 8, read the list once; the leak usually introduces itself.",
    };

  if (noCushion)
    return {
      emoji: "🎪",
      name: "The No-Cushion Tightrope",
      read: [
        `Your month actually works — about ${money(margin)} clears after essentials and debt. But you said a $500 surprise would go on ${m.surprise === "It goes on a credit card" ? "a credit card" : m.surprise === "I'd borrow from someone" ? "borrowed money" : "the rocks — it would sink the month"}. That means the whole act runs without a net, and life supplies surprises on a schedule.`,
        "This is the most fixable pattern on this page, because the margin already exists. It just doesn't have a job, so surprises hire it first — at credit-card interest.",
      ],
      blindspot: "\"I'll save what's left over\" is the trap — left over is precisely the money that vanishes. Savings that aren't automatic aren't savings; they're intentions.",
      step: `This week, set an automatic transfer of ${money(Math.max(25, Math.min(margin * 0.25, 200)))} on payday into a separate savings account you don't carry a card for. First goal: $500. At your margin that's reachable, and the day you hit it, surprises stop being emergencies.`,
    };

  if (m.stress === "Impulse spending")
    return {
      emoji: "🪣",
      name: "The Leaky Bucket",
      read: [
        `The structure is sound — about ${money(margin)} a month of real margin — but you named the leak yourself: impulse. Impulse spending isn't a math problem, it's a friction problem. Every store spent millions making the yes instant; nobody's spending anything making it slow.`,
        "So the fix isn't shame or a stricter budget. It's re-adding the friction the sellers removed.",
      ],
      blindspot: "Impulse buys are usually buying a feeling — a break, a lift, a small rebellion — and the feeling is legitimate even when the purchase isn't. Find what the impulse is actually shopping for and it loses most of its budget.",
      step: "Three friction moves this week: delete stored cards from your browser and favorite apps; move spending apps off your home screen; adopt the 24-hour rule — anything unplanned over $20 goes on a list, and if you still want it tomorrow, buy it guilt-free. You'll buy about a third of the list.",
    };

  if (m.stress === "Money fights at home")
    return {
      emoji: "🥊",
      name: "The Two-Ledger House",
      read: [
        "Your numbers hold up — so the recurring fight may not really be the math. One common possibility when money fights repeat despite workable numbers: two honest ledgers colliding in one checking account — one person spends for security and one for joy, or one tracks and one trusts.",
        "That would explain why the fights repeat: each round argues a purchase, but the disagreement underneath is about what money is for — a question that never gets asked at receipt-discovery volume.",
      ],
      blindspot: "One possibility worth checking: what goes unsaid between fights — quiet purchases, rounded-down confessions, small hidings that feel like peacekeeping — may be costing more than the purchases themselves.",
      step: "Book a 15-minute money meeting this week — coffee, calendar, no ambush. One rule: no blame for anything already spent; the past is amnestied. One agenda: “What should our money do next month?” Fifteen minutes, ends on time, repeats weekly. Boring meetings prevent loud fights.",
    };

  return {
    emoji: "🌱",
    name: "The Quiet Surplus",
    read: [
      `Real talk: your numbers are better than you may feel they are. About ${money(margin)} a month clears after essentials and debt, you have a cushion for surprises, and you mostly know where things go. That's not luck — that's a working system.`,
      "The risk at this stage isn't disaster; it's drift. Surplus without a destination gets quietly absorbed — lifestyle inflates one upgrade at a time until the margin is gone with nothing to show for it.",
    ],
    blindspot: "\"Doing fine\" is where money plans go to nap. The question that wakes it up: what is this surplus for? A number with a name — the house fund, the debt-free date, the giving goal — outperforms a vague sense of being okay.",
    step: `Give ${money(margin)} a job this week. Split it on paper — so much to savings, so much to extra debt payment, so much to giving, so much to living — and automate the first piece on payday. Money with a name doesn't drift.`,
  };
}

/** 2.0 companions per pattern: competing reading + check + experiment framing. */
const MONEY_EXTRAS: Record<string, { alternative: string; check: string; observe: string[]; minimum: string }> = {
  "The Underwater Month": {
    alternative: "One atypical month — a repair, a job gap, an annual bill — can also produce these numbers. If most months look like this one, the structural read stands.",
    check: "Was this month a typical one?",
    observe: ["What each call actually offered", "Which fixed cost turned out most movable"],
    minimum: "One call instead of two — 211 first.",
  },
  "The Debt Drag": {
    alternative: "If the balances are recent or the rates are low, the drag may be temporary rather than structural — the list will show which.",
    check: "Do the balances actually move month to month?",
    observe: ["The full list: balance, rate, minimum for each debt", "How the total compares to what you assumed"],
    minimum: "List just the balances — rates can wait a day.",
  },
  "The Fog": {
    alternative: "The gap between should-be-left and is-left can also be a categorization problem — irregular expenses that never made it into 'essentials'.",
    check: "Did anything irregular hit this month that the numbers don't show?",
    observe: ["Where the money actually went, line by line", "Whether one or two specific leaks account for most of the gap"],
    minimum: "Track just today.",
  },
  "The No-Cushion Tightrope": {
    alternative: "Savings may exist that these three numbers never asked about — the surprise answer, not the math, drove this read.",
    check: "Is there money somewhere this check didn't count?",
    observe: ["Whether the transfer actually ran on payday", "How it felt to not touch it"],
    minimum: "Open the separate account this week; fund it next payday.",
  },
  "The Leaky Bucket": {
    alternative: "What reads as impulse can be under-planned regular needs — if the same 'impulse' repeats monthly, it may belong in the budget, not on the guilt list.",
    check: "Do the impulse buys repeat, or are they truly one-offs?",
    observe: ["How many list items you still wanted after 24 hours", "What the impulse moments had in common"],
    minimum: "Just the 24-hour rule — skip the other two moves.",
  },
  "The Two-Ledger House": {
    alternative: "Sometimes the fight really is the dollars — if the margin is thinner than it looks, no meeting about meaning fixes math.",
    check: "Would both of you describe the disagreement the same way?",
    observe: ["Whether the meeting happened and ended on time", "What surfaced that receipt-moments never surface"],
    minimum: "Book the meeting; even 5 minutes counts as run.",
  },
  "The Quiet Surplus": {
    alternative: "Numbers this clean can also reflect a snapshot month — annual and irregular costs may be hiding outside it.",
    check: "Does the margin survive December and car-repair months?",
    observe: ["Whether the split got written down", "Whether the first automated piece actually ran"],
    minimum: "Name one job for the margin — automation can wait a week.",
  },
};

export function composeMoneyResult(m: MoneyInputs): Reflection {
  const margin = m.income - m.essentials - m.debt;
  const essPct = m.income > 0 ? Math.round((m.essentials / m.income) * 100) : 0;
  const debtPct = m.income > 0 ? Math.round((m.debt / m.income) * 100) : 0;
  const marginPct = m.income > 0 ? Math.round((margin / m.income) * 100) : 0;
  const p = detectPattern(m);
  const x = MONEY_EXTRAS[p.name] ?? MONEY_EXTRAS["The Fog"];
  const sections: Section[] = [];

  // ---- evidence: the calculations, separated from any interpretation ----
  const evidence: Evidence[] = [
    { id: "ev-income", statement: `Take-home, as you entered it: ${money(m.income)} a month`, sourceQuestionId: "income", sourceAnswer: String(m.income), sensitive: "financial", redactedStatement: "Take-home: entered (exact amount kept private)" },
    { id: "ev-essentials", statement: `Essentials, as you entered them: ${money(m.essentials)} (${essPct}% of take-home)`, sourceQuestionId: "essentials", sourceAnswer: String(m.essentials), sensitive: "financial", redactedStatement: `Essentials: about ${essPct}% of take-home` },
    { id: "ev-debt", statement: `Debt payments, as you entered them: ${money(m.debt)} (${debtPct}% of take-home)`, sourceQuestionId: "debt", sourceAnswer: String(m.debt), sensitive: "financial", redactedStatement: `Debt payments: about ${debtPct}% of take-home` },
    {
      id: "ev-margin",
      statement: margin >= 0 ? `Calculated: ${money(margin)} a month left over on paper — about ${money(margin / 30)} a day` : `Calculated: short ${money(-margin)} each month`,
      sensitive: "financial",
      redactedStatement: margin >= 0 ? `Calculated margin: about ${marginPct}% of take-home` : "Calculated: the month costs more than it brings in",
    },
    { id: "ev-stress", statement: `Biggest money stress — you selected: ${m.stress.toLowerCase()}`, sourceQuestionId: "stress", sourceAnswer: m.stress },
    { id: "ev-track", statement: `Do you know where last month went — you selected: ${m.track.toLowerCase()}`, sourceQuestionId: "track", sourceAnswer: m.track },
    { id: "ev-surprise", statement: `A $500 surprise this week — you selected: ${m.surprise.toLowerCase()}`, sourceQuestionId: "surprise", sourceAnswer: m.surprise },
  ];

  sections.push({
    heading: "Your numbers, plainly",
    kind: "facts",
    note: "The math and your three taps, nothing else. A common guideline puts essentials near 50% of take-home — a reference point, not a rule, and high-rent areas break it routinely.",
  });

  sections.push({
    heading: `A shape this could fit: ${p.name}`,
    kind: "interpretations",
    paragraphs: p.read,
    interpretations: [
      {
        id: "int-money",
        possibility: `this picture may fit “${p.name}” — see the read above.`,
        evidenceIds: ["ev-margin", "ev-stress", "ev-track", "ev-surprise"],
        confidence: "plausible",
        alternative: x.alternative,
        checkQuestion: x.check,
      },
    ],
    note: "A possible shape of the money situation — not a judgment of you, and the numbers stay separate from it above.",
  });

  sections.push({
    heading: "A possibility to check",
    kind: "interpretations",
    interpretations: [{ id: "int-money-check", possibility: p.blindspot, evidenceIds: ["ev-stress", "ev-track"], confidence: "tentative", checkQuestion: "If this doesn't fit, what's the more accurate description?" }],
    note: "Only you know whether it fits.",
  });

  sections.push({
    heading: "What might challenge this reading",
    kind: "challenge",
    bullets: [
      "Irregular expenses — car repairs, annual bills, gifts — may be missing from these essentials.",
      "This month may not be a typical month.",
      "Bill timing can make a monthly margin look better or worse than it is.",
      "Three numbers can't say whether the pressure sits in income, expenses, debt, or simply incomplete data.",
    ],
  });

  sections.push({
    heading: "A 7-day experiment",
    kind: "experiment",
    experiment: {
      title: "One money move for the next 7 days",
      action: p.step,
      rationale: `It follows from your own inputs — you selected “${m.stress.toLowerCase()}” as the biggest stress, and the math above says ${margin >= 0 ? `about ${money(margin)} clears the month on paper` : "the month runs short"}.`,
      duration: "7 days",
      observe: x.observe,
      minimumVersion: x.minimum,
      permissionToAdjust: "If the week goes sideways, run the minimum version and call it done — the experiment exists to produce information, not a grade.",
    },
  });

  sections.push({
    heading: "What this is — and isn't",
    kind: "resources",
    paragraphs: [
      "This mode is a reflection and learning tool, not individualized financial advice. Four numbers and three taps can suggest a shape; they can't see your whole financial life.",
      "For serious debt, foreclosure, bankruptcy, tax, investing, or legal questions, the right help is a licensed professional: the free nonprofit counselors at NFCC (1-800-388-2227), a HUD-approved housing counselor, or an attorney.",
    ],
  });

  return {
    id: newId(),
    mode: "money",
    title: `Money Check — ${p.name.toLowerCase()}`,
    createdAt: Date.now(),
    sections,
    evidence,
    schemaVersion: REFLECTION_SCHEMA_VERSION,
    meta: { pattern: p.name, patternEmoji: p.emoji, margin: Math.round(margin) },
  };
}
