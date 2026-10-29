// 7-Day Starter — exercise, diet, sleep, phone, water, quiet time.
// Three taps produce a day-by-day starter plan sized to where the person
// actually is, plus the known blind spot for their obstacle. A local
// streak tracker (current + best) gives a reason to come back daily.

import type { Evidence, Reflection, Section } from "./types";
import { newId, REFLECTION_SCHEMA_VERSION } from "./types";

export type HabitGoal = {
  id: string;
  emoji: string;
  label: string;
  levelQ: string;
  levels: string[]; // 3 levels: cold start / some / restarting
  /** plan[levelIndex] = 7 day-strings; {WHEN} is replaced with the time slot */
  plan: string[][];
  note?: string;
};

export const HABIT_GOALS: HabitGoal[] = [
  {
    id: "move",
    emoji: "🏃",
    label: "Move more",
    levelQ: "Where are you starting from?",
    levels: ["Pretty much zero right now", "I move some, not consistently", "I used to train — restarting"],
    plan: [
      [
        "Day 1 — {WHEN}: walk 10 minutes. Out five, back five. That's the whole workout.",
        "Day 2 — walk 10 minutes again, same slot. Same route is fine; boring is fine.",
        "Day 3 — walk 12 minutes. Add one song to the playlist.",
        "Day 4 — walk 12 minutes + 5 slow bodyweight squats when you get back.",
        "Day 5 — walk 15 minutes. Notice it's already easier than Day 1.",
        "Day 6 — walk 15 minutes + 10 squats + 5 wall push-ups.",
        "Day 7 — easiest day: 10-minute victory lap, then write down your Week 2 slot.",
      ],
      [
        "Day 1 — {WHEN}: 15-minute brisk walk. Brisk = you could talk, couldn't sing.",
        "Day 2 — 15 squats, 10 push-ups (knees fine), 30-second plank. Under 5 minutes total.",
        "Day 3 — 20-minute walk or easy bike. Conversational pace.",
        "Day 4 — two rounds of Day 2's circuit. Rest as needed between rounds.",
        "Day 5 — 20 minutes, your pick: walk, bike, dance in the kitchen. Moving counts.",
        "Day 6 — three rounds of the circuit, or one round harder. Your call.",
        "Day 7 — gentle 15-minute walk and pick your three fixed slots for next week.",
      ],
      [
        "Day 1 — {WHEN}: 20 minutes easy cardio. Deliberately below your ego. You're rebuilding the slot, not the PR.",
        "Day 2 — full-body basics, 2 light sets each: squat, push, pull or row, plank. Leave feeling underworked — that's correct.",
        "Day 3 — 25 minutes cardio, still conversational. The old you can wait a month.",
        "Day 4 — repeat Day 2, nudge one exercise up slightly.",
        "Day 5 — rest or a 15-minute walk. Restarting bodies earn rest days; injuries restart the restart.",
        "Day 6 — 30 minutes, any mode you enjoy. Enjoyment is a training variable.",
        "Day 7 — light session + write next week's three sessions in the calendar, with times.",
      ],
    ],
    note: "If you have a health condition or you've been fully sedentary a long while, a quick word with a doctor before ramping up is worth the call.",
  },
  {
    id: "eat",
    emoji: "🥦",
    label: "Eat better",
    levelQ: "How's the eating right now, honestly?",
    levels: ["Mostly takeout, snacks, and chaos", "Decent-ish with regular slip zones", "Fine mostly — one stubborn weak spot"],
    plan: [
      [
        "Day 1 — change nothing. Just write down everything you eat today. Data before discipline.",
        "Day 2 — add one real breakfast with protein (eggs, yogurt, whatever works). Change nothing else.",
        "Day 3 — drink water before every meal. Keep the breakfast.",
        "Day 4 — one home-assembled meal today. Assembled counts: rotisserie chicken + bagged salad is cooking.",
        "Day 5 — add one fruit or vegetable to whatever you were having anyway.",
        "Day 6 — grocery run with a 10-item list: 3 proteins, 3 vegetables, 2 fruits, 2 easy carbs.",
        "Day 7 — two home meals today, then look at Day 1's list and see how far a week moved you.",
      ],
      [
        "Day 1 — name your slip zone out loud: the time and place it goes sideways (3pm desk? 9pm couch?). Just name it.",
        "Day 2 — put a decent option physically inside the slip zone: protein bar in the desk, fruit on the counter.",
        "Day 3 — protein at breakfast and lunch. Full people make better 3pm decisions.",
        "Day 4 — the slip-zone swap: when the hour hits, eat the planted option first. Then anything else you still want.",
        "Day 5 — plan tomorrow's dinner at breakfast. One decision, moved to when you're strong.",
        "Day 6 — repeat the swap. Two wins in the zone is a pattern starting.",
        "Day 7 — review: which day felt easiest? Do more of exactly that next week.",
      ],
      [
        "Day 1 — write the weak spot down precisely: what, when, how much. Vague enemies don't lose.",
        "Day 2 — make it harder to reach: out of the house, top shelf, or not purchased at all. Friction beats willpower.",
        "Day 3 — find the need under it — break, comfort, reward? — and give that need a non-food answer once today.",
        "Day 4 — allow the thing, deliberately: a planned portion, sitting down, enjoyed. Planned isn't a slip.",
        "Day 5 — friction day again. Notice cravings peak and pass in about 10 minutes when you let them.",
        "Day 6 — repeat Day 3's swap. Twice is the start of a groove.",
        "Day 7 — write the new rule for this weak spot in one sentence. Rules beat re-deciding daily.",
      ],
    ],
    note: "This is habit-building, not a diet plan. For medical weight questions or an eating pattern that scares you, a doctor or dietitian is the real move — and worth it.",
  },
  {
    id: "sleep",
    emoji: "😴",
    label: "Sleep better",
    levelQ: "What's the sleep situation?",
    levels: ["Up too late every night, tired every day", "Inconsistent — good nights and 1am nights", "Fine falling asleep, awful getting up"],
    plan: [
      [
        "Day 1 — pick your target lights-out time. Just pick it and write it somewhere you'll see.",
        "Day 2 — set a 'start landing' alarm 45 minutes before that time. When it rings, no new episodes, no new scrolls.",
        "Day 3 — phone charges outside arm's reach tonight. Across the room counts. This is the big one.",
        "Day 4 — same, plus dim the house after the landing alarm. Bright rooms lie to your brain about the hour.",
        "Day 5 — in bed at target. Lie there bored if needed — boredom is the on-ramp.",
        "Day 6 — repeat. Same wake time tomorrow as weekdays, within an hour. Consistency outranks duration.",
        "Day 7 — count the wins, not the misses. Three good nights out of seven is a changed trajectory.",
      ],
      [
        "Day 1 — pick one lights-out time for all seven nights. The inconsistency is the injury; one time is the cast.",
        "Day 2 — anchor the morning instead: same wake time no matter how last night went. Mornings drag nights into line.",
        "Day 3 — landing alarm 45 minutes before lights-out. Screens down when it rings.",
        "Day 4 — the 1am-night autopsy: what usually keeps you up — a show, a scroll, a person, work? Name tonight's risk at dinner.",
        "Day 5 — pre-empt the named risk: episode earlier, phone parked, work shut down by a set hour.",
        "Day 6 — hold both anchors, wake time and lights-out. Two anchors is a schedule.",
        "Day 7 — look back: your best night this week — what made it work? That's your keystone for next week.",
      ],
      [
        "Day 1 — tonight, set the alarm for the same time you'll use all week — including the weekend. Yes, really.",
        "Day 2 — alarm goes across the room. Feet on floor to kill it. Standing is 80% of the battle.",
        "Day 3 — light within 5 minutes of waking: blinds open, step outside, brightest room. Light is the off switch for groggy.",
        "Day 4 — give the first 20 minutes a reason: coffee ritual, walk, music, quiet time. Mornings need a why.",
        "Day 5 — no snooze today. Snooze sleep is junk sleep; it costs more than it gives.",
        "Day 6 — weekend test: same alarm. Sleeping in past an hour un-sets the whole week's work.",
        "Day 7 — same wake, same light, same why. Seven mornings makes the alarm believable to your body.",
      ],
    ],
  },
  {
    id: "phone",
    emoji: "📵",
    label: "Less phone",
    levelQ: "How deep does the scroll go?",
    levels: ["Hours vanish daily and I feel it", "Specific danger zones — bed, bathroom, work", "Not huge, but it owns my idle moments"],
    plan: [
      [
        "Day 1 — just look: open Screen Time / Digital Wellbeing and write down the daily number. No judgment, just the number.",
        "Day 2 — kill non-human notifications: keep calls and real texts, silence every app that isn't a person.",
        "Day 3 — move the two hungriest apps off your home screen, into a folder on the last page.",
        "Day 4 — pick one no-phone hour today — a meal, a walk, first hour after work. Phone in another room, not pocket.",
        "Day 5 — grayscale day. Ugly apps are half as hungry. (Settings → Accessibility.)",
        "Day 6 — no-phone hour again, plus phone charges outside the bedroom tonight.",
        "Day 7 — check the number from Day 1. Any drop is a win; write the two rules you'll keep.",
      ],
      [
        "Day 1 — name your zones precisely: bed? bathroom? during dinner? at red lights? Write the top two.",
        "Day 2 — make zone #1 physically phone-free: charger outside the bedroom, phone stays in the car, whatever removes it from reach.",
        "Day 3 — give the zone a replacement: book on the nightstand, actual conversation at dinner. Empty hands relapse.",
        "Day 4 — defend zone #1 again. Two days makes it a policy, not a mood.",
        "Day 5 — start zone #2, same recipe: remove the phone, plant a replacement.",
        "Day 6 — hold both zones. Notice which was harder — that one's telling you something.",
        "Day 7 — keep the easier zone forever, keep working the harder one. Two clean zones changes a week.",
      ],
      [
        "Day 1 — count the reflex: every time you reach for the phone with no reason today, just notice. Tally if you're brave.",
        "Day 2 — waiting-room rule: idle moments under 5 minutes — line, elevator, kettle — get no phone. Just stand there. It's weirdly hard, then weirdly good.",
        "Day 3 — put one small analog thing where your idle hands go: a book in the bag, a notepad on the desk.",
        "Day 4 — waiting-room rule again, plus no phone for the first 15 minutes after waking.",
        "Day 5 — one full boring task — dishes, folding, a walk — with zero input. Boredom is where your brain files things.",
        "Day 6 — repeat the morning 15 and the idle rule. The reflex is already quieter — check it against Day 1.",
        "Day 7 — pick the one rule that gave you the most back and make it permanent.",
      ],
    ],
  },
  {
    id: "water",
    emoji: "💧",
    label: "Drink water",
    levelQ: "Current hydration, honestly?",
    levels: ["Basically coffee and vibes", "Some water, no system", "Decent, want it automatic"],
    plan: [
      [
        "Day 1 — get one bottle you actually like and fill it tonight for tomorrow. Equipment matters here.",
        "Day 2 — one full glass before the first coffee. Coffee stays; water just cuts the line.",
        "Day 3 — morning glass + the bottle goes wherever you go. Presence beats reminders.",
        "Day 4 — refill at lunch, whether or not it's empty. The refill is the habit.",
        "Day 5 — morning glass, lunch refill, plus a glass with dinner. Three anchors now.",
        "Day 6 — full day on the system: wake glass, bottle nearby, lunch refill, dinner glass.",
        "Day 7 — same again — notice the headache/energy difference a week makes. That's the sales pitch.",
      ],
      [
        "Day 1 — pick your bottle and your number: how many refills is a good day? Two is a fine answer.",
        "Day 2 — anchor #1: full glass on waking, before anything else.",
        "Day 3 — anchor #2: refill the bottle at lunch, every workday, same time.",
        "Day 4 — pair water to an existing habit: every coffee comes with a water chaser.",
        "Day 5 — all three anchors in one day.",
        "Day 6 — repeat. Miss one? Never miss the same anchor twice.",
        "Day 7 — count refills. Hit your number? Raise it by one next week. Didn't? Keep it and nail it.",
      ],
      [
        "Day 1 — automate the start: bottle filled the night before, on the nightstand or by the keys.",
        "Day 2 — anchor to fixed events, not feelings: wake, lunch, workout, dinner each trigger water.",
        "Day 3 — full anchor day. Thirst is a late signal; anchors don't wait for it.",
        "Day 4 — hydrate the gap: your driest stretch of the day (usually mid-afternoon) gets a planned glass.",
        "Day 5 — all anchors + gap glass. This is the complete system.",
        "Day 6 — run it again without thinking about it. Automatic is the goal, not heroic.",
        "Day 7 — system check: which anchor still needs a reminder? Tape a note there and you're done.",
      ],
    ],
  },
  {
    id: "quiet",
    emoji: "🙏",
    label: "Daily quiet time",
    levelQ: "Where's the quiet-time habit now?",
    levels: ["Doesn't exist yet", "On and off — busy weeks kill it", "Steady but shallow — want depth"],
    plan: [
      [
        "Day 1 — {WHEN}: two minutes. Sit down, phone elsewhere, be still. Two minutes, then done. Seriously, stop at two.",
        "Day 2 — two minutes again, same time and chair. The chair is learning too.",
        "Day 3 — three minutes. Add one sentence of gratitude or one verse — Psalm 23 never misses.",
        "Day 4 — three minutes. One thing you're grateful for, one thing you're carrying. Name both.",
        "Day 5 — five minutes. A short passage or prayer, then quiet. Restless is normal; stay seated.",
        "Day 6 — five minutes. Same seat, same slot — it should be starting to feel like yours.",
        "Day 7 — five minutes, plus one line in a note: what did a week of stillness change?",
      ],
      [
        "Day 1 — {WHEN}: re-open with five minutes today. No guilt about the gap — the habit isn't mad at you.",
        "Day 2 — attach it to something that already happens daily: with the first coffee, right after the alarm, at lunch. Busy weeks can't kill what's welded on.",
        "Day 3 — five minutes at the anchor. Have tomorrow's reading chosen tonight — deciding in the moment is where busy wins.",
        "Day 4 — the busy-day version: 90 seconds, one verse, one breath, one sentence of prayer. Design the minimum so zero stops being an option.",
        "Day 5 — full five at the anchor. Notice the anchor doing the remembering for you.",
        "Day 6 — test the minimum on purpose, even if you have time. Proving the floor works is what saves next month.",
        "Day 7 — write the rule: “Quiet time happens at [anchor]; crazy days get the 90-second version.” That rule is the whole system.",
      ],
      [
        "Day 1 — {WHEN}: usual time, but half the reading, double the sitting. Depth lives in the unhurried part.",
        "Day 2 — one verse only. Read it five times slowly. Let one word pick you.",
        "Day 3 — add writing: three honest sentences to God or about the day ahead. Pen slows the soul down nicely.",
        "Day 4 — silence day: no reading, ten minutes of just listening. Hardest one on the list.",
        "Day 5 — take yesterday's verse into the day: set it as a lock screen, return to it at lunch.",
        "Day 6 — pray for other people by name — five names, unhurried.",
        "Day 7 — review the week's notes. Which day went deepest? More of that, permanently.",
      ],
    ],
  },
];

