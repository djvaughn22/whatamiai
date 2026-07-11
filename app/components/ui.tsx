"use client";
// Small shared UI kit for WhatAmIAI. Family style: flat + cool, no glass,
// no gradients, no red. Follows the Open Mirror ☀️/🌙 toggle (om-theme).

import { useEffect, useState } from "react";

export const BRAND = "#E879F9";
export const INK = "#0b1220";

export type Palette = {
  dark: boolean;
  bg: string;
  text: string;
  sub: string;
  card: string;
  border: string;
  input: string;
  brand: string;
  ink: string;
};

export function usePalette(): Palette {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const follow = () => setDark(document.documentElement.dataset.omTheme !== "light");
    follow();
    window.addEventListener("om-theme", follow);
    return () => window.removeEventListener("om-theme", follow);
  }, []);
  return dark
    ? { dark, bg: "#0b1220", text: "#e8edf5", sub: "#94a3b8", card: "#141d2e", border: "#26324c", input: "#0c1220", brand: BRAND, ink: INK }
    : { dark, bg: "#FEFCF9", text: "#1C1917", sub: "#57534E", card: "#FFFFFF", border: "#E7E5E4", input: "#F9F9F7", brand: BRAND, ink: INK };
}

export function Shell({ pal, children, narrow = false }: { pal: Palette; children: React.ReactNode; narrow?: boolean }) {
  return (
    <main style={{ background: pal.bg, minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: narrow ? 620 : 680, margin: "0 auto", padding: "32px 20px 90px" }}>{children}</div>
    </main>
  );
}

export function Card({ pal, accent = false, children, style }: { pal: Palette; accent?: boolean; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: pal.card, border: `1px solid ${accent ? pal.brand : pal.border}`, borderRadius: 18, padding: "20px 22px", ...style }}>
      {children}
    </div>
  );
}

export function PrimaryBtn({ pal, children, onClick, disabled, full, type }: { pal: Palette; children: React.ReactNode; onClick?: () => void; disabled?: boolean; full?: boolean; type?: "button" | "submit" }) {
  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? pal.border : pal.brand,
        color: disabled ? pal.sub : pal.ink,
        border: "none",
        borderRadius: 50,
        padding: "14px 28px",
        fontSize: 15.5,
        fontWeight: 800,
        cursor: disabled ? "not-allowed" : "pointer",
        width: full ? "100%" : undefined,
        minHeight: 48,
      }}
    >
      {children}
    </button>
  );
}

export function GhostBtn({ pal, children, onClick, small, danger }: { pal: Palette; children: React.ReactNode; onClick?: () => void; small?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "none",
        color: danger ? pal.sub : pal.text,
        border: `2px solid ${pal.border}`,
        borderRadius: 50,
        padding: small ? "9px 18px" : "12px 22px",
        fontSize: small ? 13.5 : 14.5,
        fontWeight: 700,
        cursor: "pointer",
        minHeight: small ? 38 : 44,
      }}
    >
      {children}
    </button>
  );
}

export function TextLink({ pal, children, onClick }: { pal: Palette; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ background: "none", border: "none", color: pal.sub, fontSize: 13.5, fontWeight: 700, cursor: "pointer", textDecoration: "underline", padding: 6 }}
    >
      {children}
    </button>
  );
}

export function Eyebrow({ pal, children }: { pal: Palette; children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 12, fontWeight: 800, color: pal.brand, textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 10px" }}>
      {children}
    </p>
  );
}

export function PageHead({ pal, title, sub }: { pal: Palette; title: string; sub?: string }) {
  return (
    <header style={{ textAlign: "center", marginBottom: 30 }}>
      <h1 style={{ fontSize: "clamp(1.7rem, 8vw, 2.4rem)", fontWeight: 900, color: pal.text, margin: "0 0 10px", lineHeight: 1.1 }}>{title}</h1>
      {sub ? <p style={{ fontSize: 16, color: pal.sub, lineHeight: 1.65, maxWidth: 480, margin: "0 auto" }}>{sub}</p> : null}
    </header>
  );
}

export function TopBar({ pal, label, right }: { pal: Palette; label: string; right?: React.ReactNode }) {
  return (
    <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 26, gap: 10 }}>
      <a href="/" style={{ color: pal.sub, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>← WhatAmIAI</a>
      <span style={{ fontSize: 12.5, fontWeight: 800, color: pal.brand, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
      <span>{right}</span>
    </div>
  );
}
