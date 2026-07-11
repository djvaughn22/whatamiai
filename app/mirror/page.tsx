"use client";
// My AI Mirror — paste your prompts (never the AI's answers), review the
// parsed list, get a local analysis, then answer a few questions that test
// the read. Pasted text lives in sessionStorage only.

import { useEffect, useRef, useState } from "react";
import { parsePrompts } from "../lib/promptParser";
import { analyzePrompts, composeMirrorResult, MIRROR_FOLLOWUPS } from "../lib/mirrorEngine";
import type { Answers, Reflection } from "../lib/types";
import { clearDraft, loadDraft, saveDraft } from "../lib/storage";
import ResultView from "../components/ResultView";
import QuestionFlow from "../components/QuestionFlow";
import { Card, Eyebrow, GhostBtn, PrimaryBtn, Shell, TextLink, TopBar, usePalette } from "../components/ui";

type Stage = "input" | "review" | "result" | "followup";
type Draft = { stage: Stage; raw: string; prompts: string[]; excluded: number[] };

const DRAFT_KEY = "wai3-mirror-session";

export default function MirrorPage() {
  const pal = usePalette();
  const [stage, setStage] = useState<Stage>("input");
  const [raw, setRaw] = useState("");
  const [prompts, setPrompts] = useState<string[]>([]);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [manual, setManual] = useState("");
  const [result, setResult] = useState<Reflection | null>(null);
  const [followAnswers, setFollowAnswers] = useState<Answers>({});
  const restored = useRef(false);

  // session-only draft: survives refresh, gone when the tab closes
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const d = loadDraft<Draft>(DRAFT_KEY, true);
    if (d) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRaw(d.raw);
      setPrompts(d.prompts);
      setExcluded(new Set(d.excluded));
      if (d.stage === "review") setStage("review");
    }
  }, []);
  useEffect(() => {
    if (!restored.current) return;
    if (stage === "input" || stage === "review")
      saveDraft<Draft>(DRAFT_KEY, { stage, raw, prompts, excluded: [...excluded] }, true);
  }, [stage, raw, prompts, excluded]);

  const included = prompts.filter((_, i) => !excluded.has(i));

  const clearEverything = () => {
    setRaw("");
    setPrompts([]);
    setExcluded(new Set());
    setResult(null);
    setFollowAnswers({});
    clearDraft(DRAFT_KEY, true);
    setStage("input");
  };

  const analyze = () => {
    const r = composeMirrorResult(analyzePrompts(included));
    setResult(r);
    setStage("result");
    window.scrollTo(0, 0);
  };

  const applyFollowups = () => {
    const r = composeMirrorResult(analyzePrompts(included), followAnswers);
    setResult(r);
    setStage("result");
    window.scrollTo(0, 0);
  };

  return (
    <Shell pal={pal} narrow>
      <TopBar pal={pal} label="My AI Mirror" />

      {stage === "input" && (
        <>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: pal.text, margin: "0 0 8px" }}>Paste your prompts, not the AI&apos;s responses.</h1>
          <p style={{ fontSize: 15.5, color: pal.sub, lineHeight: 1.7, margin: "0 0 18px" }}>
            Your questions often say more about how you use AI than its answers do. Copy a batch of your own prompts from ChatGPT, Claude, Gemini, Copilot — or notes where you keep them — and this tool looks for repeated topics, goals, habits, and ways of thinking. One per line, a numbered list, or blocks separated by blank lines all work.
          </p>

          <Card pal={pal} accent style={{ marginBottom: 16 }}>
            <Eyebrow pal={pal}>Remove anything private before pasting</Eyebrow>
            <p style={{ fontSize: 14, color: pal.text, lineHeight: 1.65, margin: 0 }}>
              No passwords, account numbers, medical records, legal documents, private messages, client information, or children&apos;s identifying details — nothing you wouldn&apos;t want sitting on this device. What you paste stays in this tab only: it&apos;s never uploaded, never logged, never put in a link, and it&apos;s gone when you close the tab unless you save the finished analysis.
            </p>
          </Card>

          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={10}
            aria-label="Paste your prompts here"
            placeholder={"e.g.\nhelp me plan a launch for my etsy shop\nwhy does my css grid overflow on mobile\nrewrite this email to sound less blunt\n…"}
            style={{ width: "100%", boxSizing: "border-box", background: pal.input, border: `2px solid ${raw.trim() ? pal.brand : pal.border}`, borderRadius: 14, padding: "14px 16px", fontSize: 15, color: pal.text, lineHeight: 1.6, resize: "vertical", fontFamily: "inherit" }}
          />

          <div style={{ display: "flex", gap: 10, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
            <PrimaryBtn
              pal={pal}
              disabled={!raw.trim()}
              onClick={() => {
                setPrompts(parsePrompts(raw));
                setExcluded(new Set());
                setStage("review");
                window.scrollTo(0, 0);
              }}
            >
              Review my prompt list →
            </PrimaryBtn>
            {raw.trim() && <TextLink pal={pal} onClick={clearEverything}>Clear pasted text</TextLink>}
          </div>

          <p style={{ fontSize: 13.5, color: pal.sub, marginTop: 16, lineHeight: 1.6 }}>
            15–50 prompts usually gives the most useful picture. Fewer than 5 still works, but the read will be limited. You never need your whole history.
          </p>
        </>
      )}

      {stage === "review" && (
        <>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: pal.text, margin: "0 0 8px" }}>Your prompt list</h1>
          <p style={{ fontSize: 14.5, color: pal.sub, lineHeight: 1.65, margin: "0 0 8px" }}>
            {included.length} prompt{included.length === 1 ? "" : "s"} will be analyzed. Tap ✕ to remove one, or the circle to exclude it without deleting.
          </p>
          {included.length < 5 && (
            <Card pal={pal} style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 14, color: pal.text, margin: 0, lineHeight: 1.6 }}>
                ⚠️ Under 5 prompts is a very small sample — the result may be thin. You can still run it, or go back and paste more.
              </p>
            </Card>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {prompts.map((p, i) => {
              const off = excluded.has(i);
              return (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: pal.card, border: `1px solid ${pal.border}`, borderRadius: 12, padding: "10px 12px", opacity: off ? 0.45 : 1 }}>
                  <button
                    type="button"
                    aria-label={off ? "Include this prompt" : "Exclude this prompt"}
                    aria-pressed={off}
                    onClick={() => {
                      const next = new Set(excluded);
                      if (off) next.delete(i);
                      else next.add(i);
                      setExcluded(next);
                    }}
                    style={{ width: 22, height: 22, borderRadius: 50, border: `2px solid ${off ? pal.border : pal.brand}`, background: off ? "transparent" : pal.brand, cursor: "pointer", flexShrink: 0, marginTop: 2 }}
                  />
                  <span style={{ fontSize: 14, color: pal.text, lineHeight: 1.55, flex: 1, textDecoration: off ? "line-through" : "none" }}>{p}</span>
                  <button
                    type="button"
                    aria-label="Remove this prompt"
                    onClick={() => {
                      setPrompts(prompts.filter((_, j) => j !== i));
                      setExcluded(new Set([...excluded].filter((j) => j !== i).map((j) => (j > i ? j - 1 : j))));
                    }}
                    style={{ background: "none", border: "none", color: pal.sub, fontSize: 16, fontWeight: 800, cursor: "pointer", padding: "0 4px" }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manual.trim()) {
                setPrompts([...prompts, manual.trim()]);
                setManual("");
              }
            }}
            style={{ display: "flex", gap: 10, marginBottom: 20 }}
          >
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="Add a prompt manually…"
              aria-label="Add a prompt manually"
              style={{ flex: 1, background: pal.input, border: `2px solid ${pal.border}`, borderRadius: 12, padding: "11px 14px", fontSize: 14.5, color: pal.text, fontFamily: "inherit", minWidth: 0 }}
            />
            <GhostBtn pal={pal} small onClick={() => {
              if (manual.trim()) {
                setPrompts([...prompts, manual.trim()]);
                setManual("");
              }
            }}>Add</GhostBtn>
          </form>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <PrimaryBtn pal={pal} disabled={included.length === 0} onClick={analyze}>
              Analyze {included.length} prompt{included.length === 1 ? "" : "s"} →
            </PrimaryBtn>
            <GhostBtn pal={pal} small onClick={() => setStage("input")}>← Back to paste</GhostBtn>
            <TextLink pal={pal} onClick={clearEverything}>Clear everything</TextLink>
          </div>
        </>
      )}

      {stage === "result" && result && (
        <>
          <ResultView pal={pal} reflection={result} onRestart={clearEverything} restartLabel="Start a new Mirror" />
          <Card pal={pal} style={{ marginTop: 20 }} accent>
            <Eyebrow pal={pal}>Test this read</Eyebrow>
            <p style={{ fontSize: 14.5, color: pal.sub, lineHeight: 1.65, margin: "0 0 14px" }}>
              Prompts are a narrow window — you know things they can&apos;t show. A few optional questions will sharpen (or correct) the result.
            </p>
            <GhostBtn pal={pal} onClick={() => setStage("followup")}>Answer a few follow-ups</GhostBtn>
          </Card>
        </>
      )}

      {stage === "followup" && (
        <QuestionFlow
          pal={pal}
          questions={MIRROR_FOLLOWUPS}
          answers={followAnswers}
          onAnswers={setFollowAnswers}
          onDone={applyFollowups}
          onRestart={() => {
            setFollowAnswers({});
            setStage("result");
          }}
        />
      )}
    </Shell>
  );
}
