"use client";

// Attach evidence: pick a source already in this family or describe a new one,
// then say what kind of evidence it gives and whether it's really this person.

import { useMemo, useState } from "react";
import { useFamily } from "../FamilyProvider";
import { addCitation, addSource, applyPatch, combine } from "../../lib/family/ops";
import { INFO_LABEL, MATCH_LABEL } from "../../lib/family/evidence";
import { Choices, SelectField, TextArea, TextField } from "./bits";
import type { Id, InfoKind, MatchStatus, SourceKind } from "../../lib/family/types";

export const KIND_LABEL: Record<SourceKind, string> = {
  record: "A record (certificate, census, register, draft card)",
  newspaper: "A newspaper",
  book: "A book or published family history",
  website: "A website or online index",
  interview: "A conversation with a relative",
  document: "A family paper (letter, Bible page, discharge paper)",
  photo: "A photograph",
  tree: "Someone else's family tree",
  ai: "An AI chat",
};

export default function EvidenceForm({ target, onDone, defaultInfo }: { target: { factId?: Id; relationshipId?: Id; personId?: Id }; onDone: () => void; defaultInfo?: InfoKind }) {
  const fam = useFamily();
  const data = fam.data!;
  const sources = useMemo(() => Object.values(data.sources).sort((a, b) => a.title.localeCompare(b.title)), [data.sources]);
  const [sourceId, setSourceId] = useState<string>(sources.length ? "" : "new");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<SourceKind>("record");
  const [repository, setRepository] = useState("");
  const [url, setUrl] = useState("");
  const [recordId, setRecordId] = useState("");
  const [sdate, setSdate] = useState("");
  const [detail, setDetail] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [note, setNote] = useState("");
  const [info, setInfo] = useState<InfoKind>(defaultInfo ?? "primary");
  const [match, setMatch] = useState<MatchStatus>("confirmed");
  const [err, setErr] = useState("");
  const isNew = sourceId === "new";
  const clueOnly = isNew ? kind === "tree" || kind === "ai" : ["tree", "ai"].includes(data.sources[sourceId]?.kind ?? "");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!isNew && !sourceId) return setErr("Pick a source, or choose “A new source”.");
    if (isNew && !title.trim()) return setErr("Give the source a title, like “1940 census, Sedalia, Missouri”.");
    const cleanUrl = url.trim();
    if (cleanUrl && !/^https?:\/\//i.test(cleanUrl)) return setErr("Links must start with http:// or https://");
    let sid = sourceId;
    const patches = [];
    let cur = data;
    if (isNew) {
      const s = addSource(cur, {
        title,
        kind,
        repository: repository.trim() || undefined,
        url: cleanUrl || undefined,
        recordId: recordId.trim() || undefined,
        date: sdate.trim() || undefined,
        accessed: cleanUrl ? new Date().toISOString() : undefined,
      });
      patches.push(s.patch);
      cur = applyPatch(cur, s.patch);
      sid = s.id;
    }
    const c = addCitation(cur, {
      sourceId: sid,
      ...target,
      info: kind === "interview" && isNew ? "recollection" : info,
      match,
      detail: detail.trim() || undefined,
      excerpt: excerpt.trim() || undefined,
      note: note.trim() || undefined,
    });
    patches.push(c.patch);
    await fam.commit(combine(...patches));
    fam.toast("Evidence attached");
    onDone();
  }

  return (
    <form onSubmit={submit} className="w-fields">
      <SelectField<string>
        label="Source"
        value={sourceId}
        onChange={setSourceId}
        options={[{ value: "", label: "Choose a source…" }, { value: "new", label: "A new source" }, ...sources.map((s) => ({ value: s.id, label: s.title }))]}
      />
      {isNew ? (
        <div className="w-fields">
          <TextField label="Title" value={title} onChange={setTitle} placeholder="1940 census, Sedalia, Missouri" autoFocus />
          <SelectField<SourceKind> label="What is it?" value={kind} onChange={setKind} options={(Object.keys(KIND_LABEL) as SourceKind[]).map((k) => ({ value: k, label: KIND_LABEL[k] }))} />
          <div className="w-fields w-fields-2">
            <TextField label="Who holds it" value={repository} onChange={setRepository} placeholder="National Archives, FamilySearch, Aunt Rose" />
            <TextField label="Date of the source" value={sdate} onChange={setSdate} placeholder="1940" />
          </div>
          <div className="w-fields w-fields-2">
            <TextField label="Link" value={url} onChange={setUrl} placeholder="https://" inputMode="url" />
            <TextField label="Record number" value={recordId} onChange={setRecordId} help="Certificate number, film number or online record ID, if any." />
          </div>
        </div>
      ) : null}
      {clueOnly ? (
        <p className="w-note w-small" style={{ margin: 0 }}>
          Other people&apos;s trees and AI chats are clues. They can mark a fact as a possible match, but never prove it. Look for the record they point to.
        </p>
      ) : null}
      {!(isNew && kind === "interview") ? (
        <Choices<InfoKind>
          legend="What kind of evidence is it for this?"
          value={info}
          onChange={setInfo}
          options={(["primary", "secondary", "recollection"] as InfoKind[]).map((k) => ({ value: k, label: INFO_LABEL[k].label, help: INFO_LABEL[k].help }))}
        />
      ) : null}
      <Choices<MatchStatus>
        legend="Is it really this person?"
        value={match}
        onChange={setMatch}
        options={[
          { value: "confirmed", label: MATCH_LABEL.confirmed, help: "Names, dates, places and family all line up." },
          { value: "possible", label: MATCH_LABEL.possible, help: "Could be them. Kept as a possible match until checked." },
        ]}
      />
      <div className="w-fields w-fields-2">
        <TextField label="Where in the source" value={detail} onChange={setDetail} placeholder="Sheet 4B, line 23" />
        <TextField label="Note" value={note} onChange={setNote} placeholder="Told by Aunt Rose, 2026" />
      </div>
      <TextArea label="What it says (your own transcription)" value={excerpt} onChange={setExcerpt} rows={3} help="Type the relevant words yourself. Keep quotes from copyrighted books short." />
      {err ? (
        <p className="w-error" role="alert" style={{ margin: 0 }}>
          {err}
        </p>
      ) : null}
      <div className="w-row">
        <button type="submit" className="w-btn w-btn-primary">
          Attach
        </button>
        <button type="button" className="w-btn w-btn-quiet" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}
