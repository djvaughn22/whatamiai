// My Situation — one thing, thought through in about 8 taps.
// No required typing. The result offers a possible SHAPE of the situation
// (never the person) — as one possibility with an alternative reading and
// a question to test it, plus a small 7-day experiment. Every observation
// traces to the answers that produced it.

import type { Answers, Evidence, Interpretation, Observation, Question, Reflection, Section } from "./types";
import { answerText, newId, REFLECTION_SCHEMA_VERSION } from "./types";
import { checkSafetyAll, type SafetyKind } from "./safety";

export const SITUATION_TYPES = [
  { id: "decision", label: "A decision" },
  { id: "relationship", label: "A relationship" },
  { id: "work", label: "Work or a project" },
  { id: "money", label: "Money" },
  { id: "habit", label: "A habit" },
  { id: "conflict", label: "A conflict" },
  { id: "disappointment", label: "A disappointment" },
  { id: "stuck", label: "Feeling stuck" },
  { id: "regret", label: "Something I regret" },
  { id: "fear", label: "Something I fear" },
  { id: "other", label: "Something else" },
] as const;

export type SituationType = (typeof SITUATION_TYPES)[number]["id"];

const PEOPLE_TYPES: SituationType[] = ["relationship", "conflict", "regret", "disappointment"];
const SAFE_TYPES: SituationType[] = ["relationship", "conflict"];
const REVERSIBLE_TYPES: SituationType[] = ["decision", "money", "work"];

export function buildSituationQuestions(type: SituationType): Question[] {
  const people = PEOPLE_TYPES.includes(type);
  const qs: Question[] = [
    { id: "duration", area: "The shape", label: "How long has this been sitting on you?", kind: "choice", options: ["Days", "Weeks", "Months", "A year or more"] },
    { id: "feeling", area: "The shape", label: "What's the strongest feeling in it? Pick up to two.", kind: "chips", maxChips: 2, options: ["Afraid", "Anxious", "Angry", "Sad", "Ashamed", "Guilty", "Overwhelmed", "Confused", "Hurt", "Numb", "Hopeful", "Tired"] },
    { id: "deadline", area: "The clock", label: "Is there an actual deadline?", kind: "choice", options: ["Yes — a real date", "It feels urgent, but no date is set", "No", "Not sure"] },
    { id: "waiting", area: "The clock", label: "What are you waiting for before acting?", kind: "choice", options: ["Information", "Permission", "Confidence", "Certainty", "Nothing — I could act now", "Not sure"] },
  ];

  if (people) {
    qs.push({ id: "asked", area: "The other side", label: "Have you actually asked the other person for their side — or are you guessing?", kind: "choice", options: ["I've asked", "Partly", "I'm guessing", "There's no one to ask"] });
  }
  if (SAFE_TYPES.includes(type)) {
    qs.push({ id: "safe", area: "The other side", label: "Is this relationship safe enough for a direct, honest conversation?", kind: "choice", options: ["Yes", "Unsure", "No"] });
  }
  if (REVERSIBLE_TYPES.includes(type)) {
    qs.push({ id: "reversible", area: "The stakes", label: "Is the option you're leaning toward reversible?", kind: "choice", options: ["Mostly reversible", "Hard to reverse", "Not sure", "I'm not leaning anywhere yet"] });
  }

  qs.push(
    { id: "friend", area: "The test", label: "If a close friend brought you this exact situation, what would you tell them?", kind: "choice", options: ["I know exactly what I'd say", "I'd have a rough idea", "Honestly, no idea"] },
    { id: "tried", area: "The test", label: "What have you already tried? Tap all that fit.", kind: "chips", maxChips: 4, options: ["Thought about it a lot", "Talked to someone", "Made a list", "Looked for answers online", "Prayed about it", "Avoided it", "Nothing yet"] },
    { id: "name_it", area: "Optional", label: "Want to name it in one line? Totally optional.", kind: "text", placeholder: "Stays on this device. Skip if you'd rather not." }
  );

  return qs;
}

// ---- pattern detection ----

type SituationPattern = {
  id: string;
  emoji: string;
  name: string;
  read: string[];
  blindspot: string;
  step: string;
  ask: string;
};

