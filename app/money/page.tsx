"use client";
// Money Check — three numbers, three taps, real math. Everything stays
// on this device; financial numbers are never sent, stored remotely, or
// put in a URL.

import { useState } from "react";
import { composeMoneyResult, MONEY_STRESS, MONEY_SURPRISE, MONEY_TRACK, type MoneyInputs } from "../lib/moneyEngine";
import type { Reflection } from "../lib/types";
import ResultView from "../components/ResultView";
import { Card, Eyebrow, PageHead, PrimaryBtn, Shell, TopBar, usePalette, type Palette } from "../components/ui";

function NumField({ pal, label, hint, value, onChange }: { pal: Palette; label: string; hint: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 15, fontWeight: 800, color: pal.text, marginBottom: 4 }}>{label}</label>
      <p style={{ fontSize: 13, color: pal.sub, margin: "0 0 8px", lineHeight: 1.5 }}>{hint}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18, fontWeight: 900, color: pal.sub }}>$</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="0"
          aria-label={label}
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

  const ready = income !== "" && essentials !== "" && stress && track && surprise;

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
        sub="Most people have never seen their own margin written down. Sixty seconds fixes that."
      />

      <Card pal={pal} accent style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13.5, color: pal.text, lineHeight: 1.65, margin: 0 }}>
          🔒 <strong>These numbers never leave this device.</strong> No account, no server, no analytics on them — the math runs in your browser and disappears unless you save the result yourself.
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
        {ready ? "Show me the math →" : "Fill the numbers and taps above"}
      </PrimaryBtn>
    </Shell>
  );
}
