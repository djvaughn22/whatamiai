"use client";

// The tree around one person: grandparents, parents, the person with their
// partners, then children. Tapping someone moves them to the middle.

import Link from "next/link";
import { useState } from "react";
import { useFamily } from "../FamilyProvider";
import { setFocus } from "../../lib/family/ops";
import { childrenOf, kinshipTo, parentsOf, partnersOf, siblingsOf, livePeople } from "../../lib/family/graph";
import { isLiving } from "../../lib/family/living";
import { displayName } from "../../lib/family/names";
import { personCounts } from "../../lib/family/evidence";
import AddRelative, { type Relation } from "./AddRelative";
import { Dialog, lifeSpan } from "./bits";
import type { FamilyData, Id } from "../../lib/family/types";

function sortParents(data: FamilyData, ids: Id[]): Id[] {
  const rank = (id: Id) => (data.people[id]?.sex === "male" ? 0 : data.people[id]?.sex === "female" ? 1 : 2);
  return [...ids].sort((a, b) => rank(a) - rank(b));
}

export function focusOf(data: FamilyData): Id | undefined {
  const f = data.workspace.focusPersonId;
  if (f && data.people[f] && !data.people[f].mergedInto) return f;
  return Object.values(data.people).find((p) => p.isSelf && !p.mergedInto)?.id ?? livePeople(data)[0]?.id;
}

function Card({ data, id, self, onPick, focus }: { data: FamilyData; id: Id; self?: Id; onPick?: (id: Id) => void; focus?: boolean }) {
  const kin = self && self !== id ? kinshipTo(data, self, id) : id === self ? "you" : "";
  const living = isLiving(data, id);
  const c = personCounts(data, id);
  const proven = c.verified + c.supported;
  const inner = (
    <>
      <span className="w-pcard-name">{displayName(data, id)}</span>
      <span className="w-pcard-meta" style={{ display: "block" }}>
        {[lifeSpan(data, id), kin].filter(Boolean).join(" · ") || " "}
      </span>
      <span className="w-pcard-meta" style={{ display: "block" }}>
        {living ? "Living · private" : proven ? `${proven} fact${proven > 1 ? "s" : ""} backed by records` : c.recollection ? "Family memory so far" : "No sources yet"}
      </span>
    </>
  );
  if (focus) {
    return (
      <div className="w-pcard w-pcard-focus" aria-current="true">
        {inner}
        <div className="w-row" style={{ marginTop: 10 }}>
          <Link href={`/person/${id}`} className="w-btn w-btn-small w-btn-primary">
            Open
          </Link>
          <Link href={`/person/${id}?tab=research`} className="w-btn w-btn-small">
            Where to look
          </Link>
        </div>
      </div>
    );
  }
  return (
    <button type="button" className="w-pcard" onClick={() => onPick?.(id)} aria-label={`Move ${displayName(data, id)} to the middle`}>
      {inner}
    </button>
  );
}

function AddCard({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="w-pcard w-pcard-add" onClick={onClick}>
      + {label}
    </button>
  );
}

export default function FamilyView() {
  const fam = useFamily();
  const data = fam.data!;
  const focus = focusOf(data);
  const self = Object.values(data.people).find((p) => p.isSelf && !p.mergedInto)?.id;
  const [adding, setAdding] = useState<Relation | null>(null);
  if (!focus) return null;
  const pick = (id: Id) => fam.commit(setFocus(data, id));
  const parents = sortParents(data, parentsOf(data, focus));
  const grand = parents.map((p) => ({ parent: p, gps: sortParents(data, parentsOf(data, p)) }));
  const partners = partnersOf(data, focus);
  const kids = childrenOf(data, focus);
  const sibs = siblingsOf(data, focus);

  return (
    <div className="w-tree" aria-label={`Family of ${displayName(data, focus)}`}>
      {grand.some((g) => g.gps.length) ? (
        <>
          <div className="w-tree-label">Grandparents</div>
          <div className="w-tree-row">
            {grand.flatMap((g) => g.gps.map((gp) => <Card key={`${g.parent}-${gp}`} data={data} id={gp} self={self} onPick={pick} />))}
          </div>
          <div className="w-connector" aria-hidden="true" />
        </>
      ) : null}
      <div className="w-tree-label">Parents</div>
      <div className="w-tree-row">
        {parents.map((p) => (
          <Card key={p} data={data} id={p} self={self} onPick={pick} />
        ))}
        {parents.length < 2 ? <AddCard label="Add a parent" onClick={() => setAdding("parent")} /> : null}
      </div>
      <div className="w-connector" aria-hidden="true" />
      <div className="w-tree-row">
        <Card data={data} id={focus} self={self} focus />
        {partners.map((p) => (
          <Card key={p} data={data} id={p} self={self} onPick={pick} />
        ))}
        <AddCard label="Add a spouse or partner" onClick={() => setAdding("partner")} />
      </div>
      <div className="w-connector" aria-hidden="true" />
      <div className="w-tree-label">Children</div>
      <div className="w-tree-row">
        {kids.map((k) => (
          <Card key={k} data={data} id={k} self={self} onPick={pick} />
        ))}
        <AddCard label="Add a child" onClick={() => setAdding("child")} />
      </div>
      <div className="w-tree-label" style={{ marginTop: 18 }}>
        Brothers and sisters
      </div>
      <div className="w-tree-row">
        {sibs.map((s) => (
          <Card key={s.id} data={data} id={s.id} self={self} onPick={pick} />
        ))}
        <AddCard label="Add a brother or sister" onClick={() => setAdding("sibling")} />
      </div>
      <Dialog open={!!adding} onClose={() => setAdding(null)} title={adding === "parent" ? "Add a parent" : adding === "partner" ? "Add a spouse or partner" : adding === "child" ? "Add a child" : "Add a brother or sister"}>
        {adding ? <AddRelative anchor={focus} relation={adding} onDone={() => setAdding(null)} /> : null}
      </Dialog>
    </div>
  );
}
