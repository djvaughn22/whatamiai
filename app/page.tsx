"use client";
// WhatAmIAI.com — landing + entry screen.
// Six ways in. Every mode is tap-first,
// under two minutes to a result, and ends with a named pattern, a blind
// spot, and one concrete step.

import { useEffect, useState } from "react";
import { listSaved } from "./lib/storage";
import { Card, PageHead, PrimaryBtn, Shell, usePalette } from "./components/ui";

const MODES = [
  {
    href: "/situation",
    emoji: "🧭",
    name: "My Situation",
    time: "About 8 taps · under a minute",
    text: "One decision, conflict, or stuck place. Eight taps and it gets named — the shape it has, the blind spot to check, and one step for the next seven days.",
    button: "Name my situation",
  },
  {
    href: "/money",
    emoji: "💵",
    name: "Money Check",
    time: "3 numbers + 3 taps · 60 seconds",
    text: "Most people have never seen their own margin written down. Three numbers, three taps — your real math, your money pattern, and one move. Nothing leaves your device.",
    button: "Show me my math",
  },
  {
    href: "/react",
    emoji: "⚡",
    name: "How Do I React?",
    time: "Real situations · tap your honest move",
    text: "Cut off in traffic. Credit stolen at work. The group chat on fire. Tap what you'd really do, get a no-shame read, a steadier script, and solid counsel — and slowly discover your reaction lean.",
    button: "Deal me a situation",
  },
  {
    href: "/habits",
    emoji: "🏃",
    name: "7-Day Starter",
    time: "3 taps · plan + streak",
    text: "Exercise, eating, sleep, less phone, water, quiet time. Three taps build a week sized to where you actually are — with a streak to keep and a best record to beat.",
    button: "Build my week",
  },
  {
    href: "/mirror",
    emoji: "🪞",
    name: "My AI Mirror",
    time: "Paste prompts · instant read",
    text: "Paste prompts you've asked your usual AI and see what they say about how you really use it — the roles you hand it, the habits, and the patterns worth watching.",
    button: "Analyze my prompts",
  },
  {
    href: "/patterns",
    emoji: "🔁",
    name: "My Overall Patterns",
    time: "15 questions · almost all taps",
    text: "The wider look: how you start, finish, decide, handle pressure and conflict — and whether what you say matters most actually gets your best time.",
    button: "Explore my patterns",
  },
];

export default function Home() {
  const pal = usePalette();
  const [savedCount, setSavedCount] = useState(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSavedCount(listSaved().length);
  }, []);

  return (
    <Shell pal={pal}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 50, marginBottom: 16 }}>🪞</div>
        <h1 style={{ fontSize: "clamp(2rem, 10vw, 2.8rem)", fontWeight: 900, color: pal.text, margin: "0 0 10px", lineHeight: 1.05 }}>
          WhatAmIAI<span style={{ color: pal.brand }}>.com</span>
        </h1>
        <p style={{ fontSize: 18, fontWeight: 800, color: pal.brand, margin: "0 0 14px", lineHeight: 1.3 }}>
          Don&apos;t put me in a box. Just help me think.
        </p>
        <p style={{ fontSize: 17, fontWeight: 700, color: pal.text, lineHeight: 1.5, maxWidth: 480, margin: "0 auto 10px" }}>
          Use AI as a mirror. See what your prompts, choices, and habits reveal.
        </p>
        <p style={{ fontSize: 17, color: pal.sub, lineHeight: 1.7, maxWidth: 480, margin: "0 auto" }}>
          Fast, honest tools for real life — reactions, situations, money, habits. Almost everything is a tap, every result ends with a named pattern, a blind spot, and one step. It all runs on your device.
        </p>
      </div>

      <PageHead pal={pal} title="What would you like to understand?" />

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {MODES.map((m) => (
          <Card key={m.href} pal={pal}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <span style={{ fontSize: 28, lineHeight: 1 }} aria-hidden>{m.emoji}</span>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 19, fontWeight: 900, color: pal.text, margin: "0 0 2px" }}>{m.name}</h2>
                <p style={{ fontSize: 12.5, fontWeight: 800, color: pal.brand, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.time}</p>
                <p style={{ fontSize: 14.5, color: pal.sub, lineHeight: 1.6, margin: "0 0 14px" }}>{m.text}</p>
                <PrimaryBtn pal={pal} onClick={() => (window.location.href = m.href)}>{m.button} →</PrimaryBtn>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {savedCount > 0 && (
        <p style={{ textAlign: "center", margin: "18px 0 0" }}>
          <a href="/saved" style={{ color: pal.text, fontWeight: 800, fontSize: 15, textDecoration: "none", border: `2px solid ${pal.border}`, borderRadius: 50, padding: "10px 22px", display: "inline-block" }}>
            My saved reflections ({savedCount})
          </a>
        </p>
      )}

      <Card pal={pal} style={{ marginTop: 28, textAlign: "center" }}>
        <p style={{ fontSize: 14, color: pal.sub, lineHeight: 1.7, margin: 0 }}>
          Not a personality test, not a diagnosis, not a label — these tools name situations and habits, never people. Everything stays on this device unless you copy or share it yourself. It can&apos;t replace a counselor, a pastor, or someone who knows you well; if you&apos;re under 18, use it with a parent or trusted adult.
        </p>
      </Card>
    </Shell>
  );
}
