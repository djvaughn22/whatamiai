"use client";

import { useState } from "react";
import { useFamily } from "../FamilyProvider";
import { addFact, updateFact } from "../../lib/family/ops";
import { formatDate } from "../../lib/family/dates";
import { Choices, FACT_LABEL, SelectField, TextArea, TextField } from "./bits";
import type { Fact, FactType, Id } from "../../lib/family/types";

const PERSON_TYPES: FactType[] = ["birth", "baptism", "death", "burial", "residence", "immigration", "emigration", "naturalization", "military", "occupation", "education", "religion", "memory", "name", "other"];
const COUPLE_TYPES: FactType[] = ["marriage", "divorce", "memory", "other"];
const VALUE_HINT: Partial<Record<FactType, { label: string; placeholder: string }>> = {
  military: { label: "Branch or unit", placeholder: "U.S. Marine Corps" },
  occupation: { label: "Occupation", placeholder: "coal miner" },
  education: { label: "School or level", placeholder: "Lincoln High School" },
  religion: { label: "Religion or church", placeholder: "Catholic" },
  memory: { label: "The memory, in the family's words", placeholder: "They met at a dance in San Diego." },
  other: { label: "What happened", placeholder: "Registered for the draft" },
};

export default function FactForm({ personId, relationshipId, fact, onDone }: { personId?: Id; relationshipId?: Id; fact?: Fact; onDone: (newFactId?: Id, attach?: boolean) => void }) {
  const fam = useFamily();
  const data = fam.data!;
  const [type, setType] = useState<FactType>(fact?.type ?? (relationshipId ? "marriage" : "birth"));
  const [given, setGiven] = useState(fact?.given ?? "");
  const [surname, setSurname] = useState(fact?.surname ?? "");
  const [nickname, setNickname] = useState(fact?.nickname ?? "");
  const [date, setDate] = useState(fact?.date?.text ?? "");
  const [place, setPlace] = useState(fact?.place ?? "");
  const [value, setValue] = useState(fact?.value ?? "");
  const [note, setNote] = useState(fact?.note ?? "");
  const [how, setHow] = useState<"record" | "memory" | "unsure">("record");
  const [err, setErr] = useState("");
  const types = relationshipId ? COUPLE_TYPES : PERSON_TYPES;
  const hint = VALUE_HINT[type];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (type === "name" && !given.trim() && !surname.trim()) return setErr("Add a first or last name.");
    if (type === "memory" && !value.trim()) return setErr("Write the memory down.");
    if (type !== "name" && type !== "memory" && !date.trim() && !place.trim() && !value.trim()) return setErr("Add a date, a place, or what happened.");
    const fields = {
      type,
      given: type === "name" ? given.trim() || undefined : undefined,
      surname: type === "name" ? surname.trim() || undefined : undefined,
      nickname: type === "name" ? nickname.trim() || undefined : undefined,
      date,
      place,
      value: hint ? value : undefined,
      note: note.trim() || undefined,
    };
    if (fact) {
      await fam.commit(updateFact(data, fact.id, fields));
      fam.toast("Saved");
      return onDone(fact.id);
    }
    const memory = how === "memory" || type === "memory";
    const r = addFact(data, { ...fields, personId, relationshipId }, { knownHow: memory ? "memory" : undefined });
    await fam.commit(r.patch);
    fam.toast("Saved");
    onDone(r.id, how === "record" && type !== "memory");
  }

  return (
    <form onSubmit={submit} className="w-fields">
      {!fact ? <SelectField<FactType> label="What kind of fact?" value={type} onChange={setType} options={types.map((t) => ({ value: t, label: FACT_LABEL[t] }))} /> : null}
      {type === "name" ? (
        <div className="w-fields w-fields-3">
          <TextField label="First and middle names" value={given} onChange={setGiven} />
          <TextField label="Last name" value={surname} onChange={setSurname} />
          <TextField label="Nickname" value={nickname} onChange={setNickname} />
        </div>
      ) : (
        <>
          {hint ? (type === "memory" ? <TextArea label={hint.label} value={value} onChange={setValue} placeholder={hint.placeholder} /> : <TextField label={hint.label} value={value} onChange={setValue} placeholder={hint.placeholder} />) : null}
          <div className="w-fields w-fields-2">
            <TextField label="Date" value={date} onChange={setDate} placeholder="12 Mar 1918, about 1918, 1942–1945" help={fact?.date ? `Reads as: ${formatDate(fact.date)}` : "Rough dates are fine: about, before, after, between."} />
            <TextField label="Place" value={place} onChange={setPlace} placeholder="Sedalia, Pettis County, Missouri" help="Write it as the record does, from town to country." />
          </div>
        </>
      )}
      <TextArea label="Note" value={note} onChange={setNote} rows={2} />
      {!fact && type !== "memory" ? (
        <Choices<"record" | "memory" | "unsure">
          legend="How do you know this?"
          value={how}
          onChange={setHow}
          options={[
            { value: "record", label: "I have a record or source", help: "You'll attach it next." },
            { value: "memory", label: "I remember it, or family told me", help: "Saved as a family memory." },
            { value: "unsure", label: "Not sure yet", help: "Saved with no source until you add one." },
          ]}
        />
      ) : null}
      {err ? (
        <p className="w-error" role="alert" style={{ margin: 0 }}>
          {err}
        </p>
      ) : null}
      <div className="w-row">
        <button type="submit" className="w-btn w-btn-primary">
          {fact ? "Save" : how === "record" && type !== "memory" ? "Save and attach the source" : "Save"}
        </button>
        <button type="button" className="w-btn w-btn-quiet" onClick={() => onDone()}>
          Cancel
        </button>
      </div>
    </form>
  );
}
