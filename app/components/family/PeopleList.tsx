"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFamily } from "../FamilyProvider";
import { livePeople, kinshipTo } from "../../lib/family/graph";
import { isLiving } from "../../lib/family/living";
import { normalize, primaryName, displayName } from "../../lib/family/names";
import { personCounts } from "../../lib/family/evidence";
import { lifeSpan } from "./bits";

export default function PeopleList() {
  const { data } = useFamily();
  const [q, setQ] = useState("");
  const self = data ? Object.values(data.people).find((p) => p.isSelf && !p.mergedInto)?.id : undefined;
  const rows = useMemo(() => {
    if (!data) return [];
    const term = normalize(q);
    return livePeople(data)
      .map((p) => ({ id: p.id, n: primaryName(data, p.id) }))
      .filter((r) => !term || normalize(`${r.n.given} ${r.n.surname} ${r.n.nickname ?? ""}`).includes(term))
      .sort((a, b) => (a.n.surname || "~").localeCompare(b.n.surname || "~") || a.n.given.localeCompare(b.n.given));
  }, [data, q]);
  if (!data) return null;
  return (
    <div>
      <label className="w-field" style={{ maxWidth: "26rem", marginBottom: 12 }}>
        <span className="w-label">Find someone</span>
        <input className="w-input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name" />
      </label>
      <ul className="w-list">
        {rows.map((r) => {
          const c = personCounts(data, r.id);
          const parts = [
            c.verified + c.supported ? `${c.verified + c.supported} backed by records` : "",
            c.recollection ? `${c.recollection} family memory` : "",
            c.conflicting ? `${c.conflicting} disagree` : "",
            c.possible + c.unknown ? `${c.possible + c.unknown} unconfirmed` : "",
          ].filter(Boolean);
          return (
            <li key={r.id} className="w-between">
              <div>
                <Link href={`/person/${r.id}`} className="w-link" style={{ fontWeight: 700 }}>
                  {displayName(data, r.id)}
                </Link>
                <div className="w-tiny w-muted">
                  {[lifeSpan(data, r.id), self ? kinshipTo(data, self, r.id) : "", isLiving(data, r.id) ? "living, private" : ""].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div className="w-tiny w-muted" style={{ textAlign: "right" }}>
                {parts.join(" · ") || "no facts yet"}
              </div>
            </li>
          );
        })}
      </ul>
      {!rows.length ? <p className="w-muted">No one matches.</p> : null}
    </div>
  );
}
