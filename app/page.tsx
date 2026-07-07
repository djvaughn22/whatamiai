"use client";
import { useState, useEffect } from "react";

const STORAGE_KEY = "wai-reflection-v2";
const BRAND = "#A78BFA";

type Question = {
  id: string;
  label: string;
  options?: string[];
  textOnly?: boolean;
  placeholder?: string;
};

const QUESTIONS: Question[] = [
  {
    id: "focus",
    label: "What's taking up most of your energy right now?",
    options: [
      "Work or career",
      "Family or relationships",
      "Health",
      "Money",
      "A big decision",
      "Just getting through the day",
      "A creative project",
      "Something else",
    ],
  },
  {
    id: "best",
    label: "When you feel most like yourself, what are you doing?",
    options: [
      "Solving a problem",
      "Helping someone",
      "Making or building something",
      "Leading or organizing",
      "Learning something new",
      "Being active or outdoors",
      "Connecting with people",
      "Working quietly on my own",
    ],
  },
  {
    id: "drain",
    label: "What wears you down the fastest?",
    options: [
      "Conflict or tension",
      "Boredom and repetition",
      "Uncertainty",
      "Being rushed",
      "Too much social time",
      "Being alone too long",
      "Feeling unappreciated",
      "Not seeing progress",
    ],
  },
  {
    id: "strength",
    label: "What do people usually come to you for?",
    options: [
      "Advice",
      "A calm head in a crisis",
      "Getting things done",
      "New ideas",
      "Really listening",
      "Making them laugh",
      "Practical help",
      "Straight honesty",
    ],
  },
  {
    id: "value",
    label: "What matters most to you these days?",
    options: [
      "Stability",
      "Growth",
      "Freedom",
      "Connection",
      "Making an impact",
      "Peace of mind",
      "Adventure",
      "Security",
    ],
  },
  {
    id: "stuck",
    label: "What's one thing you keep putting off?",
    options: [
      "A hard conversation",
      "A health change",
      "A creative project",
      "A career move",
      "Reaching out to someone",
      "Learning something new",
      "Actually resting",
      "Something else",
    ],
  },
  {
    id: "next",
    label: "If nothing were holding you back, what would you try next?",
    textOnly: true,
    placeholder: "One sentence is plenty. Optional.",
  },
];

type Answers = Record<string, string>;
type Stage = "home" | "form" | "done";

