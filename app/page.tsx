"use client";
// WhatAmIAI.com — landing + entry screen.
// Seven ways in. Every mode is tap-first,
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
    text: "Pick one decision, conflict, or place you feel stuck and answer eight quick taps. You get a name for it, one thing to double-check, and one step for the week.",
    button: "Name my situation",
  },
  {
    href: "/money",
    emoji: "💵",
    name: "Money Check",
    time: "3 numbers + 3 taps · 60 seconds",
    text: "Enter your monthly take-home pay, must-pay bills, and debt payments, then tap three answers. You see what's left each month, your money pattern, and one next step. Nothing leaves your device.",
    button: "Show me my math",
  },
  {
    href: "/react",
    emoji: "⚡",
    name: "How Do I React?",
    time: "Real situations · tap your honest move",
    text: "Everyday moments like getting cut off in traffic or a group chat blowing up. Tap what you'd really do, then see what it costs, a calmer thing to say, and plain advice. Over time it shows how you tend to react.",
    button: "Deal me a situation",
  },
  {
    href: "/habits",
    emoji: "🏃",
    name: "7-Day Habit Starter",
    time: "3 taps · plan + streak",
    text: "Pick exercise, eating, sleep, less phone, water, or quiet time. Three taps make a one-week plan that fits where you are, with a streak to keep.",
    button: "Build my week",
  },
  {
    href: "/phone",
    emoji: "📵",
    name: "Intentional Phone Use",
    time: "One pick · 7 small days",
    text: "Pick the one thing you'd like to use your phone less for. Then seven small days: notice it, remove one interruption, add one pause, and protect one moment.",
    button: "Start the 7 days",
  },
  {
    href: "/mirror",
    emoji: "🪞",
    name: "My AI Mirror",
    time: "Paste prompts · instant read",
    text: "Paste a few things you've asked an AI chat tool. See what they show about how you use it: the jobs you give it, your habits, and patterns to watch.",
    button: "Analyze my prompts",
  },
  {
    href: "/patterns",
    emoji: "🔁",
    name: "My Overall Patterns",
    time: "15 questions · almost all taps",
    text: "Fifteen questions, mostly taps, about how you start and finish things, decide, and handle pressure and conflict, and whether your time goes to what you say matters most.",
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
          Short tap-to-answer tools for thinking through a decision, your money, how you react, a habit, or your phone.
        </p>
        <p style={{ fontSize: 17, color: pal.sub, lineHeight: 1.7, maxWidth: 480, margin: "0 auto" }}>
          Most take a minute or two. Each one ends with what it noticed and one small next step. Your answers stay on this device.
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
          Not a personality test, not a diagnosis, not a label — these tools name situations and habits, never people. Your answers stay on this device unless you copy or share them yourself. It can&apos;t replace a counselor, a pastor, or someone who knows you well; if you&apos;re under 18, use it with a parent or trusted adult.
        </p>
      </Card>
    </Shell>
  );
}
