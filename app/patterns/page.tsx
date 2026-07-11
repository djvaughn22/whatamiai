"use client";
// My Overall Patterns — the broader assessment. ~27 questions across ten
// areas; evidence over adjectives. Draft autosaves locally.

import { useEffect, useRef, useState } from "react";
import { composePatternsResult, PATTERN_QUESTIONS } from "../lib/patternsEngine";
import type { Answers, Reflection } from "../lib/types";
import { clearDraft, loadDraft, saveDraft } from "../lib/storage";
import QuestionFlow from "../components/QuestionFlow";
import ResultView from "../components/ResultView";
import { Card, PageHead, PrimaryBtn, Shell, TopBar, usePalette } from "../components/ui";

type Stage = "intro" | "flow" | "result";
type Draft = { answers: Answers; idx: number };

const DRAFT_KEY = "wai3-patterns-draft";

export default function PatternsPage() {
  const pal = usePalette();
  const [stage, setStage] = useState<Stage>("intro");
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
      setAnswers(d.answers);
      setIdx(d.idx);
      setStage("flow");
    }
  }, []);
  useEffect(() => {
    if (!restored.current || stage !== "flow") return;
    saveDraft<Draft>(DRAFT_KEY, { answers, idx });
  }, [stage, answers, idx]);

  const restart = () => {
    setAnswers({});
    setIdx(0);
    setResult(null);
    clearDraft(DRAFT_KEY);
    setStage("intro");
  };

  const finish = () => {
    setResult(composePatternsResult(answers));
    clearDraft(DRAFT_KEY);
    setStage("result");
    window.scrollTo(0, 0);
  };

  return (
    <Shell pal={pal} narrow>
      <TopBar pal={pal} label="My Overall Patterns" />

      {stage === "intro" && (
        <>
          <PageHead
            pal={pal}
            title="How do you actually operate?"
            sub="Ten areas: starting and finishing, decisions, pressure, conflict, responsibility, attention, relationships, correction, strengths, and alignment."
          />
          <Card pal={pal} style={{ marginBottom: 18 }}>
            <p style={{ fontSize: 15, color: pal.text, lineHeight: 1.7, margin: "0 0 10px" }}>
              This won&apos;t ask if you&apos;re creative or a good leader. It asks for observable evidence — what you finished, what you postponed, who gets your patience — and reflects back the tendencies your own answers describe.
            </p>
            <p style={{ fontSize: 14, color: pal.sub, lineHeight: 1.65, margin: 0 }}>
              About 27 questions, 6–8 minutes. Everything is skippable, your place autosaves on this device, and the written ones are optional. No types, no scores, no labels.
            </p>
          </Card>
          <PrimaryBtn pal={pal} full onClick={() => setStage("flow")}>Begin →</PrimaryBtn>
        </>
      )}

      {stage === "flow" && (
        <QuestionFlow
          pal={pal}
          questions={PATTERN_QUESTIONS}
          answers={answers}
          onAnswers={setAnswers}
          onDone={finish}
          onRestart={restart}
          startIndex={idx}
          onIndex={setIdx}
        />
      )}

      {stage === "result" && result && (
        <ResultView pal={pal} reflection={result} onRestart={restart} restartLabel="Retake the assessment" />
      )}
    </Shell>
  );
}
