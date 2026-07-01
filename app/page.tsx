"use client";
import { useState, useEffect } from "react";

const STORAGE_KEY = "wai-reflection-v1";

type Answer = { q: string; a: string };
type Section = { id: string; emoji: string; title: string; color: string; questions: string[] };

const SECTIONS: Section[] = [
  {
    id: "fruit", emoji: "🌱", title: "Good Fruit", color: "#4ADE80",
    questions: [
      "Where have you recently shown love — even when it cost you something?",
      "Where do you notice peace in your life right now, and what is feeding it?",
      "Who have you been patient with lately that was hard? How did it go?",
      "Where are you seeing kindness, gentleness, or self-control growing in yourself?",
      "What are you genuinely grateful for today that you don't say out loud enough?",
    ],
  },
  {
    id: "patterns", emoji: "⚠️", title: "Patterns to Notice", color: "#FB923C",
    questions: [
      "What is a habit or behavior you keep returning to that you know doesn't help you?",
      "Where are you being less than honest — with yourself or someone else?",
      "What do you reach for when you feel anxious, bored, or low?",
      "Is there someone you are avoiding? Why?",
      "What pattern in your life would you be embarrassed for others to see clearly?",
    ],
  },
  {
    id: "identity", emoji: "🪞", title: "Who You Are", color: "#A78BFA",
    questions: [
      "Who are you when nobody is watching?",
      "What do you believe about yourself that you haven't questioned in a long time?",
      "What do people close to you say about you that you tend to dismiss?",
      "What are you carrying from your past that still shapes how you see yourself today?",
      "If you were being fully honest, what do you actually believe about God right now?",
    ],
  },
  {
    id: "gifts", emoji: "🎁", title: "Gifts & Burdens", color: "#FBBF24",
    questions: [
      "What do you notice that other people seem to miss?",
      "What problem in the world makes you quietly angry or deeply sad?",
      "What have you been through that you wouldn't trade, even if it was painful?",
      "What do people come to you for, even if you don't advertise it?",
      "What is something you do that feels effortless to you but hard for others?",
    ],
  },
  {
    id: "serve", emoji: "🤝", title: "Ways to Serve", color: "#38BDF8",
    questions: [
      "Who in your life right now could use encouragement, help, or just someone to show up?",
      "Is there a need nearby — in your neighborhood, church, or community — you keep noticing?",
      "What has God given you — time, skill, experience, money, presence — that you could offer someone?",
      "What stops you from helping more? Is that reason still true?",
      "Is there one small thing you could do this week that would genuinely help someone?",
    ],
  },
  {
    id: "calling", emoji: "🧭", title: "Calling & Next Steps", color: "#FB7185",
    questions: [
      "What is one thing you feel quietly called to do that you keep putting off?",
      "If you removed fear of failure or what people think, what would you try?",
      "What does faithfulness look like for you in this specific season of your life?",
      "What is one honest next step — not a big plan, just the next faithful thing?",
      "What would you pray for if you believed God actually answers?",
    ],
  },
];

const ALL_QS: { sectionId: string; sectionTitle: string; emoji: string; color: string; q: string }[] = SECTIONS.flatMap(s =>
  s.questions.map(q => ({ sectionId: s.id, sectionTitle: s.title, emoji: s.emoji, color: s.color, q }))
);

type Stage = "home" | "quiz" | "done" | "review";

