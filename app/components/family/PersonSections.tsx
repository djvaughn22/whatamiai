"use client";

// The parts of a person's page other than facts and research.

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useFamily } from "../FamilyProvider";
import { assessRelationship, looseCitations, INFO_LABEL } from "../../lib/family/evidence";
import { childLinks, parentLinks, partnerLinks, siblingsOf } from "../../lib/family/graph";
import { displayName } from "../../lib/family/names";
import { ageAt, formatDate, sortKey, dateRange } from "../../lib/family/dates";
import { eventsFor } from "../../lib/family/history";
import { countryOf, usStateOf } from "../../lib/family/places";
import { activeFacts } from "../../lib/family/names";
import { addMediaRecord, removeCitation, removeMediaRecord, removeRelationship, updateCitation, updateRelationship } from "../../lib/family/ops";
import EvidenceForm from "./EvidenceForm";
import FactForm from "./FactForm";
import FactList from "./FactList";
import { Dialog, EvidenceBadge, FACT_LABEL, lifeSpan } from "./bits";
import type { Fact, Id, ParentKind, PartnerStatus, Relationship } from "../../lib/family/types";

function RelRow({ rel, other, label }: { rel: Relationship; other: Id; label: string }) {
  const fam = useFamily();
  const data = fam.data!;
  const a = assessRelationship(data, rel.id);
  const [dialog, setDialog] = useState<null | "evidence" | "fact">(null);
  const coupleFacts = rel.type === "partner" ? Object.values(data.facts).filter((f) => f.relationshipId === rel.id) : [];
  return (
    <li className="w-stack">
      <div className="w-between">
        <div>
          <Link href={`/person/${other}`} className="w-link" style={{ fontWeight: 700 }}>
            {displayName(data, other)}
          </Link>
          <span className="w-tiny w-muted"> {lifeSpan(data, other)}</span>
          <div className="w-tiny w-muted">{label}</div>
        </div>
        <div className="w-row">
          <EvidenceBadge level={a.level} title={a.reasons.join(" ")} />
          {rel.type === "parent" ? (
            <select className="w-select" style={{ width: "auto", minHeight: 36 }} aria-label="Kind of parent" value={rel.kind ?? "unknown"} onChange={(e) => fam.commit(updateRelationship(data, rel.id, { kind: e.target.value as ParentKind }))}>
              <option value="biological">Birth parent</option>
              <option value="adopted">Adoptive</option>
              <option value="step">Step</option>
              <option value="foster">Foster</option>
              <option value="guardian">Guardian</option>
              <option value="unknown">Not sure</option>
            </select>
          ) : (
            <select className="w-select" style={{ width: "auto", minHeight: 36 }} aria-label="Couple" value={rel.status ?? "unknown"} onChange={(e) => fam.commit(updateRelationship(data, rel.id, { status: e.target.value as PartnerStatus }))}>
              <option value="married">Married</option>
              <option value="partners">Partners</option>
              <option value="divorced">Divorced</option>
              <option value="unknown">Not sure</option>
            </select>
          )}
        </div>
      </div>
      {a.level === "conflicting" ? <p className="w-tiny" style={{ margin: 0, color: "var(--w-clash)" }}>{a.reasons[0]}</p> : null}
      {coupleFacts.length ? <FactList facts={coupleFacts} /> : null}
      <div className="w-row">
        <button type="button" className="w-btn w-btn-small" onClick={() => setDialog("evidence")}>
          Attach evidence for this link
        </button>
        {rel.type === "partner" ? (
          <button type="button" className="w-btn w-btn-small" onClick={() => setDialog("fact")}>
            Add marriage or a memory
          </button>
        ) : null}
        <button
          type="button"
          className="w-btn w-btn-small w-btn-quiet"
          onClick={() => {
            if (window.confirm(`Remove the link to ${displayName(data, other)}? Both people stay in the tree.`)) fam.commit(removeRelationship(data, rel.id));
          }}
        >
          Remove link
        </button>
      </div>
      <Dialog open={dialog === "evidence"} onClose={() => setDialog(null)} title="Evidence for this relationship">
        <p className="w-small w-muted" style={{ marginTop: 0 }}>
          A record that names them together: a birth certificate naming the parents, a census listing them as parent and child, a marriage record.
        </p>
        <EvidenceForm target={{ relationshipId: rel.id }} onDone={() => setDialog(null)} />
      </Dialog>
      <Dialog open={dialog === "fact"} onClose={() => setDialog(null)} title="Add to this couple">
        <FactForm relationshipId={rel.id} onDone={() => setDialog(null)} />
      </Dialog>
    </li>
  );
}

