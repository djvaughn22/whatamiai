"use client";

import Link from "next/link";
import { useState } from "react";
import { useFamily } from "../FamilyProvider";
import { livePeople } from "../../lib/family/graph";
import { displayName } from "../../lib/family/names";
import { researchPlan, ACCESS_LABEL } from "../../lib/family/research";
import StartForm from "./StartForm";
import { lifeSpan } from "./bits";

export default function WhereToLook() {
  const { data, status } = useFamily();
  const [id, setId] = useState("");
  if (status === "loading") return <p className="w-small w-muted">Loading…</p>;
  const people = data ? livePeople(data).sort((a, b) => displayName(data, a.id).localeCompare(displayName(data, b.id))) : [];
  if (!data || !people.length) {
    return (
      <div className="w-stack">
        <p className="w-small w-muted" style={{ margin: 0 }}>
          Add someone first. Their dates and places decide where to look.
        </p>
        <StartForm compact />
      </div>
    );
  }
  const plan = id ? researchPlan(data, id).slice(0, 5) : [];
  return (
    <div className="w-stack">
      <label className="w-field">
        <span className="w-label">Person</span>
        <select className="w-select" value={id} onChange={(e) => setId(e.target.value)}>
          <option value="">Choose…</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {displayName(data, p.id)} {lifeSpan(data, p.id)}
            </option>
          ))}
        </select>
      </label>
      {id ? (
        <>
          <ul className="w-list">
            {plan.map((l) => (
              <li key={l.key}>
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="w-link w-ext" style={{ fontWeight: 700 }}>
                  {l.title}
                </a>
                <div className="w-tiny w-muted">
                  {l.holder} · {ACCESS_LABEL[l.access]}
                </div>
              </li>
            ))}
          </ul>
          <Link href={`/person/${id}?tab=research`} className="w-btn w-btn-small">
            The full plan, with your progress
          </Link>
        </>
      ) : null}
    </div>
  );
}
