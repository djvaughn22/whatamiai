"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useFamily } from "../../../components/FamilyProvider";
import FactList from "../../../components/family/FactList";
import FactForm from "../../../components/family/FactForm";
import EvidenceForm from "../../../components/family/EvidenceForm";
import ResearchPanel, { Ideas } from "../../../components/family/ResearchPanel";
import { FamilyLinks, FilesTab, HistoryTab, PersonTimeline, SourcesTab } from "../../../components/family/PersonSections";
import { Dialog, EvidenceBadge, Loading, SelectField, lifeSpan } from "../../../components/family/bits";
import { kinshipTo } from "../../../lib/family/graph";
import { livingStatus } from "../../../lib/family/living";
import { displayName } from "../../../lib/family/names";
import { personCounts, LEVELS } from "../../../lib/family/evidence";
import { removePerson, setFocus, updatePerson } from "../../../lib/family/ops";
import type { Id, Sex } from "../../../lib/family/types";

const TABS = [
  { id: "facts", label: "Facts" },
  { id: "family", label: "Family" },
  { id: "research", label: "Where to look" },
  { id: "sources", label: "Sources" },
  { id: "timeline", label: "Timeline" },
  { id: "ideas", label: "Ideas" },
  { id: "files", label: "Photos & files" },
  { id: "history", label: "History" },
] as const;
type Tab = (typeof TABS)[number]["id"];

function EditPerson({ id, onDone }: { id: Id; onDone: () => void }) {
  const fam = useFamily();
  const data = fam.data!;
  const p = data.people[id];
  const [sex, setSex] = useState<Sex>(p.sex ?? "unknown");
  const [living, setLiving] = useState<"auto" | "yes" | "no">(p.living ?? "auto");
  const [isSelf, setIsSelf] = useState(!!p.isSelf);
  return (
    <div className="w-fields">
      <SelectField<Sex> label="Sex" value={sex} onChange={setSex} options={[{ value: "unknown", label: "Not sure" }, { value: "female", label: "Woman" }, { value: "male", label: "Man" }]} />
      <SelectField<"auto" | "yes" | "no">
        label="Living or deceased"
        value={living}
        onChange={setLiving}
        options={[
          { value: "auto", label: "Work it out from the dates" },
          { value: "yes", label: "Living (kept private)" },
          { value: "no", label: "Deceased" },
        ]}
        help="Anyone without a death date who was born in the last 110 years is treated as living."
      />
      <label className="w-choice">
        <input type="checkbox" checked={isSelf} onChange={(e) => setIsSelf(e.target.checked)} />
        <span>This is me (relationships are described from this person)</span>
      </label>
      <div className="w-row">
        <button
          type="button"
          className="w-btn w-btn-primary"
          onClick={async () => {
            await fam.commit(updatePerson(data, id, { sex, living: living === "auto" ? undefined : living, isSelf: isSelf || undefined }));
            onDone();
          }}
        >
          Save
        </button>
        <button type="button" className="w-btn w-btn-quiet" onClick={onDone}>
          Cancel
        </button>
      </div>
      <p className="w-tiny w-muted">Names are facts too: add or edit them in the Facts tab, each with its own evidence.</p>
    </div>
  );
}

