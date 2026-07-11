// Combined view — careful comparisons across saved reflections from
// different modes. Neither source outranks the other; each is used to
// test the other.

import type { Reflection, Section } from "./types";
import { newId } from "./types";

const asStr = (v: unknown): string => (typeof v === "string" ? v : "");
const asArr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

export function composeCombined(saved: Reflection[]): Reflection | null {
  const mirror = saved.find((r) => r.mode === "mirror");
  const situation = saved.find((r) => r.mode === "situation");
  const patterns = saved.find((r) => r.mode === "patterns");
  const modes = [mirror, situation, patterns].filter(Boolean).length;
  if (modes < 2) return null;

  const cmp: string[] = [];

  const mTop = asArr(mirror?.meta?.top);
  const mTraps = asArr(mirror?.meta?.traps);
  const pStart = asStr(patterns?.meta?.startFinish);
  const pSeek = asStr(patterns?.meta?.seek);
  const pMatters = asStr(patterns?.meta?.matters);
  const pGetsBest = asStr(patterns?.meta?.getsBest);

  if (mirror && patterns) {
    if ((mirror.meta?.planHeavy || mTraps.includes("plans_no_finish")) && pStart === "I start a lot and finish a little")
      cmp.push("You use AI heavily to plan and build, and your broader assessment says finishing is harder than starting. A useful experiment may be to make completion — not ideation — the required final step of each AI session.");
    if (pMatters && (pGetsBest === "Honestly, no" || pGetsBest === "I'm not sure") && mTop.length)
      cmp.push(`You said “${pMatters}” matters most, while your pasted prompts mostly focus on ${mTop.slice(0, 2).join(" and ").toLowerCase()}. Prompts aren't life — but if the pattern holds off-screen too, attention and priority have drifted apart.`);
    if (Number(mirror.meta?.decideCount ?? 0) >= 3 && pSeek === "Reassurance from someone")
      cmp.push("Your prompts hand AI a lot of decisions, and your assessment says reassurance is what you reach for before deciding. Together that suggests the hard part isn't information — it's owning the call. Writing your own answer first, then asking for the strongest case against it, keeps the judgment with you.");
    if (mTraps.includes("reassurance_loop") && pSeek === "More information")
      cmp.push("Your prompts show repeated okay-checking, while you describe yourself as an information-gatherer. Worth asking which one is actually running the show on hard days.");
  }

  if (mirror && situation) {
    if (mirror.meta?.relationshipQ && situation.meta?.guessing)
      cmp.push("You ask AI a fair amount about other people's words and motives, and your situation review shows at least one important assumption that hasn't been checked directly. The person can answer what the model can only guess.");
    const want = asStr(situation.meta?.want);
    if (want && mTop.length)
      cmp.push(`In your situation review you said you want: “${want}”. Your AI prompts meanwhile concentrate on ${mTop[0]?.toLowerCase()}. If those point the same direction, good — if not, one of them is getting your attention out of habit.`);
  }

  if (situation && patterns) {
    if (pStart === "I start a lot and finish a little")
      cmp.push("Your broader pattern says starting comes easier than finishing. Whatever next step came out of your situation review, treat finishing it as the test — one completed small step outweighs another round of reflection.");
    if (pSeek === "Certainty" || pSeek === "More information")
      cmp.push("Across both views you tend to wait on more input before acting. Check whether the situation you examined actually lacks information — or just lacks a decision.");
  }

  const sections: Section[] = [];
  sections.push({
    heading: "What this combines",
    paragraphs: [
      `This private summary compares ${[mirror && "your AI Mirror", situation && "your Situation review", patterns && "your Overall Patterns"].filter(Boolean).join(", ")}. Neither source outranks the other — each is a different window, and both are limited.`,
    ],
  });

  if (cmp.length) {
    sections.push({ heading: "Where the views meet", bullets: cmp, note: "Careful comparisons, not conclusions. Only you know which of these actually fit." });
  } else {
    sections.push({
      heading: "Where the views meet",
      paragraphs: ["No strong overlaps stood out between these reflections — which is itself worth noticing. Different windows showing different things usually means more of you is off-screen than on it."],
    });
  }

  sections.push({
    heading: "How to use this",
    bullets: [
      "Treat the AI-prompt view as behavior (what you actually typed) and the assessments as self-report (how you see it). Where they disagree, reality gets the tiebreak.",
      "Pick one line above and test it against the next two weeks, not against your self-image.",
      "Share the one that stung with a person who knows you, and ask if it's true.",
    ],
  });

  return {
    id: newId(),
    mode: "combined",
    title: "Combined view",
    createdAt: Date.now(),
    sections,
  };
}
