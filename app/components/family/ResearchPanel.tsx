"use client";

import { useMemo, useState } from "react";
import { useFamily } from "../FamilyProvider";
import { ACCESS_LABEL, openQuestions, profileOf, researchPlan, type Lead } from "../../lib/family/research";
import { addHypothesis, removeHypothesis, setLead, updateHypothesis } from "../../lib/family/ops";
import { buildAiPrompt } from "../../lib/family/aiPrompt";
import NewspaperSearch from "./NewspaperSearch";
import EvidenceForm from "./EvidenceForm";
import { Dialog, TextArea } from "./bits";
import type { Id, LeadStatus } from "../../lib/family/types";

const STATUS: { value: LeadStatus; label: string }[] = [
  { value: "todo", label: "To do" },
  { value: "found", label: "Found something" },
  { value: "nothing", label: "Nothing found" },
  { value: "skip", label: "Skip" },
];

function LeadRow({ personId, lead }: { personId: Id; lead: Lead }) {
  const fam = useFamily();
  const data = fam.data!;
  const state = Object.values(data.leads).find((l) => l.personId === personId && l.key === lead.key);
  const status = state?.status ?? "todo";
  const [note, setNote] = useState(state?.note ?? "");
  const [attach, setAttach] = useState(false);
  return (
    <li className="w-stack" style={{ paddingTop: 12, paddingBottom: 12 }}>
      <div className="w-between" style={{ alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 20rem" }}>
          <a href={lead.url} target="_blank" rel="noopener noreferrer" className="w-link w-ext" style={{ fontWeight: 700 }}>
            {lead.title}
          </a>
          <div className="w-tiny w-muted">
            {lead.holder} · <span className="w-tag">{ACCESS_LABEL[lead.access]}</span>
          </div>
          <p className="w-small" style={{ margin: "6px 0 0" }}>
            {lead.why}
          </p>
          {lead.tells ? <p className="w-small w-muted" style={{ margin: "4px 0 0" }}>Usually shows: {lead.tells}</p> : null}
          {lead.searchFor ? <p className="w-tiny w-muted" style={{ margin: "4px 0 0" }}>Search for: {lead.searchFor}</p> : null}
        </div>
        <label className="w-field" style={{ minWidth: "11rem" }}>
          <span className="w-tiny w-muted">Your progress</span>
          <select
            className="w-select"
            value={status}
            onChange={async (e) => {
              const s = e.target.value as LeadStatus;
              await fam.commit(setLead(data, personId, lead.key, s, note));
              if (s === "found") setAttach(true);
            }}
          >
            {STATUS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {status !== "todo" ? (
        <div className="w-row">
          <input className="w-input" style={{ flex: "1 1 16rem" }} value={note} placeholder="What you searched, what you found" onChange={(e) => setNote(e.target.value)} aria-label="Research note" />
          <button type="button" className="w-btn w-btn-small" onClick={() => fam.commit(setLead(data, personId, lead.key, status, note))}>
            Save note
          </button>
        </div>
      ) : null}
      <Dialog open={attach} onClose={() => setAttach(false)} title="Add what you found">
        <p className="w-small w-muted" style={{ marginTop: 0 }}>
          Saved to this person. Later, attach it to the exact fact it proves from the Facts tab.
        </p>
        <EvidenceForm target={{ personId }} onDone={() => setAttach(false)} />
      </Dialog>
    </li>
  );
}

function AiPanel({ personId }: { personId: Id }) {
  const fam = useFamily();
  const data = fam.data!;
  const [living, setLiving] = useState(false);
  const [pasted, setPasted] = useState("");
  const prompt = buildAiPrompt(data, personId, { includeLiving: living });
  return (
    <div className="w-stack">
      <p className="w-small w-muted" style={{ margin: 0 }}>
        Copy this into the AI chat you already use. WhatAmIAI doesn&apos;t send it anywhere. Treat the answer as ideas to check: AI tools can invent records.
      </p>
      <textarea className="w-textarea" readOnly value={prompt} rows={10} aria-label="Research prompt" />
      <div className="w-row">
        <button
          type="button"
          className="w-btn w-btn-small"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(prompt);
              fam.toast("Copied");
            } catch {
              fam.toast("Select the text and copy it");
            }
          }}
        >
          Copy
        </button>
        <label className="w-row w-small">
          <input type="checkbox" checked={living} onChange={(e) => setLiving(e.target.checked)} /> Include living relatives&apos; names
        </label>
      </div>
      <TextArea label="Paste a suggestion worth checking" value={pasted} onChange={setPasted} rows={3} help="Saved as an idea from an AI chat, never as a fact." />
      <div>
        <button
          type="button"
          className="w-btn w-btn-small"
          disabled={!pasted.trim()}
          onClick={async () => {
            await fam.commit(addHypothesis(data, { personId, text: pasted, origin: "ai", basis: "Suggested by an AI chat. Not checked." }).patch);
            setPasted("");
            fam.toast("Saved as an idea to check");
          }}
        >
          Save as an idea
        </button>
      </div>
    </div>
  );
}