function PersonInner() {
  const fam = useFamily();
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const id = params.id;
  const initial = (search.get("tab") as Tab) ?? "facts";
  const [tab, setTab] = useState<Tab>(TABS.some((t) => t.id === initial) ? initial : "facts");
  const [dialog, setDialog] = useState<null | "fact" | "edit" | "evidence">(null);
  const [newFact, setNewFact] = useState<Id | null>(null);
  if (fam.status === "loading") return <Loading />;
  const data = fam.data;
  const person = data?.people[id];
  if (!data || !person) {
    return (
      <main className="w-page">
        <h1 className="w-h2">Person not found</h1>
        <p className="w-muted">They may be in another family on this device, or were removed.</p>
        <Link href="/family" className="w-btn">
          Back to My Family
        </Link>
      </main>
    );
  }
  if (person.mergedInto) {
    return (
      <main className="w-page">
        <h1 className="w-h2">This record was merged</h1>
        <Link href={`/person/${person.mergedInto}`} className="w-btn w-btn-primary">
          Open {displayName(data, person.mergedInto)}
        </Link>
      </main>
    );
  }
  const self = Object.values(data.people).find((p) => p.isSelf && !p.mergedInto)?.id;
  const kin = self ? kinshipTo(data, self, id) : "";
  const living = livingStatus(data, id);
  const counts = personCounts(data, id);
  const facts = Object.values(data.facts).filter((f) => f.personId === id);
  return (
    <main className="w-page">
      <div className="w-between" style={{ alignItems: "flex-start" }}>
        <div>
          <h1 className="w-h1" style={{ fontSize: "clamp(1.9rem, 5vw, 2.8rem)" }}>
            {displayName(data, id)}
          </h1>
          <p className="w-muted" style={{ margin: "6px 0 0" }}>
            {[lifeSpan(data, id), kin === "you" ? "You" : kin ? kin.charAt(0).toUpperCase() + kin.slice(1) : ""].filter(Boolean).join(" · ")}
          </p>
          {living.living ? (
            <p className="w-tiny w-muted" style={{ margin: "4px 0 0" }}>
              Living, kept private. {living.why}
            </p>
          ) : null}
          <div className="w-row" style={{ marginTop: 10, gap: 6 }}>
            {LEVELS.filter((l) => counts[l]).map((l) => (
              <span key={l} className="w-row" style={{ gap: 3 }}>
                <EvidenceBadge level={l} />
                <span className="w-tiny">{counts[l]}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="w-row w-no-print">
          <button
            type="button"
            className="w-btn w-btn-small"
            onClick={async () => {
              await fam.commit(setFocus(data, id));
              router.push("/family");
            }}
          >
            Show in tree
          </button>
          <button type="button" className="w-btn w-btn-small" onClick={() => setDialog("edit")}>
            Edit
          </button>
          <button
            type="button"
            className="w-btn w-btn-small w-btn-quiet"
            onClick={async () => {
              if (!window.confirm(`Remove ${displayName(data, id)} with their facts and links? Sources stay. This can't be undone, so download a backup first if unsure.`)) return;
              await fam.commit(removePerson(data, id));
              router.push("/family");
            }}
          >
            Remove
          </button>
        </div>
      </div>

      <div className="w-tabs" role="tablist" aria-label="About this person">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === "facts" ? (
          <div className="w-stack">
            <div className="w-between">
              <p className="w-small w-muted" style={{ margin: 0 }}>
                Tap a label to see the evidence behind it.
              </p>
              <button type="button" className="w-btn w-btn-small w-btn-primary" onClick={() => setDialog("fact")}>
                Add a fact
              </button>
            </div>
            <FactList facts={facts} empty="No facts yet. Add a birth, a place they lived, a job, a family memory." />
            {data.people[id].notes ? (
              <div className="w-well w-small" style={{ whiteSpace: "pre-wrap" }}>
                <strong>Notes</strong>
                <div>{data.people[id].notes}</div>
              </div>
            ) : null}
          </div>
        ) : null}
        {tab === "family" ? <FamilyLinks personId={id} /> : null}
        {tab === "research" ? <ResearchPanel personId={id} /> : null}
        {tab === "sources" ? <SourcesTab personId={id} /> : null}
        {tab === "timeline" ? <PersonTimeline personId={id} /> : null}
        {tab === "ideas" ? <Ideas personId={id} /> : null}
        {tab === "files" ? <FilesTab personId={id} /> : null}
        {tab === "history" ? <HistoryTab personId={id} /> : null}
      </div>

      <Dialog open={dialog === "fact"} onClose={() => setDialog(null)} title="Add a fact">
        <FactForm
          personId={id}
          onDone={(fid, attach) => {
            if (fid && attach) {
              setNewFact(fid);
              setDialog("evidence");
            } else setDialog(null);
          }}
        />
      </Dialog>
      <Dialog open={dialog === "evidence"} onClose={() => setDialog(null)} title="Attach the source">
        {newFact ? <EvidenceForm target={{ factId: newFact }} onDone={() => setDialog(null)} /> : null}
      </Dialog>
      <Dialog open={dialog === "edit"} onClose={() => setDialog(null)} title="Edit person">
        <EditPerson id={id} onDone={() => setDialog(null)} />
      </Dialog>
    </main>
  );
}

export default function PersonPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PersonInner />
    </Suspense>
  );
}