export const HABIT_OBSTACLES = ["No time", "No energy", "I forget", "I start too big and quit", "It gets boring", "Stress steamrolls it"];
export const HABIT_WHEN = ["Morning", "Lunchtime", "After work", "Evening"];

// One thing that may make this harder — a possibility tied to the
// obstacle the person selected, never a verdict about them.
const OBSTACLE_READS: Record<string, string> = {
  "No time":
    "this plan's steps run 2–20 minutes, and for most schedules that time exists — it may currently be spoken for by something easier. A step with a calendar slot tends to happen; a step waiting for spare time tends to wait.",
  "No energy":
    "the habit may be getting sized on motivated days and executed on tired ones. A step small enough for tired-you to do without negotiating beats a perfect one that never starts — and energy follows action more often than it precedes it.",
  "I forget":
    "memory may be the wrong tool for this job. Habits that survive usually get welded to something that already happens daily — after the alarm, with the coffee, when you park the car — with the equipment placed where the anchor happens. Let the environment do the remembering.",
  "I start too big and quit":
    "one missed day may be getting read as ruin, with the restart pushed to next month. A counter-rule worth testing: never miss twice. One missed day is data; two is a new habit forming in the wrong direction.",
  "It gets boring":
    "boredom at week two may not be failure — it's often what practice feels like once novelty leaves, and results tend to arrive after it does. Pairing the habit with something you genuinely enjoy, and letting 'show up bored' count as a full win, tests that.",
  "Stress steamrolls it":
    "this habit may be filed under 'extra' — first thing overboard in a hard week — even though movement, sleep, real food, and quiet are often what fund the stress response. Designing the crisis version now (2 minutes, one glass, one verse) keeps hard weeks shrinking the habit instead of deleting it.",
};

