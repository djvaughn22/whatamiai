"use client";
// Renders a finished Reflection and its actions: save locally, copy,
// print, export Markdown/JSON, private snapshot, and the optional
// continue-with-an-AI prompt. Readable on a phone, clean when printed.

import { ANALYTICS_NOTE, STORAGE_NOTE } from "../lib/privacyCopy";
import { useState } from "react";
import type { Reflection } from "../lib/types";
import { saveReflection } from "../lib/storage";
import { copyText, downloadFile, exportCategories, hasFinancialContent, hasWrittenContent, safeFilename, toAIPrompt, toJSONExport, toMarkdown, toPlainText } from "../lib/exporters";
import { downloadSnapshotImage } from "../lib/shareImage";
import { IMMEDIATE_LEAD, SAFETY_COPY, type SafetyKind } from "../lib/safety";
import { ExperimentBlock, InterpretationBlock, ObservationBlock } from "./reflect";
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
  const [previewOpen, setPreviewOpen] = useState(false);
  const [includeWritten, setIncludeWritten] = useState(true);
  const [includeFigures, setIncludeFigures] = useState(true);

  const note = (msg: string) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(""), 2600);
  };

  const doCopy = async (text: string, msg: string) => {
    note((await copyText(text)) ? msg : "Couldn't copy — your browser blocked it.");
  };

  const safetyKind: SafetyKind = typeof r.meta?.safetyKind === "string" && r.meta.safetyKind in SAFETY_COPY ? (r.meta.safetyKind as SafetyKind) : "self";
  const safetyImmediate = r.meta?.safetyLevel === "immediate";
  const aiOptions = { includeWritten, includeExactFigures: includeFigures };
  const written = hasWrittenContent(r);
  // the one thing to take away: the typed experiment, else a plan section
  const stepSection = r.sections.find((s) => s.experiment) ?? r.sections.find((s) => s.kind === "plan" || s.kind === "experiment");
  const stepText = stepSection?.experiment
    ? stepSection.experiment.action
    : stepSection?.paragraphs?.[0] ?? stepSection?.bullets?.[0];
  const financial = hasFinancialContent(r);

  return (
    <div>
      {r.safetyFlagged && (
        <Card pal={pal} accent style={{ marginBottom: 18 }}>
          <Eyebrow pal={pal}>Before the reflection</Eyebrow>
          {safetyImmediate && (
            <p style={{ fontSize: 15, fontWeight: 800, color: pal.text, margin: "0 0 10px", lineHeight: 1.55 }}>{IMMEDIATE_LEAD}</p>
          )}
          <p style={{ fontSize: 15, fontWeight: 800, color: pal.text, margin: "0 0 10px", lineHeight: 1.55 }}>{SAFETY_COPY[safetyKind].lead}</p>
          {SAFETY_COPY[safetyKind].lines.map((l, i) => (
            <p key={i} style={{ fontSize: 14.5, color: pal.text, margin: "0 0 8px", lineHeight: 1.6 }}>{l}</p>
          ))}
          <p style={{ fontSize: 13.5, color: pal.sub, margin: "10px 0 0", lineHeight: 1.6 }}>
            The reflection below is kept, but it is not the response your answers most need. A real person is.
          </p>
        </Card>
      )}

      {stepText && (
        <Card pal={pal} accent style={{ marginBottom: 18 }}>
          <Eyebrow pal={pal}>Your next step</Eyebrow>
          <p style={{ fontSize: 16.5, fontWeight: 800, color: pal.text, lineHeight: 1.5, margin: 0 }}>{stepText}</p>
          <p className="no-print" style={{ fontSize: 13.5, color: pal.sub, margin: "10px 0 0" }}>
            <a href="#wai-actions" style={{ color: pal.accentText, fontWeight: 800 }}>Save, print, or download ↓</a>
          </p>
        </Card>
      )}

      <div className="print-area">
        {r.sections.map((s) => (
          <Card key={s.heading} pal={pal} style={{ marginBottom: 14 }}>
            <Eyebrow pal={pal}>{s.heading}</Eyebrow>
            {s.kind === "facts" && r.evidence?.length && !s.bullets?.length ? (
              <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                {r.evidence.map((e) => (
                  <li key={e.id} style={{ fontSize: 15, color: pal.text, lineHeight: 1.6 }}>{e.statement}</li>
                ))}
              </ul>
            ) : null}
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
            {s.observations?.length ? (
              <div style={{ marginTop: s.paragraphs?.length || s.bullets?.length ? 12 : 0 }}>
                <ObservationBlock pal={pal} r={r} observations={s.observations} />
              </div>
            ) : null}
            {s.interpretations?.length ? (
              <div style={{ marginTop: s.paragraphs?.length || s.bullets?.length ? 12 : 0 }}>
                <InterpretationBlock pal={pal} r={r} interpretations={s.interpretations} />
              </div>
            ) : null}
            {s.experiment ? (
              <div style={{ marginTop: s.paragraphs?.length || s.bullets?.length ? 12 : 0 }}>
                <ExperimentBlock pal={pal} experiment={s.experiment} />
              </div>
            ) : null}
            {s.note ? <p style={{ fontSize: 13.5, color: pal.sub, lineHeight: 1.6, margin: "12px 0 0" }}>{s.note}</p> : null}
          </Card>
        ))}
      </div>

      {/* actions */}
      <div className="no-print" id="wai-actions" style={{ scrollMarginTop: 80 }}>
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
                try {
                  saveReflection(r);
                  setSaved(true);
                  note("Saved in this browser. Find it under Saved Reflections.");
                } catch {
                  note("Couldn't save — this browser is blocking storage (private mode?). Try Download instead.");
                }
              }}
              disabled={saved}
            >
              {saved ? "✓ Saved on this device" : "Save on this device"}
            </PrimaryBtn>
          )}
          <GhostBtn pal={pal} onClick={() => doCopy(toPlainText(r), "Summary copied.")}>Copy summary</GhostBtn>
          <GhostBtn pal={pal} onClick={() => window.print()}>Print / save as PDF</GhostBtn>
        </div>
        <p style={{ fontSize: 13, fontWeight: 800, color: pal.sub, margin: "18px 0 8px" }}>Download a copy</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <GhostBtn pal={pal} small onClick={() => { downloadSnapshotImage(r, "portrait"); note("Image downloaded."); }}>Image (.png)</GhostBtn>
          <GhostBtn pal={pal} small onClick={() => { downloadFile(`${safeFilename(r.title)}.md`, toMarkdown(r), "text/markdown"); note("Text file downloaded."); }}>Text (.md)</GhostBtn>
          <GhostBtn pal={pal} small onClick={() => { downloadFile(`${safeFilename(r.title)}.json`, toJSONExport(r), "application/json"); note("Data file downloaded."); }}>Data (.json)</GhostBtn>
        </div>

        <Card pal={pal} style={{ marginTop: 20 }}>
          <Eyebrow pal={pal}>Optional: take it further with an AI</Eyebrow>
          <p style={{ fontSize: 14.5, color: pal.sub, lineHeight: 1.65, margin: "0 0 10px" }}>
            This copies your reflection plus ground rules — no diagnosing, no labels, observations kept separate from facts, judgment calls stay with you. No AI has been certified wise; take what&apos;s useful.
          </p>
          <button
            type="button"
            aria-expanded={previewOpen}
            onClick={() => setPreviewOpen(!previewOpen)}
            style={{ background: "none", border: "none", color: pal.sub, fontSize: 13, fontWeight: 800, cursor: "pointer", padding: "0 0 10px", textDecoration: "underline" }}
          >
            {previewOpen ? "Hide what will be copied" : "See what will be copied"}
          </button>
          {previewOpen && (
            <div style={{ marginBottom: 12 }}>
              <ul style={{ margin: "0 0 10px", paddingLeft: 20 }}>
                {exportCategories(r).map((c) => (
                  <li key={c} style={{ fontSize: 13.5, color: pal.sub, lineHeight: 1.6 }}>{c}</li>
                ))}
              </ul>
              {written && (
                <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13.5, color: pal.text, marginBottom: 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={includeWritten} onChange={(e) => setIncludeWritten(e.target.checked)} style={{ marginTop: 3 }} />
                  Include the answers I typed in my own words
                </label>
              )}
              {financial && (
                <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13.5, color: pal.text, marginBottom: 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={includeFigures} onChange={(e) => setIncludeFigures(e.target.checked)} style={{ marginTop: 3 }} />
                  Include my exact dollar amounts (unchecked sends percentages only)
                </label>
              )}
              <p style={{ fontSize: 12.5, color: pal.sub, lineHeight: 1.6, margin: "8px 0 0" }}>
                Nothing is sent by this site — the prompt is only copied, and you choose where to paste it.
              </p>
            </div>
          )}
          <GhostBtn pal={pal} onClick={() => doCopy(toAIPrompt(r, aiOptions), "Prompt copied — paste it into the AI you use.")}>Continue this reflection with an AI</GhostBtn>
        </Card>

        <Card pal={pal} style={{ marginTop: 14, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: pal.sub, lineHeight: 1.65, margin: "0 0 8px" }}>
            Better than any AI: someone who knows you. A trusted family member, a mature friend, a pastor or counselor — show them this and ask what they&apos;d challenge.
          </p>
          <a href="https://crossheartpray.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 800, color: pal.accentText, textDecoration: "none" }}>
            Want to sit with it through faith and Scripture? CrossHeartPray →
          </a>
        </Card>

        <div style={{ textAlign: "center", marginTop: 20, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {onRestart && <GhostBtn pal={pal} small onClick={onRestart}>{restartLabel}</GhostBtn>}
          <GhostBtn pal={pal} small onClick={() => (window.location.href = "/saved")}>My saved reflections</GhostBtn>
        </div>

        <p style={{ fontSize: 12.5, color: pal.sub, textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
          Nothing leaves this page unless you copy, print, or download it. Saved reflections: {STORAGE_NOTE}
        </p>
      </div>
    </div>
  );
}