export function Ideas({ personId }: { personId: Id }) {
  const fam = useFamily();
  const data = fam.data!;
  const [text, setText] = useState("");
  const ideas = Object.values(data.hypotheses).filter((h) => h.personId === personId);
  return (
    <div className="w-stack">
      <p className="w-small w-muted" style={{ margin: 0 }}>
        Ideas are things worth checking. They never appear as facts, in stories or in exports as facts.
      </p>
      {ideas.length ? (
        <ul className="w-list">
          {ideas.map((h) => (
            <li key={h.id} className="w-between" style={{ alignItems: "flex-start" }}>
              <div style={{ flex: "1 1 18rem" }}>
                <div>{h.text}</div>
                <div className="w-tiny w-muted">
                  {h.origin === "ai" ? "From an AI chat" : h.origin === "research" ? "From research" : "Your idea"}
                  {h.basis ? ` · ${h.basis}` : ""}
                </div>
              </div>
              <div className="w-row">
                <select className="w-select" style={{ width: "auto" }} value={h.status} aria-label="Idea status" onChange={(e) => fam.commit(updateHypothesis(data, h.id, { status: e.target.value as typeof h.status }))}>
                  <option value="open">Still open</option>
                  <option value="confirmed">Records confirm it</option>
                  <option value="disproved">Records rule it out</option>
                </select>
                <button type="button" className="w-btn w-btn-small w-btn-quiet" onClick={() => fam.commit(removeHypothesis(data, h.id))}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="w-small w-muted">No ideas yet.</p>
      )}
      <div className="w-row">
        <input className="w-input" style={{ flex: "1 1 18rem" }} value={text} onChange={(e) => setText(e.target.value)} placeholder="The Thomas Hale in the 1880 census may be her father" aria-label="New idea" />
        <button
          type="button"
          className="w-btn w-btn-small"
          disabled={!text.trim()}
          onClick={async () => {
            await fam.commit(addHypothesis(data, { personId, text, origin: "you" }).patch);
            setText("");
          }}
        >
          Add idea
        </button>
      </div>
      <p className="w-tiny w-muted">When records confirm an idea, add it as a fact with the record attached.</p>
    </div>
  );
}

export default function ResearchPanel({ personId }: { personId: Id }) {
  const { data } = useFamily();
  const plan = useMemo(() => (data ? researchPlan(data, personId) : []), [data, personId]);
  const [showAll, setShowAll] = useState(false);
  if (!data) return null;
  const p = profileOf(data, personId);
  const questions = openQuestions(data, personId);
  const groups = [...new Set(plan.map((l) => l.group))];
  const visible = showAll ? plan : plan.slice(0, 8);
  const from = p.birth ? Math.max(1770, Math.floor(p.birth[0])) : undefined;
  const to = p.death ? Math.min(1963, Math.ceil(p.death[1]) + 3) : p.birth ? Math.min(1963, Math.floor(p.birth[1]) + 90) : undefined;
  return (
    <div className="w-stack">
      {questions.length ? (
        <div className="w-well">
          <h3 className="w-h3">Open questions</h3>
          <ul className="w-small" style={{ margin: 0, paddingLeft: 18 }}>
            {questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <section>
        <h3 className="w-h3">Where to look</h3>
        {plan.length ? (
          <>
            <p className="w-small w-muted" style={{ marginTop: 0 }}>
              Places these records are likely kept, given {p.given || "this person"}&apos;s dates and places. Nothing here has been found yet; each link opens a search on the holder&apos;s own site.
            </p>
            {groups.map((g) => {
              const rows = visible.filter((l) => l.group === g);
              if (!rows.length) return null;
              return (
                <div key={g} style={{ marginTop: 12 }}>
                  <div className="w-tiny w-muted" style={{ fontWeight: 750 }}>
                    {g}
                  </div>
                  <ul className="w-list">
                    {rows.map((l) => (
                      <LeadRow key={l.key} personId={personId} lead={l} />
                    ))}
                  </ul>
                </div>
              );
            })}
            {plan.length > 8 ? (
              <button type="button" className="w-btn w-btn-small" style={{ marginTop: 10 }} onClick={() => setShowAll((s) => !s)}>
                {showAll ? "Show fewer" : `Show all ${plan.length}`}
              </button>
            ) : null}
          </>
        ) : (
          <p className="w-small w-muted">Add a name and a rough birth year or place to get a research plan.</p>
        )}
      </section>
      {p.usConnected || !p.countries.length ? (
        <section>
          <h3 className="w-h3">Search old newspapers</h3>
          <NewspaperSearch personId={personId} initial={{ text: p.name ? `"${p.name}"` : "", state: p.states[0], from, to }} />
        </section>
      ) : null}
      <details className="w-more">
        <summary>Ask any AI for ideas</summary>
        <div style={{ marginTop: 10 }}>
          <AiPanel personId={personId} />
        </div>
      </details>
    </div>
  );
}