const OBSTACLE_ALTS: Record<string, string> = {
  "No time": "Sometimes there genuinely is no slack — if an honest look at the calendar says so, the fix is a smaller step, not a stronger intention.",
  "No energy": "Persistent no-energy can also be a sleep, health, or season signal worth checking on its own — not a willpower question at all.",
  "I forget": "If reminders already exist and still get ignored, the obstacle may actually be size or energy, not memory.",
  "I start too big and quit": "Some people genuinely run on sprints — the check is what week three looks like, not how day one felt.",
  "It gets boring": "Boredom can also mean the habit is the wrong one. Worth asking whether the goal still matters or just sounded right.",
  "Stress steamrolls it": "If stress is constant rather than episodic, the habit may need to shrink permanently — not just on bad days.",
};

/** Busy-day and minimum versions per goal, for the week's experiment card. */
const GOAL_VERSIONS: Record<string, { busy: string; minimum: string }> = {
  move: { busy: "A 10-minute walk, any time it fits.", minimum: "Shoes on, out the door, two minutes." },
  eat: { busy: "Eat the planted decent option first; everything else is optional.", minimum: "Write down what you ate today — nothing else." },
  sleep: { busy: "Phone charges outside the bedroom; that's the whole night.", minimum: "Set the landing alarm, even if you ignore it." },
  phone: { busy: "One no-phone meal.", minimum: "Glance at the screen-time number once." },
  water: { busy: "One full glass before the first coffee.", minimum: "Fill the bottle tonight for tomorrow." },
  quiet: { busy: "The 90-second version: one verse, one breath, one sentence.", minimum: "Sit down in the chair. That's it." },
};

