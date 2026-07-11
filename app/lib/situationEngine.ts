// My Situation — one thing, thought through.
// Adaptive question banks + a deterministic result composer.
// The result reflects how the user currently sees this situation —
// never a claim about their "real self."

import type { Answers, Question, Reflection, Section } from "./types";
import { answerText, has, newId } from "./types";
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

const WHAT_LABEL: Record<SituationType, string> = {
  decision: "What is the decision in front of you, stated as plainly as possible?",
  relationship: "What is going on in this relationship, stated as plainly as possible?",
  work: "What is happening with this work or project, stated as plainly as possible?",
  money: "What is the money situation, stated as plainly as possible?",
  habit: "What is the habit, and what does it look like in a normal week?",
  conflict: "What happened in this conflict, stated as plainly as possible?",
  disappointment: "What happened, stated as plainly as possible?",
  stuck: "Where do you feel stuck, stated as plainly as possible?",
  regret: "What happened, stated as plainly as possible?",
  fear: "What are you afraid might happen, stated as plainly as possible?",
  other: "What is the situation, stated as plainly as possible?",
};

const PEOPLE_TYPES: SituationType[] = ["relationship", "conflict", "regret", "disappointment"];
const SAFE_TYPES: SituationType[] = ["relationship", "conflict"];
const REVERSIBLE_TYPES: SituationType[] = ["decision", "money", "work"];

export function buildSituationQuestions(type: SituationType): Question[] {
  const people = PEOPLE_TYPES.includes(type);
  const qs: Question[] = [
    { id: "what", area: "The facts", label: WHAT_LABEL[type], kind: "text", placeholder: "Just the plain version. No one sees this but you." },
    { id: "known_assumed", area: "The facts", label: "What do you know directly — and what have you only assumed or heard secondhand?", kind: "text", placeholder: "Optional. \"I know… / I'm assuming…\"" },
    { id: "deadline", area: "The facts", label: "Is there an actual deadline?", kind: "choice", options: ["Yes — a real date", "It feels urgent, but no date is set", "No", "Not sure"] },
    { id: "feeling", area: "Inside", label: "What are you feeling? Pick up to two that are strongest.", kind: "chips", maxChips: 2, options: ["Afraid", "Anxious", "Angry", "Sad", "Ashamed", "Guilty", "Overwhelmed", "Confused", "Hurt", "Numb", "Hopeful", "Tired"] },
    { id: "hope", area: "Inside", label: "What outcome are you hoping for?", kind: "text", placeholder: "One honest sentence." },
    { id: "dread", area: "Inside", label: "What outcome are you trying hardest to avoid?", kind: "text", placeholder: "Optional." },
    { id: "loop_thought", area: "Inside", label: "What thought keeps repeating?", kind: "text", placeholder: "Optional — write it the way it sounds in your head." },
    { id: "your_choice", area: "Responsibility", label: "What choice did you make — or what choice still belongs to you now?", kind: "text", placeholder: "Optional." },
    { id: "admit", area: "Responsibility", label: "Is there something you need to admit — to yourself or to someone else?", kind: "choice", options: ["Yes", "Maybe", "No"] },
    { id: "admit_what", area: "Responsibility", label: "If you're willing, name it here.", kind: "text", placeholder: "Optional. Stays on this device.", showIf: (a) => ["Yes", "Maybe"].includes(answerText(a, "admit")) },
    { id: "not_yours", area: "Responsibility", label: "Are you carrying responsibility for something that may not actually be yours?", kind: "choice", options: ["Probably", "Not sure", "No"] },
    { id: "delayed", area: "Avoidance", label: "What action have you been delaying?", kind: "text", placeholder: "Optional." },
    { id: "waiting", area: "Avoidance", label: "What are you waiting for before acting?", kind: "choice", options: ["Information", "Permission", "Confidence", "Certainty", "Nothing — I could act now", "Not sure"] },
  ];

  if (people) {
    qs.push(
      { id: "other_view", area: "The other side", label: "What might the other person say happened?", kind: "text", placeholder: "Optional — their version, as fairly as you can." },
      { id: "asked", area: "The other side", label: "Have you actually asked them — or are you guessing?", kind: "choice", options: ["I've asked", "Partly", "I'm guessing", "There's no one to ask"] }
    );
  }
  if (SAFE_TYPES.includes(type)) {
    qs.push({ id: "safe", area: "The other side", label: "Is this relationship safe enough for a direct, honest conversation?", kind: "choice", options: ["Yes", "Unsure", "No"] });
  }

  qs.push(
    { id: "options", area: "Options", label: "What are the realistic choices here — even the imperfect ones?", kind: "text", placeholder: "Optional. List them roughly." }
  );
  if (REVERSIBLE_TYPES.includes(type)) {
    qs.push({ id: "reversible", area: "Options", label: "Is the option you're leaning toward reversible?", kind: "choice", options: ["Mostly reversible", "Hard to reverse", "Not sure", "I'm not leaning anywhere yet"] });
  }
  qs.push(
    { id: "clarifying", area: "Options", label: "What single fact, if you knew it, would make this clearer?", kind: "text", placeholder: "Optional." },
    { id: "step", area: "Action", label: "What is one honest step you could take in the next seven days?", kind: "text", placeholder: "Small and specific beats big and vague." },
    { id: "person", area: "Action", label: "Who has enough context — and enough honesty — to challenge your view on this?", kind: "text", placeholder: "Optional — a name is enough." }
  );

  return qs;
}

