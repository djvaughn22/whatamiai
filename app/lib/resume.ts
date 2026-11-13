// "Pick up where you left off" on the home page (owner direction, Nov 12:
// easy ways back, on-device only). Reads the drafts the tools ALREADY keep
// in this browser — no new storage key, nothing sent anywhere. A draft only
// counts when someone actually answered something: Money Check saves an
// all-empty draft just by opening it.

import { PATTERN_QUESTIONS } from "./patternsEngine";

type Store = Pick<Storage, "getItem">;
export type DraftResume = { href: string; label: string; detail: string };

function read(store: Store, key: string): unknown {
  try {
    const raw = store.getItem(key);
    return raw == null ? null : JSON.parse(raw);
  } catch {
    return null; // blocked or damaged: skip it, never break the home page
  }
}

function answerCount(v: unknown): number {
  const answers = (v as { answers?: unknown } | null)?.answers;
  return answers && typeof answers === "object" && !Array.isArray(answers) ? Object.keys(answers).length : 0;
}

export function draftResumes(store: Store): DraftResume[] {
  const out: DraftResume[] = [];

  const situation = answerCount(read(store, "wai3-situation-draft"));
  if (situation > 0) out.push({ href: "/situation", label: "🧭 My Situation", detail: `${situation} answer${situation === 1 ? "" : "s"} in, keep going` });

  const patterns = answerCount(read(store, "wai3-patterns-draft"));
  if (patterns > 0) out.push({ href: "/patterns", label: "🔁 My Overall Patterns", detail: `${Math.min(patterns, PATTERN_QUESTIONS.length)} of ${PATTERN_QUESTIONS.length} answered` });

  const money = read(store, "wai-money-draft-v1") as Record<string, unknown> | null;
  if (money && typeof money === "object" && Object.values(money).some((x) => typeof x === "string" && x.trim() !== "")) {
    out.push({ href: "/money", label: "💵 Money Check", detail: "Your numbers are still here" });
  }

  const react = read(store, "wai-react-v1") as { done?: unknown } | null;
  const cards = Array.isArray(react?.done) ? react.done.length : 0;
  if (cards > 0) out.push({ href: "/react", label: "⚡ How Do I React?", detail: `${cards} card${cards === 1 ? "" : "s"} done` });

  return out;
}
