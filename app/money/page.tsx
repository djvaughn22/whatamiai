"use client";
// Money Check — three numbers, three taps, real math. The math runs in the
// browser; the numbers are never sent, stored remotely, or put in a URL.
// Entries autosave to localStorage (DRAFT_KEY) until cleared; the result is
// stored only if the user taps Save. The site-wide layout loads Google
// Analytics for page visits — it never receives these numbers. If either
// of those facts changes, update the card copy below.

import { useEffect, useId, useRef, useState } from "react";
import { composeMoneyResult, MONEY_STRESS, MONEY_SURPRISE, MONEY_TRACK, type MoneyInputs } from "../lib/moneyEngine";
import type { Reflection } from "../lib/types";
import { clearDraft, loadDraft, saveDraft } from "../lib/storage";
import ResultView from "../components/ResultView";
import { Card, Eyebrow, PageHead, PrimaryBtn, Shell, TextLink, TopBar, usePalette, type Palette } from "../components/ui";

const DRAFT_KEY = "wai-money-draft-v1";
type MoneyDraft = { income: string; essentials: string; debt: string; stress: string; track: string; surprise: string };

function NumField({ pal, label, hint, value, onChange }: { pal: Palette; label: string; hint: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={id} style={{ display: "block", fontSize: 15, fontWeight: 800, color: pal.text, marginBottom: 4 }}>{label}</label>
      <p id={`${id}-hint`} style={{ fontSize: 13, color: pal.sub, margin: "0 0 8px", lineHeight: 1.5 }}>{hint}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18, fontWeight: 900, color: pal.sub }}>$</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="0"
          id={id}
          aria-describedby={`${id}-hint`}
          maxLength={9}
          style={{ width: "100%", boxSizing: "border-box", background: pal.input, border: `2px solid ${value ? pal.brand : pal.border}`, borderRadius: 14, padding: "13px 16px", fontSize: 18, fontWeight: 800, color: pal.text, fontFamily: "inherit" }}
        />
      </div>
    </div>
  );
}