export default function WhatAmIAIPage() {
  const [dark, setDark] = useState(true);
  const [stage, setStage] = useState<Stage>("home");
  const [answers, setAnswers] = useState<Answers>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("wai-theme");
    // Reading persisted state after hydration is intentional and safe here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedTheme) setDark(savedTheme === "dark");
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      try { setAnswers(JSON.parse(saved)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    }
  }, [answers]);

  const setAnswer = (id: string, value: string) =>
    setAnswers((a) => ({ ...a, [id]: value }));

  const answeredCount = QUESTIONS.filter((q) => (answers[q.id] ?? "").trim()).length;

  const observations = (): string[] => {
    const a = answers;
    const out: string[] = [];
    if (a.best?.trim()) out.push(`You feel most like yourself when you're ${a.best.toLowerCase()} — that's worth protecting.`);
    if (a.strength?.trim()) out.push(`People come to you for ${a.strength.toLowerCase()}. That's a real gift, even if it feels ordinary to you.`);
    if (a.drain?.trim()) out.push(`${a.drain} wears you down faster than most things — just naming it is half the battle.`);
    if (a.value?.trim()) out.push(`What you're really after right now is ${a.value.toLowerCase()}. Let that steer the small decisions too.`);
    if (a.focus?.trim()) out.push(`Most of your energy is going toward ${a.focus.toLowerCase()} these days — is that where you want it?`);
    if (a.stuck?.trim()) out.push(`You've been putting off ${a.stuck.toLowerCase()} — maybe this week is the week for one small step.`);
    if (a.next?.trim()) out.push(`And that thing you'd try if nothing held you back — "${a.next.trim()}" — hold onto it.`);
    return out;
  };

  const buildAIPrompt = () => {
    const lines = QUESTIONS.filter((q) => (answers[q.id] ?? "").trim())
      .map((q) => `Q: ${q.label}\nA: ${answers[q.id].trim()}`)
      .join("\n\n");
    if (!lines) return "";
    return `I just did a quick self-reflection. Based on my answers below, help me notice patterns, ask a few thoughtful follow-up questions, and gently point out anything I might be missing. Don't put me in a box or tell me who I am — just help me think.\n\nHere's what I said:\n\n${lines}\n\nHelp me understand myself a little better and think about what might be worth trying next.`;
  };

  const copyPrompt = () => {
    const p = buildAIPrompt();
    if (!p) return;
    navigator.clipboard.writeText(p).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const reset = () => {
    setAnswers({});
    localStorage.removeItem(STORAGE_KEY);
    setStage("home");
  };

  const bg = dark ? "#0b1220" : "#FEFCF9";
  const text = dark ? "#e8edf5" : "#1C1917";
  const sub = dark ? "#94a3b8" : "#57534E";
  const card = dark ? "#141414" : "#FFFFFF";
  const border = dark ? "#26324c" : "#E7E5E4";
  const inputBg = dark ? "#1A1A1A" : "#F9F9F7";

  const shell: React.CSSProperties = {
    background: bg,
    minHeight: "100vh",
    fontFamily: "system-ui, -apple-system, sans-serif",
  };


  if (stage === "home")
    return (
      <main style={shell}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "36px 24px 80px" }}>

          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <div style={{ fontSize: 52, marginBottom: 20 }}>🪞</div>
            <h1 style={{ fontSize: 46, fontWeight: 900, color: text, margin: "0 0 12px", lineHeight: 1.05 }}>WhatAmIAI</h1>
            <p style={{ fontSize: 18, fontWeight: 800, color: BRAND, margin: "0 0 16px", lineHeight: 1.3 }}>Don&apos;t put me in a box. Just help me think.</p>
            <p style={{ fontSize: 18, color: sub, lineHeight: 1.7, maxWidth: 460, margin: "0 auto 32px" }}>
              Seven quick questions — mostly taps, not typing. Then turn your answers into a reflection prompt for any AI. No labels, no accounts, no algorithms.
            </p>
            <button onClick={() => setStage("form")} style={{ background: BRAND, color: "#0b1220", border: "none", borderRadius: 50, padding: "15px 34px", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>
              {answeredCount > 0 ? "Continue →" : "Start — takes a minute →"}
            </button>
            {answeredCount > 0 && (
              <p style={{ fontSize: 14, color: sub, marginTop: 16 }}>{answeredCount} of {QUESTIONS.length} answered</p>
            )}
          </div>

          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "22px 26px", textAlign: "center" }}>
            <p style={{ fontSize: 15, color: sub, lineHeight: 1.7, margin: 0 }}>
              This is a thinking tool, not a test. Answer honestly, skip anything you want, and take what's useful.
            </p>
          </div>
        </div>
      </main>
    );

  if (stage === "form")
    return (
      <main style={shell}>
        <div style={{ maxWidth: 620, margin: "0 auto", padding: "36px 24px 80px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36 }}>
            <button onClick={() => setStage("home")} style={{ background: "none", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", color: sub }}>← Back</button>
            <span style={{ fontSize: 13, fontWeight: 700, color: sub }}>{answeredCount} / {QUESTIONS.length}</span>
          </div>

          <h2 style={{ fontSize: 26, fontWeight: 900, color: text, lineHeight: 1.25, marginBottom: 8 }}>A few honest questions</h2>
          <p style={{ fontSize: 15, color: sub, marginBottom: 32 }}>Pick what fits. Skip anything you want.</p>

          {QUESTIONS.map((q, i) => {
            const val = answers[q.id] ?? "";
            const active = val.trim().length > 0;
            return (
              <div key={q.id} style={{ marginBottom: 26 }}>
                <label style={{ display: "block", fontSize: 16, fontWeight: 800, color: text, marginBottom: 10, lineHeight: 1.4 }}>
                  <span style={{ color: BRAND, marginRight: 8 }}>{i + 1}.</span>{q.label}
                </label>
                {q.textOnly ? (
                  <textarea
                    value={val}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    placeholder={q.placeholder}
                    rows={3}
                    style={{ width: "100%", boxSizing: "border-box", background: inputBg, border: `2px solid ${active ? BRAND : border}`, borderRadius: 14, padding: "14px 16px", fontSize: 16, color: text, lineHeight: 1.6, resize: "vertical", fontFamily: "inherit", outline: "none" }}
                  />
                ) : (
                  <select
                    value={val}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", background: inputBg, border: `2px solid ${active ? BRAND : border}`, borderRadius: 14, padding: "14px 16px", fontSize: 16, color: active ? text : sub, fontFamily: "inherit", outline: "none", cursor: "pointer", appearance: "none" }}
                  >
                    <option value="">Choose one…</option>
                    {q.options!.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}

          <button
            onClick={() => setStage("done")}
            disabled={answeredCount === 0}
            style={{ width: "100%", background: answeredCount === 0 ? border : BRAND, color: answeredCount === 0 ? sub : "#0b1220", border: "none", borderRadius: 50, padding: "16px", fontSize: 16, fontWeight: 800, cursor: answeredCount === 0 ? "not-allowed" : "pointer", marginTop: 12 }}
          >
            See my reflection →
          </button>
        </div>
      </main>
    );

  // stage === "done"
  return (
    <main style={shell}>
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 52, marginBottom: 20 }}>✅</div>
          <h1 style={{ fontSize: 34, fontWeight: 900, color: text, marginBottom: 14 }}>Nice — that's you, on paper.</h1>
          <p style={{ fontSize: 17, color: sub, lineHeight: 1.7, maxWidth: 440, margin: "0 auto" }}>
            Here&apos;s a quick reflection on what you shared — then take it deeper with any AI.
          </p>
        </div>

        <div style={{ background: card, border: `2px solid ${border}`, borderRadius: 20, padding: "24px 26px", marginBottom: 22 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: BRAND, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 14px" }}>Your mirror 🪞</p>

          {observations().length > 0 && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {observations().map((o, i) => (
                  <div key={i} style={{ display: "flex", gap: 10 }}>
                    <span style={{ color: BRAND, fontWeight: 900, flexShrink: 0 }}>•</span>
                    <p style={{ fontSize: 15.5, color: text, lineHeight: 1.6, margin: 0 }}>{o}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 13, color: sub, margin: "16px 0 0", lineHeight: 1.6 }}>
                Patterns, not a verdict — you&apos;re not a category. Take it deeper with AI below. 👇
              </p>
            </>
          )}
        </div>

        <div style={{ background: card, border: `2px solid ${BRAND}`, borderRadius: 20, padding: "26px", marginBottom: 28 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: BRAND, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Take it to AI</p>
          <p style={{ fontSize: 15, color: sub, lineHeight: 1.7, margin: "0 0 20px" }}>
            Paste it into Claude or ChatGPT and ask it to help you notice patterns and ask follow-up questions.
          </p>
          <button onClick={copyPrompt} style={{ background: BRAND, color: "#0b1220", border: "none", borderRadius: 50, padding: "13px 28px", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
            {copied ? "✓ Copied!" : "Copy AI Prompt"}
          </button>
          <div style={{ display: "flex", gap: 16, marginTop: 18, flexWrap: "wrap" }}>
            <a href="https://claude.ai" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 700, color: sub, textDecoration: "none" }}>→ Open Claude (free)</a>
            <a href="https://chat.openai.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 700, color: sub, textDecoration: "none" }}>→ Open ChatGPT (free)</a>
          </div>
        </div>

        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "18px 22px", marginBottom: 28, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: sub, lineHeight: 1.7, margin: "0 0 10px" }}>
            Want to sit with this through faith and Scripture instead?
          </p>
          <a href="https://crossheartpray.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 800, color: BRAND, textDecoration: "none" }}>
            Reflect with Scripture at CrossHeartPray →
          </a>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          <button
            onClick={() => {
              const d = { title: "WhatAmIAI", text: "Don't put me in a box. Just help me think — 7 quick questions, then reflect with any AI.", url: "https://whatamiai.com" };
              if (typeof navigator !== "undefined" && navigator.share) navigator.share(d).catch(() => {});
              else if (typeof navigator !== "undefined") navigator.clipboard.writeText(d.url);
            }}
            style={{ background: "none", border: `2px solid ${border}`, borderRadius: 50, padding: "13px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", color: text }}
          >
            Share WhatAmIAI
          </button>
          <button onClick={() => setStage("form")} style={{ background: "none", border: `2px solid ${border}`, borderRadius: 50, padding: "13px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", color: sub }}>Edit answers</button>
          <button onClick={reset} style={{ background: "none", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", color: sub, textDecoration: "underline" }}>Start fresh</button>
        </div>
      </div>
    </main>
  );
}
