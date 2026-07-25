"use client";
// Shared Reflection Engine 2.0 building blocks: confidence labels (text,
// never color alone), expandable evidence disclosures ("Why am I seeing
// this?"), cautious interpretation blocks with alternatives and check
// questions, and typed experiment cards with flexible versions.
// Internal ids are plumbing — only statements are ever rendered.

import { useState } from "react";
import type { Experiment, Interpretation, Observation, Reflection } from "../lib/types";
import { CONFIDENCE_LABEL, evidenceFor } from "../lib/types";
import type { Palette } from "./ui";

export function ConfidenceTag({ pal, confidence }: { pal: Palette; confidence: keyof typeof CONFIDENCE_LABEL }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 11.5,
        fontWeight: 800,
        color: pal.sub,
        border: `1px solid ${pal.border}`,
        borderRadius: 50,
        padding: "2px 10px",
        letterSpacing: "0.02em",
      }}
    >
      {CONFIDENCE_LABEL[confidence]}
    </span>
  );
}

export function EvidenceDisclosure({ pal, r, ids, label = "Why am I seeing this?" }: { pal: Palette; r: Reflection; ids: string[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const items = evidenceFor(r, ids);
  if (!items.length) return null;
  return (
    <div style={{ marginTop: 6 }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        style={{ background: "none", border: "none", color: pal.sub, fontSize: 12.5, fontWeight: 800, cursor: "pointer", padding: "2px 0", textDecoration: "underline" }}
      >
        {open ? "Hide the answers behind this" : label}
      </button>
      {open && (
        <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
          {items.map((e) => (
            <li key={e.id} style={{ fontSize: 13, color: pal.sub, lineHeight: 1.55, marginBottom: 3 }}>
              {e.statement}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ObservationBlock({ pal, r, observations }: { pal: Palette; r: Reflection; observations: Observation[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {observations.map((o) => (
        <div key={o.id}>
          <p style={{ fontSize: 15, color: pal.text, lineHeight: 1.6, margin: "0 0 4px" }}>{o.statement}</p>
          <ConfidenceTag pal={pal} confidence={o.confidence} />
          <EvidenceDisclosure pal={pal} r={r} ids={o.evidenceIds} />
        </div>
      ))}
    </div>
  );
}

export function InterpretationBlock({ pal, r, interpretations }: { pal: Palette; r: Reflection; interpretations: Interpretation[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {interpretations.map((i) => (
        <div key={i.id}>
          <p style={{ fontSize: 15.5, color: pal.text, lineHeight: 1.65, margin: "0 0 6px" }}>
            <strong>One possibility:</strong> {i.possibility}
          </p>
          <ConfidenceTag pal={pal} confidence={i.confidence} />
          {i.alternative && (
            <p style={{ fontSize: 14.5, color: pal.text, lineHeight: 1.65, margin: "10px 0 0" }}>
              <strong style={{ color: pal.sub }}>Another possibility:</strong> {i.alternative}
            </p>
          )}
          {i.checkQuestion && (
            <p style={{ fontSize: 14, color: pal.sub, lineHeight: 1.6, margin: "8px 0 0", fontStyle: "italic" }}>
              A question to test it: {i.checkQuestion}
            </p>
          )}
          <EvidenceDisclosure pal={pal} r={r} ids={i.evidenceIds} />
        </div>
      ))}
    </div>
  );
}

export function ExperimentBlock({ pal, experiment }: { pal: Palette; experiment: Experiment }) {
  const x = experiment;
  const row = (label: string, text: string) => (
    <p style={{ fontSize: 14.5, color: pal.text, lineHeight: 1.65, margin: "8px 0 0" }}>
      <strong style={{ color: pal.sub }}>{label}:</strong> {text}
    </p>
  );
  return (
    <div>
      <p style={{ fontSize: 15.5, fontWeight: 800, color: pal.text, margin: "0 0 6px" }}>{x.title}</p>
      <p style={{ fontSize: 15.5, color: pal.text, lineHeight: 1.65, margin: 0 }}>{x.action}</p>
      {row("Why this connects", x.rationale)}
      {row("How long", x.duration)}
      {x.observe.length > 0 && (
        <div style={{ margin: "8px 0 0" }}>
          <p style={{ fontSize: 14.5, fontWeight: 800, color: pal.sub, margin: "0 0 4px" }}>What to observe:</p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {x.observe.map((o) => (
              <li key={o} style={{ fontSize: 14.5, color: pal.text, lineHeight: 1.6 }}>{o}</li>
            ))}
          </ul>
        </div>
      )}
      {x.busyVersion && row("Busy-day version", x.busyVersion)}
      {x.minimumVersion && row("Minimum version", x.minimumVersion)}
      {x.permissionToAdjust && (
        <p style={{ fontSize: 13.5, color: pal.sub, lineHeight: 1.6, margin: "10px 0 0" }}>{x.permissionToAdjust}</p>
      )}
    </div>
  );
}
