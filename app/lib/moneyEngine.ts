// Money Check — three numbers, three taps, then the real math.
// Deterministic, all local: margin per month and per day, essentials and
// debt share, a named money pattern, one blind spot, one 7-day move.
// If the math says underwater, it says so plainly — structural problem,
// not a willpower failure — and points at real help.

import type { Reflection, Section } from "./types";
import { newId } from "./types";

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
      blindspot: "Shame. It keeps people underwater silent, and silent people don't ask for the help that actually exists. You did the brave thing by running the numbers at all.",
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
        "Your numbers hold up — the fight isn't really the math. When money fights recur at home, it's almost never dollars versus dollars; it's meaning versus meaning. One of you spends for security, one for joy, or one tracks and one trusts — two honest ledgers, colliding in one checking account.",
        "That's why the fights repeat: each round argues a purchase, but the disagreement is about what money is for. That question never gets asked at receipt-discovery volume.",
      ],
      blindspot: "The most expensive thing in a two-ledger house is what goes unsaid between fights — quiet purchases, rounded-down confessions, small hidings that feel like peacekeeping. They're loans against trust, and that interest rate is brutal.",
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

export function composeMoneyResult(m: MoneyInputs): Reflection {
  const margin = m.income - m.essentials - m.debt;
  const essPct = m.income > 0 ? Math.round((m.essentials / m.income) * 100) : 0;
  const debtPct = m.income > 0 ? Math.round((m.debt / m.income) * 100) : 0;
  const p = detectPattern(m);
  const sections: Section[] = [];

  const numbers: string[] = [
    `Take-home: ${money(m.income)} a month`,
    `Essentials: ${money(m.essentials)} (${essPct}% of take-home)`,
    `Debt payments: ${money(m.debt)} (${debtPct}%)`,
    margin >= 0
      ? `Left over on paper: ${money(margin)} a month — about ${money(margin / 30)} a day`
      : `Short each month: ${money(-margin)}`,
  ];
  sections.push({
    heading: "Your numbers, plainly",
    bullets: numbers,
    note: "A common guideline puts essentials near 50% of take-home — a reference point, not a rule, and high-rent areas break it routinely.",
  });

  sections.push({
    heading: "The read",
    paragraphs: p.read,
    note: "This names the shape of the money situation — not your character.",
  });

  sections.push({ heading: "The blind spot to check", paragraphs: [p.blindspot], note: "Only you know whether it fits." });
  sections.push({ heading: "One money move for the next 7 days", paragraphs: [p.step] });

  sections.push({
    heading: "What this is — and isn't",
    paragraphs: [
      "Four numbers and three taps can find a pattern; they can't see your whole financial life. This isn't financial advice — for debt strategy, taxes, or investing, a real professional (or the free nonprofit counselors at NFCC, 1-800-388-2227) beats any tool.",
    ],
  });

  return {
    id: newId(),
    mode: "money",
    title: `Money Check — ${p.name.toLowerCase()}`,
    createdAt: Date.now(),
    sections,
    meta: { pattern: p.name, patternEmoji: p.emoji, margin: Math.round(margin) },
  };
}
