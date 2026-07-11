"use client";
// WhatAmIAI.com — landing + entry screen.
// Three ways in: My AI Mirror, My Situation, My Overall Patterns.

import { useEffect, useState } from "react";
import { listSaved } from "./lib/storage";
import { Card, PageHead, PrimaryBtn, Shell, usePalette } from "./components/ui";

const MODES = [
  {
    href: "/mirror",
    emoji: "🪞",
    name: "My AI Mirror",
    text: "Paste prompts you've asked your usual AI and see what those questions suggest about how you actually use it — what you return to, and where your attention goes.",
    button: "Analyze my prompts",
  },
  {
    href: "/situation",
    emoji: "🧭",
    name: "My Situation",
    text: "Think carefully through one decision, problem, relationship, habit, or season — with questions that separate facts, feelings, assumptions, and what's actually yours to do.",
    button: "Examine a situation",
  },
  {
    href: "/patterns",
    emoji: "🔁",
    name: "My Overall Patterns",
    text: "A broader guided look at how you tend to start, finish, decide, avoid, relate, respond to pressure, and follow through — built on real examples, not adjectives.",
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
        <p style={{ fontSize: 17, color: pal.sub, lineHeight: 1.7, maxWidth: 480, margin: "0 auto" }}>
          Take an honest look at where you are. Guided reflection that runs on your device — it helps you notice patterns and choose a next step.
        </p>
        <p style={{ fontSize: 15, fontWeight: 700, color: pal.text, margin: "14px auto 0" }}>
          Not a personality test. Not a diagnosis. Not a label.
        </p>
      </div>

      <PageHead pal={pal} title="What would you like to understand?" />

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {MODES.map((m) => (
          <Card key={m.href} pal={pal}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <span style={{ fontSize: 28, lineHeight: 1 }} aria-hidden>{m.emoji}</span>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 19, fontWeight: 900, color: pal.text, margin: "0 0 6px" }}>{m.name}</h2>
                <p style={{ fontSize: 14.5, color: pal.sub, lineHeight: 1.6, margin: "0 0 14px" }}>{m.text}</p>
                <PrimaryBtn pal={pal} onClick={() => (window.location.href = m.href)}>{m.button} →</PrimaryBtn>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <p style={{ fontSize: 14, color: pal.sub, textAlign: "center", margin: "18px 0 0", lineHeight: 1.6 }}>
        Not sure where to start? <a href="/situation" style={{ color: pal.brand, fontWeight: 800, textDecoration: "none" }}>Start with My Situation</a> — one thing, thought through. You can do any mode on its own and combine results later.
      </p>

      {savedCount > 0 && (
        <p style={{ textAlign: "center", margin: "16px 0 0" }}>
          <a href="/saved" style={{ color: pal.text, fontWeight: 800, fontSize: 15, textDecoration: "none", border: `2px solid ${pal.border}`, borderRadius: 50, padding: "10px 22px", display: "inline-block" }}>
            My saved reflections ({savedCount})
          </a>
        </p>
      )}

      <Card pal={pal} style={{ marginTop: 28, textAlign: "center" }}>
        <p style={{ fontSize: 14, color: pal.sub, lineHeight: 1.7, margin: 0 }}>
          Your answers stay on this device unless you choose to copy or share them. This tool can help you reflect, but it can&apos;t tell you who you are, diagnose you, or replace a counselor, a pastor, or someone who knows you well. If you&apos;re under 18, use it with a parent or trusted adult.
        </p>
      </Card>
    </Shell>
  );
}
