"use client";

// Facts with their evidence. Each row shows the label, and opens to show
// exactly which sources gave it and why. Disagreeing versions get a
// "choose one, with a reason" panel.

import { useState } from "react";
import { useFamily } from "../FamilyProvider";
import { assessFact, INFO_LABEL, LEVEL_INFO } from "../../lib/family/evidence";
import { formatDate, sortKey } from "../../lib/family/dates";
import { chooseFact, rejectFact, removeCitation, removeFact, restoreFact, updateCitation } from "../../lib/family/ops";
import EvidenceForm from "./EvidenceForm";
import FactForm from "./FactForm";
import { Dialog, EvidenceBadge, FACT_LABEL, TextField } from "./bits";
import type { Fact, Id } from "../../lib/family/types";

function factText(f: Fact): string {
  if (f.type === "name") return [f.given, f.surname].filter(Boolean).join(" ") + (f.nickname ? ` (“${f.nickname}”)` : "");
  if (f.type === "memory") return `“${f.value ?? ""}”`;
  const bits = [f.value, formatDate(f.date), f.place].filter(Boolean);
  return bits.join(" · ") || "No details yet";
}

const ORDER: Record<string, number> = { name: 0, birth: 1, baptism: 2, residence: 4, immigration: 4, emigration: 4, naturalization: 4, military: 4, occupation: 4, education: 4, religion: 4, other: 4, marriage: 5, divorce: 5, memory: 6, death: 8, burial: 9 };

export function sortFacts(facts: Fact[]): Fact[] {
  return [...facts].sort((a, b) => (ORDER[a.type] ?? 5) - (ORDER[b.type] ?? 5) || (Number.isFinite(sortKey(a.date)) ? sortKey(a.date) : 1e9) - (Number.isFinite(sortKey(b.date)) ? sortKey(b.date) : 1e9));
}

