// Exports for a finished reflection: copy, Markdown, JSON, snapshot,
// print, and the optional continue-with-an-AI prompt.
// Nothing is ever auto-sent anywhere, and no content goes into a URL.

import type { Reflection } from "./types";
import { MODE_LABEL } from "./types";

function dateStr(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export function toMarkdown(r: Reflection): string {
  const lines: string[] = [`# ${r.title}`, "", `*${MODE_LABEL[r.mode]} — ${dateStr(r.createdAt)} — WhatAmIAI.com*`, ""];
  for (const s of r.sections) {
    lines.push(`## ${s.heading}`, "");
    for (const p of s.paragraphs ?? []) lines.push(p, "");
    if (s.bullets?.length) {
      for (const b of s.bullets) lines.push(`- ${b}`);
      lines.push("");
    }
    if (s.note) lines.push(`> ${s.note}`, "");
  }
  return lines.join("\n");
}

export function toPlainText(r: Reflection): string {
  const lines: string[] = [r.title, `${MODE_LABEL[r.mode]} — ${dateStr(r.createdAt)}`, ""];
  for (const s of r.sections) {
    lines.push(s.heading.toUpperCase(), "");
    for (const p of s.paragraphs ?? []) lines.push(p, "");
    for (const b of s.bullets ?? []) lines.push(`• ${b}`);
    if (s.bullets?.length) lines.push("");
    if (s.note) lines.push(`(${s.note})`, "");
  }
  return lines.join("\n");
}

/** Short version for pasting into a text or email. Never auto-sent. */
export function toSnapshot(r: Reflection): string {
  const first = r.sections[0];
  const firstLine = first?.paragraphs?.[0] ?? first?.bullets?.[0] ?? "";
  const step = r.sections.find((s) => /next step|experiment/i.test(s.heading));
  const stepLine = step?.paragraphs?.[0] ?? step?.bullets?.[0] ?? "";
  return [
    `${r.title} (${dateStr(r.createdAt)})`,
    firstLine,
    stepLine ? `Next: ${stepLine}` : "",
    "— from a private reflection on whatamiai.com",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function toJSONExport(r: Reflection): string {
  // meta is internal plumbing for the combined view; keep exports clean.
  const { meta: _meta, ...rest } = r;
  return JSON.stringify(rest, null, 2);
}

/** Optional secondary feature: a structured prompt for any external AI. */
export function toAIPrompt(r: Reflection): string {
  return [
    "I completed a guided self-reflection (on whatamiai.com) and I'd like your help thinking it through further.",
    "",
    "Ground rules for this conversation:",
    "- Do not diagnose me, label me, or assign me a personality type.",
    "- Keep observations clearly separate from facts; say \"one possibility\" rather than \"the real reason.\"",
    "- Don't claim to know my motives, my mental health, or what I should do with my life.",
    "- Ask me clarifying questions before drawing conclusions.",
    "- Challenge my assumptions, including the ones in the summary below.",
    "- If anything touches safety, health, legal, or other high-stakes territory, recommend the right kind of real person to talk to.",
    "- The judgment calls stay with me.",
    "",
    "Here is my reflection summary:",
    "",
    toPlainText(r),
  ].join("\n");
}

export function downloadFile(filename: string, content: string, type = "text/plain"): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function safeFilename(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "reflection";
}