// ---- result composition ----

const TYPE_NOUN: Record<SituationType, string> = {
  decision: "this decision", relationship: "this relationship", work: "this work",
  money: "this money situation", habit: "this habit", conflict: "this conflict",
  disappointment: "this disappointment", stuck: "this stuck place", regret: "this regret",
  fear: "this fear", other: "this situation",
};

function freeTexts(a: Answers): string[] {
  return ["what", "known_assumed", "hope", "dread", "loop_thought", "your_choice", "admit_what", "delayed", "other_view", "options", "clarifying", "step", "person"]
    .map((id) => answerText(a, id))
    .filter(Boolean);
}

export function composeSituationResult(type: SituationType, a: Answers): Reflection {
  const sections: Section[] = [];
  const noun = TYPE_NOUN[type];
  const safety: SafetyKind | null = checkSafetyAll(freeTexts(a));

  // What happened
  const what = answerText(a, "what");
  sections.push({
    heading: "What happened",
    paragraphs: what
      ? [`In your words: “${what}”`]
      : [`You chose not to write ${noun} out — that's fine. The rest of this still applies to what you have in mind.`],
  });

  // Known vs assumed
  const known = answerText(a, "known_assumed");
  const asked = answerText(a, "asked");
  const knownParas: string[] = [];
  if (known) knownParas.push(`You separated it like this: “${known}”`);
  if (asked === "I'm guessing") knownParas.push("You also said the other person's side is currently a guess — you haven't asked. That means at least part of the picture is an assumption, not a fact.");
  else if (asked === "Partly") knownParas.push("You've partly asked the other person — some of their side is still filled in by assumption.");
  if (knownParas.length) sections.push({ heading: "What is known — and what is assumed", paragraphs: knownParas });

  // Want / fear
  const hope = answerText(a, "hope");
  const dread = answerText(a, "dread");
  const feelings = answerText(a, "feeling");
  const loop = answerText(a, "loop_thought");
  const wf: string[] = [];
  if (hope) wf.push(`What you appear to want: “${hope}”`);
  if (dread) wf.push(`What you're trying hardest to avoid: “${dread}”`);
  if (feelings) wf.push(`Strongest feelings right now: ${feelings.toLowerCase()}.`);
  if (loop) wf.push(`The thought on repeat: “${loop}” — repeated thoughts feel truer each lap, but repetition isn't evidence.`);
  if (wf.length) sections.push({ heading: "What you want — and what you fear", paragraphs: wf });

  // Yours to carry
  const yours: string[] = [];
  const choice = answerText(a, "your_choice");
  const admit = answerText(a, "admit");
  const admitWhat = answerText(a, "admit_what");
  const delayed = answerText(a, "delayed");
  if (choice) yours.push(`A choice that belongs to you: “${choice}”`);
  if (admit === "Yes") yours.push(admitWhat ? `Something you said you need to admit: “${admitWhat}” — naming it here is already the first part.` : "You said there's something you need to admit. You didn't have to write it down for it to count — but it belongs on your side of the ledger.");
  else if (admit === "Maybe") yours.push(admitWhat ? `Something you might need to admit: “${admitWhat}”` : "You said there might be something to admit. Worth sitting with that one honestly.");
  if (delayed) yours.push(`An action you've been delaying: “${delayed}” — delay is also a decision, just an unspoken one.`);
  if (yours.length) sections.push({
    heading: "What appears to be yours to carry",
    paragraphs: yours,
    note: "Based only on what you wrote — only you know whether this list is right.",
  });

  // Not yours
  const notYours: string[] = [];
  if (answerText(a, "not_yours") === "Probably") notYours.push("You said you're probably carrying responsibility that isn't yours. That's worth taking seriously: doing someone else's part rarely helps them do it.");
  notYours.push("Other people's reactions, the past, and outcomes you can't foresee are not yours to command. That's not permission to go passive — it's just where your responsibility ends.");
  sections.push({
    heading: "What may not be yours to control",
    paragraphs: notYours,
    note: "This isn't meant to dismiss anything real — grief, injustice, and hard consequences don't stop being real because they're outside your control.",
  });

  // Tension
  const tensions: string[] = [];
  if (answerText(a, "deadline") === "It feels urgent, but no date is set")
    tensions.push("You said this feels urgent, but no actual deadline exists. It may help to separate the pressure you feel from the time you truly have.");
  if (admit === "Yes" && delayed)
    tensions.push("You know something needs admitting and you named a delayed action. Those two are usually connected — the delay often protects the not-admitting.");
  if (answerText(a, "waiting") === "Certainty")
    tensions.push("You're waiting for certainty before acting. Information can usually be gotten; certainty usually can't. Could this be a wait with no end condition?");
  if (answerText(a, "waiting") === "Permission")
    tensions.push("You're waiting for permission. Whose, exactly — and have they been asked? If no one holds that permission, the wait may really be about something else.");
  if (hope && dread && answerText(a, "waiting") === "Nothing — I could act now")
    tensions.push("You named what you want, what you fear, and said nothing is stopping you from acting. If that's accurate, the remaining gap isn't information — it's a decision.");
  if (tensions.length) sections.push({ heading: "A tension worth examining", paragraphs: tensions.slice(0, 2) });

  // Blind spot
  const blind: string[] = [];
  if (asked === "I'm guessing") blind.push("One possibility worth considering: the version of the other person living in your head hasn't been checked against the actual person. Assumed motives are usually less generous than real ones.");
  else if (answerText(a, "reversible") === "Not sure") blind.push("One possibility worth considering: you may not yet know whether the option you're weighing can be undone. Reversibility changes how much certainty a decision actually needs.");
  else if (answerText(a, "not_yours") === "Probably") blind.push("One possibility worth considering: some of the weight here may belong to someone else's choices, not yours — and carrying it hasn't been helping either of you.");
  else if (!has(a, "options")) blind.push("One possibility worth considering: this may currently feel like it has one impossible option instead of several imperfect ones. Listing even bad options usually shrinks the problem.");
  if (blind.length) sections.push({ heading: "One possible blind spot", paragraphs: blind.slice(0, 1), note: "Only you know whether this fits." });

  // Strength
  let strength = "You took time to look at this honestly instead of around it. That is already a strength — most hard situations are handled on autopilot.";
  if (admitWhat) strength = "You were willing to name something you need to admit. That kind of honesty is the hardest part of most situations, and you already did it.";
  else if (asked === "I've asked") strength = "You've actually asked the other person for their side instead of guessing. That directness is a real strength — keep using it.";
  else if (answerText(a, "step")) strength = "You already named a concrete step yourself. You may need less advice here than momentum.";
  sections.push({ heading: "A strength you can use", paragraphs: [strength] });

  // Next step
  const step = answerText(a, "step");
  const safeAns = answerText(a, "safe");
  const next: string[] = [];
  if (safety === "abuse" || safety === "danger" || safeAns === "No") {
    next.push("Because safety came up in your answers, the honest next step is not a confrontation. Talk with a counselor, advocate, or trusted person who can help you plan safely — see the resources above.");
  } else if (step) {
    next.push(`Your own words: “${step}” — put a day on it. A step without a date is still a plan, not a step.`);
  } else {
    const waiting = answerText(a, "waiting");
    if (waiting === "Information") next.push("Write down the single fact you most need, where it lives, and get it this week. You told us information is the missing piece — so treat getting it as the step.");
    else if (waiting === "Confidence") next.push("Pick the smallest version of the action — small enough that confidence isn't required — and do that version within seven days.");
    else if (answerText(a, "clarifying")) next.push(`You said one fact would make this clearer: “${answerText(a, "clarifying")}”. Getting that fact is your next step.`);
    else next.push("Choose the smallest honest action this week that moves the situation — a written list of your real options counts.");
  }
  sections.push({ heading: "One reasonable next step", paragraphs: next });

  // Take it to a person
  const person = answerText(a, "person");
  const q =
    asked === "I'm guessing"
      ? "“Here's what I think happened and what I'm assuming — what am I not seeing?”"
      : "“Here's the situation and the step I'm considering — what would you challenge?”";
  sections.push({
    heading: "One question to take to someone you trust",
    paragraphs: [person ? `You named ${person}. Ask them: ${q}` : `Find the person with enough context and enough honesty, and ask: ${q}`],
    note: "A tool can organize your thinking. A person who knows you can correct it. Don't skip the person.",
  });

  sections.push({
    heading: "What this is — and isn't",
    paragraphs: ["This is how you see " + noun + " today, organized. It's not the whole story, not a verdict, and not advice about major life changes — those deserve real people, real counsel, and time."],
  });

  return {
    id: newId(),
    mode: "situation",
    title: `Situation — ${SITUATION_TYPES.find((t) => t.id === type)?.label.toLowerCase() ?? type}`,
    createdAt: Date.now(),
    sections,
    safetyFlagged: !!safety,
    meta: {
      type,
      guessing: asked === "I'm guessing",
      want: hope || "",
    },
  };
}
