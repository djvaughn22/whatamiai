"use client";
// How Do I React? — scenario deck. Tap your honest first move, get a
// no-shame read, a steadier script, and Scripture counsel. Picks build a
// reaction lean over time (stored locally). No abuse/danger scenarios —
// those get real resources, always visible from this page.

import { useEffect, useMemo, useState } from "react";
import { leanFromTallies, reactAIPrompt, SCENARIOS, STYLE_INFO, type ReactionOption, type ReactionStyle, type Scenario, type StyleTallies } from "../lib/reactEngine";
import { copyText } from "../lib/exporters";
import { Card, Eyebrow, GhostBtn, PageHead, PrimaryBtn, Shell, TopBar, usePalette, type Palette } from "../components/ui";

const STORE_KEY = "wai-react-v1";
type Progress = { done: string[]; tallies: StyleTallies };
const EMPTY: Progress = { done: [], tallies: { fire: 0, retreat: 0, pleaser: 0, steady: 0 } };

function loadProgress(): Progress {
  if (typeof window === "undefined") return EMPTY;
  try {
    const p = JSON.parse(localStorage.getItem(STORE_KEY) ?? "");
    if (p && Array.isArray(p.done) && p.tallies) return p as Progress;
  } catch {}
  return EMPTY;
}

function LeanCard({ pal, tallies }: { pal: Palette; tallies: StyleTallies }) {
  const lean = leanFromTallies(tallies);
  if (!lean) return null;
  const info = STYLE_INFO[lean.style];
  return (
    <Card pal={pal} accent style={{ marginTop: 16 }}>
      <Eyebrow pal={pal}>Your reaction lean so far</Eyebrow>
      <p style={{ fontSize: 22, fontWeight: 900, color: pal.text, margin: "0 0 4px" }}>
        {info.emoji} {info.name}
      </p>
      <p style={{ fontSize: 14, color: pal.sub, margin: "0 0 10px", fontWeight: 700 }}>
        {info.short} ({lean.count} of your {lean.total} picks)
      </p>
      <p style={{ fontSize: 14.5, color: pal.text, lineHeight: 1.65, margin: "0 0 10px" }}>{info.read}</p>
      <p style={{ fontSize: 14.5, color: pal.text, lineHeight: 1.65, margin: "0 0 10px" }}>{info.growth}</p>
      <p style={{ fontSize: 13.5, color: pal.sub, lineHeight: 1.6, margin: 0 }}>{info.counsel}</p>
      <p style={{ fontSize: 12.5, color: pal.sub, lineHeight: 1.6, margin: "10px 0 0" }}>
        A lean is a habit, not an identity — it describes your taps here, and habits can be retrained.
      </p>
    </Card>
  );
}

function SafetyFooter({ pal }: { pal: Palette }) {
  return (
    <Card pal={pal} style={{ marginTop: 20 }}>
      <p style={{ fontSize: 13.5, color: pal.sub, lineHeight: 1.7, margin: 0 }}>
        These cards are everyday situations on purpose. If something in your real life involves abuse, threats, or danger, that&apos;s bigger than practice: call or text <strong style={{ color: pal.text }}>988</strong> (crisis, US), call <strong style={{ color: pal.text }}>1-800-799-7233</strong> (domestic violence hotline), or <strong style={{ color: pal.text }}>911</strong> if you&apos;re in immediate danger. Real people first, always.
      </p>
    </Card>
  );
}

