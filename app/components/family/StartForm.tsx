"use client";

// The first step: one person, from what the visitor already knows.
// What they type is saved as a family memory (or "no source yet"), never as
// a record, and nothing is searched until they choose to.

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFamily } from "../FamilyProvider";
import { addPerson } from "../../lib/family/ops";
import { Choices, SelectField, TextField } from "./bits";
import type { Sex } from "../../lib/family/types";

type Relation = "me" | "parent" | "grandparent" | "great-grandparent" | "other";

export default function StartForm({ compact = false, onDone }: { compact?: boolean; onDone?: (id: string) => void }) {
  const fam = useFamily();
  const router = useRouter();
  const [given, setGiven] = useState("");
  const [surname, setSurname] = useState("");
  const [year, setYear] = useState("");
  const [place, setPlace] = useState("");
  const [relation, setRelation] = useState<Relation>("grandparent");
  const [sex, setSex] = useState<Sex>("unknown");
  const [living, setLiving] = useState<"unsure" | "yes" | "no">("unsure");
  const [how, setHow] = useState<"memory" | "unsure">("memory");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!given.trim() && !surname.trim()) {
      setErr("Add at least a first or last name.");
      return;
    }
    setErr("");
    setBusy(true);
    try {
      const d = await fam.ensureMine();
      const y = year.trim();
      const birthDate = /^\d{4}$/.test(y) ? `about ${y}` : y;
      const isMe = relation === "me";
      const r = addPerson(
        d,
        {
          given,
          surname,
          sex,
          isSelf: isMe || undefined,
          living: isMe ? "yes" : living === "unsure" ? undefined : living,
          birthDate,
          birthPlace: place,
          knownHow: how,
          memoryNote: relation === "other" || isMe ? undefined : `Entered as the visitor's ${relation.replace("-", " ")}`,
        },
      );
      await fam.commit(r.patch);
      fam.toast("Saved in this browser");
      if (onDone) onDone(r.id);
      else router.push(`/person/${r.id}?tab=research`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-panel w-fields" aria-label="Start with one person">
      {!compact ? (
        <div>
          <h2 className="w-h3" style={{ fontSize: "1.1rem" }}>
            Start with one person
          </h2>
          <p className="w-small w-muted" style={{ margin: 0 }}>
            A grandparent is a good place to start. Rough is fine.
          </p>
        </div>
      ) : null}
      <div className="w-fields w-fields-2">
        <TextField label="First name" value={given} onChange={setGiven} autoComplete="off" />
        <TextField label="Last name" value={surname} onChange={setSurname} autoComplete="off" help="For women, the birth surname if you know it." />
      </div>
      <div className="w-fields w-fields-2">
        <TextField label="Born about" value={year} onChange={setYear} placeholder="1918" inputMode="text" help="A year, or a date like 12 Mar 1918." />
        <TextField label="Where they lived or were born" value={place} onChange={setPlace} placeholder="Sedalia, Missouri" />
      </div>
      <div className="w-fields w-fields-3">
        <SelectField<Relation>
          label="Who are they to you?"
          value={relation}
          onChange={setRelation}
          options={[
            { value: "me", label: "Me" },
            { value: "parent", label: "My parent" },
            { value: "grandparent", label: "My grandparent" },
            { value: "great-grandparent", label: "My great-grandparent" },
            { value: "other", label: "Another relative" },
          ]}
        />
        <SelectField<Sex> label="They were" value={sex} onChange={setSex} options={[{ value: "unknown", label: "Not sure / skip" }, { value: "female", label: "A woman" }, { value: "male", label: "A man" }]} />
        {relation !== "me" ? (
          <SelectField<"unsure" | "yes" | "no">
            label="Still living?"
            value={living}
            onChange={setLiving}
            options={[
              { value: "unsure", label: "Not sure" },
              { value: "no", label: "No" },
              { value: "yes", label: "Yes" },
            ]}
            help="Living people stay private."
          />
        ) : null}
      </div>
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
        <button type="submit" className="w-btn w-btn-primary" disabled={busy}>
          {busy ? "Saving…" : "Start"}
        </button>
        <span className="w-tiny w-muted">No account. Saved only in this browser.</span>
      </div>
    </form>
  );
}
