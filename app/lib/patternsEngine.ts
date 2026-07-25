// My Overall Patterns — a broader look at repeated behavior.
// Asks for observable evidence, not flattering adjectives.
// Output describes how the person answered in THIS session — tendencies
// and conditions with traceable evidence, never fixed identity. Every
// substantial reading carries an alternative or a disconfirming question.

import type { Answers, Evidence, Interpretation, Observation, Question, Reflection, Section } from "./types";
import { answerText, newId, REFLECTION_SCHEMA_VERSION } from "./types";
import { checkSafetyAll } from "./safety";

export const PATTERN_QUESTIONS: Question[] = [
  // Starting and finishing
  { id: "start_finish", area: "Starting and finishing", label: "Which is closest to how projects usually go for you?", kind: "choice", options: ["I start a lot and finish a little", "I start carefully and finish most of it", "I start a lot and finish a lot", "I rarely start new things"] },
  { id: "stops", area: "Starting and finishing", label: "When something goes unfinished, what usually stopped it?", kind: "choice", options: ["I lost interest once it was figured out", "Something newer pulled me away", "It got hard or confusing", "Life interrupted and I didn't come back", "Nothing — I usually finish"] },
  // Decisions
  { id: "decide_speed", area: "Decisions", label: "Decisions: fast or slow?", kind: "choice", options: ["Fast — sometimes too fast", "Small ones fast, big ones I sit on", "I delay most decisions", "Depends entirely on the day"] },
  { id: "seek", area: "Decisions", label: "Before a big decision, what do you reach for most?", kind: "choice", options: ["More information", "Reassurance from someone", "Consensus — everyone on board", "Control of the details", "Quiet time to think"] },
  // Pressure
  { id: "pressure", area: "Pressure", label: "When time or stakes go up, you get… (pick up to two)", kind: "chips", maxChips: 2, options: ["More focused", "Controlling", "Withdrawn", "Impulsive", "Irritable", "Extremely productive", "Scattered", "Quiet"] },
  // Conflict
  { id: "conflict_style", area: "Conflict", label: "Conflict: what's your default?", kind: "choice", options: ["Address it directly", "Avoid it as long as possible", "Soften it — keep the peace", "Escalate — win it", "Overexplain until it dissolves"] },
  { id: "conflict_hard", area: "Conflict", label: "Which is hardest for you?", kind: "choice", options: ["Apologizing", "Forgiving", "Setting a boundary", "Staying calm", "Letting it go afterward"] },
  // Responsibility
  { id: "balance", area: "Responsibility", label: "Where's the imbalance, if any?", kind: "choice", options: ["I take on too much", "I wait for others to act first", "A bit of both", "It's fairly balanced"] },
  // Attention
  { id: "time", area: "Attention", label: "Most of your actual hours go to…", kind: "choice", options: ["Work or projects", "Family and people", "Screens and scrolling", "Other people's needs", "Getting through the day"] },
  { id: "distraction", area: "Attention", label: "When work gets uncomfortable, what do you reach for?", kind: "choice", options: ["A new idea", "Scrolling", "Busywork that feels productive", "Helping someone else instead", "I usually push through"] },
  // Relationships
  { id: "respond", area: "Relationships", label: "When someone close brings you a problem, you usually…", kind: "choice", options: ["Listen first", "Jump to fixing it", "Persuade them to see it my way", "Withdraw — I need space", "Take it over completely"] },
  // Growth and correction
  { id: "wrong", area: "Growth", label: "When you're proven wrong, what actually happens?", kind: "choice", options: ["I adjust quickly", "I defend first, adjust later", "I dig in", "I try not to find out"] },
  // Strengths in action
  { id: "asked_for", area: "Strengths", label: "What do people repeatedly ask you to help with?", kind: "text", placeholder: "The thing they keep coming back for." },
  // Alignment
  { id: "matters", area: "Alignment", label: "What do you say matters most to you?", kind: "text", placeholder: "Your words." },
  { id: "gets_best", area: "Alignment", label: "Does it actually get your best time and attention?", kind: "choice", options: ["Yes, consistently", "Some weeks", "Honestly, no", "I'm not sure"] },
];

