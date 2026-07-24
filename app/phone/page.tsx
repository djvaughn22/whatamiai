"use client";
// More Intentional Phone Use — pick one type of phone use to reduce, get
// the 7-day starter, mark days done as you go. Progress stays local.

import { useEffect, useState } from "react";
import {
  clearPhonePlan,
  loadPhonePlan,
  PHONE_DAYS,
  PHONE_FOCUS_OPTIONS,
  PHONE_NEXT_QUESTION,
  PHONE_POSSIBILITY,
  PHONE_PRINCIPLES,
  PHONE_REFLECTION_QUESTIONS,
  startPhonePlan,
  togglePhoneDay,
  type PhoneDay,
  type PhonePlan,
} from "../lib/phoneEngine";
import { Card, Eyebrow, GhostBtn, PageHead, PrimaryBtn, Shell, TopBar, usePalette, type Palette } from "../components/ui";

function DayCard({ pal, day, index, done, current, onToggle }: { pal: Palette; day: PhoneDay; index: number; done: boolean; current: boolean; onToggle: () => void }) {
  return (
    <Card pal={pal} accent={current} style={{ marginBottom: 14, opacity: done ? 0.72 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
        <h2 style={{ fontSize: 17, fontWeight: 900, color: pal.text, margin: 0 }}>{day.title}</h2>
        {current && !done && (
          <span style={{ fontSize: 11.5, fontWeight: 800, color: pal.brand, textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>Today</span>
        )}
      </div>
      {day.paragraphs.map((p) => (
        <p key={p} style={{ fontSize: 14.5, color: pal.text, lineHeight: 1.65, margin: "0 0 8px" }}>{p}</p>
      ))}
      {day.bullets && (
        <ul style={{ margin: "0 0 8px", paddingLeft: 22 }}>
          {day.bullets.map((b) => (
            <li key={b} style={{ fontSize: 14.5, color: pal.text, lineHeight: 1.65, marginBottom: 4 }}>{b}</li>
          ))}
        </ul>
      )}
      {day.note && <p style={{ fontSize: 13.5, color: pal.sub, lineHeight: 1.6, margin: "0 0 10px" }}>{day.note}</p>}
      <button
        type="button"
        aria-pressed={done}
        onClick={onToggle}
        style={{
          background: done ? pal.brand : "none",
          color: done ? pal.ink : pal.text,
          border: `2px solid ${done ? pal.brand : pal.border}`,
          borderRadius: 50,
          padding: "9px 18px",
          fontSize: 13.5,
          fontWeight: 800,
          cursor: "pointer",
          minHeight: 40,
          marginTop: 4,
        }}
      >
        {done ? `✓ Day ${index + 1} done` : `Mark day ${index + 1} done`}
      </button>
    </Card>
  );
}

export default function PhonePage() {
  const pal = usePalette();
  const [plan, setPlan] = useState<PhonePlan | null>(null);
  const [focus, setFocus] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlan(loadPhonePlan());
  }, []);

  const start = () => {
    if (!focus) return;
    setPlan(startPhonePlan(focus));
    window.scrollTo(0, 0);
  };

  const restart = () => {
    clearPhonePlan();
    setPlan(null);
    setFocus("");
    window.scrollTo(0, 0);
  };

  if (plan) {
    const doneCount = plan.done.length;
    const currentIndex = PHONE_DAYS.findIndex((_, i) => !plan.done.includes(i));
    return (
      <Shell pal={pal} narrow>
        <TopBar pal={pal} label="Intentional Phone Use" />

        <Card pal={pal} accent style={{ marginBottom: 20, textAlign: "center" }}>
          <Eyebrow pal={pal}>What you selected</Eyebrow>
          <p style={{ fontSize: 19, fontWeight: 900, color: pal.text, margin: "0 0 4px", lineHeight: 1.3 }}>
            You want to spend less time on your phone.
          </p>
          <p style={{ fontSize: 14.5, fontWeight: 700, color: pal.brand, margin: "0 0 10px" }}>
            This week: less {plan.focus.toLowerCase()}
          </p>
          <p style={{ fontSize: 14, color: pal.sub, lineHeight: 1.65, margin: 0 }}>
            {doneCount >= PHONE_DAYS.length
              ? "7 of 7 days done. Choose one rule to keep for another week."
              : `${doneCount} of 7 days done. This plan does not assume that all screen time is harmful. Its purpose is to help you notice which phone use you choose and which phone use seems to happen automatically.`}
          </p>
        </Card>

        {PHONE_DAYS.map((day, i) => (
          <DayCard key={day.title} pal={pal} day={day} index={i} done={plan.done.includes(i)} current={i === currentIndex} onToggle={() => setPlan(togglePhoneDay(plan, i))} />
        ))}

        <Card pal={pal} style={{ marginBottom: 14 }}>
          <Eyebrow pal={pal}>Two principles</Eyebrow>
          {PHONE_PRINCIPLES.map((p) => (
            <div key={p.title} style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: pal.text, margin: "0 0 4px" }}>{p.title}</p>
              <p style={{ fontSize: 14.5, color: pal.sub, lineHeight: 1.65, margin: 0 }}>{p.text}</p>
            </div>
          ))}
        </Card>

        <Card pal={pal} style={{ marginBottom: 14 }}>
          <Eyebrow pal={pal}>A possibility to examine</Eyebrow>
          {PHONE_POSSIBILITY.map((p) => (
            <p key={p} style={{ fontSize: 14.5, color: pal.text, lineHeight: 1.65, margin: "0 0 10px" }}>{p}</p>
          ))}
          <p style={{ fontSize: 14.5, color: pal.sub, lineHeight: 1.65, margin: "0 0 6px" }}>{PHONE_NEXT_QUESTION.lead}</p>
          <p style={{ fontSize: 15.5, fontWeight: 800, color: pal.brand, lineHeight: 1.5, margin: 0 }}>{PHONE_NEXT_QUESTION.question}</p>
        </Card>

        <Card pal={pal} style={{ marginBottom: 20 }}>
          <Eyebrow pal={pal}>Continue the reflection</Eyebrow>
          <p style={{ fontSize: 14.5, color: pal.sub, lineHeight: 1.65, margin: "0 0 10px" }}>Consider these questions:</p>
          <ol style={{ margin: 0, paddingLeft: 22 }}>
            {PHONE_REFLECTION_QUESTIONS.map((q) => (
              <li key={q} style={{ fontSize: 14.5, color: pal.text, lineHeight: 1.65, marginBottom: 6 }}>{q}</li>
            ))}
          </ol>
        </Card>

        <p style={{ fontSize: 12.5, color: pal.sub, textAlign: "center", margin: "0 0 14px", lineHeight: 1.6 }}>
          Your plan and progress stay in this browser — no account, nothing sent anywhere.
        </p>
        <p style={{ textAlign: "center", display: "flex", gap: 10, justifyContent: "center" }}>
          <GhostBtn pal={pal} small onClick={restart}>Choose a different focus</GhostBtn>
          <GhostBtn pal={pal} small onClick={() => (window.location.href = "/")}>← All modes</GhostBtn>
        </p>
      </Shell>
    );
  }

  return (
    <Shell pal={pal} narrow>
      <TopBar pal={pal} label="Intentional Phone Use" />
      <PageHead
        pal={pal}
        title="More intentional phone use"
        sub="This plan does not assume that all screen time is harmful. Its purpose is to help you notice which phone use you choose and which phone use seems to happen automatically."
      />

      <Card pal={pal} style={{ marginBottom: 18 }}>
        <Eyebrow pal={pal}>Before you begin</Eyebrow>
        <p style={{ fontSize: 14.5, color: pal.text, lineHeight: 1.65, margin: "0 0 14px" }}>
          Choose one type of phone use you want to reduce.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          {PHONE_FOCUS_OPTIONS.map((o) => {
            const selected = focus === o;
            return (
              <button
                key={o}
                type="button"
                aria-pressed={selected}
                onClick={() => setFocus(o)}
                style={{ textAlign: "left", background: selected ? pal.brand : pal.card, color: selected ? pal.ink : pal.text, border: `2px solid ${selected ? pal.brand : pal.border}`, borderRadius: 14, padding: "13px 16px", fontSize: 15, fontWeight: 700, cursor: "pointer", minHeight: 48 }}
              >
                {o}
              </button>
            );
          })}
        </div>
        <p style={{ fontSize: 13.5, color: pal.sub, lineHeight: 1.6, margin: 0 }}>
          Do not try to reduce everything at once.
        </p>
      </Card>

      <PrimaryBtn pal={pal} full disabled={!focus} onClick={start}>
        {focus ? "Start the 7 days →" : "Pick one type of phone use"}
      </PrimaryBtn>

      <p style={{ fontSize: 12.5, color: pal.sub, textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
        Your plan and progress stay in this browser — no account, nothing sent anywhere.
      </p>
      <p style={{ textAlign: "center", marginTop: 14 }}>
        <GhostBtn pal={pal} small onClick={() => (window.location.href = "/")}>← All modes</GhostBtn>
      </p>
    </Shell>
  );
}