function Resolve({ fact, peers, onDone }: { fact: Fact; peers: Id[]; onDone: () => void }) {
  const fam = useFamily();
  const data = fam.data!;
  const [reason, setReason] = useState("");
  return (
    <div className="w-fields">
      <p className="w-small" style={{ margin: 0 }}>
        Keep <strong>{factText(fact)}</strong> as the version the evidence supports best. The other {peers.length === 1 ? "version stays" : "versions stay"} on record, marked as not chosen.
      </p>
      <TextField label="Why this one?" value={reason} onChange={setReason} placeholder="The birth certificate was made at the time; the census age is second-hand." />
      <div className="w-row">
        <button
          type="button"
          className="w-btn w-btn-primary"
          disabled={!reason.trim()}
          onClick={async () => {
            await fam.commit(chooseFact(data, fact.id, reason, peers));
            fam.toast("Chosen. The reason is saved with it.");
            onDone();
          }}
        >
          Choose this version
        </button>
        <button type="button" className="w-btn w-btn-quiet" onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function FactRow({ fact }: { fact: Fact }) {
  const fam = useFamily();
  const data = fam.data!;
  const a = assessFact(data, fact.id);
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<null | "evidence" | "edit" | "resolve" | "reject">(null);
  const [reason, setReason] = useState("");
  const rejected = !!fact.rejected;
  return (
    <li>
      <div className="w-fact">
        <div className="w-fact-type">{FACT_LABEL[fact.type] ?? fact.type}</div>
        <div>
          <div className={`w-fact-main${rejected ? " w-fact-rejected" : ""}`}>{factText(fact)}</div>
          {fact.note ? <div className="w-tiny w-muted" style={{ whiteSpace: "pre-wrap", marginTop: 2 }}>{fact.note}</div> : null}
          {rejected ? <div className="w-tiny w-muted">Set aside: {fact.rejected!.reason}</div> : null}
          {a.level === "conflicting" && !rejected ? (
            <div className="w-tiny" style={{ marginTop: 4, color: "var(--w-clash)" }}>
              {a.reasons[0]}{" "}
              <button type="button" className="w-link" onClick={() => setDialog("resolve")}>
                Choose this version
              </button>
            </div>
          ) : null}
        </div>
        <div className="w-row" style={{ justifyContent: "flex-end" }}>
          {!rejected ? (
            <button type="button" className="w-link" onClick={() => setOpen((o) => !o)} aria-expanded={open} style={{ textDecoration: "none" }}>
              <EvidenceBadge level={a.level} /> <span className="w-sr">Show evidence</span>
            </button>
          ) : (
            <span className="w-tag">Not used</span>
          )}
        </div>
      </div>
      {open ? (
        <div className="w-well" style={{ marginTop: 10 }}>
          <p className="w-small" style={{ marginTop: 0 }}>
            <strong>{LEVEL_INFO[a.level].label}.</strong> {LEVEL_INFO[a.level].explain}
          </p>
          {a.citations.length ? (
            <ul className="w-list">
              {a.citations.map((c) => {
                const s = data.sources[c.sourceId];
                return (
                  <li key={c.id} className="w-stack" style={{ paddingTop: 8, paddingBottom: 8 }}>
                    <div className="w-between">
                      <div>
                        <div style={{ fontWeight: 700 }}>
                          {s?.url ? (
                            <a href={s.url} target="_blank" rel="noopener noreferrer" className="w-link w-ext">
                              {s.title}
                            </a>
                          ) : (
                            s?.title
                          )}
                        </div>
                        <div className="w-tiny w-muted">
                          {[s?.repository, c.detail, INFO_LABEL[c.info].label, c.match === "confirmed" ? "checked" : "not confirmed yet", s?.kind === "tree" || s?.kind === "ai" ? "a clue, not proof" : ""].filter(Boolean).join(" · ")}
                        </div>
                        {c.excerpt ? <div className="w-small" style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>“{c.excerpt}”</div> : null}
                        {c.note ? <div className="w-tiny w-muted" style={{ marginTop: 2 }}>{c.note}</div> : null}
                      </div>
                      <div className="w-row">
                        {c.match === "possible" ? (
                          <button type="button" className="w-btn w-btn-small" onClick={() => fam.commit(updateCitation(data, c.id, { match: "confirmed" }))}>
                            It&apos;s them
                          </button>
                        ) : null}
                        <button type="button" className="w-btn w-btn-small w-btn-quiet" onClick={() => fam.commit(removeCitation(data, c.id))}>
                          Detach
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="w-small w-muted">Nothing attached yet.</p>
          )}
          <div className="w-row" style={{ marginTop: 10 }}>
            <button type="button" className="w-btn w-btn-small w-btn-primary" onClick={() => setDialog("evidence")}>
              Attach evidence
            </button>
            <button type="button" className="w-btn w-btn-small" onClick={() => setDialog("edit")}>
              Edit
            </button>
            {a.conflictsWith.length ? (
              <button type="button" className="w-btn w-btn-small" onClick={() => setDialog("reject")}>
                This version is wrong
              </button>
            ) : null}
            <button
              type="button"
              className="w-btn w-btn-small w-btn-quiet"
              onClick={() => {
                if (window.confirm("Remove this fact and the evidence attached to it? The sources themselves stay.")) fam.commit(removeFact(data, fact.id));
              }}
            >
              Remove
            </button>
          </div>
        </div>
      ) : null}
      {rejected ? (
        <button type="button" className="w-link w-tiny" onClick={() => fam.commit(restoreFact(data, fact.id))}>
          Use this version again
        </button>
      ) : null}
      <Dialog open={dialog === "evidence"} onClose={() => setDialog(null)} title="Attach evidence">
        <EvidenceForm target={{ factId: fact.id }} onDone={() => setDialog(null)} />
      </Dialog>
      <Dialog open={dialog === "edit"} onClose={() => setDialog(null)} title={`Edit ${FACT_LABEL[fact.type]?.toLowerCase() ?? "fact"}`}>
        <FactForm fact={fact} onDone={() => setDialog(null)} />
      </Dialog>
      <Dialog open={dialog === "resolve"} onClose={() => setDialog(null)} title="Records disagree">
        <Resolve fact={fact} peers={a.conflictsWith} onDone={() => setDialog(null)} />
      </Dialog>
      <Dialog open={dialog === "reject"} onClose={() => setDialog(null)} title="Set this version aside">
        <div className="w-fields">
          <p className="w-small" style={{ margin: 0 }}>
            It stays on record but won&apos;t be used in stories or timelines.
          </p>
          <TextField label="Why is it wrong?" value={reason} onChange={setReason} placeholder="This record is a different man of the same name." />
          <div className="w-row">
            <button
              type="button"
              className="w-btn w-btn-primary"
              disabled={!reason.trim()}
              onClick={async () => {
                await fam.commit(rejectFact(data, fact.id, reason));
                setDialog(null);
              }}
            >
              Set aside
            </button>
          </div>
        </div>
      </Dialog>
    </li>
  );
}

export default function FactList({ facts, empty }: { facts: Fact[]; empty?: string }) {
  if (!facts.length) return <p className="w-muted w-small">{empty ?? "No facts yet."}</p>;
  return (
    <ul className="w-list">
      {sortFacts(facts).map((f) => (
        <FactRow key={f.id} fact={f} />
      ))}
    </ul>
  );
}
