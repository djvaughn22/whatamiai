"use client";

// Live search of Library of Congress newspaper pages, from this browser.
// A hit means the words are on the page — the person reads it and decides.
// Saving keeps it as a POSSIBLE match until they confirm it.

import { useRef, useState } from "react";
import { useFamily } from "../FamilyProvider";
import { newspaperUrl, searchNewspapers, LocLimitError, type NewspaperHit, type NewspaperQuery, type NewspaperResult } from "../../lib/family/loc";
import { addCitation, addSource, applyPatch, combine } from "../../lib/family/ops";
import { US_STATES } from "../../lib/family/places";
import { livePeople } from "../../lib/family/graph";
import { displayName } from "../../lib/family/names";
import { SelectField, TextField } from "./bits";
import type { Id } from "../../lib/family/types";

function niceDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

export default function NewspaperSearch({ initial, personId }: { initial?: Partial<NewspaperQuery>; personId?: Id }) {
  const fam = useFamily();
  const [text, setText] = useState(initial?.text ?? "");
  const [state, setState] = useState(initial?.state ?? "");
  const [from, setFrom] = useState(initial?.from ? String(initial.from) : "");
  const [to, setTo] = useState(initial?.to ? String(initial.to) : "");
  const [result, setResult] = useState<NewspaperResult | null>(null);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [target, setTarget] = useState<Id>(personId ?? "");
  const [slow, setSlow] = useState(false);
  const [lastQuery, setLastQuery] = useState<NewspaperQuery | null>(null);
  const ctl = useRef<AbortController | null>(null);

  async function run(p = 1) {
    setErr("");
    if (!text.trim()) return setErr("Type a name or words to look for.");
    const f = from ? Number(from) : undefined;
    const t = to ? Number(to) : undefined;
    if ((f && (f < 1770 || f > 1963)) || (t && (t < 1770 || t > 1963))) return setErr("These newspapers run from 1770 to 1963.");
    const q: NewspaperQuery = { text, state: state || undefined, from: f, to: t, page: p };
    setLastQuery(q);
    setBusy(true);
    setSlow(false);
    const c = new AbortController();
    ctl.current = c;
    const slowTimer = window.setTimeout(() => setSlow(true), 6000);
    const stopTimer = window.setTimeout(() => c.abort(), 90000);
    try {
      const r = await searchNewspapers(q, fetch, Date.now(), c.signal);
      setResult(r);
      setPage(p);
    } catch (e) {
      if (c.signal.aborted) setErr("The Library of Congress didn't answer in time. Its search is sometimes slow: try again in a few minutes, or open the same search on loc.gov.");
      else setErr(e instanceof LocLimitError ? e.message : e instanceof Error ? e.message : "The search didn't work. Try again in a minute.");
    } finally {
      window.clearTimeout(slowTimer);
      window.clearTimeout(stopTimer);
      setBusy(false);
      setSlow(false);
    }
  }

  const saved = (hit: NewspaperHit) => !!fam.data && Object.values(fam.data.sources).some((s) => s.provider === "loc" && s.recordId === hit.id);

  async function save(hit: NewspaperHit) {
    const data = fam.data ?? (await fam.ensureMine());
    const pid = personId ?? target;
    if (!pid) return setErr("Choose who this might be about first.");
    const s = addSource(data, {
      title: `${hit.paper}, ${niceDate(hit.date)}${hit.page ? `, page ${hit.page}` : ""}`,
      kind: "newspaper",
      repository: "Library of Congress, Chronicling America",
      url: hit.url,
      recordId: hit.id,
      date: hit.date,
      accessed: new Date().toISOString(),
      provider: "loc",
    });
    const c = addCitation(applyPatch(data, s.patch), { sourceId: s.id, personId: pid, info: "secondary", match: "possible", note: hit.snippet ? `Search snippet: ${hit.snippet.slice(0, 240)}` : undefined });
    await fam.commit(combine(s.patch, c.patch));
    fam.toast("Saved as a possible match");
  }

  const people = fam.data ? livePeople(fam.data).sort((a, b) => displayName(fam.data!, a.id).localeCompare(displayName(fam.data!, b.id))) : [];

  return (
    <div className="w-stack">
      <form
        className="w-fields"
        onSubmit={(e) => {
          e.preventDefault();
          run(1);
        }}
      >
        <TextField label="Words to find" value={text} onChange={setText} placeholder={'"Anders Lindqvist" or Lindqvist Duluth'} help="Put a full name in quotes to find it as written. Old papers often use initials: try “A. Lindqvist” too." />
        <div className="w-fields w-fields-3">
          <SelectField<string> label="State" value={state} onChange={setState} options={[{ value: "", label: "Any state" }, ...US_STATES.map(([a, n]) => ({ value: a, label: n }))]} />
          <TextField label="From year" value={from} onChange={setFrom} placeholder="1850" inputMode="numeric" />
          <TextField label="To year" value={to} onChange={setTo} placeholder="1963" inputMode="numeric" />
        </div>
        <div className="w-row">
          <button type="submit" className="w-btn w-btn-primary" disabled={busy}>
            {busy ? "Searching…" : "Search newspapers"}
          </button>
          {busy ? (
            <button type="button" className="w-btn w-btn-small w-btn-quiet" onClick={() => ctl.current?.abort()}>
              Cancel
            </button>
          ) : null}
          <span className="w-tiny w-muted">Library of Congress, 1770–1963. Searched from your browser.</span>
        </div>
        {busy && slow ? (
          <p className="w-small w-muted" role="status" style={{ margin: 0 }}>
            Still searching. The Library of Congress can take up to a minute for some searches.
          </p>
        ) : null}
      </form>
      {err ? (
        <p className="w-error" role="alert">
          {err}
        </p>
      ) : null}
      {lastQuery && (err || result) ? (
        <p className="w-tiny" style={{ margin: 0 }}>
          <a className="w-link w-ext" href={newspaperUrl(lastQuery, false)} target="_blank" rel="noopener noreferrer">
            Open this search on loc.gov
          </a>
        </p>
      ) : null}
      {result ? (
        <div aria-live="polite">
          <p className="w-small w-muted">
            {result.total ? `${result.total.toLocaleString()} page${result.total === 1 ? "" : "s"} contain these words. A page is a lead, not a match, until you read it.` : "No pages found. Try fewer words, initials, or a wider range of years."}
          </p>
          {!personId && result.hits.length && people.length ? (
            <div style={{ maxWidth: "26rem", marginBottom: 10 }}>
              <SelectField<string> label="Save matches to" value={target} onChange={setTarget} options={[{ value: "", label: "Choose a person…" }, ...people.map((p) => ({ value: p.id, label: displayName(fam.data!, p.id) }))]} />
            </div>
          ) : null}
          <ul className="w-list">
            {result.hits.map((h) => (
              <li key={h.id} className="w-stack" style={{ paddingTop: 12, paddingBottom: 12 }}>
                <div className="w-between" style={{ alignItems: "flex-start" }}>
                  <div style={{ flex: "1 1 18rem" }}>
                    <a href={h.url} target="_blank" rel="noopener noreferrer" className="w-link w-ext" style={{ fontWeight: 700 }}>
                      {h.paper}
                    </a>
                    <div className="w-tiny w-muted">
                      {[niceDate(h.date), h.page ? `page ${h.page}` : "", [h.city, h.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
                    </div>
                    {h.snippet ? <p className="w-small" style={{ margin: "6px 0 0" }}>{h.snippet}</p> : null}
                  </div>
                  <div>
                    {saved(h) ? (
                      <span className="w-tag">Saved</span>
                    ) : (
                      <button type="button" className="w-btn w-btn-small" onClick={() => save(h)} disabled={!personId && !target}>
                        Save as possible match
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {result.pages > 1 ? (
            <div className="w-row" style={{ marginTop: 10 }}>
              <button type="button" className="w-btn w-btn-small" disabled={page <= 1 || busy} onClick={() => run(page - 1)}>
                Previous
              </button>
              <span className="w-small w-muted">
                Page {page} of {result.pages.toLocaleString()}
              </span>
              <button type="button" className="w-btn w-btn-small" disabled={page >= result.pages || busy} onClick={() => run(page + 1)}>
                Next
              </button>
            </div>
          ) : null}
          <p className="w-tiny w-muted">Newspaper pages courtesy of the Library of Congress, Chronicling America.</p>
        </div>
      ) : null}
    </div>
  );
}
