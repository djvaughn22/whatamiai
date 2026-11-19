"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useFamily } from "../../components/FamilyProvider";
import { EvidenceBadge, FACT_LABEL, Loading } from "../../components/family/bits";
import { focusOf } from "../../components/family/FamilyView";
import { assessFact } from "../../lib/family/evidence";
import { formatDate, sortKey } from "../../lib/family/dates";
import { eventsFor } from "../../lib/family/history";
import { ancestorsWithDepth, livePeople } from "../../lib/family/graph";
import { displayName } from "../../lib/family/names";
import { countryOf, usStateOf } from "../../lib/family/places";
import type { Fact, Id } from "../../lib/family/types";

const JourneyMap = dynamic(() => import("../../components/family/JourneyMap"), { ssr: false, loading: () => <div className="w-well w-small w-muted">Loading the map…</div> });

export default function TimelinePage() {
  const fam = useFamily();
  const [who, setWho] = useState<string>("line");
  const [view, setView] = useState<"list" | "map">("list");
  const [history, setHistory] = useState(true);
  const data = fam.data;
  const people = useMemo<Id[]>(() => {
    if (!data) return [];
    const focus = focusOf(data);
    if (who === "all" || !focus) return livePeople(data).map((p) => p.id);
    if (who === "line") return [focus, ...ancestorsWithDepth(data, focus).keys()];
    return [who];
  }, [data, who]);

  if (fam.status === "loading") return <Loading />;
  if (!data || !livePeople(data).length) {
    return (
      <main className="w-page">
        <h1 className="w-h2">Timeline</h1>
        <p className="w-muted">Add people with dates and places, and their lives line up here with history beside them.</p>
        <Link href="/family" className="w-btn">
          Go to My Family
        </Link>
      </main>
    );
  }
  const focus = focusOf(data);
  const set = new Set(people);
  const facts: Fact[] = Object.values(data.facts).filter((f) => {
    if (f.rejected || f.type === "name" || f.date?.y === undefined) return false;
    if (f.personId) return set.has(f.personId);
    const rel = f.relationshipId ? data.relationships[f.relationshipId] : undefined;
    return !!rel && (set.has(rel.a) || set.has(rel.b));
  });
  const scopes = new Set<string>(["US"]);
  for (const f of facts) {
    if (!f.place) continue;
    const st = usStateOf(f.place);
    if (st) scopes.add(st);
    const c = countryOf(f.place);
    if (c) scopes.add(c);
  }
  const keys = facts.map((f) => sortKey(f.date)).filter(Number.isFinite);
  const from = keys.length ? Math.min(...keys) : 0;
  const to = keys.length ? Math.max(...keys) : 0;
  type Row = { key: number; fact?: Fact; ev?: ReturnType<typeof eventsFor>[number] };
  const rows: Row[] = facts.map((f) => ({ key: sortKey(f.date), fact: f }));
  if (history && keys.length) for (const e of eventsFor([...scopes], from, to)) rows.push({ key: e.start, ev: e });
  rows.sort((a, b) => a.key - b.key);
  const decades = new Map<number, Row[]>();
  for (const r of rows) {
    const d = Math.floor(r.key / 10) * 10;
    decades.set(d, [...(decades.get(d) ?? []), r]);
  }
  const who2 = (f: Fact) => {
    if (f.personId) return displayName(data, f.personId);
    const rel = data.relationships[f.relationshipId!];
    return `${displayName(data, rel.a)} & ${displayName(data, rel.b)}`;
  };

  return (
    <main className="w-page">
      <div className="w-between">
        <h1 className="w-h2" style={{ margin: 0 }}>
          Timeline
        </h1>
        <div className="w-tabs" role="tablist" aria-label="View" style={{ margin: 0, border: 0 }}>
          <button type="button" role="tab" aria-selected={view === "list"} onClick={() => setView("list")}>
            Lives in order
          </button>
          <button type="button" role="tab" aria-selected={view === "map"} onClick={() => setView("map")}>
            Journey map
          </button>
        </div>
      </div>
      <div className="w-row" style={{ margin: "12px 0 6px" }}>
        <label className="w-field" style={{ minWidth: "16rem" }}>
          <span className="w-label">Whose story</span>
          <select className="w-select" value={who} onChange={(e) => setWho(e.target.value)}>
            <option value="line">{focus ? `${displayName(data, focus)} and their ancestors` : "One line"}</option>
            <option value="all">Everyone</option>
            {livePeople(data)
              .sort((a, b) => displayName(data, a.id).localeCompare(displayName(data, b.id)))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {displayName(data, p.id)}
                </option>
              ))}
          </select>
        </label>
        {view === "list" ? (
          <label className="w-row w-small" style={{ alignSelf: "flex-end", minHeight: 44 }}>
            <input type="checkbox" checked={history} onChange={(e) => setHistory(e.target.checked)} /> Show history alongside
          </label>
        ) : null}
      </div>
      {view === "map" ? (
        <JourneyMap people={people} />
      ) : !facts.length ? (
        <p className="w-muted">No dated facts for this selection yet.</p>
      ) : (
        <div>
          {[...decades.entries()].map(([d, list]) => (
            <section key={d}>
              <h2 className="w-tl-decade">{d}s</h2>
              <ul className="w-tl">
                {list.map((r, i) =>
                  r.fact ? (
                    <li key={r.fact.id} className="w-tl-item">
                      <div className="w-tl-date">{formatDate(r.fact.date)}</div>
                      <div className="w-between" style={{ alignItems: "flex-start" }}>
                        <div>
                          <Link className="w-link" href={`/person/${r.fact.personId ?? data.relationships[r.fact.relationshipId!]?.a}`} style={{ fontWeight: 700 }}>
                            {who2(r.fact)}
                          </Link>
                          <div className="w-small">
                            {FACT_LABEL[r.fact.type]}
                            {r.fact.value ? `: ${r.fact.value}` : ""}
                            {r.fact.place ? <span className="w-muted"> · {r.fact.place}</span> : null}
                          </div>
                        </div>
                        <EvidenceBadge level={assessFact(data, r.fact.id).level} />
                      </div>
                    </li>
                  ) : (
                    <li key={`h-${r.ev!.id}-${i}`} className="w-tl-item w-tl-history">
                      <div className="w-tl-date">{Math.floor(r.ev!.start)}</div>
                      <div className="w-small">
                        <span className="w-tag">History</span> <strong>{r.ev!.title}.</strong> {r.ev!.text}{" "}
                        <a href={r.ev!.source} target="_blank" rel="noopener noreferrer" className="w-link w-ext w-tiny">
                          {r.ev!.sourceName}
                        </a>
                      </div>
                    </li>
                  ),
                )}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
