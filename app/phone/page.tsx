"use client";
// More Intentional Phone Use — pick one type of phone use to reduce, get
// the 7-day starter, mark days done as you go. Progress stays local.

import { ANALYTICS_NOTE, STORAGE_NOTE } from "../lib/privacyCopy";
import { useEffect, useState } from "react";
import {
  clearPhonePlan,
  composePhoneReflection,
  loadPhonePlan,
  PHONE_DAYS,
  PHONE_FOCUS_OPTIONS,
  PHONE_NEXT_QUESTION,
  PHONE_OUTCOMES,
  PHONE_POSSIBILITY,
  PHONE_PRINCIPLES,
  PHONE_REFLECTION_QUESTIONS,
  startPhonePlan,
  togglePhoneDay,
  updatePhonePlan,
  type PhoneDay,
  type PhonePlan,
} from "../lib/phoneEngine";
import { copyText, downloadFile, exportCategories, safeFilename, toAIPrompt, toJSONExport, toMarkdown, toPlainText } from "../lib/exporters";
import { saveReflection } from "../lib/storage";
import { Card, Eyebrow, GhostBtn, PageHead, PrimaryBtn, Shell, TopBar, usePalette, type Palette } from "../components/ui";

function OptField({ pal, label, value, onSave, rows }: { pal: Palette; label: string; value: string; onSave: (v: string) => void; rows?: number }) {
  const [v, setV] = useState(value);
  const style = { width: "100%", boxSizing: "border-box" as const, background: pal.input, border: `1px solid ${pal.border}`, borderRadius: 10, padding: "9px 12px", fontSize: 13.5, color: pal.text, fontFamily: "inherit", lineHeight: 1.5 };
  return (
    <label style={{ display: "block", marginBottom: 8 }}>
      <span style={{ display: "block", fontSize: 12.5, fontWeight: 800, color: pal.sub, marginBottom: 4 }}>{label} <span style={{ fontWeight: 700 }}>(optional)</span></span>
      {rows ? (
        <textarea value={v} rows={rows} onChange={(e) => setV(e.target.value)} onBlur={() => onSave(v)} style={{ ...style, resize: "vertical" }} />
      ) : (
        <input value={v} onChange={(e) => setV(e.target.value)} onBlur={() => onSave(v)} style={style} />
      )}
    </label>
  );
}

