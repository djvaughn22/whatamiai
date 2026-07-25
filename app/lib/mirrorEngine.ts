// My AI Mirror — deterministic, local analysis of pasted prompts.
// Every observation is traceable to matched prompts. No scoring is hidden,
// no personality types are assigned, nothing leaves the browser.

import type { Answers, Evidence, Observation, Reflection, Section } from "./types";
import { answerText, newId, REFLECTION_SCHEMA_VERSION } from "./types";
import { assessSafetyAll, type SafetyHit } from "./safety";

/** Pasted lines that read like an AI analyzing the user, not a prompt. */
const PASTED_ANALYSIS = /^you (are|were|fear|tend|always|never|seem|sound|have (a|an)|need to|struggle with)\b/i;

// ---- category rules ----

type Category = {
  id: string;
  label: string; // list label
  phrase: string; // "most attention on {phrase}"
  re: RegExp;
};

const CATEGORIES: Category[] = [
  { id: "build", label: "Build or create", phrase: "building and creating", re: /\b(build(ing)?|creat(e|ing)|mak(e|ing)|design(ing)?|generat(e|ing)|prototype|develop(ing)?|cod(e|ing)|program|app|website|web ?page|landing page|logo|component|feature|implement)\b/i },
  { id: "learn", label: "Learn or understand", phrase: "learning and understanding", re: /\b(explain|teach|learn(ing)?|understand(ing)?|what (is|are|was|were)|how (does|do|did|to)|eli5|difference between|meaning of|definition of)\b/i },
  { id: "research", label: "Research and compare", phrase: "researching and comparing options", re: /\b(research|compar(e|ing|ison)|versus|vs\.?|best (way|option|tool|approach|choice)|top \d+|alternatives?|pros and cons|which (is|one) (better|best)|recommend(ation)?s?)\b/i },
  { id: "decide", label: "Make decisions", phrase: "working through decisions", re: /\b(should (i|we)|help me (decide|choose|pick)|decid(e|ing)|choos(e|ing) between|worth (it|buying|doing|the)|good idea to|do you think i should)\b/i },
  { id: "technical", label: "Solve technical problems", phrase: "solving technical problems", re: /\b(error|bug|fix(ing)?|debug|broken|not working|doesn'?t work|won'?t (run|start|load)|fail(s|ed|ing)|install|deploy|crash|exception|stack trace|undefined|npm|git)\b/i },
  { id: "writing", label: "Improve writing", phrase: "improving writing", re: /\b(rewrite|reword|edit|proofread|draft|polish|shorten|condense|summariz(e|ing)|summary|email|essay|caption|headline|paragraph|tone|grammar|wording)\b/i },
  { id: "plan", label: "Organize and plan", phrase: "planning and organizing", re: /\b(plan(ning)?|roadmap|schedule|organiz(e|ing)|checklist|step[- ]by[- ]step|steps (to|for)|outline|prioritiz(e|ing)|timeline|to[- ]?do|strategy|workflow)\b/i },
  { id: "emotions", label: "Process feelings", phrase: "processing feelings", re: /\b(i feel|feel(ing)? (like|so|really|stuck|lost)|anxious|anxiety|stressed|overwhelmed|sad|lonely|depress\w*|angry|frustrat\w*|worried|afraid|scared|grie(f|ving)|guilty|ashamed)\b/i },
  { id: "reassure", label: "Seek reassurance", phrase: "checking whether things are okay", re: /\b(am i (ok(ay)?|doing|wrong|right|overreacting|crazy|being)|is (this|that|it) (ok(ay)?|normal|good enough|fine)|was (i|that) (wrong|right|ok(ay)?|fair)|reassur\w*|tell me (i'?m|it'?s))\b/i },
  { id: "testideas", label: "Test ideas", phrase: "testing ideas", re: /\b(what do you think (of|about)|feedback on|critique|review my|poke holes|devil'?s advocate|is this a good idea|rate (my|this)|honest (opinion|take)|weak(ness(es)?)? (in|of))\b/i },
  { id: "fun", label: "Entertainment", phrase: "having fun", re: /\b(joke|funny|story about|poem|song|game|riddle|trivia|roleplay|for fun|meme|rap|silly)\b/i },
  { id: "relationships", label: "Manage relationships", phrase: "the people in your life", re: /\b(my (wife|husband|spouse|girlfriend|boyfriend|partner|mom|dad|mother|father|son|daughter|kids?|children|brother|sister|friends?|boss|coworkers?|co-workers?|neighbor|family|in-?laws?)|relationship|marriage|parenting|apolog\w*|forgiv\w*|argument with|conflict with)\b/i },
  { id: "faith", label: "Faith and meaning", phrase: "faith and meaning", re: /\b(god|bible|jesus|scripture|pray(er|ing)?|church|faith|spiritual\w*|meaning of life|purpose in|calling)\b/i },
  { id: "money", label: "Money and business", phrase: "money and business", re: /\b(money|budget|pric(e|ing)|sell(ing)?|sales|market(ing)?|business|revenue|profit|invoice|customers?|invest\w*|income|salary|debt|tax(es)?|etsy|storefront|launch(ing)? (a|my|the))\b/i },
  { id: "health", label: "Health and habits", phrase: "health and habits", re: /\b(workout|exercise|diet|calorie|sleep|habit|routine|weight|health|doctor|symptom|meditat\w*|gym|nutrition|running)\b/i },
  { id: "tedious", label: "Offload tedious work", phrase: "offloading tedious work", re: /\b(format(ting)?|convert(ing)?|translat(e|ing)|transcrib\w*|extract(ing)?|clean (up|this)|boilerplate|template|spreadsheet|regex|rename|reformat|bullet points)\b/i },
  { id: "curiosity", label: "Explore curiosity", phrase: "exploring curiosity", re: /\b(why (do|does|is|are|did|would)|what if|random question|curious|interesting|history of|how come|fun fact)\b/i },
  { id: "memory", label: "Remember and document", phrase: "capturing and documenting ideas", re: /\b(write (this|it) down|document(ing)?|take notes?|notes? (on|for)|remember (this|that)|log (this|my)|journal|keep track|capture (this|these|my))\b/i },
];

// ---- habit + signal rules ----

const SIGNALS = {
  imperative: /^(write|make|build|create|fix|give|list|generate|draft|plan|design|add|show|explain|summarize|rewrite|convert|find|help me (build|make|write|fix))\b/i,
  iteration: /\b(again|redo|try again|another (version|option|take)|revise|instead|now (make|add|change|do|try)|v2|second draft|tweak|iterate)\b/i,
  challenge: /\b(are you sure|that'?s (wrong|not right|incorrect)|double-?check|verify|cite|sources?\??|prove (it|that)|back that up)\b/i,
  fullExec: /\b(complete|entire|full|whole thing|everything|end[- ]to[- ]end|all of (it|them)|start to finish)\b/i,
  speed: /\b(quick(ly)?|fast|asap|right now|briefly|short answer|tl;?dr|in one sentence)\b/i,
  certainty: /\b(exactly|guaranteed?|definitely|for sure|100%|certain|the best possible|optimal)\b/i,
  simplify: /\b(simpl(e|er|ify)|plain english|eli5|layman|easy (way|explanation)|break (it|this|that) down)\b/i,
  brainstorm: /\b(brainstorm|ideas? for|suggest(ions)?|come up with|list of ideas|name (some|a few))\b/i,
  verification: /\b(check (the|my|this)|test(ed)? (it|this)|did (it|this) work|validate|confirm (that|this)|review (the|my) (result|output|work))\b/i,
  completion: /\b(finish(ing)?|complete[ds]?|ship(ping)?|launch(ed)?|done with|wrap(ping)? up|final (step|version)|last step)\b/i,
  rest: /\b(rest|take a break|vacation|relax|day off|recharge|unplug)\b/i,
  opposing: /\b(opposing|counter[- ]?argument|argue against|steelman|strongest case against|what am i missing|blind spots?)\b/i,
  motives: /\b(what (should|do) i (say|text|tell|reply)|why (did|does|would) (he|she|they)|what (did|does) (he|she|they) mean|how do i respond to (him|her|them))\b/i,
  forOthers: /\b(for my (wife|husband|kids?|children|son|daughter|mom|dad|friend|family)|help (my|her|him|them))\b/i,
};

type SignalId = keyof typeof SIGNALS;

// ---- subject extraction ----

const STOPWORDS = new Set(
  `a about above after again all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just like me more most my myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with you your yours yourself
please help need want make making made write writing written give giving get getting use using tell show create creating explain would thing things something anything stuff really actually maybe kind sort way ways good better best new one two three lot much many still able going doesnt dont cant wont didnt isnt arent thats whats hows been being
build building rewrite plan plans planning draft outline checklist fixing compare list steps ideas
ai chatgpt claude gemini copilot gpt prompt prompts question answer`.split(/\s+/)
);

function topSubjects(prompts: string[]): { term: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of prompts) {
    const seen = new Set<string>();
    const words = p
      .toLowerCase()
      .replace(/[^a-z0-9\s'-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
    for (const w of words) {
      if (seen.has(w)) continue;
      seen.add(w);
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([term, count]) => ({ term, count }));
}

// ---- analysis ----

export type MirrorAnalysis = {
  promptCount: number;
  safety: SafetyHit | null;
  pastedAnalysis: { count: number; example: string };
  categories: { id: string; label: string; phrase: string; count: number; pct: number; example: string }[];
  subjects: { term: string; count: number }[];
  roles: { label: string; detail: string; count: number }[];
  habits: string[];
  missing: string[];
  strengths: string[];
  traps: { id: string; text: string }[];
  experiment: string;
  summary: string;
};

function excerpt(p: string, max = 90): string {
  const t = p.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : t.slice(0, max - 1).trimEnd() + "…";
}

export function analyzePrompts(prompts: string[]): MirrorAnalysis {
  const n = prompts.length;

  // category matches
  const catHits = CATEGORIES.map((c) => {
    const matched = prompts.filter((p) => c.re.test(p));
    return { ...c, count: matched.length, example: matched[0] ? excerpt(matched[0]) : "" };
  })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  const cat = (id: string) => catHits.find((c) => c.id === id)?.count ?? 0;

  // signal matches
  const sig: Record<SignalId, number> = Object.fromEntries(
    (Object.keys(SIGNALS) as SignalId[]).map((k) => [k, prompts.filter((p) => SIGNALS[k].test(p)).length])
  ) as Record<SignalId, number>;

  const questionCount = prompts.filter((p) => p.includes("?")).length;
  const imperativeCount = prompts.filter((p) => SIGNALS.imperative.test(p)).length;
  const wordCounts = prompts.map((p) => p.split(/\s+/).length).sort((a, b) => a - b);
  const medianWords = wordCounts.length ? wordCounts[Math.floor(wordCounts.length / 2)] : 0;

  // habits — only surfaced with evidence
  const habits: string[] = [];
  if (medianWords >= 22) habits.push(`Specific over exploratory: your typical prompt runs about ${medianWords} words — you usually know what you want before you ask.`);
  else if (medianWords > 0 && medianWords <= 7) habits.push(`Short and exploratory: your typical prompt is about ${medianWords} words — you start broad and narrow down as you go.`);
  if (n > 0 && imperativeCount / n >= 0.5) habits.push(`Action-oriented: ${imperativeCount} of ${n} prompts open with a direct instruction rather than a question.`);
  else if (n > 0 && questionCount / n >= 0.6) habits.push(`Reflective: ${questionCount} of ${n} prompts are questions rather than instructions.`);
  if (sig.iteration >= 2) habits.push(`Rapid iteration: ${sig.iteration} prompts push for another version instead of settling for the first one.`);
  if (sig.challenge >= 2) habits.push(`You challenge weak answers: ${sig.challenge} prompts ask for verification, sources, or a double-check.`);
  if (sig.fullExec >= 2) habits.push(`You often ask for complete execution, not just advice (${sig.fullExec} prompts).`);
  if (sig.speed >= 2) habits.push(`Speed matters: ${sig.speed} prompts ask for quick or short answers.`);
  if (cat("research") >= 2) habits.push(`You like comparisons before committing (${cat("research")} prompts compare options).`);
  if (sig.certainty >= 2) habits.push(`You push for certainty (${sig.certainty} prompts) — worth remembering that AI can't guarantee outcomes.`);
  if (sig.simplify >= 2) habits.push(`You ask AI to make complexity manageable (${sig.simplify} prompts ask for a simpler version).`);

  // missing areas — restrained, only for a decent sample
  const missing: string[] = [];
  if (n >= 8) {
    if (sig.verification === 0 && sig.completion === 0) missing.push("finishing, testing, or checking results — most prompts are about starting or improving");
    if (sig.rest === 0) missing.push("rest — no prompt here touches breaks, recovery, or slowing down");
    if (cat("relationships") === 0) missing.push("the people in your life");
    if (cat("fun") === 0) missing.push("enjoyment — nothing in this set was just for fun");
    if (sig.opposing === 0) missing.push("opposing views — no prompt asks what you might be missing or for the case against your plan");
  }
  const missingShown = missing.slice(0, 4);

  // strengths — only from repeated behavior
  const strengths: string[] = [];
  if (cat("learn") >= 2) strengths.push("Curiosity: you use AI to learn unfamiliar subjects, not just to confirm what you already know.");
  if (cat("build") >= 3) strengths.push("Bias toward making: a large share of these prompts turn ideas into concrete work.");
  if (sig.iteration >= 2) strengths.push("Willingness to revise: you don't settle for the first draft.");
  if (cat("testideas") >= 2) strengths.push("You invite critique of your own ideas — that takes some humility.");
  if (sig.challenge >= 2) strengths.push("You verify instead of just accepting confident answers.");
  if (sig.forOthers >= 2) strengths.push("Care for others shows up in what you ask — several prompts are on someone else's behalf.");
  if (cat("plan") >= 2 && cat("build") >= 2) strengths.push("Persistence: you plan, then keep pushing the same work forward.");

  // traps — max 3, each threshold-gated, watchful not shaming
  const traps: { id: string; text: string }[] = [];
  if (cat("plan") >= 3 && sig.completion === 0 && sig.verification === 0)
    traps.push({ id: "plans_no_finish", text: `One pattern worth watching: ${cat("plan")} prompts are about planning, and none in this set are about finishing, testing, or shipping. Plans may be piling up faster than they're completed.` });
  if (cat("reassure") >= 3)
    traps.push({ id: "reassurance_loop", text: `One pattern worth watching: ${cat("reassure")} prompts ask whether something is okay or good enough. AI will always answer — but it can't actually settle that question for you.` });
  if (cat("decide") >= 4)
    traps.push({ id: "outsourced_judgment", text: `One pattern worth watching: ${cat("decide")} prompts hand AI a decision. It can lay out options and trade-offs, but judgment calls about your own life stay yours.` });
  if (cat("build") >= 5 && sig.completion === 0 && sig.iteration < 2)
    traps.push({ id: "novelty", text: "One pattern worth watching: many new things get started in these prompts, with little sign of returning to any one of them." });
  if ((cat("technical") >= 3 || cat("research") >= 3) && sig.challenge === 0 && sig.verification === 0)
    traps.push({ id: "no_verify", text: "One pattern worth watching: confident answers appear to be accepted without a verification step. For anything high-stakes, check before acting." });
  if (cat("relationships") >= 3 && sig.motives >= 2)
    traps.push({ id: "proxy_conversation", text: `One pattern worth watching: ${sig.motives} prompts ask AI to interpret or script a conversation with someone in your life. A direct conversation may answer what AI can only guess at.` });
  const trapsShown = traps.slice(0, 3);

  // one experiment
  const EXPERIMENTS: Record<string, string> = {
    plans_no_finish: "End each AI session by writing down the one real-world action you'll take before the next session — and don't open a new plan until the last action is done.",
    reassurance_loop: "Next time you reach for reassurance, ask AI instead for the facts you'd need to check — then go check one of them.",
    outsourced_judgment: "Before asking AI to help decide, write your own answer first. Then ask AI for the strongest case against it.",
    novelty: "Pick one current project and make completion — not a new idea — the required last step of every session about it.",
    no_verify: "For the next high-stakes answer you get, verify one claim against an independent source before acting on it.",
    proxy_conversation: "Take one question you've been asking AI about a person, and ask that person directly this week.",
  };
  const CATEGORY_EXPERIMENTS: Record<string, string> = {
    build: "Add a \"does it actually work?\" check at the end of every build session before starting the next feature.",
    learn: "After each thing you learn, explain it back in two sentences without AI. That's the real test.",
    research: "Set a decision deadline before the next comparison session — research ends when the date arrives.",
    decide: "Ask for the strongest opposing view before you settle your next decision.",
    writing: "Read your next AI-polished draft out loud once before sending — keep what sounds like you.",
  };
  const experiment =
    (trapsShown[0] && EXPERIMENTS[trapsShown[0].id]) ||
    (catHits[0] && CATEGORY_EXPERIMENTS[catHits[0].id]) ||
    "Ask AI to challenge the central assumption of your next big prompt before you act on its answer.";

  // roles
  const roleDefs: { label: string; detail: string; count: number }[] = [
    { label: "Builder", detail: "you bring it work to produce, not just questions to answer", count: cat("build") + cat("technical") },
    { label: "Teacher", detail: "you ask it to explain until things make sense", count: cat("learn") },
    { label: "Researcher", detail: "you send it out to gather and compare", count: cat("research") + cat("curiosity") },
    { label: "Editor", detail: "you hand it words to sharpen", count: cat("writing") },
    { label: "Strategist", detail: "you use it to lay out plans and priorities", count: cat("plan") },
    { label: "Decision partner", detail: "you think out loud with it before choosing", count: cat("decide") },
    { label: "Technical assistant", detail: "you call it when something breaks", count: cat("technical") },
    { label: "Brainstorming partner", detail: "you use it to multiply options", count: sig.brainstorm },
    { label: "Sounding board", detail: "you bring it feelings as much as tasks", count: cat("emotions") + cat("reassure") },
    { label: "Critic", detail: "you ask it to poke holes in your work", count: cat("testideas") },
    { label: "Memory aid", detail: "you use it to capture and keep track", count: cat("memory") },
    { label: "Entertainer", detail: "you keep some of it just for fun", count: cat("fun") },
  ];
  const roles = roleDefs.filter((r) => r.count > 0).sort((a, b) => b.count - a.count).slice(0, 3);

  // distribution with percentages of the pasted set
  const categories = catHits.map((c) => ({
    id: c.id,
    label: c.label,
    phrase: c.phrase,
    count: c.count,
    pct: n ? Math.round((c.count / n) * 100) : 0,
    example: c.example,
  }));

  // one-sentence summary
  const rolePhrase = roles[0] ? `as a ${roles[0].label.toLowerCase()}` : "in a mix of ways";
  const c1 = categories[0]?.phrase;
  const c2 = categories[1]?.phrase;
  const focus = c1 && c2 ? `${c1}, followed by ${c2}` : c1 ?? "a wide mix of topics";
  const summary = `Across the ${n} prompts you pasted, you mainly use AI ${rolePhrase}, with most attention on ${focus}.`;

  const pastedLines = prompts.filter((p) => PASTED_ANALYSIS.test(p.trim()));

  return {
    promptCount: n,
    safety: assessSafetyAll(prompts),
    pastedAnalysis: { count: pastedLines.length, example: pastedLines[0] ? excerpt(pastedLines[0]) : "" },
    categories,
    subjects: topSubjects(prompts),
    roles,
    habits: habits.slice(0, 5),
    missing: missingShown,
    strengths: strengths.slice(0, 4),
    traps: trapsShown,
    experiment,
    summary,
  };
}

// ---- follow-up questions ----

export const MIRROR_FOLLOWUPS = [
  { id: "accurate", area: "Testing the read", label: "Which part of this feels most accurate?", kind: "choice" as const, options: ["The main uses", "The role AI plays for me", "The habits", "The patterns worth watching", "Honestly, not much of it"] },
  { id: "start_complete", area: "Testing the read", label: "Are you using AI more for starting things or completing them?", kind: "choice" as const, options: ["Starting", "Completing", "Both about equally", "Not sure"] },
  { id: "matters_offscreen", area: "Testing the read", label: "Which recurring topic matters most outside the screen?", kind: "text" as const, placeholder: "Optional — your words." },
  { id: "proxy", area: "Testing the read", label: "Is there a conversation or decision you may be bringing to AI instead of handling directly?", kind: "choice" as const, options: ["Yes", "Maybe", "No"] },
  { id: "benefit", area: "Testing the read", label: "Which use of AI has produced the most real-world benefit so far?", kind: "text" as const, placeholder: "Optional." },
];

// ---- compose the result ----

const TRAP_ALTS: Record<string, { alternative: string; check: string }> = {
  plans_no_finish: { alternative: "Finishing may simply live outside your AI window — shipped work doesn't always generate prompts.", check: "What did you finish last month that never touched AI?" },
  reassurance_loop: { alternative: "A season of genuine uncertainty can produce this pattern without it being a loop.", check: "Is there one question underneath most of these checks?" },
  outsourced_judgment: { alternative: "Handing AI decisions can be deliberate delegation of low-stakes calls — the question is whether the high-stakes ones stay yours.", check: "Which recent decision would you not have delegated?" },
  novelty: { alternative: "Exploration phases look exactly like this on purpose — the check is whether one thing eventually gets picked.", check: "Which of the started things still matters a month later?" },
  no_verify: { alternative: "Verification may happen off-screen — in tests, in practice, in results.", check: "Where did the last confident answer get checked, if anywhere?" },
  proxy_conversation: { alternative: "Rehearsing with AI before a hard conversation can be preparation rather than avoidance — if the conversation eventually happens.", check: "Has the real conversation happened yet?" },
};

export function composeMirrorResult(analysis: MirrorAnalysis, followups?: Answers): Reflection {
  const a = analysis;
  const sections: Section[] = [];

  // evidence pool: the categories' counts and examples, plus any typed follow-ups
  const evidence: Evidence[] = a.categories.slice(0, 8).map((c) => ({
    id: `ev-cat-${c.id}`,
    statement: `${c.label}: ${c.count} of ${a.promptCount} pasted prompts (e.g. “${c.example}”)`,
    sourcePrompt: c.example,
  }));
  evidence.push({ id: "ev-count", statement: `You pasted ${a.promptCount} prompt${a.promptCount === 1 ? "" : "s"} and chose which ones to include` });

  sections.push({
    heading: "Your AI use in one sentence",
    kind: "summary",
    paragraphs: [a.summary],
    note: "This describes the prompts you pasted — not your whole life, and not who you are.",
  });

  if (a.categories.length) {
    sections.push({
      heading: "Your main uses",
      kind: "facts",
      bullets: a.categories.slice(0, 6).map((c) => `${c.label} — ${c.count} of ${a.promptCount} prompts. e.g. “${c.example}”`),
    });
  }

  if (a.roles.length) {
    sections.push({
      heading: "The role you give AI",
      bullets: a.roles.map((r) => `${r.label} (${r.count} prompts) — ${r.detail}.`),
      note: "None of these roles is automatically healthy or unhealthy. They're just the jobs you've been handing it.",
    });
  }

  if (a.habits.length) {
    sections.push({ heading: "How you work with AI", bullets: a.habits });
  }

  if (a.subjects.length) {
    sections.push({
      heading: "What appears to matter most right now",
      bullets: a.subjects.map((s) => `“${s.term}” — comes up in ${s.count} prompts`),
      note: "Share of the prompts you pasted — a measure of this prompt set, not of what matters in your life.",
    });
  }

  if (a.categories.length) {
    sections.push({
      heading: "Share of the prompts you pasted",
      bullets: a.categories.map((c) => `${c.label}: ${c.count} prompt${c.count === 1 ? "" : "s"} (${c.pct}%)`),
      note: "A prompt can count in more than one category, so these can add up past 100%.",
    });
  }

  if (a.missing.length) {
    sections.push({
      heading: "What may be missing",
      paragraphs: ["Within the prompts you pasted, very little attention went to:"],
      bullets: a.missing,
      note: "Absent here doesn't mean absent from your life. It may just live somewhere other than your AI window.",
    });
  }

  if (a.strengths.length) {
    sections.push({ heading: "Strengths visible in your prompts", bullets: a.strengths });
  }

  if (a.traps.length) {
    sections.push({
      heading: "Patterns worth watching",
      kind: "interpretations",
      interpretations: a.traps.map((t) => ({
        id: `int-${t.id}`,
        possibility: t.text.replace(/^One pattern worth watching: /, ""),
        evidenceIds: evidence.filter((e) => e.id.startsWith("ev-cat-")).map((e) => e.id).slice(0, 3),
        confidence: "tentative" as const,
        alternative: TRAP_ALTS[t.id]?.alternative,
        checkQuestion: TRAP_ALTS[t.id]?.check,
      })),
      note: "Only you know whether these fit. They're possibilities from a limited window, not verdicts.",
    });
  }

  sections.push({
    heading: "One experiment for using AI better",
    kind: "experiment",
    experiment: {
      title: "A one-week experiment",
      action: a.experiment,
      rationale: a.traps[0]
        ? "It targets the first pattern worth watching above — the one your prompt set showed most clearly."
        : `It follows from your biggest use: ${a.categories[0]?.phrase ?? "how you used AI in this set"}.`,
      duration: "One week",
      observe: ["Whether it changed what you asked AI for", "Whether the pattern it targets showed up again"],
      permissionToAdjust: "If it doesn't fit your actual week, shrink it — one honest try produces more information than seven intended ones.",
    },
  });

  sections.push({
    heading: "What might challenge this reading",
    kind: "challenge",
    bullets: [
      "You chose which prompts to paste — the selection itself shapes everything above.",
      a.promptCount < 10
        ? `${a.promptCount} prompts is a small sample; a different batch could tell a different story.`
        : "These prompts may span an unknown stretch of time — a busy season can dominate a set like this.",
      "Word-matching can miscategorize — a prompt about a “budget app you're building” counts as money and building alike.",
    ],
  });

  if (a.pastedAnalysis.count > 0) {
    sections.push({
      heading: "Pasted analysis, not confirmed fact",
      kind: "custom",
      paragraphs: [
        `${a.pastedAnalysis.count} of the lines you pasted read like an AI's analysis of you rather than a prompt you wrote (e.g. “${a.pastedAnalysis.example}”). WhatAmIAI treats lines like that as pasted content — claims you can examine — not as facts about you. Nothing on this page restates them as true. You decide whether they fit.`,
      ],
    });
  }

  sections.push({
    heading: "What these prompts can't tell you",
    bullets: [
      "Your personality, motives, or mental health.",
      "Your values, or how you treat people away from a keyboard.",
      "Whether any absent topic is absent from your life.",
      "Anything about you that you didn't already put into words.",
    ],
  });

  // follow-up answers, if given — the user's review of the read, kept
  // separate and senior to the word-counting above
  if (followups) {
    const read: Observation[] = [];
    const fev = (id: string, label: string, sensitive?: boolean): string => {
      const v = answerText(followups, id);
      evidence.push(
        sensitive
          ? { id: `ev-fu-${id}`, statement: `${label} — in your words: “${v}”`, sourceQuestionId: id, sourceAnswer: v, sensitive: "written", redactedStatement: `${label} — a written answer (kept private)` }
          : { id: `ev-fu-${id}`, statement: `${label} — you selected: ${v}`, sourceQuestionId: id, sourceAnswer: v }
      );
      return `ev-fu-${id}`;
    };
    const acc = answerText(followups, "accurate");
    if (acc)
      read.push({
        id: "obs-fu-acc",
        statement:
          acc === "Honestly, not much of it"
            ? "You marked this read as mostly inaccurate. Where this page and your account disagree, your account wins — it saw the context; the word-counter didn't."
            : `You said the most accurate part was: ${acc.toLowerCase()}.`,
        evidenceIds: [fev("accurate", "Which part felt most accurate")],
        confidence: "direct",
      });
    const sc = answerText(followups, "start_complete");
    if (sc === "Starting")
      read.push({ id: "obs-fu-sc", statement: "You said you use AI more for starting than completing. That makes the experiment above more relevant than anything else on this page.", evidenceIds: [fev("start_complete", "Starting or completing")], confidence: "direct" });
    else if (sc === "Completing")
      read.push({ id: "obs-fu-sc", statement: "You said you use AI more for completing than starting — a pattern many people never build.", evidenceIds: [fev("start_complete", "Starting or completing")], confidence: "direct" });
    const mo = answerText(followups, "matters_offscreen");
    if (mo) read.push({ id: "obs-fu-mo", statement: `The recurring topic that matters most off-screen, in your words: “${mo}”.`, evidenceIds: [fev("matters_offscreen", "What matters most off-screen", true)], confidence: "direct" });
    const px = answerText(followups, "proxy");
    if (px === "Yes" || px === "Maybe")
      read.push({ id: "obs-fu-px", statement: "You said there may be a conversation or decision being routed through AI instead of handled directly. Worth naming what it is — and who it's with.", evidenceIds: [fev("proxy", "A conversation routed through AI")], confidence: "direct" });
    const bf = answerText(followups, "benefit");
    if (bf) read.push({ id: "obs-fu-bf", statement: `Most real-world benefit so far, in your words: “${bf}”. More of that.`, evidenceIds: [fev("benefit", "Most real-world benefit", true)], confidence: "direct" });
    if (read.length) sections.push({ heading: "Your read on it", kind: "observations", observations: read, note: "Your review of the analysis — kept senior to the analysis itself." });
  }

  sections.push({
    heading: "Continue the reflection",
    kind: "questions",
    bullets: [
      followups ? "What important context is missing that no prompt window could show?" : "Which part of this read feels least accurate? (The follow-up questions below the result let you say so.)",
      a.missing.length ? `Is “${a.missing[0]}” genuinely absent from your life, or just from this window?` : "What do you deliberately keep away from AI — and why?",
    ],
  });

  const followupHit = followups ? assessSafetyAll(["matters_offscreen", "benefit"].map((id) => answerText(followups, id))) : null;
  const hit = [a.safety, followupHit].filter((h) => h && h.level !== "mention").sort((x, y) => (y!.level === "immediate" ? 1 : 0) - (x!.level === "immediate" ? 1 : 0))[0] ?? null;

  return {
    id: newId(),
    mode: "mirror",
    title: `AI Mirror — ${a.promptCount} prompts`,
    createdAt: Date.now(),
    sections,
    evidence,
    schemaVersion: REFLECTION_SCHEMA_VERSION,
    safetyFlagged: !!hit,
    meta: {
      ...(hit ? { safetyKind: hit.kind, safetyLevel: hit.level } : {}),
      top: a.categories.slice(0, 3).map((c) => c.label),
      traps: a.traps.map((t) => t.id),
      subjects: a.subjects.slice(0, 5).map((s) => s.term),
      planHeavy: a.categories.slice(0, 3).some((c) => c.id === "plan" || c.id === "build"),
      relationshipQ: a.categories.some((c) => c.id === "relationships" && c.count >= 2),
      decideCount: a.categories.find((c) => c.id === "decide")?.count ?? 0,
    },
  };
}
