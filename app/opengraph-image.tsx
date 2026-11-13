// Share preview for every page that doesn't set its own: 1200×630 PNG in the
// site's dark palette (app/components/ui.tsx: bg, text, sub; brand #E879F9).
// Words match the home page. No "free" claims, no AI branding.

import { ImageResponse } from "next/og";

export const alt = "WhatAmIAI: think one thing through. Leave with a next step.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#0b1220";
const TEXT = "#e8edf5";
const SUB = "#94a3b8";
const BRAND = "#E879F9";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: BG,
          color: TEXT,
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ width: 140, height: 10, borderRadius: 5, background: BRAND, display: "flex" }} />
        <div style={{ marginTop: 36, fontSize: 30, letterSpacing: 6, color: SUB, display: "flex" }}>WHATAMIAI.COM</div>
        <div style={{ marginTop: 20, fontSize: 84, lineHeight: 1.08, display: "flex", flexWrap: "wrap" }}>
          <span>Think one thing through.&nbsp;</span>
          <span style={{ color: BRAND }}>Leave with a next step.</span>
        </div>
        <div style={{ marginTop: 28, fontSize: 36, color: SUB, lineHeight: 1.35, display: "flex" }}>
          Short tools you answer mostly by tapping. No sign-up. Your answers stay in your browser.
        </div>
      </div>
    ),
    size,
  );
}