export function FamilyLinks({ personId }: { personId: Id }) {
  const { data } = useFamily();
  if (!data) return null;
  const sex = (id: Id) => data.people[id]?.sex;
  const parents = parentLinks(data, personId);
  const partners = partnerLinks(data, personId);
  const kids = childLinks(data, personId);
  const sibs = siblingsOf(data, personId);
  const word = (id: Id, f: string, m: string, n: string) => (sex(id) === "female" ? f : sex(id) === "male" ? m : n);
  return (
    <div className="w-stack">
      <section>
        <h3 className="w-h3">Parents</h3>
        {parents.length ? (
          <ul className="w-list">
            {parents.map((r) => (
              <RelRow key={r.id} rel={r} other={r.a} label={word(r.a, "Mother", "Father", "Parent")} />
            ))}
          </ul>
        ) : (
          <p className="w-small w-muted">No parents linked yet. Add them from the tree.</p>
        )}
      </section>
      <section>
        <h3 className="w-h3">Spouses and partners</h3>
        {partners.length ? (
          <ul className="w-list">
            {partners.map((r) => (
              <RelRow key={r.id} rel={r} other={r.a === personId ? r.b : r.a} label="Couple" />
            ))}
          </ul>
        ) : (
          <p className="w-small w-muted">None linked yet.</p>
        )}
      </section>
      <section>
        <h3 className="w-h3">Children</h3>
        {kids.length ? (
          <ul className="w-list">
            {kids.map((r) => (
              <RelRow key={r.id} rel={r} other={r.b} label={word(r.b, "Daughter", "Son", "Child")} />
            ))}
          </ul>
        ) : (
          <p className="w-small w-muted">None linked yet.</p>
        )}
      </section>
      {sibs.length ? (
        <section>
          <h3 className="w-h3">Brothers and sisters</h3>
          <ul className="w-list">
            {sibs.map((s) => (
              <li key={s.id}>
                <Link href={`/person/${s.id}`} className="w-link">
                  {displayName(data, s.id)}
                </Link>{" "}
                <span className="w-tiny w-muted">
                  {lifeSpan(data, s.id)}
                  {s.half ? " · half sibling" : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <p className="w-tiny w-muted">
        <Link href="/family" className="w-link">
          Add relatives from the tree
        </Link>
      </p>
    </div>
  );
}

export function SourcesTab({ personId }: { personId: Id }) {
  const fam = useFamily();
  const data = fam.data!;
  const [adding, setAdding] = useState(false);
  const facts = activeFacts(data, personId);
  const factIds = new Set(Object.values(data.facts).filter((f) => f.personId === personId).map((f) => f.id));
  const relIds = new Set(Object.values(data.relationships).filter((r) => r.a === personId || r.b === personId).map((r) => r.id));
  const cites = Object.values(data.citations).filter((c) => (c.factId && factIds.has(c.factId)) || (c.relationshipId && relIds.has(c.relationshipId)) || c.personId === personId);
  const sources = [...new Set(cites.map((c) => c.sourceId))].map((id) => data.sources[id]).filter(Boolean);
  const loose = looseCitations(data, personId);
  return (
    <div className="w-stack">
      {loose.length ? (
        <section className="w-panel" style={{ borderColor: "var(--w-maybe)" }}>
          <h3 className="w-h3">Saved, not yet tied to a fact</h3>
          <p className="w-small w-muted" style={{ marginTop: 0 }}>
            Read each one. If it&apos;s about this person, attach it to the fact it supports.
          </p>
          <ul className="w-list">
            {loose.map((c) => {
              const s = data.sources[c.sourceId];
              return (
                <li key={c.id} className="w-stack">
                  <div>
                    {s?.url ? (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="w-link w-ext" style={{ fontWeight: 700 }}>
                        {s.title}
                      </a>
                    ) : (
                      <strong>{s?.title}</strong>
                    )}
                    <div className="w-tiny w-muted">{[s?.repository, c.match === "possible" ? "possible match" : "checked", c.note].filter(Boolean).join(" · ")}</div>
                  </div>
                  <div className="w-row">
                    <label className="w-row w-small">
                      <span>Attach to</span>
                      <select
                        className="w-select"
                        style={{ width: "auto", minHeight: 36 }}
                        value=""
                        onChange={(e) => {
                          if (e.target.value) fam.commit(updateCitation(data, c.id, { factId: e.target.value, personId: undefined }));
                        }}
                      >
                        <option value="">a fact…</option>
                        {facts
                          .filter((f) => f.type !== "name")
                          .map((f) => (
                            <option key={f.id} value={f.id}>
                              {FACT_LABEL[f.type]} {[formatDate(f.date), f.place].filter(Boolean).join(", ")}
                            </option>
                          ))}
                      </select>
                    </label>
                    <button type="button" className="w-btn w-btn-small w-btn-quiet" onClick={() => fam.commit(removeCitation(data, c.id))}>
                      Not them
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
      <section>
        <div className="w-between">
          <h3 className="w-h3" style={{ margin: 0 }}>
            Sources for {displayName(data, personId)}
          </h3>
          <button type="button" className="w-btn w-btn-small" onClick={() => setAdding(true)}>
            Add a source
          </button>
        </div>
        {sources.length ? (
          <ul className="w-list" style={{ marginTop: 10 }}>
            {sources.map((s) => {
              const used = cites.filter((c) => c.sourceId === s.id);
              return (
                <li key={s.id}>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="w-link w-ext" style={{ fontWeight: 700 }}>
                      {s.title}
                    </a>
                  ) : (
                    <strong>{s.title}</strong>
                  )}
                  <div className="w-tiny w-muted">
                    {[s.repository, s.recordId ? `Record ${s.recordId}` : "", s.kind === "tree" || s.kind === "ai" ? "a clue, not proof" : "", `${used.length} use${used.length === 1 ? "" : "s"}: ${[...new Set(used.map((c) => INFO_LABEL[c.info].label.toLowerCase()))].join(", ")}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="w-small w-muted">No sources yet. Every fact can carry its own.</p>
        )}
      </section>
      <Dialog open={adding} onClose={() => setAdding(false)} title="Add a source">
        <p className="w-small w-muted" style={{ marginTop: 0 }}>
          Saved to this person. Attach it to a specific fact afterwards, here or from the Facts tab.
        </p>
        <EvidenceForm target={{ personId }} onDone={() => setAdding(false)} />
      </Dialog>
    </div>
  );
}

export function PersonTimeline({ personId }: { personId: Id }) {
  const { data } = useFamily();
  const [history, setHistory] = useState(true);
  if (!data) return null;
  const facts = activeFacts(data, personId).filter((f) => f.type !== "name" && f.date?.y !== undefined);
  for (const r of partnerLinks(data, personId)) for (const f of Object.values(data.facts)) if (f.relationshipId === r.id && !f.rejected && f.date?.y !== undefined) facts.push(f);
  const birth = facts.find((f) => f.type === "birth" || f.type === "baptism");
  const death = facts.find((f) => f.type === "death" || f.type === "burial");
  const from = dateRange(birth?.date)?.[0] ?? Math.min(...facts.map((f) => sortKey(f.date)));
  const to = dateRange(death?.date)?.[1] ?? Math.min(new Date().getFullYear(), from + 90);
  const scopes = new Set<string>(["US"]);
  for (const f of activeFacts(data, personId)) {
    if (!f.place) continue;
    const st = usStateOf(f.place);
    if (st) scopes.add(st);
    const c = countryOf(f.place);
    if (c) scopes.add(c);
  }
  type Row = { key: number; fact?: Fact; ev?: ReturnType<typeof eventsFor>[number] };
  const rows: Row[] = facts.map((f) => ({ key: sortKey(f.date), fact: f }));
  if (history && Number.isFinite(from)) for (const e of eventsFor([...scopes], from, to)) rows.push({ key: e.start, ev: e });
  rows.sort((a, b) => a.key - b.key);
  if (!facts.length) return <p className="w-small w-muted">Add dated facts to see a timeline.</p>;
  return (
    <div>
      <label className="w-row w-small" style={{ marginBottom: 8 }}>
        <input type="checkbox" checked={history} onChange={(e) => setHistory(e.target.checked)} /> Show history alongside
      </label>
      <ul className="w-tl">
        {rows.map((r, i) =>
          r.fact ? (
            <li key={r.fact.id} className="w-tl-item">
              <div className="w-tl-date">{formatDate(r.fact.date)}</div>
              <div>
                <strong>{FACT_LABEL[r.fact.type]}</strong>
                {r.fact.value ? `: ${r.fact.value}` : ""}
                {r.fact.place ? <span className="w-muted"> · {r.fact.place}</span> : null}
                {birth && r.fact !== birth && ageAt(birth.date, r.fact.date) ? <span className="w-tiny w-muted"> · age {ageAt(birth.date, r.fact.date)}</span> : null}
              </div>
            </li>
          ) : (
            <li key={`h-${r.ev!.id}-${i}`} className="w-tl-item w-tl-history">
              <div className="w-tl-date">{Math.floor(r.ev!.start)}</div>
              <div className="w-small">
                <span className="w-tag">History</span> {r.ev!.text}{" "}
                <a href={r.ev!.source} target="_blank" rel="noopener noreferrer" className="w-link w-ext w-tiny">
                  {r.ev!.sourceName}
                </a>
              </div>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
const MAX_BYTES = 10 * 1024 * 1024;

function MediaThumb({ id, type, name }: { id: Id; type: string; name: string }) {
  const { readFile } = useFamily();
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let u: string | null = null;
    let alive = true;
    readFile(id).then((b) => {
      if (!alive || !b) return;
      u = URL.createObjectURL(b);
      setUrl(u);
    });
    return () => {
      alive = false;
      if (u) URL.revokeObjectURL(u);
    };
  }, [id, readFile]);
  if (!url) return <div className="w-well w-tiny w-muted">Loading…</div>;
  if (type === "application/pdf")
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="w-btn w-btn-small">
        Open PDF
      </a>
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={name} style={{ width: "100%", maxHeight: 220, objectFit: "contain", borderRadius: 10, background: "var(--om-surface-2)" }} />;
}

export function FilesTab({ personId }: { personId: Id }) {
  const fam = useFamily();
  const data = fam.data!;
  const [err, setErr] = useState("");
  const files = useMemo(() => Object.values(data.media).filter((m) => m.personIds.includes(personId)), [data.media, personId]);
  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    setErr("");
    const list = [...(e.target.files ?? [])];
    e.target.value = "";
    for (const f of list) {
      if (!ALLOWED.includes(f.type)) {
        setErr(`${f.name}: only photos (JPEG, PNG, WebP, GIF) and PDFs can be added.`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        setErr(`${f.name} is over 10 MB.`);
        continue;
      }
      const r = addMediaRecord(fam.data!, { name: f.name.slice(0, 120), type: f.type, size: f.size, personIds: [personId] });
      await fam.saveFile(r.id, f);
      await fam.commit(r.patch);
    }
  }
  return (
    <div className="w-stack">
      <p className="w-small w-muted" style={{ margin: 0 }}>
        Photos and scans stay in this browser. They&apos;re included in a full backup only if you choose to include them.
      </p>
      <label className="w-btn" style={{ width: "fit-content" }}>
        Add photos or documents
        <input type="file" accept={ALLOWED.join(",")} multiple onChange={onPick} className="w-sr" />
      </label>
      {err ? <p className="w-error">{err}</p> : null}
      {files.length ? (
        <div className="w-grid2">
          {files.map((m) => (
            <figure key={m.id} className="w-panel" style={{ margin: 0 }}>
              <MediaThumb id={m.id} type={m.type} name={m.caption || m.name} />
              <figcaption className="w-between w-small" style={{ marginTop: 8 }}>
                <span>{m.caption || m.name}</span>
                <button
                  type="button"
                  className="w-btn w-btn-small w-btn-quiet"
                  onClick={async () => {
                    if (!window.confirm("Remove this file from this browser?")) return;
                    await fam.commit(removeMediaRecord(data, m.id));
                    await fam.dropFile(m.id);
                  }}
                >
                  Remove
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p className="w-small w-muted">No files yet.</p>
      )}
    </div>
  );
}

export function HistoryTab({ personId }: { personId: Id }) {
  const { data } = useFamily();
  if (!data) return null;
  const ids = new Set<Id>([personId]);
  for (const f of Object.values(data.facts)) if (f.personId === personId) ids.add(f.id);
  for (const r of Object.values(data.relationships)) if (r.a === personId || r.b === personId) ids.add(r.id);
  for (const c of Object.values(data.citations)) if (c.personId === personId || (c.factId && ids.has(c.factId)) || (c.relationshipId && ids.has(c.relationshipId))) ids.add(c.id);
  for (const l of Object.values(data.leads)) if (l.personId === personId) ids.add(l.id);
  for (const h of Object.values(data.hypotheses)) if (h.personId === personId) ids.add(h.id);
  const rows = data.changes.filter((c) => ids.has(c.entityId)).slice(-200).reverse();
  if (!rows.length) return <p className="w-small w-muted">No changes recorded yet.</p>;
  return (
    <ul className="w-list">
      {rows.map((c) => (
        <li key={c.id} className="w-between">
          <span className="w-small">{c.summary}</span>
          <span className="w-tiny w-muted">{new Date(c.at).toLocaleString()}</span>
        </li>
      ))}
    </ul>
  );
}