/**
 * 2.0 companions to each shape: a condensed one-line possibility, a
 * competing reading (the app challenges itself, not only the user), and
 * which answers triggered it.
 */
const PATTERN_EXTRAS: Record<string, { possibility: string; alternative: string; triggers: string[] }> = {
  phantom_deadline: {
    possibility: "the pressure here may be a phantom deadline — real urgency as a feeling, with no actual date behind it",
    alternative: "A real consequence may exist that simply hasn't been written down as a date yet. Naming it would tell you which this is.",
    triggers: ["deadline"],
  },
  already_known: {
    possibility: "the thinking may already be done — what's left may be the doing",
    alternative: "Advice you'd give a friend can also be too simple for the inside view. Your hesitation may know something the easy answer doesn't.",
    triggers: ["friend"],
  },
  unasked: {
    possibility: "part of the weight may be a conversation that hasn't happened yet",
    alternative: "Some questions stay unasked for good reasons — timing, safety, history. Only you know whether this is avoidance or wisdom.",
    triggers: ["asked"],
  },
  certainty_wait: {
    possibility: "this wait may have no end condition — certainty rarely arrives on schedule",
    alternative: "Sometimes waiting is itself the decision that fits. If the real cost of waiting is low, patience may be strategy rather than stalling.",
    triggers: ["waiting"],
  },
  permission_slip: {
    possibility: "the permission being waited on may not be held by anyone but you",
    alternative: "There may be a real gatekeeper here — in which case this is a conversation to schedule, not a fear to out-wait.",
    triggers: ["waiting"],
  },
  slow_leak: {
    possibility: "time plus avoidance may be quietly raising the price of this",
    alternative: "Some things do resolve with time. The check is whether this one has actually gotten smaller — or just quieter.",
    triggers: ["duration", "tried"],
  },
  missing_fact: {
    possibility: "one gettable fact may be the actual blocker",
    alternative: "If the missing information keeps changing shape, the blocker may be the decision itself, not the data.",
    triggers: ["waiting"],
  },
  open_door: {
    possibility: "this may be a reversible choice carrying irreversible-level caution",
    alternative: "Reversible on paper isn't always reversible in relationships or momentum — worth pricing what undoing would really cost.",
    triggers: ["reversible"],
  },
  fresh_cut: {
    possibility: "the feelings may still be too fresh for the decision to see straight",
    alternative: "Fresh anger is sometimes accurate anger. The 72-hour pause tests it either way — it costs nothing if the anger was right.",
    triggers: ["duration", "feeling"],
  },
  overthought_loop: {
    possibility: "more thinking may have stopped adding information some laps ago",
    alternative: "It's also possible something changed recently and another look is genuinely warranted. The check: has anything new entered since the last lap?",
    triggers: ["tried"],
  },
  crossroads: {
    possibility: "this may simply be a genuinely hard decision — real options, real trade-offs, no move that gets everything",
    alternative: "There isn't enough in eight taps to say more confidently — which is itself worth knowing.",
    triggers: [],
  },
};

const HOT_FEELINGS = ["Angry", "Hurt", "Afraid", "Overwhelmed", "Ashamed"];

