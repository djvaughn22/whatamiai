"use client";

// Add a parent, partner, child or sibling: a new person, or someone already
// in the tree. The link itself can carry a family memory as its evidence.

import { useMemo, useState } from "react";
import { useFamily } from "../FamilyProvider";
import { addPerson, addRelationship, applyPatch, combine, type RelError } from "../../lib/family/ops";
import { livePeople, parentsOf, partnersOf } from "../../lib/family/graph";
import { displayName } from "../../lib/family/names";
import { Choices, SelectField, TextField, lifeSpan } from "./bits";
import type { FamilyData, Id, Patch, Sex } from "../../lib/family/types";

export type Relation = "parent" | "partner" | "child" | "sibling";

const TITLES: Record<Relation, string> = { parent: "Add a parent", partner: "Add a spouse or partner", child: "Add a child", sibling: "Add a brother or sister" };
const ERRORS: Record<RelError, string> = {
  loop: "That would make someone their own ancestor.",
  duplicate: "They're already linked that way.",
  self: "A person can't be linked to themselves.",
  missing: "One of these people is no longer in the tree.",
};

export default function AddRelative({ anchor, relation, onDone }: { anchor: Id; relation: Relation; onDone: (newId?: Id) => void }) {
  const fam = useFamily();
  const data = fam.data!;
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [given, setGiven] = useState("");
  const [surname, setSurname] = useState("");
  const [sex, setSex] = useState<Sex>("unknown");
  const [birth, setBirth] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [death, setDeath] = useState("");
  const [living, setLiving] = useState<"unsure" | "yes" | "no">("unsure");
  const [how, setHow] = useState<"memory" | "unsure">("memory");
  const [existing, setExisting] = useState<Id>("");
  const [alsoParents, setAlsoParents] = useState<Id[]>(() => (relation === "child" ? partnersOf(data, anchor).slice(0, 1) : relation === "sibling" ? parentsOf(data, anchor) : []));
  const [err, setErr] = useState("");
  const anchorName = displayName(data, anchor);
  const anchorParents = parentsOf(data, anchor);
  const anchorPartners = partnersOf(data, anchor);

  const candidates = useMemo(
    () =>
      livePeople(data)
        .filter((p) => p.id !== anchor)
        .map((p) => ({ id: p.id, label: `${displayName(data, p.id)}${lifeSpan(data, p.id) ? ` (${lifeSpan(data, p.id)})` : ""}` }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [data, anchor],
  );

  if (relation === "sibling" && !anchorParents.length) {
    return (
      <div className="w-stack">
        <p>Brothers and sisters are linked through a shared parent. Add {anchorName}&apos;s parent first, even if you only know a first name.</p>
        <button type="button" className="w-btn" onClick={() => onDone()}>
          OK
        </button>
      </div>
    );
  }

  function link(d: FamilyData, other: Id): { patch?: Patch; error?: RelError } {
    const knownHow = how;
    const patches: Patch[] = [];
    let cur = d;
    const add = (input: Parameters<typeof addRelationship>[1]) => {
      const r = addRelationship(cur, input);
      if (r.error) return r.error;
      patches.push(r.patch);
      cur = applyPatch(cur, r.patch);
      return null;
    };
    let e: RelError | null = null;
    if (relation === "parent") e = add({ type: "parent", a: other, b: anchor, knownHow });
    if (relation === "partner") e = add({ type: "partner", a: anchor, b: other, status: "unknown", knownHow });
    if (relation === "child") {
      e = add({ type: "parent", a: anchor, b: other, knownHow });
      for (const p of alsoParents) if (!e) e = add({ type: "parent", a: p, b: other, knownHow });
    }
    if (relation === "sibling") for (const p of alsoParents) if (!e) e = add({ type: "parent", a: p, b: other, knownHow });
    if (e) return { error: e };
    return { patch: combine(...patches) };
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setErr("");
    if (mode === "existing") {
      if (!existing) return setErr("Pick a person.");
      const r = link(data, existing);
      if (r.error) return setErr(ERRORS[r.error]);
      await fam.commit(r.patch!);
      fam.toast("Linked");
      return onDone(existing);
    }
    if (!given.trim() && !surname.trim()) return setErr("Add at least a first or last name.");
    if (relation === "sibling" && !alsoParents.length) return setErr("Pick at least one shared parent.");
    const y = birth.trim();
    const p = addPerson(data, {
      given,
      surname,
      sex,
      birthDate: /^\d{4}$/.test(y) ? `about ${y}` : y,
      birthPlace,
      deathDate: death,
      living: living === "unsure" ? undefined : living,
      knownHow: how,
    });
    const after = applyPatch(data, p.patch);
    const r = link(after, p.id);
    if (r.error) return setErr(ERRORS[r.error]);
    await fam.commit(combine(p.patch, r.patch!));
    fam.toast("Added");
    onDone(p.id);
  }

  const otherParentChoices = relation === "child" ? anchorPartners : relation === "sibling" ? anchorParents : [];

  return (
    <form onSubmit={submit} className="w-fields">
      <p className="w-small w-muted" style={{ margin: 0 }}>
        {TITLES[relation]} for {anchorName}.
      </p>
      <Choices<"new" | "existing">
        legend="Who?"
        value={mode}
        onChange={setMode}
        options={[
          { value: "new", label: "Someone new" },
          { value: "existing", label: "Someone already in this tree" },
        ]}
      />
      {mode === "existing" ? (
        <SelectField<string> label="Person" value={existing} onChange={setExisting} options={[{ value: "", label: "Choose…" }, ...candidates.map((c) => ({ value: c.id, label: c.label }))]} />
      ) : (
        <>
          <div className="w-fields w-fields-2">
            <TextField label="First name" value={given} onChange={setGiven} autoFocus />
            <TextField label="Last name" value={surname} onChange={setSurname} help={relation === "parent" || relation === "partner" ? "For women, the birth surname if you know it." : undefined} />
          </div>
          <div className="w-fields w-fields-2">
            <TextField label="Born about" value={birth} onChange={setBirth} placeholder="1890" />
            <TextField label="Born where" value={birthPlace} onChange={setBirthPlace} placeholder="Sedalia, Missouri" />
          </div>
          <div className="w-fields w-fields-3">
            <SelectField<Sex> label="They were" value={sex} onChange={setSex} options={[{ value: "unknown", label: "Not sure / skip" }, { value: "female", label: "A woman" }, { value: "male", label: "A man" }]} />
            <SelectField<"unsure" | "yes" | "no"> label="Still living?" value={living} onChange={setLiving} options={[{ value: "unsure", label: "Not sure" }, { value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
            <TextField label="Died about" value={death} onChange={setDeath} placeholder="1975" />
          </div>
        </>
      )}
      {otherParentChoices.length ? (
        <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="w-fields">
          <legend className="w-label" style={{ marginBottom: 6 }}>
            {relation === "child" ? "Also a child of" : "Shared parents"}
          </legend>
          {otherParentChoices.map((pid) => (
            <label key={pid} className="w-choice">
              <input
                type="checkbox"
                checked={alsoParents.includes(pid)}
                onChange={(e) => setAlsoParents((cur) => (e.target.checked ? [...cur, pid] : cur.filter((x) => x !== pid)))}
              />
              <span>{displayName(data, pid)}</span>
            </label>
          ))}
        </fieldset>
      ) : null}
      <Choices<"memory" | "unsure">
        legend="How do you know this?"
        value={how}
        onChange={setHow}
        options={[
          { value: "memory", label: "I remember it, or family told me", help: "Saved as a family memory." },
          { value: "unsure", label: "Not sure yet", help: "Saved with no source until you add one." },
        ]}
      />
      {err ? (
        <p className="w-error" role="alert" style={{ margin: 0 }}>
          {err}
        </p>
      ) : null}
      <div className="w-row">
        <button type="submit" className="w-btn w-btn-primary">
          {mode === "existing" ? "Link" : "Add"}
        </button>
        <button type="button" className="w-btn w-btn-quiet" onClick={() => onDone()}>
          Cancel
        </button>
      </div>
    </form>
  );
}
