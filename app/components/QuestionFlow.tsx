"use client";
// Generic one-question-at-a-time flow: progress, Back, Skip, Start over
// (with confirmation), preserved answers, chips/choice/text inputs, and a
// calm inline safety notice when a typed answer needs one.

import { useEffect, useMemo, useRef, useState } from "react";
import type { Answers, Question } from "../lib/types";
import { checkSafety, SAFETY_COPY, type SafetyKind } from "../lib/safety";
import { Card, GhostBtn, PrimaryBtn, TextLink, type Palette } from "./ui";

export default function QuestionFlow({
  pal,
  questions,
  answers,
  onAnswers,
  onDone,
  onRestart,
  startIndex = 0,
  onIndex,
}: {
  pal: Palette;
  questions: Question[];
  answers: Answers;
  onAnswers: (a: Answers) => void;
  onDone: () => void;
  onRestart: () => void;
  startIndex?: number;
  onIndex?: (i: number) => void;
}) {
  const visible = useMemo(() => questions.filter((q) => !q.showIf || q.showIf(answers)), [questions, answers]);
  const [idx, setIdxRaw] = useState(Math.min(startIndex, Math.max(visible.length - 1, 0)));
  const [safety, setSafety] = useState<SafetyKind | null>(null);
  const advanceTimer = useRef<number | null>(null);
  useEffect(() => () => {
    if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
  }, []);
  const setIdx = (i: number) => {
    setIdxRaw(i);
    onIndex?.(i);
  };

  const q = visible[idx];
  if (!q) return null;
  const val = answers[q.id];
  const textVal = typeof val === "string" ? val : "";
  const chipVals = Array.isArray(val) ? val : [];

  const set = (v: string | string[]) => onAnswers({ ...answers, [q.id]: v });

  const advance = () => {
    setSafety(null);
    if (idx + 1 < visible.length) setIdx(idx + 1);
    else onDone();
  };

  const next = () => {
    if (q.kind === "text" && textVal.trim()) {
      const k = checkSafety(textVal);
      if (k && !safety) {
        setSafety(k); // show help once; user can still continue
        return;
      }
    }
    advance();
  };

  const back = () => {
    setSafety(null);
    if (idx > 0) setIdx(idx - 1);
  };

  const restart = () => {
    if (window.confirm("Start over? Your answers so far will be cleared.")) onRestart();
  };

  const pct = Math.round(((idx + 1) / visible.length) * 100);

  return (
    <div>
      {/* progress */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: pal.sub }}>{q.area}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: pal.sub }} aria-label={`Question ${idx + 1} of ${visible.length}`}>
            {idx + 1} / {visible.length}
          </span>
        </div>
        <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} style={{ height: 6, borderRadius: 4, background: pal.border }}>
          <div style={{ height: 6, borderRadius: 4, width: `${pct}%`, background: pal.brand }} />
        </div>
      </div>

      <h2 style={{ fontSize: 21, fontWeight: 900, color: pal.text, lineHeight: 1.35, margin: "0 0 6px" }}>{q.label}</h2>
      {q.help ? <p style={{ fontSize: 14, color: pal.sub, margin: "0 0 14px", lineHeight: 1.6 }}>{q.help}</p> : <div style={{ height: 14 }} />}

      {q.kind === "text" && (
        <textarea
          value={textVal}
          onChange={(e) => {
            setSafety(null);
            set(e.target.value);
          }}
          placeholder={q.placeholder}
          rows={4}
          aria-label={q.label}
          style={{ width: "100%", boxSizing: "border-box", background: pal.input, border: `2px solid ${textVal.trim() ? pal.brand : pal.border}`, borderRadius: 14, padding: "14px 16px", fontSize: 16, color: pal.text, lineHeight: 1.6, resize: "vertical", fontFamily: "inherit" }}
        />
      )}

      {q.kind === "choice" && (
        <div role="radiogroup" aria-label={q.label} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {q.options!.map((o) => {
            const selected = textVal === o;
            return (
              <button
                key={o}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  set(o);
                  // brief tick so the selection is visible before advancing
                  advanceTimer.current = window.setTimeout(advance, 120);
                }}
                style={{ textAlign: "left", background: selected ? pal.brand : pal.card, color: selected ? pal.ink : pal.text, border: `2px solid ${selected ? pal.brand : pal.border}`, borderRadius: 14, padding: "14px 16px", fontSize: 15.5, fontWeight: 700, cursor: "pointer", lineHeight: 1.45, minHeight: 48 }}
              >
                {o}
              </button>
            );
          })}
        </div>
      )}

      {q.kind === "chips" && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {q.options!.map((o) => {
            const selected = chipVals.includes(o);
            const max = q.maxChips ?? 3;
            return (
              <button
                key={o}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  if (selected) set(chipVals.filter((c) => c !== o));
                  else if (chipVals.length < max) set([...chipVals, o]);
                }}
                style={{ background: selected ? pal.brand : pal.card, color: selected ? pal.ink : pal.text, border: `2px solid ${selected ? pal.brand : pal.border}`, borderRadius: 50, padding: "11px 18px", fontSize: 14.5, fontWeight: 700, cursor: "pointer", minHeight: 44 }}
              >
                {o}
              </button>
            );
          })}
        </div>
      )}

      {safety && (
        <Card pal={pal} accent style={{ marginTop: 18 }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: pal.text, margin: "0 0 10px", lineHeight: 1.55 }}>{SAFETY_COPY[safety].lead}</p>
          {SAFETY_COPY[safety].lines.map((l, i) => (
            <p key={i} style={{ fontSize: 14.5, color: pal.text, margin: "0 0 8px", lineHeight: 1.6 }}>{l}</p>
          ))}
          <p style={{ fontSize: 13.5, color: pal.sub, margin: "10px 0 0", lineHeight: 1.6 }}>
            You can keep reflecting afterward — but please take care of the safety part first. Tap Next again to continue.
          </p>
        </Card>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 22, alignItems: "center", flexWrap: "wrap" }}>
        <GhostBtn pal={pal} onClick={back} small>
          ← Back
        </GhostBtn>
        {(q.kind === "text" || q.kind === "chips") && (
          <PrimaryBtn pal={pal} onClick={next}>
            Next →
          </PrimaryBtn>
        )}
        <GhostBtn pal={pal} small onClick={advance}>
          Skip
        </GhostBtn>
        <span style={{ marginLeft: "auto" }}>
          <TextLink pal={pal} onClick={restart}>Start over</TextLink>
        </span>
      </div>

      <p style={{ fontSize: 12.5, color: pal.sub, marginTop: 18, lineHeight: 1.6 }}>
        Answers save on this device as you go, so a refresh won&apos;t lose your place. Nothing is sent anywhere.
      </p>
    </div>
  );
}
