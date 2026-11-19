"use client";

// Tree health: the evidence audit, people entered twice, and records that disagree.

import Link from "next/link";
import { useState } from "react";
import { useFamily } from "../FamilyProvider";
import { assessFact, LEVELS, treeAudit } from "../../lib/family/evidence";
import { findDuplicates, mergePeople } from "../../lib/family/duplicates";
import { displayName } from "../../lib/family/names";
import { formatDate } from "../../lib/family/dates";
import { EvidenceBadge, lifeSpan } from "./bits";
import type { Id } from "../../lib/family/types";

export function AuditLine() {
  const { data } = useFamily();
  if (!data) return null;
  const a = treeAudit(data);
  if (!a.totalFacts) return null;
  return (
    <div className="w-well">
      <p className="w-small" style={{ margin: "0 0 8px" }}>
        <strong>{a.totalFacts} facts</strong> about {a.people} {a.people === 1 ? "person" : "people"}.{" "}
        {a.peopleWithoutSource ? `${a.peopleWithoutSource} ${a.peopleWithoutSource === 1 ? "person has" : "people have"} nothing backing them yet.` : "Everyone has at least one source or family memory."}
      </p>
      <div className="w-row" style={{ gap: 8 }}>
        {LEVELS.filter((l) => a.facts[l]).map((l) => (
          <span key={l} className="w-row" style={{ gap: 4 }}>
            <EvidenceBadge level={l} />
            <span className="w-small">{a.facts[l]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function Conflicts() {
  const { data } = useFamily();
  if (!data) return null;
  const open = Object.values(data.facts).filter((f) => !f.rejected && f.personId && assessFact(data, f.id).level === "conflicting" && !data.people[f.personId]?.mergedInto);
  const byPerson = new Map<Id, number>();
  for (const f of open) byPerson.set(f.personId!, (byPerson.get(f.personId!) ?? 0) + 1);
  if (!byPerson.size) return null;
  return (
    <div className="w-panel" style={{ borderColor: "var(--w-clash)" }}>
      <h2 className="w-h3">Records disagree</h2>
      <p className="w-small w-muted" style={{ marginTop: 0 }}>
        Pick the version the evidence supports best and say why, or keep the question open.
      </p>
      <ul className="w-list">
        {[...byPerson.entries()].map(([pid, n]) => (
          <li key={pid} className="w-between">
            <Link className="w-link" href={`/person/${pid}`}>
              {displayName(data, pid)}
            </Link>
            <span className="w-small w-muted">{n} versions</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Duplicates() {
  const fam = useFamily();
  const data = fam.data;
  const [keep, setKeep] = useState<Record<string, Id>>({});
  if (!data) return null;
  const dups = findDuplicates(data);
  if (!dups.length) return null;
  const facts = (id: Id) =>
    Object.values(data.facts)
      .filter((f) => f.personId === id && !f.rejected && f.type !== "name")
      .slice(0, 4)
      .map((f) => `${f.type} ${[formatDate(f.date), f.place].filter(Boolean).join(", ")}`)
      .join("; ");
  return (
    <div className="w-panel" style={{ borderColor: "var(--w-maybe)" }}>
      <h2 className="w-h3">Might be the same person</h2>
      <p className="w-small w-muted" style={{ marginTop: 0 }}>
        Merging keeps every fact, source and link from both. Check the reasons first.
      </p>
      <ul className="w-list">
        {dups.map((d) => {
          const key = `${d.a}|${d.b}`;
          const k = keep[key] ?? d.a;
          const drop = k === d.a ? d.b : d.a;
          return (
            <li key={key} className="w-stack">
              <div className="w-grid2">
                {[d.a, d.b].map((id) => (
                  <label key={id} className="w-choice">
                    <input type="radio" name={key} checked={k === id} onChange={() => setKeep((c) => ({ ...c, [key]: id }))} />
                    <span>
                      <strong>{displayName(data, id)}</strong> <span className="w-muted w-small">{lifeSpan(data, id)}</span>
                      <span className="w-help" style={{ display: "block" }}>
                        {facts(id) || "No facts yet"}
                      </span>
                      <span className="w-help" style={{ display: "block" }}>
                        Keep this record
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <ul className="w-small w-muted" style={{ margin: 0, paddingLeft: 18 }}>
                {d.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <div className="w-row">
                <button
                  type="button"
                  className="w-btn w-btn-small"
                  onClick={async () => {
                    const r = mergePeople(data, k, drop);
                    if (r.error) return fam.toast("These two can't be merged.");
                    await fam.commit(r.patch);
                    fam.toast("Merged. Nothing was lost.");
                  }}
                >
                  Merge into {displayName(data, k)}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="w-tiny w-muted" style={{ marginBottom: 0 }}>
        Each merge is listed in the person&apos;s history.
      </p>
    </div>
  );
}