function TapRow({ pal, label, options, value, onPick }: { pal: Palette; label: string; options: string[]; value: string; onPick: (v: string) => void }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontSize: 15, fontWeight: 800, color: pal.text, margin: "0 0 8px" }}>{label}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map((o) => {
          const selected = value === o;
          return (
            <button
              key={o}
              type="button"
              aria-pressed={selected}
              onClick={() => onPick(o)}
              style={{ background: selected ? pal.brand : pal.card, color: selected ? pal.ink : pal.text, border: `2px solid ${selected ? pal.brand : pal.border}`, borderRadius: 50, padding: "11px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", minHeight: 44 }}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function MoneyPage() {
  const pal = usePalette();
  const [income, setIncome] = useState("");
  const [essentials, setEssentials] = useState("");
  const [debt, setDebt] = useState("");
  const [stress, setStress] = useState("");
  const [track, setTrack] = useState("");
  const [surprise, setSurprise] = useState("");
  const [result, setResult] = useState<Reflection | null>(null);
  const restored = useRef(false);

  // draft: numbers and taps survive a refresh, on this device only
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const d = loadDraft<MoneyDraft>(DRAFT_KEY);
    if (d) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIncome(d.income ?? "");
      setEssentials(d.essentials ?? "");
      setDebt(d.debt ?? "");
      setStress(d.stress ?? "");
      setTrack(d.track ?? "");
      setSurprise(d.surprise ?? "");
    }
  }, []);
  useEffect(() => {
    if (!restored.current || result) return;
    saveDraft<MoneyDraft>(DRAFT_KEY, { income, essentials, debt, stress, track, surprise });
  }, [income, essentials, debt, stress, track, surprise, result]);

  const ready = income !== "" && essentials !== "" && stress && track && surprise;
  const missing = [
    income === "" && "take-home",
    essentials === "" && "essentials",
    !(stress && track && surprise) && "the three taps",
  ].filter(Boolean) as string[];
  const anyInput = income || essentials || debt || stress || track || surprise;

  const clearAll = () => {
    setIncome("");
    setEssentials("");
    setDebt("");
    setStress("");
    setTrack("");
    setSurprise("");
    clearDraft(DRAFT_KEY);
  };

  const run = () => {
    const m: MoneyInputs = {
      income: Number(income || 0),
      essentials: Number(essentials || 0),
      debt: Number(debt || 0),
      stress,
      track,
      surprise,
    };
    setResult(composeMoneyResult(m));
    window.scrollTo(0, 0);
  };

  const restart = () => {
    setResult(null);
    window.scrollTo(0, 0);
  };

  if (result) {
    const emoji = typeof result.meta?.patternEmoji === "string" ? result.meta.patternEmoji : "💵";
    const pattern = typeof result.meta?.pattern === "string" ? result.meta.pattern : "";
    return (
      <Shell pal={pal} narrow>
        <TopBar pal={pal} label="Money Check" />
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 44, marginBottom: 8 }} aria-hidden>{emoji}</div>
          <p style={{ fontSize: 13, fontWeight: 800, color: pal.sub, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 6px" }}>This money situation has a shape</p>
          <h1 style={{ fontSize: "clamp(1.6rem, 8vw, 2.2rem)", fontWeight: 900, color: pal.text, margin: 0, lineHeight: 1.15 }}>{pattern}</h1>
        </div>
        <ResultView pal={pal} reflection={result} onRestart={restart} restartLabel="Run the numbers again" />
      </Shell>
    );
  }

  return (
    <Shell pal={pal} narrow>
      <TopBar pal={pal} label="Money Check" />
      <PageHead
        pal={pal}
        title="Three numbers. Three taps. The real math."
        sub="See what's left each month after bills and debt payments. It takes about a minute."
      />

      <Card pal={pal} accent style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13.5, color: pal.text, lineHeight: 1.65, margin: 0 }}>
          🔒 <strong>Your numbers stay in this browser.</strong> The math runs on your device. What you type autosaves here so a refresh won&apos;t lose it, until you clear it below. The result is kept only if you tap Save. Google Analytics counts visits to this page; your numbers are never sent to it or put in a link.
        </p>
      </Card>

      <Card pal={pal} style={{ marginBottom: 20 }}>
        <Eyebrow pal={pal}>The three numbers — estimates are fine</Eyebrow>
        <NumField pal={pal} label="Monthly take-home" hint="What actually lands in your account each month, after taxes." value={income} onChange={setIncome} />
        <NumField pal={pal} label="Monthly essentials" hint="Rent or mortgage, utilities, groceries, transport, insurance — the must-pays." value={essentials} onChange={setEssentials} />
        <NumField pal={pal} label="Monthly debt payments" hint="Cards, car loan, student loans, personal loans. Zero is a fine answer." value={debt} onChange={setDebt} />
      </Card>

      <Card pal={pal} style={{ marginBottom: 20 }}>
        <Eyebrow pal={pal}>The three taps</Eyebrow>
        <TapRow pal={pal} label="Biggest money stress right now?" options={MONEY_STRESS} value={stress} onPick={setStress} />
        <TapRow pal={pal} label="Do you know where last month actually went?" options={MONEY_TRACK} value={track} onPick={setTrack} />
        <TapRow pal={pal} label="If a $500 surprise hit this week…" options={MONEY_SURPRISE} value={surprise} onPick={setSurprise} />
      </Card>

      <PrimaryBtn pal={pal} full disabled={!ready} onClick={run}>
        {ready ? "Show me the math →" : `Still needed: ${missing.join(", ")}`}
      </PrimaryBtn>
      {anyInput ? (
        <p style={{ textAlign: "center", marginTop: 12 }}>
          <TextLink pal={pal} onClick={clearAll}>Clear these numbers from this device</TextLink>
        </p>
      ) : (
        <p style={{ fontSize: 12.5, color: pal.sub, textAlign: "center", marginTop: 14, lineHeight: 1.6 }}>
          Your entries save on this device as you type, so a refresh won&apos;t lose them.
        </p>
      )}
    </Shell>
  );
}