function detectPattern(a: Answers): SituationPattern {
  const t = (id: string) => answerText(a, id);
  const tried = Array.isArray(a["tried"]) ? (a["tried"] as string[]) : [];
  const feelings = Array.isArray(a["feeling"]) ? (a["feeling"] as string[]) : [];
  const old = ["Months", "A year or more"].includes(t("duration"));

  if (t("deadline") === "It feels urgent, but no date is set")
    return {
      id: "phantom_deadline", emoji: "⏰", name: "The Phantom Deadline",
      read: [
        "This feels urgent — but you said no actual date exists. That combination has a name: pressure without a clock. The urgency is real as a feeling, but it isn't coming from the calendar.",
        "Phantom deadlines push people into rushed choices, or keep them in a permanent low hum of stress about a thing that could actually wait a beat.",
      ],
      blindspot: "You may be treating a feeling of urgency as a fact of urgency. Ask: who or what set this clock? If the answer is \"nobody,\" you have more room than it feels like.",
      step: "Set the deadline yourself. Pick a real date this week — \"I decide by Friday\" — write it where you'll see it, and let the pressure work for you instead of on you.",
      ask: "“This feels urgent to me — do you see an actual clock on it, or am I supplying the pressure myself?”",
    };

  if (t("friend") === "I know exactly what I'd say")
    return {
      id: "already_known", emoji: "🎯", name: "The Answer You Already Have",
      read: [
        "You said that if a friend brought you this exact situation, you'd know exactly what to tell them. That's the tell: this usually isn't a thinking problem anymore. It's a doing problem.",
        "We hold friends' situations at arm's length, so we see them clearly. Our own sit two inches from our face. But the advice doesn't change with the distance — only the courage required does.",
      ],
      blindspot: "More research, more thinking, and more waiting can all be ways of not doing the thing you'd tell your friend to do. Notice if \"I need more time\" has quietly become \"I don't want to.\"",
      step: "Write down, word for word, what you'd tell that friend. Then do the first sentence of it within seven days.",
      ask: "“Here's what I'd tell a friend in my shoes — can you hold me to actually doing it?”",
    };

  if (t("asked") === "I'm guessing")
    return {
      id: "unasked", emoji: "💬", name: "The Unasked Conversation",
      read: [
        "A big piece of this situation is what another person thinks, feels, or meant — and you said you're guessing at it. So part of what's weighing on you isn't the situation. It's the story you've written about the situation.",
        "The version of that person living in your head right now is almost never as fair as the real one — assumed motives run less generous than actual ones.",
      ],
      blindspot: "You may be reacting to a conversation that hasn't happened. Every day it stays unasked, the imagined version gets another coat of paint.",
      step: "Have the conversation this week — or the first honest piece of it. One opener: “I've been assuming some things about this, and I'd rather just ask you.”",
      ask: "“Here's what I think they think — how would you find out for real?”",
    };

  if (t("waiting") === "Certainty")
    return {
      id: "certainty_wait", emoji: "🔒", name: "The Certainty Wait",
      read: [
        "You're waiting for certainty before you act. Here's the hard part: information can usually be gotten. Certainty usually can't. Which means this wait may have no end condition — it can't finish, only expire.",
        "Situations like this often stall not because the answer is unknowable but because 'sure' was set as the price of moving, and 'sure' never goes on sale.",
      ],
      blindspot: "Check whether you're actually gathering information — or just re-checking the same facts hoping they'll start guaranteeing something. Facts inform; they never promise.",
      step: "Replace “When I'm sure” with “When I know X.” Name the one fact that would move you, get that fact this week, and let it be enough.",
      ask: "“What's the decision you'd make with the information I already have?”",
    };

  if (t("waiting") === "Permission")
    return {
      id: "permission_slip", emoji: "🎫", name: "The Permission Slip",
      read: [
        "You're waiting for permission. So the real question is: whose? If a specific person holds it, this situation is actually a conversation you haven't had yet. If nobody holds it, the wait is about something else — usually fear wearing a politer costume.",
      ],
      blindspot: "Waiting for permission nobody was asked to give is one of the most common ways good plans die quietly. The permission may already be yours.",
      step: "Name who holds the permission. If it's a real person, ask them this week, plainly. If no name comes to mind — you just found out you don't need one.",
      ask: "“Am I actually waiting on someone's yes here, or am I waiting on my own?”",
    };

  if (old && (tried.includes("Avoided it") || tried.includes("Nothing yet")))
    return {
      id: "slow_leak", emoji: "💧", name: "The Slow Leak",
      read: [
        `This has been sitting for ${t("duration").toLowerCase()}, and by your own account it's mostly been avoided. That's not laziness — avoidance is what humans do with things that feel too big to face and too important to drop.`,
        "But a slow leak doesn't stay the same size. Situations left alone don't usually resolve; they compound, and they quietly charge interest the whole time.",
      ],
      blindspot: "The cost of this situation isn't just the situation — it's the background weight of carrying an unhandled thing every day. You've likely stopped noticing how much that costs you.",
      step: "Don't try to solve it this week. Just touch it: open the folder, make the call to ask one question, write the first three sentences. Breaking the seal is the whole assignment.",
      ask: "“I've been avoiding this for a while — will you check in with me on Friday and ask if I touched it?”",
    };

  if (t("waiting") === "Information")
    return {
      id: "missing_fact", emoji: "🔍", name: "The Missing Fact",
      read: [
        "You said information is what you're waiting on — and that's the most solvable wait there is. A missing fact has a location. It lives somewhere: a person, a document, a number, a test, an answer to one direct question.",
      ],
      blindspot: "One check: is it truly one fact you need, or has “more information” become a renewable excuse? A real information gap gets smaller when you work on it. A stalling one just gets vaguer.",
      step: "Write down the single fact you most need and where it lives. Then go get it this week. When you have it, the situation owes you a decision.",
      ask: "“Here's the fact I think I'm missing — do you agree that's the real blocker?”",
    };

  if (t("reversible") === "Mostly reversible")
    return {
      id: "open_door", emoji: "🚪", name: "The Open Door",
      read: [
        "The option you're leaning toward is mostly reversible — you said so yourself. That changes the math completely: reversible decisions don't need certainty, they need a try.",
        "Most people spend hard-to-reverse-level caution on walk-back-able choices. If the door stays open behind you, the cheapest way to learn if it's right is to walk through it.",
      ],
      blindspot: "You may be demanding one-way-door certainty for a two-way-door choice. The real risk here might be the months spent deliberating, not the decision itself.",
      step: "Treat it as an experiment, not a verdict: pick the reversible option, set a review date (30 days is plenty), and decide then with real experience instead of guesses.",
      ask: "“If this turns out wrong, what would undoing it actually cost me? Am I overpricing that?”",
    };

  if (t("duration") === "Days" && feelings.some((f) => HOT_FEELINGS.includes(f)))
    return {
      id: "fresh_cut", emoji: "🩹", name: "The Fresh Cut",
      read: [
        `This happened days ago and the feelings are still hot — ${feelings.join(" and ").toLowerCase()} is a lot of current running through a decision. Fresh pain is real, but it's also a distorting lens: it makes temporary things look permanent and small things look fatal.`,
      ],
      blindspot: "The move that most wants to be made right now may be calibrated to how much it hurts, not to what the situation needs. Those are rarely the same move.",
      step: "Give it 72 hours before anything irreversible — no big texts, no announcements, no burned bridges. Use the time to write the angriest, most honest version somewhere private. Then decide.",
      ask: "“I'm still hot about this — tell me honestly, does my planned response match the size of what happened?”",
    };

  if (tried.length >= 3)
    return {
      id: "overthought_loop", emoji: "🔄", name: "The Overthought Loop",
      read: [
        `You've already worked this one: ${tried.map((x) => x.toLowerCase()).join(", ")}. That's not nothing — that's a person who takes the situation seriously. But when the thinking has been done several ways and the situation hasn't moved, more thinking isn't the missing ingredient.`,
        "Loops like this feel productive because the mind is genuinely busy. The tell is that laps get counted, and the scenery never changes.",
      ],
      blindspot: "At some point, analysis stopped being preparation and became a comfortable place to live. The next lap around the loop will feel exactly as necessary as the last one did.",
      step: "Declare the research phase over. Pick the least-bad option you've already identified and take its first physical step — something your hands do, not your head — within seven days.",
      ask: "“I've thought about this from every angle — what do you think I'm avoiding by thinking more?”",
    };

  return {
    id: "crossroads", emoji: "🛤️", name: "The Genuine Crossroads",
    read: [
      "This one doesn't match the usual stall patterns — no phantom deadline, no unasked conversation, no certainty trap. Sometimes a situation is just genuinely hard: real options, real trade-offs, no move that gets everything.",
      "That's actually useful to know. It means you're not doing it wrong. It means this is a real decision, and real decisions cost something no matter which way they go.",
    ],
    blindspot: "With genuinely hard situations, the trap is waiting for a version of the choice that doesn't hurt anywhere. That version isn't coming — and waiting for it is itself a choice, just an unsigned one.",
    step: "Write your options down — even the imperfect ones, even the ones you've already half-rejected. Seen on paper, most impossible situations turn out to be three or four uncomfortable-but-survivable ones.",
    ask: "“Here are my real options as I see them — which one would you pick for me, and what am I not seeing?”",
  };
}