export default function ReactPage() {
  const pal = usePalette();
  const [progress, setProgress] = useState<Progress>(EMPTY);
  const [active, setActive] = useState<Scenario | null>(null);
  const [picked, setPicked] = useState<ReactionOption | null>(null);
  const [flash, setFlash] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(loadProgress());
    setLoaded(true);
  }, []);

  const save = (p: Progress) => {
    setProgress(p);
    localStorage.setItem(STORE_KEY, JSON.stringify(p));
  };

  const note = (msg: string) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(""), 2600);
  };

  const remaining = useMemo(() => SCENARIOS.filter((s) => !progress.done.includes(s.id)), [progress.done]);

  const pick = (s: Scenario, o: ReactionOption) => {
    setPicked(o);
    if (!progress.done.includes(s.id)) {
      save({
        done: [...progress.done, s.id],
        tallies: { ...progress.tallies, [o.style]: progress.tallies[o.style] + 1 },
      });
    }
    window.scrollTo(0, 0);
  };

  const nextCard = () => {
    setActive(null);
    setPicked(null);
    window.scrollTo(0, 0);
  };

  const resetAll = () => {
    if (window.confirm("Reset your deck? Completed cards and your reaction lean will be cleared.")) {
      save(EMPTY);
      setActive(null);
      setPicked(null);
    }
  };

  // ---- feedback view ----
  if (active && picked) {
    const s = active;
    return (
      <Shell pal={pal} narrow>
        <TopBar pal={pal} label="How Do I React?" />
        <Card pal={pal} style={{ marginBottom: 14 }}>
          <Eyebrow pal={pal}>{s.emoji} {s.title}</Eyebrow>
          <p style={{ fontSize: 14.5, color: pal.sub, lineHeight: 1.6, margin: 0 }}>Your honest pick: <strong style={{ color: pal.text }}>{picked.text}</strong></p>
        </Card>

        <Card pal={pal} style={{ marginBottom: 14 }}>
          <Eyebrow pal={pal}>The honest read — no shame in it</Eyebrow>
          <p style={{ fontSize: 15.5, color: pal.text, lineHeight: 1.65, margin: 0 }}>{picked.read}</p>
        </Card>

        <Card pal={pal} accent style={{ marginBottom: 14 }}>
          <Eyebrow pal={pal}>A steadier way</Eyebrow>
          <p style={{ fontSize: 15.5, color: pal.text, lineHeight: 1.65, margin: "0 0 12px" }}>{s.better}</p>
          <p style={{ fontSize: 15, color: pal.text, lineHeight: 1.65, margin: 0, fontStyle: "italic" }}>{s.script}</p>
        </Card>

        <Card pal={pal} style={{ marginBottom: 14 }}>
          <Eyebrow pal={pal}>Counsel</Eyebrow>
          <p style={{ fontSize: 15.5, color: pal.text, lineHeight: 1.65, margin: "0 0 10px" }}>{s.counsel}</p>
          <p style={{ fontSize: 13, color: pal.sub, lineHeight: 1.6, margin: 0 }}>
            Counsel like this has a deep source.{" "}
            <a href="https://crossheartpray.com" target="_blank" rel="noopener noreferrer" style={{ color: pal.brand, fontWeight: 800, textDecoration: "none" }}>
              CrossHeartPray →
            </a>
          </p>
        </Card>

        <LeanCard pal={pal} tallies={progress.tallies} />

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 20 }}>
          {remaining.length > 0 && <PrimaryBtn pal={pal} onClick={nextCard}>Next situation →</PrimaryBtn>}
          <GhostBtn pal={pal} onClick={async () => note((await copyText(reactAIPrompt(s, picked))) ? "Prompt copied — paste it into the AI you use." : "Couldn't copy — your browser blocked it.")}>
            Talk this one out with an AI
          </GhostBtn>
          <GhostBtn pal={pal} small onClick={nextCard}>All cards</GhostBtn>
        </div>
        {flash && <p style={{ fontSize: 13.5, color: pal.brand, fontWeight: 800, marginTop: 12 }}>{flash}</p>}
        <p style={{ fontSize: 12.5, color: pal.sub, marginTop: 14, lineHeight: 1.6 }}>
          The AI prompt includes ground rules: positive, practical, grace-first, no labels, real help first if anything is unsafe.
        </p>
        <SafetyFooter pal={pal} />
      </Shell>
    );
  }

  // ---- active card, waiting for a pick ----
  if (active) {
    const s = active;
    return (
      <Shell pal={pal} narrow>
        <TopBar pal={pal} label="How Do I React?" />
        <Card pal={pal} style={{ marginBottom: 18 }}>
          <Eyebrow pal={pal}>{s.emoji} {s.domain}</Eyebrow>
          <h2 style={{ fontSize: 21, fontWeight: 900, color: pal.text, margin: "0 0 8px", lineHeight: 1.3 }}>{s.title}</h2>
          <p style={{ fontSize: 15.5, color: pal.text, lineHeight: 1.65, margin: 0 }}>{s.setup}</p>
        </Card>
        <p style={{ fontSize: 14, fontWeight: 800, color: pal.sub, margin: "0 0 12px" }}>
          What&apos;s your honest first move — not the right answer, the real one?
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {s.options.map((o) => (
            <button
              key={o.text}
              type="button"
              onClick={() => pick(s, o)}
              style={{ textAlign: "left", background: pal.card, color: pal.text, border: `2px solid ${pal.border}`, borderRadius: 14, padding: "14px 16px", fontSize: 15.5, fontWeight: 700, cursor: "pointer", lineHeight: 1.45, minHeight: 48 }}
            >
              {o.text}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 18 }}>
          <GhostBtn pal={pal} small onClick={nextCard}>← Back to the deck</GhostBtn>
        </div>
        <p style={{ fontSize: 12.5, color: pal.sub, marginTop: 14, lineHeight: 1.6 }}>
          Honest picks make the read useful. Nothing leaves this device.
        </p>
      </Shell>
    );
  }

  // ---- deck ----
  const doneCount = progress.done.length;
  return (
    <Shell pal={pal} narrow>
      <TopBar pal={pal} label="How Do I React?" />
      <PageHead
        pal={pal}
        title="How do you actually react?"
        sub="Real situations, four honest moves each. Tap the one you'd really make — get a no-shame read, a steadier script, and solid counsel. Your picks slowly reveal your reaction lean."
      />

      {loaded && doneCount > 0 && (
        <p style={{ fontSize: 14, fontWeight: 800, color: pal.brand, textAlign: "center", margin: "0 0 16px" }}>
          {doneCount} of {SCENARIOS.length} situations faced
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
        {SCENARIOS.map((s) => {
          const done = progress.done.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => { setActive(s); setPicked(null); window.scrollTo(0, 0); }}
              style={{ background: pal.card, color: pal.text, border: `2px solid ${done ? pal.brand : pal.border}`, borderRadius: 14, padding: "14px 12px", fontSize: 14, fontWeight: 800, cursor: "pointer", textAlign: "left", minHeight: 76, lineHeight: 1.35, opacity: done ? 0.75 : 1 }}
            >
              <span style={{ fontSize: 20, display: "block", marginBottom: 6 }} aria-hidden>{s.emoji}{done ? " ✓" : ""}</span>
              {s.title}
            </button>
          );
        })}
      </div>

      {loaded && <LeanCard pal={pal} tallies={progress.tallies} />}
      {loaded && doneCount >= 3 && !leanFromTallies(progress.tallies) && (
        <p style={{ fontSize: 13.5, color: pal.sub, textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
          No single reaction lean yet — your picks are split. A few more cards will sharpen the picture.
        </p>
      )}

      {loaded && doneCount > 0 && (
        <p style={{ textAlign: "center", marginTop: 16 }}>
          <GhostBtn pal={pal} small onClick={resetAll}>Reset the deck</GhostBtn>
        </p>
      )}

      <SafetyFooter pal={pal} />
    </Shell>
  );
}