// Lowercase a quoted choice for mid-sentence use, but keep the pronoun "I".
const softLower = (t: string) => (/^I\b/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1));

export type HabitInputs = { goalId: string; level: number; obstacle: string; when: string };

export function composeHabitsResult(h: HabitInputs): Reflection {
  const goal = HABIT_GOALS.find((g) => g.id === h.goalId) ?? HABIT_GOALS[0];
  const levelIdx = Math.min(h.level, goal.plan.length - 1);
  const levelText = goal.levels[levelIdx] ?? goal.levels[0];
  const days = goal.plan[levelIdx].map((d) => d.replace("{WHEN}", h.when.toLowerCase()));
  const versions = GOAL_VERSIONS[goal.id] ?? GOAL_VERSIONS.move;
  const sections: Section[] = [];

  const evidence: Evidence[] = [
    { id: "ev-goal", statement: `The habit — you selected: ${goal.label.toLowerCase()}`, sourceQuestionId: "goal", sourceAnswer: goal.label },
    { id: "ev-level", statement: `Where you're starting from — you selected: “${softLower(levelText)}”`, sourceQuestionId: "level", sourceAnswer: levelText },
    { id: "ev-obstacle", statement: `What usually kills it — you selected: “${softLower(h.obstacle)}”`, sourceQuestionId: "obstacle", sourceAnswer: h.obstacle },
    { id: "ev-when", statement: `Your most reliable pocket of time — you selected: ${h.when.toLowerCase()}`, sourceQuestionId: "when", sourceAnswer: h.when },
  ];

  sections.push({
    heading: `Your 7-day starter — ${goal.label.toLowerCase()}`,
    kind: "plan",
    bullets: days,
    note: goal.note ?? "Sized to where you said you are, not where you wish you were. Small on purpose — the first week's only job is to exist.",
  });

  sections.push({
    heading: "The two rules that make it work",
    kind: "custom",
    bullets: [
      "Too small to skip: if a day's step feels laughably easy, it's correctly sized. You're building the showing-up, not the results — those come free later.",
      "Never miss twice: one missed day is nothing. Zero drama, no makeup double. Just don't let it become two.",
    ],
  });

  sections.push({
    heading: "The week, as an experiment",
    kind: "experiment",
    experiment: {
      title: "Run the seven days above",
      action: `${days[0]} Then one step a day in your ${h.when.toLowerCase()} slot, at whatever size actually happens.`,
      rationale: `You picked ${goal.label.toLowerCase()}, starting from “${softLower(levelText)}”, with “${softLower(h.obstacle)}” as the usual killer — the plan is sized to exactly that.`,
      duration: "7 days",
      observe: [
        "Which days happened, which didn't, and what was different about them",
        "Whether the obstacle you named is the one that actually showed up",
      ],
      busyVersion: versions.busy,
      minimumVersion: versions.minimum,
      permissionToAdjust: "Shrinking a day is success, not failure — the week's only job is to exist. Completing it isn't virtue and missing days isn't a verdict.",
    },
  });

  sections.push({
    heading: "One thing that may make this harder",
    kind: "interpretations",
    interpretations: [
      {
        id: "int-obstacle",
        possibility: OBSTACLE_READS[h.obstacle] ?? OBSTACLE_READS["I start too big and quit"],
        evidenceIds: ["ev-obstacle"],
        confidence: "plausible",
        alternative: OBSTACLE_ALTS[h.obstacle] ?? OBSTACLE_ALTS["I start too big and quit"],
        checkQuestion: "Does this match how it usually goes for you?",
      },
    ],
    note: "You named the obstacle yourself — this is one possibility for what it tends to mean, not a diagnosis of you.",
  });

  sections.push({
    heading: "What might challenge this reading",
    kind: "challenge",
    bullets: [
      "One week can start a habit; it can't prove or disprove one.",
      `You named “${softLower(h.obstacle)}” — if a day gets missed, check whether that was actually the cause before rewriting the plan.`,
      "Three taps size a plan roughly. If the week feels wrong by day three, the sizing missed — not you.",
    ],
  });

  sections.push({
    heading: "What you told it",
    kind: "facts",
    note: "The whole plan is built from these four taps — nothing else.",
  });

  sections.push({
    heading: "Continue the reflection",
    kind: "questions",
    bullets: [
      "Which day of the plan looks least realistic from here?",
      "What made the easiest day easy — and can that condition be copied?",
    ],
  });

  sections.push({
    heading: "What this is — and isn't",
    kind: "resources",
    paragraphs: [
      "A starter week, not a medical program. For health conditions, injuries, or eating patterns that worry you, a doctor beats any plan on a screen — and starting smaller than this page suggests is always allowed.",
    ],
  });

  return {
    id: newId(),
    mode: "habits",
    title: `7-Day Habit Starter — ${goal.label.toLowerCase()}`,
    createdAt: Date.now(),
    sections,
    evidence,
    schemaVersion: REFLECTION_SCHEMA_VERSION,
    meta: { goal: goal.label, goalEmoji: goal.emoji, when: h.when },
  };
}

