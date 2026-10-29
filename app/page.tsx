"use client";
// WhatAmIAI.com — home. One clear start (My Situation, ~1 minute), then
// the other tools grouped by what they help you do. If this browser has
// a plan in progress or saved reflections, those come first.

import { useEffect, useState } from "react";
import { listSaved } from "./lib/storage";
import { currentStreak, loadStreak } from "./lib/habitsEngine";
import { loadPhonePlan } from "./lib/phoneEngine";
import { ANALYTICS_NOTE, STORAGE_NOTE } from "./lib/privacyCopy";
import { Card, Eyebrow, Shell, usePalette, type Palette } from "./components/ui";

type Tool = { href: string; emoji: string; name: string; time: string; text: string };

const GROUPS: { title: string; tools: Tool[] }[] = [
  {
    title: "Think something through",
    tools: [
      { href: "/situation", emoji: "🧭", name: "My Situation", time: "8 taps", text: "A decision, a conflict, or a place you feel stuck. Get a name for it and one step for this week." },
      { href: "/react", emoji: "⚡", name: "How Do I React?", time: "1 tap a card", text: "Everyday moments. Pick what you'd really do, then see what it costs and a calmer thing to say." },
      { href: "/patterns", emoji: "🔁", name: "My Overall Patterns", time: "15 questions", text: "How you start and finish things, decide, and handle pressure." },
      { href: "/mirror", emoji: "🪞", name: "My AI Mirror", time: "Paste prompts", text: "Paste things you've asked an AI chat. See the jobs you give it and the habits in how you ask." },
    ],
  },
  {
    title: "Make a small change",
    tools: [
      { href: "/money", emoji: "💵", name: "Money Check", time: "3 numbers + 3 taps", text: "See what's really left each month after bills and debt, and one next step." },
      { href: "/habits", emoji: "🏃", name: "7-Day Habit Starter", time: "3 taps", text: "Exercise, eating, sleep, water, quiet time, or less phone. A one-week plan with a streak." },
      { href: "/phone", emoji: "📵", name: "Intentional Phone Use", time: "7 small days", text: "Pick the one thing you'd like to use your phone less for, then take it a day at a time." },
    ],
  },
];

type Resume = { href: string; label: string; detail: string };

function ToolRow({ pal, t }: { pal: Palette; t: Tool }) {
  return (
    <a href={t.href} className="wai-row" style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "16px 18px", background: pal.card, border: `1px solid ${pal.border}`, borderRadius: 16, textDecoration: "none" }}>
      <span style={{ fontSize: 26, lineHeight: 1.1 }} aria-hidden>{t.emoji}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", columnGap: 10, rowGap: 2 }}>
          <span style={{ fontSize: 17, fontWeight: 900, color: pal.text }}>{t.name}</span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: pal.sub }}>{t.time}</span>
        </span>
        <span style={{ display: "block", fontSize: 14.5, color: pal.sub, lineHeight: 1.55, marginTop: 4 }}>{t.text}</span>
      </span>
      <span aria-hidden style={{ color: pal.accentText, fontWeight: 900, fontSize: 18, alignSelf: "center" }}>→</span>
    </a>
  );
}

export default function Home() {
  const pal = usePalette();
  const [resume, setResume] = useState<Resume[]>([]);

  useEffect(() => {
    const items: Resume[] = [];
    try {
      const plan = loadPhonePlan();
      if (plan) items.push({ href: "/phone", label: "📵 Your phone week", detail: `${plan.done.length} of 7 days done` });
      const streak = loadStreak();
      if (streak) {
        const n = currentStreak(streak);
        items.push({ href: "/habits", label: "🏃 Your habit week", detail: n > 0 ? `${n}-day streak` : "Mark today when you do it" });
      }
      const saved = listSaved().length;
      if (saved > 0) items.push({ href: "/saved", label: "💾 Saved reflections", detail: `${saved} saved` });
    } catch {
      // storage blocked (private mode etc.) — the page works without it
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResume(items);
  }, []);

  return (
    <Shell pal={pal}>
      <section style={{ textAlign: "center", marginBottom: 28 }}>
        <h1 style={{ fontSize: "clamp(1.9rem, 8.5vw, 2.6rem)", fontWeight: 900, color: pal.text, margin: "0 0 12px", lineHeight: 1.1 }}>
          Think one thing through.
          <br />
          <span style={{ color: pal.accentText }}>Leave with a next step.</span>
        </h1>
        <p style={{ fontSize: 16.5, color: pal.sub, lineHeight: 1.6, maxWidth: 460, margin: "0 auto 22px" }}>
          Short tools you answer mostly by tapping. Each one shows what it noticed, a question to check it against, and one small thing to try. Save it, print it, or download it.
        </p>
        <a
          href="/situation"
          style={{ display: "inline-block", background: pal.brand, color: pal.ink, borderRadius: 50, padding: "15px 30px", fontSize: 16.5, fontWeight: 900, textDecoration: "none", minHeight: 48, boxSizing: "border-box" }}
        >
          Start with one situation →
        </a>
        <p style={{ fontSize: 13.5, color: pal.sub, margin: "10px 0 0" }}>About a minute. No sign-up.</p>
      </section>

      {resume.length > 0 && (
        <Card pal={pal} accent style={{ marginBottom: 28 }}>
          <Eyebrow pal={pal}>Pick up where you left off</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {resume.map((r) => (
              <a key={r.href} href={r.href} style={{ display: "flex", justifyContent: "space-between", gap: 12, color: pal.text, textDecoration: "none", fontWeight: 800, fontSize: 15.5, padding: "8px 0" }}>
                <span>{r.label}</span>
                <span style={{ color: pal.sub, fontWeight: 700, fontSize: 14 }}>{r.detail} →</span>
              </a>
            ))}
          </div>
        </Card>
      )}

      {GROUPS.map((g) => (
        <section key={g.title} style={{ marginBottom: 26 }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, color: pal.accentText, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px 4px" }}>{g.title}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {g.tools.map((t) => <ToolRow key={t.href} pal={pal} t={t} />)}
          </div>
        </section>
      ))}

      <div style={{ fontSize: 13.5, color: pal.sub, lineHeight: 1.65, padding: "4px 6px" }}>
        <p style={{ margin: "0 0 8px" }}>
          <strong style={{ color: pal.text }}>Where your answers go:</strong> {STORAGE_NOTE} {ANALYTICS_NOTE}
        </p>
        <p style={{ margin: 0 }}>
          Not a personality test or a diagnosis — these tools name situations and habits, not people. They don&apos;t replace a counselor, a pastor, or someone who knows you. Under 18? Use it with a parent or trusted adult.
        </p>
      </div>
    </Shell>
  );
}