function DayCard({ pal, day, index, done, current, onToggle, children }: { pal: Palette; day: PhoneDay; index: number; done: boolean; current: boolean; onToggle: () => void; children?: React.ReactNode }) {
  return (
    <Card pal={pal} accent={current} style={{ marginBottom: 14, opacity: done ? 0.72 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
        <h2 style={{ fontSize: 17, fontWeight: 900, color: pal.text, margin: 0 }}>{day.title}</h2>
        {current && !done && (
          <span style={{ fontSize: 11.5, fontWeight: 800, color: pal.accentText, textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>Today</span>
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
      {children}
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
  const [flash, setFlash] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const note = (msg: string) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(""), 2600);
  };

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
    const patch = (p: Partial<PhonePlan>) => setPlan(updatePhonePlan(plan, p));
    const dayExtras = (i: number): React.ReactNode => {
      const bits: React.ReactNode[] = [];
      if (i === 0)
        bits.push(
          <OptField key="t" pal={pal} label="Total screen time you wrote down" value={plan.day1Total ?? ""} onSave={(v) => patch({ day1Total: v })} />,
          <OptField key="a" pal={pal} label="Your two most-used apps" value={plan.day1Apps ?? ""} onSave={(v) => patch({ day1Apps: v })} />
        );
      if (i === 5)
        bits.push(<OptField key="r" pal={pal} label="The replacement you picked" value={plan.replacement ?? ""} onSave={(v) => patch({ replacement: v })} />);
      if (i === 6)
        bits.push(
          <OptField key="k" pal={pal} label="One phone use worth keeping" value={plan.keepUse ?? ""} onSave={(v) => patch({ keepUse: v })} />,
          <OptField key="c" pal={pal} label="Today, compared with Day 1" value={plan.day7 ?? ""} onSave={(v) => patch({ day7: v })} rows={3} />
        );
      if (i === currentIndex && i !== 0 && i !== 5 && i !== 6)
        bits.push(<OptField key="n" pal={pal} label="A short note for today" value={plan.notes?.[i] ?? ""} onSave={(v) => patch({ notes: { ...(plan.notes ?? {}), [i]: v } })} />);
      return bits.length ? <div style={{ margin: "4px 0 10px" }}>{bits}</div> : null;
    };
    const reflection = () => composePhoneReflection(plan);
    return (
      <Shell pal={pal} narrow>
        <TopBar pal={pal} label="Intentional Phone Use" />

        <Card pal={pal} accent style={{ marginBottom: 20, textAlign: "center" }}>
          <Eyebrow pal={pal}>What you selected</Eyebrow>
          <p style={{ fontSize: 19, fontWeight: 900, color: pal.text, margin: "0 0 4px", lineHeight: 1.3 }}>
            You want to spend less time on your phone.
          </p>
          <p style={{ fontSize: 14.5, fontWeight: 700, color: pal.accentText, margin: "0 0 10px" }}>
            This week: less {plan.focus.toLowerCase()}
          </p>
          <p style={{ fontSize: 14, color: pal.sub, lineHeight: 1.65, margin: 0 }}>
            {doneCount >= PHONE_DAYS.length
              ? "7 of 7 days done. Choose one rule to keep for another week."
              : `${doneCount} of 7 days done. This plan does not assume that all screen time is harmful. Its purpose is to help you notice which phone use you choose and which phone use seems to happen automatically.`}
          </p>
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 12.5, fontWeight: 800, color: pal.sub, margin: "0 0 8px" }}>Optional — what should the reclaimed time serve?</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {PHONE_OUTCOMES.map((o) => {
                const selected = plan.outcome === o;
                return (
                  <button
                    key={o}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => patch({ outcome: selected ? "" : o })}
                    style={{ background: selected ? pal.brand : pal.card, color: selected ? pal.ink : pal.text, border: `2px solid ${selected ? pal.brand : pal.border}`, borderRadius: 50, padding: "7px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", minHeight: 36 }}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {PHONE_DAYS.map((day, i) => (
          <DayCard key={day.title} pal={pal} day={day} index={i} done={plan.done.includes(i)} current={i === currentIndex} onToggle={() => setPlan(togglePhoneDay(plan, i))}>
            {dayExtras(i)}
          </DayCard>
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
          <p style={{ fontSize: 15.5, fontWeight: 800, color: pal.accentText, lineHeight: 1.5, margin: 0 }}>{PHONE_NEXT_QUESTION.question}</p>
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

        <Card pal={pal} style={{ marginBottom: 20 }}>
          <Eyebrow pal={pal}>Keep it, share it, or take it further — your call</Eyebrow>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <GhostBtn pal={pal} small onClick={() => { saveReflection(reflection()); note("Saved — only in this browser. Find it under saved reflections."); }}>Save on this device</GhostBtn>
            <GhostBtn pal={pal} small onClick={async () => note((await copyText(toPlainText(reflection()))) ? "Summary copied." : "Couldn't copy — your browser blocked it.")}>Copy summary</GhostBtn>
            <GhostBtn pal={pal} small onClick={() => window.print()}>Print / save as PDF</GhostBtn>
            <GhostBtn pal={pal} small onClick={() => downloadFile(`${safeFilename(reflection().title)}.md`, toMarkdown(reflection()), "text/markdown")}>Export Markdown</GhostBtn>
            <GhostBtn pal={pal} small onClick={() => downloadFile(`${safeFilename(reflection().title)}.json`, toJSONExport(reflection()), "application/json")}>Export JSON</GhostBtn>
          </div>
          <div style={{ marginTop: 14 }}>
            <button
              type="button"
              aria-expanded={previewOpen}
              onClick={() => setPreviewOpen(!previewOpen)}
              style={{ background: "none", border: "none", color: pal.sub, fontSize: 12.5, fontWeight: 800, cursor: "pointer", padding: "0 0 8px", textDecoration: "underline" }}
            >
              {previewOpen ? "Hide what an AI prompt would include" : "See what an AI prompt would include"}
            </button>
            {previewOpen && (
              <ul style={{ margin: "0 0 10px", paddingLeft: 20 }}>
                {exportCategories(reflection()).map((c) => (
                  <li key={c} style={{ fontSize: 12.5, color: pal.sub, lineHeight: 1.6 }}>{c}</li>
                ))}
              </ul>
            )}
            <GhostBtn pal={pal} small onClick={async () => note((await copyText(toAIPrompt(reflection()))) ? "Prompt copied — paste it into the AI you use." : "Couldn't copy — your browser blocked it.")}>Continue this reflection with an AI</GhostBtn>
          </div>
          <p style={{ fontSize: 12, color: pal.sub, lineHeight: 1.6, margin: "12px 0 0" }}>
            Nothing is saved, copied, or exported unless you tap it.
          </p>
        </Card>

        {flash && (
          <p role="status" style={{ fontSize: 13.5, color: pal.accentText, fontWeight: 800, textAlign: "center", margin: "0 0 14px" }}>{flash}</p>
        )}

        <p style={{ fontSize: 12.5, color: pal.sub, textAlign: "center", margin: "0 0 14px", lineHeight: 1.6 }}>
          {STORAGE_NOTE} {ANALYTICS_NOTE}
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
        {STORAGE_NOTE} {ANALYTICS_NOTE}
      </p>
      <p style={{ textAlign: "center", marginTop: 14 }}>
        <GhostBtn pal={pal} small onClick={() => (window.location.href = "/")}>← All modes</GhostBtn>
      </p>
    </Shell>
  );
}