export default function WhatAmIAIPage() {
  const [dark, setDark] = useState(true);
  const [stage, setStage] = useState<Stage>("home");
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [current, setCurrent] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("wai-theme");
    if (saved) setDark(saved === "dark");
    const savedAnswers = localStorage.getItem(STORAGE_KEY);
    if (savedAnswers) {
      try { setAnswers(JSON.parse(savedAnswers)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (answers.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  }, [answers]);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("wai-theme", next ? "dark" : "light");
  };

  const q = ALL_QS[idx];
  const progress = Math.round((idx / ALL_QS.length) * 100);

  const handleNext = () => {
    const updated = [...answers];
    const existing = updated.findIndex(a => a.q === q.q);
    if (existing >= 0) updated[existing].a = current;
    else updated.push({ q: q.q, a: current });
    setAnswers(updated);
    if (idx + 1 >= ALL_QS.length) {
      setStage("done");
    } else {
      setIdx(idx + 1);
      const next = ALL_QS[idx + 1];
      const saved = answers.find(a => a.q === next.q);
      setCurrent(saved?.a ?? "");
    }
  };

  const handlePrev = () => {
    if (idx === 0) return;
    const updated = [...answers];
    const existing = updated.findIndex(a => a.q === q.q);
    if (existing >= 0) updated[existing].a = current;
    else if (current.trim()) updated.push({ q: q.q, a: current });
    setAnswers(updated);
    const prev = ALL_QS[idx - 1];
    const saved = updated.find(a => a.q === prev.q);
    setCurrent(saved?.a ?? "");
    setIdx(idx - 1);
  };

  const startQuiz = (sectionId?: string) => {
    if (sectionId) {
      const startIdx = ALL_QS.findIndex(q => q.sectionId === sectionId);
      setIdx(startIdx >= 0 ? startIdx : 0);
      const saved = answers.find(a => a.q === ALL_QS[startIdx >= 0 ? startIdx : 0].q);
      setCurrent(saved?.a ?? "");
    } else {
      setIdx(0);
      const saved = answers.find(a => a.q === ALL_QS[0].q);
      setCurrent(saved?.a ?? "");
    }
    setStage("quiz");
  };

  const buildAIPrompt = () => {
    const filled = answers.filter(a => a.a.trim());
    if (filled.length === 0) return "";
    const lines = filled.map(a => `Q: ${a.q}\nA: ${a.a}`).join("\n\n");
    return `I've been doing a Gospel-first reflection exercise and I want to think through my answers more deeply. Please help me notice patterns, ask follow-up questions, and gently point out anything I might be missing — without telling me what to do or defining who I am. Here are my answers:\n\n${lines}\n\nHelp me see myself more honestly, explore what might be next, and reflect on where I might be called to grow or serve.`;
  };

  const copyPrompt = () => {
    const p = buildAIPrompt();
    if (!p) return;
    navigator.clipboard.writeText(p).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const bg = dark ? "#0C0C0C" : "#FEFCF9";
  const text = dark ? "#F5F0E8" : "#1C1917";
  const sub = dark ? "#8A8078" : "#57534E";
  const card = dark ? "#141414" : "#FFFFFF";
  const border = dark ? "#222" : "#E7E5E4";
  const inputBg = dark ? "#1A1A1A" : "#F9F9F7";

  if (stage === "home") return (
    <main style={{ background: bg, minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "36px 24px 80px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 52, paddingBottom: 18, borderBottom: `1px solid ${border}` }}>
          <a href="https://openmirrorllc.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: sub, textDecoration: "none" }}>Open Mirror LLC</a>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <a href="https://crossheartpray.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 800, color: "#A78BFA", textDecoration: "none" }}>CrossHeartPray →</a>
            <button onClick={toggle} style={{ background: "none", border: `1px solid ${border}`, borderRadius: 50, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: sub }}>{dark ? "☀️" : "🌙"}</button>
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ fontSize: 52, marginBottom: 20 }}>🪞</div>
          <h1 style={{ fontSize: 44, fontWeight: 900, color: text, margin: "0 0 16px", lineHeight: 1.05 }}>WhatAmIAI</h1>
          <p style={{ fontSize: 19, color: sub, lineHeight: 1.75, maxWidth: 480, margin: "0 auto 32px" }}>
            Gospel-first reflection questions — honest, unhurried, one at a time. No labels. No algorithms. Just questions worth sitting with.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            <button onClick={() => startQuiz()} style={{ background: "#A78BFA", color: "#0C0C0C", border: "none", borderRadius: 50, padding: "14px 32px", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>
              {answers.length > 0 ? "Continue Reflecting →" : "Start Reflecting →"}
            </button>
            {answers.length > 0 && (
              <button onClick={() => setStage("review")} style={{ background: "none", border: `2px solid ${border}`, borderRadius: 50, padding: "14px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer", color: sub }}>
                Review My Answers
              </button>
            )}
          </div>
          {answers.filter(a => a.a.trim()).length > 0 && (
            <p style={{ fontSize: 14, color: sub, marginTop: 16 }}>{answers.filter(a => a.a.trim()).length} of {ALL_QS.length} questions answered</p>
          )}
        </div>

        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: sub, marginBottom: 20, textAlign: "center" }}>Jump to a section</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {SECTIONS.map(s => {
              const answered = answers.filter(a => ALL_QS.find(q => q.q === a.q && q.sectionId === s.id && a.a.trim())).length;
              return (
                <button key={s.id} onClick={() => startQuiz(s.id)} style={{
                  background: card, border: `2px solid ${border}`, borderRadius: 16,
                  padding: "18px 20px", cursor: "pointer", textAlign: "left",
                }}>
                  <div style={{ fontSize: 26, marginBottom: 8 }}>{s.emoji}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: text, marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: s.color, fontWeight: 700 }}>{answered}/{s.questions.length} answered</div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ background: dark ? "#130F20" : "#FAF5FF", border: `2px solid ${dark ? "#2A1F40" : "#DDD6FE"}`, borderRadius: 20, padding: "24px 28px", textAlign: "center" }}>
          <p style={{ fontSize: 15, color: sub, lineHeight: 1.7, margin: "0 0 6px" }}>
            Bring what you notice back to <strong style={{ color: text }}>Scripture, prayer, and people you trust.</strong>
          </p>
          <p style={{ fontSize: 14, color: sub, margin: 0 }}>AI is a question tool — not your guide. Jesus is.</p>
        </div>
      </div>
    </main>
  );

  if (stage === "quiz") return (
    <main style={{ background: bg, minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "36px 24px 80px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36 }}>
          <button onClick={() => setStage("home")} style={{ background: "none", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", color: sub }}>← Back</button>
          <button onClick={toggle} style={{ background: "none", border: `1px solid ${border}`, borderRadius: 50, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: sub }}>{dark ? "☀️" : "🌙"}</button>
        </div>

        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: q.color }}>{q.emoji} {q.sectionTitle}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: sub }}>{idx + 1} / {ALL_QS.length}</span>
          </div>
          <div style={{ height: 4, background: border, borderRadius: 4 }}>
            <div style={{ height: "100%", width: `${progress}%`, background: q.color, borderRadius: 4, transition: "width 0.3s" }} />
          </div>
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 900, color: text, lineHeight: 1.3, marginBottom: 28 }}>{q.q}</h2>

        <textarea
          value={current}
          onChange={e => setCurrent(e.target.value)}
          placeholder="Write honestly. No one else sees this."
          rows={6}
          style={{
            width: "100%", boxSizing: "border-box", background: inputBg,
            border: `2px solid ${current.trim() ? q.color : border}`,
            borderRadius: 16, padding: "18px 20px", fontSize: 16, color: text,
            lineHeight: 1.65, resize: "vertical", fontFamily: "inherit", outline: "none",
            transition: "border-color 0.2s",
          }}
        />

        <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "space-between" }}>
          <button onClick={handlePrev} disabled={idx === 0} style={{
            background: "none", border: `2px solid ${border}`, borderRadius: 50,
            padding: "12px 22px", fontSize: 14, fontWeight: 700, cursor: idx === 0 ? "not-allowed" : "pointer",
            color: idx === 0 ? border : sub, opacity: idx === 0 ? 0.4 : 1,
          }}>← Prev</button>
          <button onClick={handleNext} style={{
            background: q.color, color: "#0C0C0C", border: "none",
            borderRadius: 50, padding: "12px 28px", fontSize: 15, fontWeight: 800, cursor: "pointer",
          }}>
            {idx + 1 >= ALL_QS.length ? "Finish →" : "Next →"}
          </button>
        </div>

        <p style={{ fontSize: 13, color: sub, textAlign: "center", marginTop: 20 }}>
          You can skip any question — just press Next.
        </p>
      </div>
    </main>
  );

  if (stage === "done") return (
    <main style={{ background: bg, minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "60px 24px 80px", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 24 }}>✅</div>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: text, marginBottom: 16 }}>You showed up.</h1>
        <p style={{ fontSize: 18, color: sub, lineHeight: 1.75, maxWidth: 460, margin: "0 auto 36px" }}>
          That is no small thing. Bring what you noticed back to Scripture, prayer, and people who know you.
        </p>

        <div style={{ background: dark ? "#130F20" : "#FAF5FF", border: `2px solid ${dark ? "#2A1F40" : "#DDD6FE"}`, borderRadius: 20, padding: "28px", marginBottom: 32, textAlign: "left" }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: "#A78BFA", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Take it to AI</p>
          <p style={{ fontSize: 15, color: sub, lineHeight: 1.7, margin: "0 0 20px" }}>
            Copy your answers as a prompt and paste it into Claude or ChatGPT. Ask it to help you notice patterns and ask follow-up questions — but bring what you find back to Jesus, not the AI.
          </p>
          <button onClick={copyPrompt} style={{
            background: "#A78BFA", color: "#0C0C0C", border: "none",
            borderRadius: 50, padding: "12px 26px", fontSize: 14, fontWeight: 800, cursor: "pointer",
          }}>
            {copied ? "✓ Copied!" : "Copy AI Prompt"}
          </button>
          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            <a href="https://claude.ai" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 700, color: sub, textDecoration: "none" }}>→ Open Claude (free)</a>
            <a href="https://chat.openai.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 700, color: sub, textDecoration: "none" }}>→ Open ChatGPT (free)</a>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          <button onClick={() => setStage("review")} style={{ background: "#A78BFA", color: "#0C0C0C", border: "none", borderRadius: 50, padding: "13px 26px", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>Review My Answers</button>
          <button onClick={() => { setStage("home"); }} style={{ background: "none", border: `2px solid ${border}`, borderRadius: 50, padding: "13px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer", color: sub }}>Back to Home</button>
          <button onClick={() => { setAnswers([]); localStorage.removeItem(STORAGE_KEY); setIdx(0); setCurrent(""); setStage("home"); }} style={{ background: "none", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", color: sub, textDecoration: "underline" }}>Start Fresh</button>
        </div>
      </div>
    </main>
  );

  if (stage === "review") return (
    <main style={{ background: bg, minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "36px 24px 80px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36 }}>
          <button onClick={() => setStage("home")} style={{ background: "none", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", color: sub }}>← Home</button>
          <button onClick={copyPrompt} style={{ background: "#A78BFA", color: "#0C0C0C", border: "none", borderRadius: 50, padding: "9px 20px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
            {copied ? "✓ Copied!" : "Copy AI Prompt"}
          </button>
        </div>

        <h1 style={{ fontSize: 30, fontWeight: 900, color: text, marginBottom: 8 }}>Your Reflection</h1>
        <p style={{ fontSize: 15, color: sub, marginBottom: 36 }}>{answers.filter(a => a.a.trim()).length} answered · {ALL_QS.length - answers.filter(a => a.a.trim()).length} skipped</p>

        {SECTIONS.map(s => {
          const sectionQs = ALL_QS.filter(q => q.sectionId === s.id);
          const sectionAnswers = sectionQs.map(q => ({ q: q.q, a: answers.find(a => a.q === q.q)?.a ?? "" })).filter(a => a.a.trim());
          if (sectionAnswers.length === 0) return null;
          return (
            <div key={s.id} style={{ marginBottom: 32 }}>
              <p style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: s.color, marginBottom: 14 }}>{s.emoji} {s.title}</p>
              {sectionAnswers.map((a, i) => (
                <div key={i} style={{ background: card, border: `2px solid ${border}`, borderRadius: 16, padding: "20px", marginBottom: 12 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: sub, margin: "0 0 8px" }}>{a.q}</p>
                  <p style={{ fontSize: 15, color: text, lineHeight: 1.65, margin: 0 }}>{a.a}</p>
                </div>
              ))}
            </div>
          );
        })}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 24 }}>
          <button onClick={() => startQuiz()} style={{ background: "#A78BFA", color: "#0C0C0C", border: "none", borderRadius: 50, padding: "13px 26px", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>Keep Reflecting</button>
          <button onClick={() => { setAnswers([]); localStorage.removeItem(STORAGE_KEY); setStage("home"); }} style={{ background: "none", border: `2px solid ${border}`, borderRadius: 50, padding: "13px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer", color: sub }}>Start Fresh</button>
        </div>
      </div>
    </main>
  );

  return null;
}
