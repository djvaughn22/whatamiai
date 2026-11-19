"use client";

// A printable family history book: everyone who has died, their facts with
// evidence labels and sources, every story, and a full source list.
// Living people are left out. "Print or save as PDF" uses the browser.

import Link from "next/link";
import { useState } from "react";
import { useFamily } from "../../components/FamilyProvider";
import { EvidenceBadge, EvidenceKey, FACT_LABEL, Loading, lifeSpan } from "../../components/family/bits";
import { StoryBody } from "../../components/family/StoryView";
import { assessFact, assessRelationship, LEVEL_INFO } from "../../lib/family/evidence";
import { formatDate, sortKey } from "../../lib/family/dates";
import { livePeople, parentLinks, partnersOf } from "../../lib/family/graph";
import { isLiving } from "../../lib/family/living";
import { activeFacts, displayName } from "../../lib/family/names";
import { buildStory } from "../../lib/family/stories";
import type { Id } from "../../lib/family/types";

export default function BookPage() {
  const fam = useFamily();
  const [withStories, setWithStories] = useState(true);
  const [withUnsourced, setWithUnsourced] = useState(false);
  if (fam.status === "loading") return <Loading />;
  const data = fam.data;
  if (!data || !livePeople(data).length) {
    return (
      <main className="w-read">
        <h1 className="w-h2">Family history book</h1>
        <p className="w-muted">Add people to your tree first.</p>
        <Link href="/family" className="w-btn">
          My Family
        </Link>
      </main>
    );
  }
  const birthKey = (id: Id) => {
    const b = activeFacts(data, id).find((f) => f.type === "birth" || f.type === "baptism");
    const k = sortKey(b?.date);
    return Number.isFinite(k) ? k : 9999;
  };
  const people = livePeople(data)
    .filter((p) => !isLiving(data, p.id))
    .sort((a, b) => birthKey(a.id) - birthKey(b.id));
  const hiddenLiving = livePeople(data).length - people.length;
  const usedSources = new Map<Id, number>();
  const noteOf = (sourceId: Id) => {
    if (!usedSources.has(sourceId)) usedSources.set(sourceId, usedSources.size + 1);
    return usedSources.get(sourceId)!;
  };
  const stories = Object.values(data.stories);
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <main className="w-read w-book">
      <div className="w-panel w-no-print w-stack" style={{ marginBottom: 24 }}>
        <p className="w-small" style={{ margin: 0 }}>
          Your book is built from the tree as it is now. Print it, or choose “Save as PDF” in the print window.
        </p>
        <label className="w-row w-small">
          <input type="checkbox" checked={withStories} onChange={(e) => setWithStories(e.target.checked)} /> Include stories
        </label>
        <label className="w-row w-small">
          <input type="checkbox" checked={withUnsourced} onChange={(e) => setWithUnsourced(e.target.checked)} /> Include facts with no source yet (marked)
        </label>
        <div>
          <button type="button" className="w-btn w-btn-primary" onClick={() => window.print()}>
            Print or save as PDF
          </button>
        </div>
      </div>

      <header style={{ textAlign: "center", padding: "24px 0 8px" }}>
        <p className="w-tiny w-muted" style={{ letterSpacing: "0.08em" }}>
          A FAMILY HISTORY
        </p>
        <h1 className="w-h1">{data.workspace.name}</h1>
        <p className="w-muted">Compiled {today}</p>
        <p className="w-small w-muted">
          {people.length} {people.length === 1 ? "person" : "people"}
          {hiddenLiving ? ` · ${hiddenLiving} living ${hiddenLiving === 1 ? "person" : "people"} left out for privacy` : ""}
        </p>
      </header>

      <section style={{ marginTop: 24 }}>
        <h2 className="w-h2">How to read this book</h2>
        <p className="w-small w-muted">Every fact carries a label that says how it is supported. Numbers point to the source list at the end.</p>
        <EvidenceKey compact />
      </section>

      <section className="w-book-page" style={{ marginTop: 32 }}>
        <h2 className="w-h2">The people</h2>
        {people.map((p) => {
          const facts = activeFacts(data, p.id).filter((f) => f.type !== "name");
          for (const pid of partnersOf(data, p.id)) {
            const rel = Object.values(data.relationships).find((r) => r.type === "partner" && ((r.a === p.id && r.b === pid) || (r.b === p.id && r.a === pid)));
            if (rel) for (const f of Object.values(data.facts)) if (f.relationshipId === rel.id && !f.rejected && f.type !== "memory") facts.push(f);
          }
          const rows = facts
            .map((f) => ({ f, a: assessFact(data, f.id) }))
            .filter((x) => withUnsourced || (x.a.level !== "unknown" && x.a.level !== "possible"))
            .sort((x, y) => sortKey(x.f.date) - sortKey(y.f.date));
          const parents = parentLinks(data, p.id).filter((r) => !isLiving(data, r.a));
          return (
            <article key={p.id} style={{ breakInside: "avoid", padding: "18px 0", borderBottom: "1px solid var(--om-border)" }}>
              <h3 className="w-serif" style={{ fontSize: "1.35rem", margin: 0 }}>
                {displayName(data, p.id)} <span className="w-muted" style={{ fontSize: "1rem" }}>{lifeSpan(data, p.id)}</span>
              </h3>
              {parents.length ? (
                <p className="w-small" style={{ margin: "4px 0 0" }}>
                  Parents: {parents.map((r) => `${displayName(data, r.a)} (${LEVEL_INFO[assessRelationship(data, r.id).level].label.toLowerCase()})`).join(", ")}
                </p>
              ) : null}
              {partnersOf(data, p.id).filter((x) => !isLiving(data, x)).length ? (
                <p className="w-small" style={{ margin: "2px 0 0" }}>
                  Married or partnered: {partnersOf(data, p.id).filter((x) => !isLiving(data, x)).map((x) => displayName(data, x)).join(", ")}
                </p>
              ) : null}
              {rows.length ? (
                <table className="w-small" style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
                  <thead>
                    <tr className="w-muted" style={{ textAlign: "left" }}>
                      <th style={{ padding: "4px 6px 4px 0" }}>Fact</th>
                      <th style={{ padding: "4px 6px" }}>When and where</th>
                      <th style={{ padding: "4px 0 4px 6px" }}>Evidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ f, a }) => (
                      <tr key={f.id} style={{ borderTop: "1px solid var(--om-border)", verticalAlign: "top" }}>
                        <td style={{ padding: "6px 6px 6px 0" }}>
                          {FACT_LABEL[f.type]}
                          {f.value && f.type !== "memory" ? `: ${f.value}` : ""}
                        </td>
                        <td style={{ padding: "6px" }}>{[formatDate(f.date), f.place].filter(Boolean).join(", ") || "—"}</td>
                        <td style={{ padding: "6px 0 6px 6px" }}>
                          <EvidenceBadge level={a.level} />
                          {a.citations.length ? <sup className="w-tiny"> {[...new Set(a.citations.map((c) => noteOf(c.sourceId)))].join(",")}</sup> : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="w-small w-muted">No sourced facts yet.</p>
              )}
            </article>
          );
        })}
      </section>

      {withStories && stories.length ? (
        <section>
          {stories.map((s) => (
            <div key={s.id} className="w-book-page" style={{ marginTop: 36 }}>
              <h2 className="w-h2">{s.title}</h2>
              <StoryBody doc={buildStory(data, s)} headingLevel={3} />
            </div>
          ))}
        </section>
      ) : null}

      <section className="w-book-page" style={{ marginTop: 36 }}>
        <h2 className="w-h2">Sources</h2>
        {usedSources.size ? (
          <ol className="w-notes">
            {[...usedSources.entries()].map(([sid, n]) => {
              const s = data.sources[sid];
              return (
                <li key={sid} value={n}>
                  {s?.title}
                  {s?.repository ? `. ${s.repository}` : ""}
                  {s?.recordId ? `. Record ${s.recordId}` : ""}
                  {s?.url ? `. ${s.url}` : ""}
                  {s?.kind === "tree" || s?.kind === "ai" ? ". A clue, not proof" : ""}.
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="w-small w-muted">No sources attached yet.</p>
        )}
        <p className="w-tiny w-muted" style={{ marginTop: 24 }}>
          Made with WhatAmIAI. Facts are labeled by their evidence; family memories are kept as memories; open questions are left open.
        </p>
      </section>
    </main>
  );
}