// ---- streak tracking (local) ----

export type Streak = { goalId: string; days: string[]; best: number };
const STREAK_KEY = "wai-habit-streak-v1";

// Local calendar day, not UTC: an evening tap must land on today, not tomorrow.
const dayStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function loadStreak(): Streak | null {
  if (typeof window === "undefined") return null;
  try {
    const s = JSON.parse(localStorage.getItem(STREAK_KEY) ?? "");
    if (s && typeof s.goalId === "string" && Array.isArray(s.days)) {
      const days = s.days.filter((d: unknown): d is string => typeof d === "string");
      const best = typeof s.best === "number" && Number.isFinite(s.best) && s.best > 0 ? Math.floor(s.best) : 0;
      return { goalId: s.goalId, days, best };
    }
  } catch {}
  return null;
}

export function currentStreak(s: Streak): number {
  const have = new Set(s.days);
  let n = 0;
  const d = new Date();
  // today counts if marked; otherwise streak is measured through yesterday
  if (!have.has(dayStr(d))) d.setDate(d.getDate() - 1);
  while (have.has(dayStr(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function markToday(goalId: string): Streak {
  const prev = loadStreak();
  const s: Streak = prev && prev.goalId === goalId ? prev : { goalId, days: [], best: prev?.best ?? 0 };
  const today = dayStr(new Date());
  if (!s.days.includes(today)) s.days = [...s.days, today].slice(-400);
  s.best = Math.max(s.best, currentStreak(s));
  localStorage.setItem(STREAK_KEY, JSON.stringify(s));
  return s;
}

export function todayMarked(s: Streak | null): boolean {
  return !!s && s.days.includes(dayStr(new Date()));
}

// Days marked in the last 7 (today included). A missed day drops the streak
// to zero; this number doesn't, so one bad day isn't the whole story.
export function daysThisWeek(s: Streak): number {
  const have = new Set(s.days);
  const d = new Date();
  let n = 0;
  for (let i = 0; i < 7; i++) {
    if (have.has(dayStr(d))) n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
