"use client";
// My Situation — pick the kind of situation, answer adaptive questions
// one at a time, get an organized view of it. Draft autosaves locally so
// a refresh never loses your place.

import { useEffect, useRef, useState } from "react";
import { buildSituationQuestions, composeSituationResult, SITUATION_TYPES, type SituationType } from "../lib/situationEngine";
import type { Answers, Reflection } from "../lib/types";
import { clearDraft, loadDraft, saveDraft } from "../lib/storage";
import QuestionFlow from "../components/QuestionFlow";
import ResultView from "../components/ResultView";
import { Card, PageHead, Shell, TopBar, usePalette } from "../components/ui";

type Stage = "type" | "flow" | "result";
type Draft = { type: SituationType; answers: Answers; idx: number };

const DRAFT_KEY = "wai3-situation-draft";

export default function SituationPage() {
  const pal = usePalette();
  const [stage, setStage] = useState<Stage>("type");
  const [type, setType] = useState<SituationType>("other");
  const [answers, setAnswers] = useState<Answers>({});
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState<Reflection | null>(null);
  const restored = useRef(false);

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const d = loadDraft<Draft>(DRAFT_KEY);
    if (d && Object.keys(d.answers).length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setType(d.type);
      setAnswers(d.answers);
      setIdx(d.idx);
      setStage("flow");
    }
  }, []);
  useEffect(() => {
    if (!restored.current || stage !== "flow") return;
    saveDraft<Draft>(DRAFT_KEY, { type, answers, idx });
  }, [stage, type, answers, idx]);

  const restart = () => {
    setAnswers({});
    setIdx(0);
    setResult(null);
    clearDraft(DRAFT_KEY);
    setStage("type");
  };

  const finish = () => {
    setResult(composeSituationResult(type, answers));
    clearDraft(DRAFT_KEY);
    setStage("result");
    window.scrollTo(0, 0);
  };

  return (
    <Shell pal={pal} narrow>
      <TopBar pal={pal} label="My Situation" />

      {stage === "type" && (
        <>
          <PageHead
            pal={pal}
            title="What kind of situation is it?"
            sub="About 8 taps, under a minute, no typing required. At the end, the situation gets named — its shape, its blind spot, and one step."
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
            {SITUATION_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setType(t.id);
                  setStage("flow");
                  window.scrollTo(0, 0);
                }}
                style={{ background: pal.card, color: pal.text, border: `2px solid ${pal.border}`, borderRadius: 14, padding: "16px 14px", fontSize: 15, fontWeight: 800, cursor: "pointer", textAlign: "left", minHeight: 56 }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Card pal={pal} style={{ marginTop: 22, textAlign: "center" }}>
            <p style={{ fontSize: 13.5, color: pal.sub, lineHeight: 1.65, margin: 0 }}>
              Your answers stay on this device. This helps you see how you currently see the situation — it isn&apos;t advice about major life changes, and it can&apos;t replace the people who know you.
            </p>
          </Card>
        </>
      )}

      {stage === "flow" && (
        <QuestionFlow
          pal={pal}
          questions={buildSituationQuestions(type)}
          answers={answers}
          onAnswers={setAnswers}
          onDone={finish}
          onRestart={restart}
          startIndex={idx}
          onIndex={setIdx}
        />
      )}

      {stage === "result" && result && (
        <>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 44, marginBottom: 8 }} aria-hidden>
              {typeof result.meta?.patternEmoji === "string" ? result.meta.patternEmoji : "🧭"}
            </div>
            <p style={{ fontSize: 13, fontWeight: 800, color: pal.sub, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 6px" }}>
              This situation has a shape
            </p>
            <h1 style={{ fontSize: "clamp(1.6rem, 8vw, 2.2rem)", fontWeight: 900, color: pal.text, margin: 0, lineHeight: 1.15 }}>
              {typeof result.meta?.pattern === "string" ? result.meta.pattern : "The read"}
            </h1>
          </div>
          <ResultView pal={pal} reflection={result} onRestart={restart} restartLabel="Examine another situation" />
        </>
      )}
    </Shell>
  );
}
