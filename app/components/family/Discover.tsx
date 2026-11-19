"use client";

// Discover: type what you know about one person, see where their records are
// likely kept, and search old newspapers for them. Nothing is saved until the
// visitor chooses "Keep in My Family". What they type never goes into a URL.

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFamily } from "../FamilyProvider";
import { discover, discoveredPatch, EMPTY_DISCOVER, hasName, type DiscoverInput } from "../../lib/family/discover";
import { livePeople } from "../../lib/family/graph";
import { LeadInfo } from "./ResearchPanel";
import NewspaperSearch from "./NewspaperSearch";
import { SelectField, TextField } from "./bits";
import type { Id, Sex } from "../../lib/family/types";

const FIRST = 8;

export default function Discover() {
  const fam = useFamily();
  const [form, setForm] = useState<DiscoverInput>(EMPTY_DISCOVER);
  const [asked, setAsked] = useState<DiscoverInput | null>(null);
  const [run, setRun] = useState(0);
  const [err, setErr] = useState("");
  const [keptId, setKeptId] = useState<Id | null>(null);
  const [keeping, setKeeping] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const result = useMemo(() => (asked ? discover(asked) : null), [asked]);
  const field = (k: keyof DiscoverInput) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasName(form)) {
      setErr("Add at least a first or last name.");
      return;
    }
    setErr("");
    setAsked({ ...form });
    setKeptId(null);
    setShowAll(false);
    setRun((n) => n + 1);
  }

  async function keep() {
    if (!asked) return;
    setKeeping(true);
    try {
      const d = await fam.ensureMine();
      const r = discoveredPatch(d, asked);
      await fam.commit(r.patch);
      setKeptId(r.id);
      fam.toast("Kept in My Family");
    } finally {
      setKeeping(false);
    }
  }

  const hasTree = fam.data?.workspace.kind === "mine" && livePeople(fam.data).length > 0;
  const name = result?.profile.name || "this person";
  const plan = result?.plan ?? [];
  const visible = showAll ? plan : plan.slice(0, FIRST);
  const groups = [...new Set(visible.map((l) => l.group))];
  const papers = result ? result.profile.usConnected || !result.profile.countries.length : false;

  return (
    <div className="w-stack">
      <form onSubmit={submit} className="w-panel w-fields" aria-label="Who are you looking for?">
        <div className="w-fields w-fields-2">
          <TextField label="First name" value={form.given} onChange={field("given")} autoComplete="off" />
          <TextField label="Last name" value={form.surname} onChange={field("surname")} autoComplete="off" help="For women, the birth surname if you know it." />
        </div>
        <div className="w-fields w-fields-2">
          <TextField label="Born about" value={form.born} onChange={field("born")} placeholder="1890" help="A year is enough." />
          <TextField label="Died about" value={form.died} onChange={field("died")} placeholder="If you know" />
        </div>
        <div className="w-fields w-fields-2">
          <TextField label="Born where" value={form.bornPlace} onChange={field("bornPlace")} placeholder="Stockholm, Sweden" />
          <TextField label="Lived where" value={form.livedPlace} onChange={field("livedPlace")} placeholder="Duluth, Minnesota" help="If it's not where they were born." />
        </div>
        <div className="w-fields w-fields-2">
          <SelectField<Sex>
            label="They were"
            value={form.sex}
            onChange={(v) => setForm((f) => ({ ...f, sex: v }))}
            options={[
              { value: "unknown", label: "Not sure / skip" },
              { value: "female", label: "A woman" },
              { value: "male", label: "A man" },
            ]}
            help="Some records, like draft cards, were kept for men only."
          />
        </div>
        {err ? (
          <p className="w-error" role="alert" style={{ margin: 0 }}>
            {err}
          </p>
        ) : null}
        <div className="w-row">
          <button type="submit" className="w-btn w-btn-primary">
            Show where to look
          </button>
          <span className="w-tiny w-muted">Nothing is saved unless you keep it.</span>
        </div>
      </form>

      {hasTree && !result ? (
        <p className="w-small w-muted" style={{ margin: 0 }}>
          Looking for someone already in{" "}
          <Link className="w-link" href="/family">
            My Family
          </Link>
          ? Their page has this same list, with your progress.
        </p>
      ) : null}

      {result ? (
        <section aria-labelledby="where-title" className="w-stack" style={{ marginTop: 10 }}>
          <h2 id="where-title" className="w-h3" style={{ fontSize: "1.2rem", margin: 0 }}>
            Where to look for {name}
          </h2>
          {plan.length ? (
            <div>
              <p className="w-small w-muted" style={{ marginTop: 0 }}>
                Where records like these are kept, from the dates and places you typed. Nothing here has been found yet: each link opens a search on the holder&apos;s own site.
              </p>
              {groups.map((g) => (
                <div key={g} style={{ marginTop: 12 }}>
                  <div className="w-tiny w-muted" style={{ fontWeight: 750 }}>
                    {g}
                  </div>
                  <ul className="w-list">
                    {visible
                      .filter((l) => l.group === g)
                      .map((l) => (
                        <li key={l.key} style={{ paddingTop: 12, paddingBottom: 12 }}>
                          <LeadInfo lead={l} />
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
              {plan.length > FIRST ? (
                <button type="button" className="w-btn w-btn-small" style={{ marginTop: 10 }} onClick={() => setShowAll((s) => !s)}>
                  {showAll ? "Show fewer" : `Show all ${plan.length}`}
                </button>
              ) : null}
            </div>
          ) : (
            <p className="w-small w-muted" style={{ margin: 0 }}>
              Add a rough birth year or a place to see where to look.
            </p>
          )}

          {result.questions.length ? (
            <div className="w-well">
              <h3 className="w-h3">Still to find out</h3>
              <ul className="w-small" style={{ margin: 0, paddingLeft: 18 }}>
                {result.questions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="w-well w-between">
            {keptId ? (
              <>
                <span className="w-small">Kept in My Family. What you typed is saved with no source yet.</span>
                <Link href={`/person/${keptId}?tab=research`} className="w-btn w-btn-small">
                  Open their page
                </Link>
              </>
            ) : (
              <>
                <span className="w-small" style={{ flex: "1 1 18rem" }}>
                  Keep {name} in My Family to mark what you&apos;ve checked, save newspaper pages and add relatives.
                </span>
                <button type="button" className="w-btn w-btn-small" onClick={keep} disabled={keeping}>
                  {keeping ? "Keeping…" : "Keep in My Family"}
                </button>
              </>
            )}
          </div>

          {papers ? (
            <section aria-labelledby="papers-title">
              <h3 id="papers-title" className="w-h3">
                Search old newspapers
              </h3>
              <NewspaperSearch key={run} initial={result.newspaper} personId={keptId ?? undefined} saveHint="Keep this person in My Family to save pages to them." />
            </section>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