const CONFLICT_PHRASE: Record<string, string> = {
  "Address it directly": "address it directly",
  "Avoid it as long as possible": "avoid it as long as you can",
  "Soften it — keep the peace": "soften it to keep the peace",
  "Escalate — win it": "escalate to win it",
  "Overexplain until it dissolves": "overexplain until it dissolves",
};

export function composePatternsResult(a: Answers): Reflection {
  const t = (id: string) => answerText(a, id);
  const sections: Section[] = [];
  const safety = checkSafetyAll(["asked_for", "matters"].map((id) => t(id)));

  const sf = t("start_finish");
  const ds = t("decide_speed");
  const press = t("pressure");
  const cs = t("conflict_style");
  const time = t("time");
  const stops = t("stops");
  const distraction = t("distraction");
  const seek = t("seek");
  const respond = t("respond");

  // ---- evidence: every answer given this session ----
  const evidence: Evidence[] = [];
  const AREA: Record<string, string> = Object.fromEntries(PATTERN_QUESTIONS.map((q) => [q.id, q.label]));
  for (const q of PATTERN_QUESTIONS) {
    const v = t(q.id);
    if (!v) continue;
    if (q.kind === "text") {
      evidence.push({ id: `ev-${q.id}`, statement: `${AREA[q.id]} — in your words: “${v}”`, sourceQuestionId: q.id, sourceAnswer: v, sensitive: "written", redactedStatement: `${AREA[q.id]} — a written answer (kept private)` });
    } else {
      evidence.push({ id: `ev-${q.id}`, statement: `${AREA[q.id]} — you selected: ${v.toLowerCase()}`, sourceQuestionId: q.id, sourceAnswer: v });
    }
  }
  const ev = (...ids: string[]) => ids.map((i) => `ev-${i}`).filter((id) => evidence.some((e) => e.id === id));
  const answered = evidence.length;
  const skippedTexts = ["asked_for", "matters"].filter((id) => !t(id)).length;

  // How you responded in this session
  const opBits: string[] = [];
  if (sf) opBits.push(`with projects, you said: “${sf.toLowerCase()}”`);
  if (ds) opBits.push(`with decisions: “${ds.toLowerCase()}”`);
  if (press) opBits.push(`under pressure you said you become ${press.toLowerCase()}`);
  if (cs) opBits.push(`in conflict your stated default is to ${CONFLICT_PHRASE[cs] ?? cs.toLowerCase()}`);
  if (time) opBits.push(`and most of your hours currently go to ${time.toLowerCase()}`);
  sections.push({
    heading: "How you answered this session",
    kind: "summary",
    paragraphs: [
      ...(opBits.length ? [`Based only on your ${answered} answers: ${opBits.join("; ")}.`] : []),
      "These answers reflect how you responded in this session. They may reveal patterns worth checking, but they do not define you.",
    ],
  });

  // Strongest — only evidence-backed
  const strong: Observation[] = [];
  if (t("asked_for"))
    strong.push({ id: "obs-asked-for", statement: `People repeatedly come to you for: “${t("asked_for")}”. Repeated requests are better evidence than self-ratings — this one counts.`, evidenceIds: ev("asked_for"), confidence: "direct" });
  if (t("wrong") === "I adjust quickly")
    strong.push({ id: "obs-adjust", statement: "You said you adjust quickly when proven wrong — which means feedback actually reaches you.", evidenceIds: ev("wrong"), confidence: "direct" });
  if (strong.length) sections.push({ heading: "Where you appear strongest", kind: "observations", observations: strong });

  // Slows you down
  const slow: Observation[] = [];
  if (stops && stops !== "Nothing — I usually finish")
    slow.push({ id: "obs-stops", statement: `What usually stops a project, in your words: “${stops.toLowerCase()}”.`, evidenceIds: ev("stops"), confidence: "direct" });
  if (distraction && distraction !== "I usually push through")
    slow.push({ id: "obs-distract", statement: `When work gets uncomfortable, you said you reach for: ${distraction.toLowerCase()}. Naming the escape hatch is most of disarming it.`, evidenceIds: ev("distraction"), confidence: "plausible" });
  if (slow.length) sections.push({ heading: "What repeatedly slows you down", kind: "observations", observations: slow, note: "These are behaviors and conditions you described, not flaws in who you are." });

  // Pressure
  if (press)
    sections.push({
      heading: "How you respond under pressure",
      kind: "observations",
      observations: [{ id: "obs-press", statement: `Your pressure mode, in your words: ${press.toLowerCase()}. Worth asking the people around you whether they'd describe it the same way.`, evidenceIds: ev("pressure"), confidence: "direct" }],
    });

  // Decisions
  const dec: Observation[] = [];
  if (ds) dec.push({ id: "obs-speed", statement: `Speed, as you described it: “${ds.toLowerCase()}”.`, evidenceIds: ev("decide_speed"), confidence: "direct" });
  const SEEK_READ: Record<string, string> = {
    "More information": "Before big decisions you said you reach for more information. Often wise — the one question worth asking is whether gathering ever becomes a polite way to postpone. Only you know.",
    "Reassurance from someone": "Before big decisions you said you reach for reassurance. Wanting a witness is human; worth noticing whether you're asking them to inform the decision or to carry it.",
    "Consensus — everyone on board": "You said you reach for consensus before deciding. That builds trust — and can also hand the decision to the least convinced person in the room.",
    "Control of the details": "You said you reach for control of the details before deciding. Preparation is a strength; the version worth watching is where control of small things substitutes for deciding the big thing.",
    "Quiet time to think": "You said you reach for quiet time before deciding. Protect it — and give it an end date, so thinking time doesn't quietly become waiting time.",
  };
  if (SEEK_READ[seek]) dec.push({ id: "obs-seek", statement: SEEK_READ[seek], evidenceIds: ev("seek"), confidence: "plausible" });
  if (dec.length) sections.push({ heading: "How you make decisions", kind: "observations", observations: dec });

  // Relating
  const rel: Observation[] = [];
  if (respond)
    rel.push({ id: "obs-respond", statement: `When someone close brings a problem, you said you usually ${respond.toLowerCase().replace("it my way", "it your way").replace("i need space", "you need space")}.`, evidenceIds: ev("respond"), confidence: "direct" });
  if (cs)
    rel.push({ id: "obs-conflict", statement: `In conflict you said you tend to ${CONFLICT_PHRASE[cs] ?? cs.toLowerCase()}${t("conflict_hard") ? `, and that the hardest part is ${t("conflict_hard").toLowerCase()}` : ""}.`, evidenceIds: ev("conflict_style", "conflict_hard"), confidence: "direct" });
  if (rel.length) sections.push({ heading: "How you relate to others", kind: "observations", observations: rel, note: "No attachment styles, no relationship types — just the behavior you described." });

  // Alignment + gap
  const matters = t("matters");
  const getsBest = t("gets_best");
  const align: string[] = [];
  if (matters) align.push(`You said what matters most is: “${matters}”.`);
  if (getsBest === "Yes, consistently" && matters) align.push("And you said it consistently gets your best time and attention. That alignment is rare — protect it.");
  if (getsBest === "Some weeks") align.push("You said it gets your best attention some weeks. Partial alignment is normal; the question is which weeks win over a year.");
  if (align.length) sections.push({ heading: "Where your actions and priorities line up", kind: "custom", paragraphs: align });

  if (matters && (getsBest === "Honestly, no" || getsBest === "I'm not sure")) {
    sections.push({
      heading: "Where there may be a gap",
      kind: "interpretations",
      interpretations: [
        {
          id: "int-gap",
          possibility: `what you said matters most — “${matters}” — ${getsBest === "Honestly, no" ? "doesn't currently" : "may not"} get your best time and attention${time ? `, while most hours go to ${time.toLowerCase()}` : ""}.`,
          evidenceIds: ev("matters", "gets_best", "time"),
          confidence: "plausible",
          alternative: "A season can cause this too — caregiving, a launch, a crisis. The gap may describe this month more than the trajectory.",
          checkQuestion: "Would the people closest to you say this gap has lasted longer than a season?",
        },
      ],
      note: "A gap is information, not an indictment.",
    });
  }

  // Strength to use intentionally
  let useStrength = "Your willingness to answer these questions honestly. Self-honesty is the condition every other change depends on.";
  if (t("asked_for")) useStrength = `The thing people already ask you for — “${t("asked_for")}” — used on purpose instead of on demand. Aim it at what you said matters most.`;
  else if (t("wrong") === "I adjust quickly") useStrength = "You said you adjust quickly when proven wrong. That's rarer than it sounds — it means feedback actually reaches you. Seek it out more deliberately.";
  sections.push({ heading: "A strength to use more intentionally", kind: "custom", paragraphs: [useStrength] });

  // Pattern worth interrupting — offered as a possibility, with a counter-reading
  let interrupt: Interpretation | null = null;
  if (sf === "I start a lot and finish a little")
    interrupt = { id: "int-interrupt", possibility: "starting new things may be functioning as a way of not finishing current ones — the next new idea is often the most comfortable place to avoid the last one.", evidenceIds: ev("start_finish", "stops"), confidence: "plausible", alternative: "Wide starting can also be genuine exploration. The test is whether the unfinished things still matter to you a month later.", checkQuestion: "Which unfinished thing would you most regret never returning to?" };
  else if (distraction === "A new idea")
    interrupt = { id: "int-interrupt", possibility: "reaching for a new idea when the current work gets uncomfortable — the discomfort is often a sign the part that matters is close.", evidenceIds: ev("distraction"), confidence: "plausible", alternative: "Sometimes the new idea really is better than the current one. The check is whether the old one was near done.", checkQuestion: "When did the last new idea arrive — right when the old work got hard?" };
  else if (distraction === "Scrolling")
    interrupt = { id: "int-interrupt", possibility: "scrolling may be working as the escape hatch from uncomfortable work — it doesn't refuse the work, it reschedules it with interest.", evidenceIds: ev("distraction"), confidence: "plausible", alternative: "Short breaks can be genuine recovery. The difference is usually whether you decided the break or the feed did.", checkQuestion: "After a scroll, does the work feel more possible or less?" };
  else if (cs === "Avoid it as long as possible")
    interrupt = { id: "int-interrupt", possibility: "conflicts may be aging expensively — you said avoidance is the default, and most conflicts are cheaper the week they happen.", evidenceIds: ev("conflict_style"), confidence: "plausible", alternative: "Some conflicts genuinely resolve themselves. The check is whether the avoided ones shrank or compounded.", checkQuestion: "Which avoided conflict from last year would have been cheaper handled early?" };
  else if (t("wrong") === "I dig in" || t("wrong") === "I try not to find out")
    interrupt = { id: "int-interrupt", possibility: "a position may be getting protected instead of tested — you described defending or avoiding being wrong.", evidenceIds: ev("wrong"), confidence: "plausible", alternative: "Digging in is sometimes just being right early. The check is what happens in the cases where you weren't.", checkQuestion: "What would one clarifying question before defending change?" };
  else if (t("balance") === "I take on too much")
    interrupt = { id: "int-interrupt", possibility: "some of what's being carried may not be yours — you said you take on too much, and every task absorbed is one someone else didn't learn to carry.", evidenceIds: ev("balance"), confidence: "plausible", alternative: "Seasons of genuine necessity exist — sometimes there's no one else yet. The check is whether that's still true.", checkQuestion: "Which absorbed task could someone else own within a month?" };
  if (interrupt) sections.push({ heading: "A pattern worth interrupting", kind: "interpretations", interpretations: [interrupt], note: "A behavior to examine — not a label to wear." });

  // What might challenge this reading (result-specific, required)
  const challenge: string[] = ["Some questions may have required choosing between answers that both partly fit — a forced pick reads more certain than it felt."];
  if (skippedTexts > 0) challenge.push(`The ${skippedTexts === 1 ? "written question you skipped" : "two written questions you skipped"} would have been the strongest evidence here — the reads above lean only on menu choices.`);
  if (answered < 10) challenge.push(`Only ${answered} of 15 questions were answered, so several areas are invisible to this read.`);
  challenge.push("One session's answers can reflect this week's mood as much as a long-run pattern.");
  sections.push({ heading: "What might challenge this reading", kind: "challenge", bullets: challenge });

  // 30-day experiment
  let exp = "Pick the one answer above that stung slightly, and design the smallest weekly action that contradicts it.";
  let expRationale = "It targets whichever read landed closest — you choose, not the tool.";
  let expEvidence: string[] = [];
  if (sf === "I start a lot and finish a little") {
    exp = "Complete one current project before beginning anything new. Keep a visible list of what 'complete' means for it.";
    expRationale = "You said projects start a lot and finish a little — this tests whether finishing is a capacity problem or a queue problem.";
    expEvidence = ev("start_finish");
  } else if (matters && (getsBest === "Honestly, no" || getsBest === "I'm not sure")) {
    exp = `Give “${matters}” one scheduled, uninterrupted block every week — best hours, not leftovers — and note what changes.`;
    expRationale = "You said this matters most but doesn't get your best attention — the block tests whether the gap is scheduling or something else.";
    expEvidence = ev("matters", "gets_best");
  } else if (seek === "Reassurance from someone") {
    exp = "Each time you want reassurance about a decision, replace one ask with one fact-gathering step, and write down what you found.";
    expRationale = "You said reassurance is what you reach for first — this tests whether the missing piece was ever information.";
    expEvidence = ev("seek");
  } else if (t("wrong") === "I defend first, adjust later" || t("wrong") === "I dig in") {
    exp = "In every disagreement, ask one genuine clarifying question before defending your position. Count the times it changes the conversation.";
    expRationale = "You described defending before adjusting — the question inserts one beat between the two.";
    expEvidence = ev("wrong");
  }
  sections.push({
    heading: "One 30-day experiment",
    kind: "experiment",
    experiment: {
      title: "A 30-day experiment",
      action: exp,
      rationale: expRationale,
      duration: "30 days",
      observe: ["What actually happened, not what you intended", "Whether the read it targets still fits after two weeks"],
      minimumVersion: "Run it for one week instead — same experiment, shorter lease.",
      permissionToAdjust: "Completing it isn't virtue and missing days isn't failure — the experiment only exists to produce information.",
    },
  });

  sections.push({
    heading: "Questions only real life can answer",
    kind: "questions",
    paragraphs: ["A reflection describes; it doesn't prove. Test this one against:"],
    bullets: [
      "your behavior over the next few weeks, not your intentions",
      "actual consequences — what finished, what didn't",
      "feedback from people who know you and will be honest",
      "who in your life can disagree with you honestly — and whether it actually happens",
      "whether the things you said matter most receive real time and effort",
    ],
  });

  return {
    id: newId(),
    mode: "patterns",
    title: "Overall patterns",
    createdAt: Date.now(),
    sections,
    evidence,
    schemaVersion: REFLECTION_SCHEMA_VERSION,
    safetyFlagged: !!safety,
    meta: {
      ...(safety ? { safetyKind: safety } : {}),
      startFinish: sf,
      seek,
      matters,
      getsBest,
      time,
    },
  };
}
