"use client";
// Renders a finished Reflection and its actions: save locally, copy,
// print, export Markdown/JSON, private snapshot, and the optional
// continue-with-an-AI prompt. Readable on a phone, clean when printed.

import { useState } from "react";
import type { Reflection } from "../lib/types";
import { saveReflection } from "../lib/storage";
import { copyText, downloadFile, safeFilename, toAIPrompt, toJSONExport, toMarkdown, toPlainText, toSnapshot } from "../lib/exporters";
import { downloadSnapshotImage } from "../lib/shareImage";
import { SAFETY_COPY } from "../lib/safety";
import { Card, Eyebrow, GhostBtn, PrimaryBtn, type Palette } from "./ui";

export default function ResultView({
  pal,
  reflection,
  onRestart,
  restartLabel = "Start over",
  readOnly = false,
}: {
  pal: Palette;
  reflection: Reflection;
  onRestart?: () => void;
  restartLabel?: string;
  readOnly?: boolean;
}) {
  const r = reflection;
  const [saved, setSaved] = useState(false);
  const [flash, setFlash] = useState("");

  const note = (msg: string) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(""), 2600);
  };

  const doCopy = async (text: string, msg: string) => {
    note((await copyText(text)) ? msg : "Couldn't copy — your browser blocked it.");
  };

  return (
    <div>
      {r.safetyFlagged && (
        <Card pal={pal} accent style={{ marginBottom: 18 }}>
          <Eyebrow pal={pal}>Before the reflection</Eyebrow>
          <p style={{ fontSize: 15, fontWeight: 800, color: pal.text, margin: "0 0 10px", lineHeight: 1.55 }}>{SAFETY_COPY.self.lead}</p>
          {SAFETY_COPY.self.lines.map((l, i) => (
            <p key={i} style={{ fontSize: 14.5, color: pal.text, margin: "0 0 8px", lineHeight: 1.6 }}>{l}</p>
          ))}
          <p style={{ fontSize: 13.5, color: pal.sub, margin: "10px 0 0", lineHeight: 1.6 }}>
            The reflection below is kept, but it is not the response your answers most need. A real person is.
          </p>
        </Card>
      )}

      <div className="print-area">
        {r.sections.map((s) => (
          <Card key={s.heading} pal={pal} style={{ marginBottom: 14 }}>
            <Eyebrow pal={pal}>{s.heading}</Eyebrow>
            {(s.paragraphs ?? []).map((p, i) => (
              <p key={i} style={{ fontSize: 15.5, color: pal.text, lineHeight: 1.65, margin: i === 0 ? 0 : "10px 0 0" }}>{p}</p>
            ))}
            {s.bullets?.length ? (
              <ul style={{ margin: s.paragraphs?.length ? "10px 0 0" : 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                {s.bullets.map((b, i) => (
                  <li key={i} style={{ fontSize: 15, color: pal.text, lineHeight: 1.6 }}>{b}</li>
                ))}
              </ul>
            ) : null}
            {s.note ? <p style={{ fontSize: 13.5, color: pal.sub, lineHeight: 1.6, margin: "12px 0 0" }}>{s.note}</p> : null}
          </Card>
        ))}
      </div>

      {/* actions */}
      <div className="no-print">
        {flash && (
          <div
            role="status"
            style={{
              position: "fixed",
              bottom: 18,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 60,
              background: pal.card,
              border: `1px solid ${pal.brand}`,
              borderRadius: 999,
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 700,
              color: pal.text,
              maxWidth: "calc(100vw - 32px)",
              textAlign: "center",
            }}
          >
            {flash}
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
          {!readOnly && (
            <PrimaryBtn
              pal={pal}
              onClick={() => {
                saveReflection(r);
                setSaved(true);
                note("Saved — only in this browser.");
              }}
              disabled={saved}
            >
              {saved ? "✓ Saved on this device" : "Save on this device"}
            </PrimaryBtn>
          )}
          <GhostBtn pal={pal} onClick={() => doCopy(toPlainText(r), "Summary copied.")}>Copy summary</GhostBtn>
          <GhostBtn pal={pal} onClick={() => window.print()}>Print / save as PDF</GhostBtn>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
          <GhostBtn pal={pal} small onClick={() => downloadFile(`${safeFilename(r.title)}.md`, toMarkdown(r), "text/markdown")}>Export Markdown</GhostBtn>
          <GhostBtn pal={pal} small onClick={() => downloadFile(`${safeFilename(r.title)}.json`, toJSONExport(r), "application/json")}>Export JSON</GhostBtn>
          <GhostBtn pal={pal} small onClick={() => doCopy(toSnapshot(r), "Snapshot copied — paste it into a text or email if you choose to.")}>Copy text/email snapshot</GhostBtn>
          <GhostBtn pal={pal} small onClick={() => { downloadSnapshotImage(r, "square"); note("Image saved to your device — share it only if you choose to."); }}>Snapshot image (square)</GhostBtn>
          <GhostBtn pal={pal} small onClick={() => { downloadSnapshotImage(r, "portrait"); note("Image saved to your device — share it only if you choose to."); }}>Snapshot image (tall)</GhostBtn>
        </div>

        <Card pal={pal} style={{ marginTop: 20 }}>
          <Eyebrow pal={pal}>Optional: take it further with an AI</Eyebrow>
          <p style={{ fontSize: 14.5, color: pal.sub, lineHeight: 1.65, margin: "0 0 14px" }}>
            This copies your summary plus ground rules — no diagnosing, no labels, observations kept separate from facts, judgment calls stay with you. No AI has been certified wise; take what&apos;s useful.
          </p>
          <GhostBtn pal={pal} onClick={() => doCopy(toAIPrompt(r), "Prompt copied — paste it into the AI you use.")}>Continue this reflection with an AI</GhostBtn>
        </Card>

        <Card pal={pal} style={{ marginTop: 14, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: pal.sub, lineHeight: 1.65, margin: "0 0 8px" }}>
            Better than any AI: someone who knows you. A trusted family member, a mature friend, a pastor or counselor — show them this and ask what they&apos;d challenge.
          </p>
          <a href="https://crossheartpray.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 800, color: pal.brand, textDecoration: "none" }}>
            Want to sit with it through faith and Scripture? CrossHeartPray →
          </a>
        </Card>

        <div style={{ textAlign: "center", marginTop: 20, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {onRestart && <GhostBtn pal={pal} small onClick={onRestart}>{restartLabel}</GhostBtn>}
          <GhostBtn pal={pal} small onClick={() => (window.location.href = "/saved")}>My saved reflections</GhostBtn>
        </div>

        <p style={{ fontSize: 12.5, color: pal.sub, textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
          Everything on this page stays in your browser unless you copy, print, or export it yourself. There&apos;s no account and no sync — clearing your browser data clears saved reflections too.
        </p>
      </div>
    </div>
  );
}
