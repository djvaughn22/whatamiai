// "Ask any AI": builds a research prompt the person copies into the chat tool
// they already use. WhatAmIAI sends nothing anywhere. The prompt carries
// ground rules against invented records, labels every fact with its evidence,
// and leaves living people out unless the person chooses otherwise.
// Whatever comes back is saved as an idea to check, never as a fact.

import { assessFact, LEVEL_INFO } from "./evidence";
import { formatDate } from "./dates";
import { activeFacts, displayName } from "./names";
import { parentsOf, partnersOf, childrenOf } from "./graph";
import { isLiving, privateLabel } from "./living";
import { openQuestions } from "./research";
import type { FamilyData, Id } from "./types";

export const AI_RULES = [
  "Do not invent people, dates, places, relationships or records.",
  "If you suggest a record, name the real collection or archive and say it still has to be checked.",
  "Label every suggestion as a possibility, not a fact.",
  "If the facts below conflict, say which records would settle it.",
  "If you don't know, say so.",
];

export function buildAiPrompt(data: FamilyData, personId: Id, opts: { includeLiving?: boolean } = {}): string {
  const name = (id: Id) => (!opts.includeLiving && isLiving(data, id) ? privateLabel(data, id) : displayName(data, id));
  const lines: string[] = [];
  lines.push("I'm researching my family history and want help planning what to look for next.");
  lines.push("");
  lines.push("Ground rules:");
  AI_RULES.forEach((r) => lines.push(`- ${r}`));
  lines.push("");
  const living = isLiving(data, personId) && !opts.includeLiving;
  lines.push(`Person: ${name(personId)}${living ? " (living, details withheld)" : ""}`);
  if (!living) {
    const facts = activeFacts(data, personId).filter((f) => f.type !== "name");
    if (facts.length) {
      lines.push("What I have, with how well each is supported:");
      for (const f of facts) {
        const level = LEVEL_INFO[assessFact(data, f.id).level].label;
        const what = [f.type, f.value, f.date ? formatDate(f.date) : "", f.place].filter(Boolean).join(", ");
        lines.push(`- ${what} [${level}]`);
      }
    }
  }
  const rel = (label: string, ids: Id[]) => {
    if (ids.length) lines.push(`${label}: ${ids.map(name).join("; ")}`);
  };
  rel("Parents", parentsOf(data, personId));
  rel("Spouses or partners", partnersOf(data, personId));
  rel("Children", childrenOf(data, personId));
  const qs = openQuestions(data, personId);
  if (qs.length) {
    lines.push("");
    lines.push("Open questions:");
    qs.forEach((q) => lines.push(`- ${q}`));
  }
  lines.push("");
  lines.push("Please suggest specific record collections to search, in order, and what each one could tell me.");
  return lines.join("\n");
}
