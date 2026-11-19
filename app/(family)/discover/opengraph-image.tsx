// Share preview for /discover: 1200×630 PNG in the site's dark palette
// (bg, text, sub; brand #E879F9). Without it, a shared Discover link would show
// the reflection tools' picture (app/opengraph-image.tsx).

import { ImageResponse } from "next/og";

export const alt = "WhatAmIAI Discover: find where someone's records are kept.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#0b1220";
const TEXT = "#e8edf5";
const SUB = "#94a3b8";
const BRAND = "#E879F9";

export default function DiscoverImage() {
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
          <span>Find where their&nbsp;</span>
          <span style={{ color: BRAND }}>records are kept.</span>
        </div>
        <div style={{ marginTop: 28, fontSize: 36, color: SUB, lineHeight: 1.35, display: "flex" }}>
          Type a name, a rough year and a place. See which records fit, and search old newspapers.
        </div>
      </div>
    ),
    size,
  );
}