// ---- result composition ----

const QUESTION_PHRASE: Record<string, string> = {
  duration: "How long it's been sitting on you",
  feeling: "Strongest feelings in it",
  deadline: "Is there an actual deadline",
  waiting: "What you're waiting for",
  asked: "Have you asked the other person",
  safe: "Safe enough for a direct conversation",
  reversible: "Is the option reversible",
  friend: "What you'd tell a friend",
  tried: "What you've already tried",
};

export function composeSituationResult(type: SituationType, a: Answers): Reflection {
  const t = (id: string) => answerText(a, id);
  const sections: Section[] = [];
  const label = SITUATION_TYPES.find((x) => x.id === type)?.label ?? "A situation";
  const safety: SafetyKind | null = checkSafetyAll([t("name_it")]);
  const unsafe = safety === "abuse" || safety === "danger" || t("safe") === "No";
  const pattern = detectPattern(a);
  const extras = PATTERN_EXTRAS[pattern.id] ?? PATTERN_EXTRAS.crossroads;

  // ---- evidence: exactly what was said this session ----
  const evidence: Evidence[] = [{ id: "ev-type", statement: `The kind of situation — you selected: ${label.toLowerCase()}`, sourceQuestionId: "type", sourceAnswer: label }];
  for (const [qid, phrase] of Object.entries(QUESTION_PHRASE)) {
    if (t(qid)) evidence.push({ id: `ev-${qid}`, statement: `${phrase} — you selected: ${t(qid).toLowerCase()}`, sourceQuestionId: qid, sourceAnswer: t(qid) });
  }
  if (t("name_it")) {
    evidence.push({
      id: "ev-name_it",
      statement: `In your words: “${t("name_it")}”`,
      sourceQuestionId: "name_it",
      sourceAnswer: t("name_it"),
      sensitive: "written",
      redactedStatement: "A one-line description you wrote (kept private)",
    });
  }
  const evIds = (ids: string[]) => ids.map((q) => `ev-${q}`).filter((id) => evidence.some((e) => e.id === id));
  const skipped = Object.keys(QUESTION_PHRASE).filter((qid) => !t(qid) && ["duration", "feeling", "deadline", "waiting", "friend", "tried"].includes(qid)).length;

  // ---- a possible shape (interpretation, not verdict) ----
  const readInterp: Interpretation = {
    id: "int-shape",
    possibility: extras.possibility,
    evidenceIds: evIds(extras.triggers),
    confidence: pattern.id === "crossroads" ? "tentative" : "plausible",
    alternative: extras.alternative,
    checkQuestion: "Does this match your experience of it?",
  };
  sections.push({
    heading: `A possible shape: ${pattern.name}`,
    kind: "interpretations",
    paragraphs: pattern.read,
    interpretations: [readInterp],
    note: "This offers a possible pattern in this situation — not a fact about you. Situations have shapes; people are bigger than them.",
  });

  sections.push({
    heading: "What you told it",
    kind: "facts",
    note: "Only your selections and words from this session. The whole read above is built from these — nothing else.",
  });

  // ---- supporting observations, each traceable ----
  const also: Observation[] = [];
  const feelings = Array.isArray(a["feeling"]) ? (a["feeling"] as string[]) : [];
  if (feelings.length)
    also.push({ id: "obs-feel", statement: `Strongest feelings in it, as you named them: ${feelings.join(" and ").toLowerCase()}. Feelings are information about weight, not instructions about action.`, evidenceIds: evIds(["feeling"]), confidence: "direct" });
  if (t("deadline") === "Yes — a real date")
    also.push({ id: "obs-deadline", statement: "There's a real deadline. That can work as a gift disguised as pressure — it does the prioritizing for you.", evidenceIds: evIds(["deadline"]), confidence: "direct" });
  if (t("asked") === "Partly")
    also.push({ id: "obs-asked", statement: "You've partly asked the other person for their side — so part of the picture may still be assumption.", evidenceIds: evIds(["asked"]), confidence: "plausible" });
  if (t("reversible") === "Hard to reverse")
    also.push({ id: "obs-rev", statement: "The option you're leaning toward is hard to reverse — the one kind of decision that has earned slowness.", evidenceIds: evIds(["reversible"]), confidence: "direct" });
  if (pattern.id !== "already_known" && t("friend") === "I know exactly what I'd say")
    also.push({ id: "obs-friend", statement: "You said you'd know exactly what to tell a friend in this spot. Worth writing that advice down and seeing if it's also yours.", evidenceIds: evIds(["friend"]), confidence: "direct" });
  if (also.length) sections.push({ heading: "Also in the mix", kind: "observations", observations: also.slice(0, 3) });

  sections.push({
    heading: "A possibility to check",
    kind: "interpretations",
    interpretations: [
      {
        id: "int-check",
        possibility: pattern.blindspot,
        evidenceIds: evIds(extras.triggers),
        confidence: "tentative",
        checkQuestion: "If this doesn't fit, what's the more accurate description?",
      },
    ],
    note: "Only you know whether this fits. If it doesn't, discard it.",
  });

  // ---- what might challenge this reading (result-specific) ----
  const challenge: string[] = [
    "Eight taps compress a real situation. You may have picked the closest available answer rather than an exact one — if any answer was a stretch, the shape above may be off too.",
  ];
  if (skipped > 0) challenge.push(`You skipped ${skipped} question${skipped === 1 ? "" : "s"}, so the read never saw ${skipped === 1 ? "that part" : "those parts"}.`);
  if (!t("name_it")) challenge.push("You didn't describe the situation in your own words, so this read is built entirely from menu choices.");
  sections.push({ heading: "What might challenge this reading", kind: "challenge", bullets: challenge });

  // ---- one small experiment (or safety-first path) ----
  if (unsafe) {
    sections.push({
      heading: "One step for the next 7 days",
      kind: "plan",
      paragraphs: [
        "Because safety came up in your answers, the honest next step is not a confrontation and not a solo move. Talk with a counselor, advocate, or trusted person who can help you plan safely — the resources above come first.",
      ],
    });
  } else {
    const trigger = evidenceFirst(evidence, evIds(extras.triggers));
    sections.push({
      heading: "One small experiment",
      kind: "experiment",
      experiment: {
        title: "One step for the next 7 days",
        action: pattern.step,
        rationale: trigger ? `This follows from your own answer — ${trigger.statement.charAt(0).toLowerCase()}${trigger.statement.slice(1)}.` : "This follows from the overall shape of your answers.",
        duration: "7 days",
        observe: [
          "Whether the step actually happened — and if not, what specifically stopped it",
          "Whether the shape above still fits once you've tried it",
        ],
        permissionToAdjust: "If the step is too big for this week, shrink it until it isn't. A smaller step that happens beats a right-sized one that doesn't.",
      },
    });
  }

  sections.push({
    heading: "Take it to a person",
    kind: "resources",
    paragraphs: [unsafe ? "Choose someone safe and steady, and let them help you carry this one." : `Find someone with enough context and enough honesty, and ask them: ${pattern.ask}`],
    note: "A tool can organize your thinking. A person who knows you can correct it. Don't skip the person.",
  });

  sections.push({
    heading: "Continue the reflection",
    kind: "questions",
    bullets: [
      "Which of your eight answers was the least exact fit?",
      "What important context did the questions never ask about?",
      pattern.id === "crossroads" ? "What would make one of the real options survivable enough to pick?" : `If “${pattern.name}” is wrong, what does the situation look like instead?`,
    ],
  });

  sections.push({
    heading: "What this is — and isn't",
    kind: "custom",
    paragraphs: [
      "This is how the situation looks from your eight answers — one possible shape, a possibility to check, and a small step. It's not a verdict, and not advice about major life changes. Those deserve real people, real counsel, and time.",
    ],
  });

  return {
    id: newId(),
    mode: "situation",
    title: `Situation — ${label.toLowerCase()}`,
    createdAt: Date.now(),
    sections,
    evidence,
    schemaVersion: REFLECTION_SCHEMA_VERSION,
    safetyFlagged: !!safety,
    meta: {
      ...(safety ? { safetyKind: safety } : {}),
      type,
      guessing: t("asked") === "I'm guessing",
      want: "",
      pattern: pattern.name,
      patternEmoji: pattern.emoji,
    },
  };
}

function evidenceFirst(pool: Evidence[], ids: string[]): Evidence | null {
  for (const id of ids) {
    const e = pool.find((x) => x.id === id);
    if (e) return e;
  }
  return null;
}
