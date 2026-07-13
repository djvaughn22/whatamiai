// My Overall Patterns — a broader look at repeated behavior.
// Asks for observable evidence, not flattering adjectives.
// Output describes tendencies and conditions, never fixed identity.

import type { Answers, Question, Reflection, Section } from "./types";
import { answerText, newId } from "./types";
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

  // How you currently operate
  const operate: string[] = [];
  const sf = t("start_finish");
  const ds = t("decide_speed");
  const press = t("pressure");
  const cs = t("conflict_style");
  const time = t("time");
  const opBits: string[] = [];
  if (sf) opBits.push(`with projects, you said: “${sf.toLowerCase()}”`);
  if (ds) opBits.push(`with decisions: “${ds.toLowerCase()}”`);
  if (press) opBits.push(`under pressure you tend to become ${press.toLowerCase()}`);
  if (cs) opBits.push(`in conflict your default is to ${CONFLICT_PHRASE[cs] ?? cs.toLowerCase()}`);
  if (time) opBits.push(`and most of your hours currently go to ${time.toLowerCase()}`);
  if (opBits.length) operate.push(`Based only on your answers: ${opBits.join("; ")}.`);
  operate.push("These are tendencies you reported, not fixed traits. They can shift with conditions — that's the useful part.");
  sections.push({ heading: "How you currently operate", paragraphs: operate });

  // Strongest
  const strong: string[] = [];
  if (t("asked_for")) strong.push(`People repeatedly come to you for: “${t("asked_for")}”. Repeated requests are better evidence than self-ratings — this one counts.`);
  if (t("energy")) strong.push(`Work that gives you energy: “${t("energy")}”.`);
  if (t("carry")) strong.push(`A responsibility you reliably carry: “${t("carry")}”. Reliability that steady tends to be invisible to the person doing it.`);
  if (t("follow_through")) strong.push(`You follow through when this is present: “${t("follow_through")}”. That's not a character flaw needing fixing — it's a condition you can deliberately set up.`);
  if (t("good_decision")) strong.push(`A decision that worked, in your words: “${t("good_decision")}”. Worth noticing what made it work and repeating that.`);
  if (strong.length) sections.push({ heading: "Where you appear strongest", paragraphs: strong });

  // Slows you down
  const slow: string[] = [];
  const stops = t("stops");
  if (stops && stops !== "Nothing — I usually finish") slow.push(`What usually stops a project: “${stops.toLowerCase()}”.`);
  const distraction = t("distraction");
  if (distraction && distraction !== "I usually push through") slow.push(`When work gets uncomfortable, you reach for: ${distraction.toLowerCase()}. Naming the escape hatch is most of disarming it.`);
  if (t("postpone")) slow.push(`The responsibility you keep postponing: “${t("postpone")}”. Postponed things rarely get cheaper.`);
  if (slow.length) sections.push({ heading: "What repeatedly slows you down", paragraphs: slow, note: "These are behaviors and conditions, not flaws in who you are." });

  // Pressure
  const pr: string[] = [];
  if (press) pr.push(`Your pressure mode, in your words: ${press.toLowerCase()}. It's worth knowing that pressure-you and normal-you are different people to be around.`);
  if (t("notice_first")) pr.push(`What others notice first: “${t("notice_first")}”. If you know what they see, you can catch it a beat earlier yourself.`);
  if (t("regain")) pr.push(`What restores perspective for you: “${t("regain")}”. That belongs on the calendar during hard seasons, not after them.`);
  if (pr.length) sections.push({ heading: "How you respond under pressure", paragraphs: pr });

  // Decisions
  const dec: string[] = [];
  if (ds) dec.push(`Speed: “${ds.toLowerCase()}”.`);
  const seek = t("seek");
  if (seek === "More information") dec.push("Before big decisions you reach for more information. That's usually wise — the only question worth asking is whether gathering ever becomes a polite way to postpone. Only you know.");
  else if (seek === "Reassurance from someone") dec.push("Before big decisions you reach for reassurance. Wanting a witness is human; just notice whether you're asking them to inform the decision or to carry it.");
  else if (seek === "Consensus — everyone on board") dec.push("You reach for consensus before deciding. That builds trust — and can also hand your decision to the least convinced person in the room.");
  else if (seek === "Control of the details") dec.push("You reach for control of the details before deciding. Preparation is a strength; watch only for the version where control of small things substitutes for deciding the big thing.");
  else if (seek === "Quiet time to think") dec.push("You reach for quiet time before deciding. Protect it — and give it an end date, so thinking time doesn't quietly become waiting time.");
  if (dec.length) sections.push({ heading: "How you make decisions", paragraphs: dec });

  // Relating
  const rel: string[] = [];
  const respond = t("respond");
  if (respond) rel.push(`When someone close brings a problem, you usually ${respond.toLowerCase().replace("it my way", "it your way").replace("i need space", "you need space")}.`);
  if (cs) rel.push(`In conflict you tend to ${CONFLICT_PHRASE[cs] ?? cs.toLowerCase()}, and you said the hardest part is ${t("conflict_hard").toLowerCase() || "—"}.`);
  rel.push("One question worth sitting with: who in your life can disagree with you honestly — and does it actually happen? People with no honest dissenter around them drift.");
  if (rel.length) sections.push({ heading: "How you relate to others", paragraphs: rel, note: "No attachment styles, no relationship types — just the behavior you described." });

  // Alignment + gap
  const matters = t("matters");
  const getsBest = t("gets_best");
  const align: string[] = [];
  if (matters) align.push(`You said what matters most is: “${matters}”.`);
  if (getsBest === "Yes, consistently" && matters) align.push("And you said it consistently gets your best time and attention. That alignment is rare — protect it.");
  if (getsBest === "Some weeks") align.push("You said it gets your best attention some weeks. Partial alignment is normal; the question is which weeks win over a year.");
  if (align.length) sections.push({ heading: "Where your actions and priorities line up", paragraphs: align });

  const gap: string[] = [];
  if (matters && (getsBest === "Honestly, no" || getsBest === "I'm not sure"))
    gap.push(`You said “${matters}” matters most, but that it ${getsBest === "Honestly, no" ? "honestly doesn't" : "may not"} get your best time and attention${time ? ` — most hours go to ${time.toLowerCase()}` : ""}. That gap may be worth examining.`);
  if (gap.length) sections.push({ heading: "Where there may be a gap", paragraphs: gap, note: "A gap is information, not an indictment." });

  // Strength to use intentionally
  let useStrength = "Your willingness to answer these questions honestly. Self-honesty is the strength every other change depends on.";
  if (t("asked_for")) useStrength = `The thing people already ask you for — “${t("asked_for")}” — used on purpose instead of on demand. Aim it at what you said matters most.`;
  else if (t("wrong") === "I adjust quickly") useStrength = "You adjust quickly when proven wrong. That's rarer than it sounds — it means feedback actually reaches you. Seek it out more deliberately.";
  sections.push({ heading: "A strength to use more intentionally", paragraphs: [useStrength] });

  // Pattern to interrupt
  let interrupt = "";
  if (sf === "I start a lot and finish a little") interrupt = "Starting as a way of not finishing. The next new idea is the most comfortable place to hide from the current one.";
  else if (distraction === "A new idea") interrupt = "Reaching for a new idea when the current work gets uncomfortable. The discomfort is usually the sign you're near the part that matters.";
  else if (distraction === "Scrolling") interrupt = "Scrolling as the escape hatch from uncomfortable work. It doesn't refuse the work — it just reschedules it with interest.";
  else if (cs === "Avoid it as long as possible") interrupt = "Letting conflicts age. You said avoidance is the default — most conflicts are cheaper the week they happen.";
  else if (t("wrong") === "I dig in" || t("wrong") === "I try not to find out") interrupt = "Protecting a position instead of testing it. You described defending or avoiding being wrong — one clarifying question before defending would change most of those conversations.";
  else if (t("balance") === "I take on too much") interrupt = "Taking on what isn't yours. You said you take on too much — every task absorbed is one someone else didn't learn to carry.";
  if (interrupt) sections.push({ heading: "A pattern to interrupt", paragraphs: [interrupt], note: "A behavior to interrupt — not a label to wear." });

  // 30-day experiment
  let exp = "Pick the one answer above that stung slightly, and design the smallest weekly action that contradicts it. Run it for 30 days.";
  if (sf === "I start a lot and finish a little") exp = "For 30 days: complete one current project before beginning anything new. Keep a visible list of what 'complete' means for it.";
  else if (matters && (getsBest === "Honestly, no" || getsBest === "I'm not sure")) exp = `For 30 days: give “${matters}” one scheduled, uninterrupted block every week — best hours, not leftovers — and note what changes.`;
  else if (seek === "Reassurance from someone") exp = "For 30 days: each time you want reassurance about a decision, replace one ask with one fact-gathering step, and write down what you found.";
  else if (t("postpone")) exp = `For 30 days — actually, for this week: schedule the responsibility you named (“${t("postpone")}”) and complete it. Then pick the next one.`;
  else if (t("wrong") === "I defend first, adjust later" || t("wrong") === "I dig in") exp = "For 30 days: in every disagreement, ask one genuine clarifying question before defending your position. Count the times it changes the conversation.";
  sections.push({ heading: "One 30-day experiment", paragraphs: [exp] });

  sections.push({
    heading: "Questions only real life can answer",
    paragraphs: ["A reflection describes; it doesn't prove. Test this one against:"],
    bullets: [
      "your behavior over the next few weeks, not your intentions",
      "actual consequences — what finished, what didn't",
      "feedback from people who know you and will be honest",
      "how you treat people when you're stressed, not when you're rested",
      "whether the things you said matter most receive real time and effort",
    ],
  });

  return {
    id: newId(),
    mode: "patterns",
    title: "Overall patterns",
    createdAt: Date.now(),
    sections,
    safetyFlagged: !!safety,
    meta: {
      startFinish: sf,
      seek,
      matters,
      getsBest,
      time,
    },
  };
}
