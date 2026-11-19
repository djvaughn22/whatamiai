"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useFamily } from "../../components/FamilyProvider";
import { Loading, SelectField, TextField, lifeSpan } from "../../components/family/bits";
import { TEMPLATES, suggestTitle } from "../../lib/family/stories";
import { addStory } from "../../lib/family/ops";
import { livePeople, partnersOf } from "../../lib/family/graph";
import { displayName } from "../../lib/family/names";
import type { Id, StoryTemplate } from "../../lib/family/types";

function NewStory() {
  const fam = useFamily();
  const router = useRouter();
  const data = fam.data!;
  const [template, setTemplate] = useState<StoryTemplate>("life");
  const [a, setA] = useState<Id>("");
  const [b, setB] = useState<Id>("");
  const [many, setMany] = useState<Id[]>([]);
  const [place, setPlace] = useState("");
  const [surname, setSurname] = useState("");
  const [title, setTitle] = useState("");
  const [err, setErr] = useState("");
  const people = useMemo(() => livePeople(data).sort((x, y) => displayName(data, x.id).localeCompare(displayName(data, y.id))), [data]);
  const opts = [{ value: "", label: "Choose…" }, ...people.map((p) => ({ value: p.id, label: `${displayName(data, p.id)} ${lifeSpan(data, p.id)}` }))];
  const partnerOpts = a ? [{ value: "", label: "Choose…" }, ...partnersOf(data, a).map((p) => ({ value: p, label: displayName(data, p) }))] : [{ value: "", label: "Pick the first person" }];
  const ids = template === "journey" ? many : template === "how-met" || template === "two-lines" ? [a, b].filter(Boolean) : template === "life" ? [a].filter(Boolean) : [];
  const suggested = suggestTitle(data, template, ids, place, surname);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const t = TEMPLATES[template];
    if (template === "journey" && !many.length) return setErr("Pick at least one person who made the journey.");
    if (t.people === 1 && template !== "journey" && !a) return setErr(t.needs);
    if (t.people === 2 && (!a || !b)) return setErr(t.needs);
    if (template === "generations" && !place.trim()) return setErr(t.needs);
    if (template === "surname" && !surname.trim()) return setErr(t.needs);
    const r = addStory(data, { template, title: title.trim() || suggested, personIds: ids, place: place.trim() || undefined, surname: surname.trim() || undefined });
    await fam.commit(r.patch);
    router.push(`/stories/${r.id}`);
  }

  return (
    <form onSubmit={create} className="w-panel w-fields" aria-label="New story">
      <h2 className="w-h3" style={{ fontSize: "1.15rem" }}>
        Start a story
      </h2>
      <SelectField<StoryTemplate> label="Kind of story" value={template} onChange={(v) => { setTemplate(v); setErr(""); }} options={(Object.keys(TEMPLATES) as StoryTemplate[]).map((k) => ({ value: k, label: TEMPLATES[k].label }))} help={TEMPLATES[template].needs} />
      {template === "life" ? <SelectField<string> label="Person" value={a} onChange={setA} options={opts} /> : null}
      {template === "how-met" || template === "two-lines" ? (
        <div className="w-fields w-fields-2">
          <SelectField<string> label="First person" value={a} onChange={(v) => { setA(v); setB(""); }} options={opts} />
          <SelectField<string> label="Their spouse or partner" value={b} onChange={setB} options={partnerOpts} />
        </div>
      ) : null}
      {template === "journey" ? (
        <fieldset className="w-fields" style={{ border: 0, padding: 0, margin: 0, maxHeight: 260, overflow: "auto" }}>
          <legend className="w-label">Who made the journey</legend>
          {people.map((p) => (
            <label key={p.id} className="w-row w-small">
              <input type="checkbox" checked={many.includes(p.id)} onChange={(e) => setMany((cur) => (e.target.checked ? [...cur, p.id] : cur.filter((x) => x !== p.id)))} />
              {displayName(data, p.id)} <span className="w-muted">{lifeSpan(data, p.id)}</span>
            </label>
          ))}
        </fieldset>
      ) : null}
      {template === "generations" ? <TextField label="Place" value={place} onChange={setPlace} placeholder="Missouri, or Pettis County, Missouri" /> : null}
      {template === "surname" ? <TextField label="Surname" value={surname} onChange={setSurname} placeholder="Lindqvist" /> : null}
      <TextField label="Title" value={title} onChange={setTitle} placeholder={suggested} />
      {err ? (
        <p className="w-error" role="alert" style={{ margin: 0 }}>
          {err}
        </p>
      ) : null}
      <div className="w-row">
        <button type="submit" className="w-btn w-btn-primary">
          Write it from the records
        </button>
      </div>
      <p className="w-tiny w-muted" style={{ margin: 0 }}>
        Stories use only facts in your tree, with each source numbered. Family memories are quoted as memories. Nothing is made up to fill gaps: they&apos;re listed as questions instead.
      </p>
    </form>
  );
}

export default function StoriesPage() {
  const fam = useFamily();
  if (fam.status === "loading") return <Loading />;
  const data = fam.data;
  const stories = data ? Object.values(data.stories).sort((x, y) => y.updatedAt.localeCompare(x.updatedAt)) : [];
  return (
    <main className="w-page">
      <div className="w-between">
        <h1 className="w-h2" style={{ margin: 0 }}>
          Stories
        </h1>
        {data && livePeople(data).length ? (
          <Link href="/book" className="w-btn w-btn-small">
            Make a family history book
          </Link>
        ) : null}
      </div>
      {!data || !livePeople(data).length ? (
        <p className="w-muted">
          Stories are written from the facts in your tree.{" "}
          <Link href="/family" className="w-link">
            Add people first
          </Link>
          , or{" "}
          <Link href="/example" className="w-link">
            read the example family&apos;s stories
          </Link>
          .
        </p>
      ) : (
        <div className="w-grid2" style={{ marginTop: 16, alignItems: "start" }}>
          <section aria-labelledby="yours">
            <h2 id="yours" className="w-h3">
              Your stories
            </h2>
            {stories.length ? (
              <ul className="w-list">
                {stories.map((s) => (
                  <li key={s.id}>
                    <Link href={`/stories/${s.id}`} className="w-link w-serif" style={{ fontSize: "1.15rem", fontWeight: 650 }}>
                      {s.title}
                    </Link>
                    <div className="w-tiny w-muted">{TEMPLATES[s.template].label}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="w-small w-muted">None yet.</p>
            )}
          </section>
          <NewStory />
        </div>
      )}
    </main>
  );
}
