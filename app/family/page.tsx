"use client";

import Link from "next/link";
import { useState } from "react";
import { useFamily } from "../components/FamilyProvider";
import FamilyView from "../components/family/FamilyView";
import PeopleList from "../components/family/PeopleList";
import StartForm from "../components/family/StartForm";
import { AuditLine, Conflicts, Duplicates } from "../components/family/Review";
import { Loading } from "../components/family/bits";
import { livePeople } from "../lib/family/graph";

export default function MyFamily() {
  const fam = useFamily();
  const [view, setView] = useState<"tree" | "list">("tree");
  if (fam.status === "loading") return <Loading />;
  const data = fam.data;
  const count = data ? livePeople(data).length : 0;

  if (!data || !count) {
    return (
      <main className="w-page">
        <h1 className="w-h2">My Family</h1>
        <p className="w-muted" style={{ maxWidth: "40rem" }}>
          Nobody here yet. Add the first person, bring in a tree you already have, or look around the example family first.
        </p>
        <div className="w-grid2" style={{ marginTop: 18 }}>
          <StartForm />
          <div className="w-stack">
            <div className="w-panel">
              <h2 className="w-h3">Already have a tree?</h2>
              <p className="w-small w-muted">Export a GEDCOM file from Ancestry, MyHeritage, FamilySearch or your family tree program, then bring it in here.</p>
              <Link className="w-btn" href="/family/data#import">
                Import a GEDCOM file
              </Link>
            </div>
            <div className="w-panel">
              <h2 className="w-h3">See it working first</h2>
              <p className="w-small w-muted">A made-up family with records, memories, a disagreement and a couple&apos;s story.</p>
              <button type="button" className="w-btn" onClick={() => fam.openExample()}>
                Open the example family
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-page">
      <div className="w-between">
        <div>
          <h1 className="w-h2" style={{ marginBottom: 2 }}>
            {data.workspace.name}
          </h1>
          <p className="w-small w-muted" style={{ margin: 0 }}>
            {count} {count === 1 ? "person" : "people"} ·{" "}
            <Link className="w-link" href="/family/data">
              Switch family, import or export
            </Link>
          </p>
        </div>
        <div className="w-tabs" role="tablist" aria-label="View" style={{ margin: 0, border: 0 }}>
          <button type="button" role="tab" aria-selected={view === "tree"} onClick={() => setView("tree")}>
            Tree
          </button>
          <button type="button" role="tab" aria-selected={view === "list"} onClick={() => setView("list")}>
            Everyone
          </button>
        </div>
      </div>
      <div className="w-stack" style={{ marginTop: 14 }}>
        <AuditLine />
        <Conflicts />
        <Duplicates />
      </div>
      <div style={{ marginTop: 22 }}>{view === "tree" ? <FamilyView /> : <PeopleList />}</div>
    </main>
  );
}
