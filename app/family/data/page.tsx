"use client";

// Your data: every family on this device, import, export and erase.
// Export is never behind a paywall.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFamily } from "../../components/FamilyProvider";
import { Loading, download, safeFileName } from "../../components/family/bits";
import { exportGedcom, importGedcom, type ImportSummary } from "../../lib/family/gedcom";
import { readBackup, toBackup, withFreshIds } from "../../lib/family/backupJson";
import { renameWorkspace } from "../../lib/family/ops";
import { treeAudit, LEVEL_INFO, LEVELS } from "../../lib/family/evidence";
import { requestPersistence, usage } from "../../lib/family/store";
import { emptyData, type FamilyData, type Id } from "../../lib/family/types";
import { newWorkspace } from "../../lib/family/ops";

const MAX_IMPORT = 50 * 1024 * 1024;

function blobToDataUrl(b: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(b);
  });
}

async function dataUrlToBlob(url: string): Promise<Blob | null> {
  if (!/^data:(image\/(jpeg|png|webp|gif)|application\/pdf);base64,/.test(url)) return null;
  return (await fetch(url)).blob();
}

export default function DataPage() {
  const fam = useFamily();
  const [withFiles, setWithFiles] = useState(false);
  const [summary, setSummary] = useState<(ImportSummary & { audit: ReturnType<typeof treeAudit> }) | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [space, setSpace] = useState<{ used: number; quota: number } | null>(null);
  const [kept, setKept] = useState<boolean | null>(null);

  useEffect(() => {
    usage().then(setSpace);
    navigator.storage?.persisted?.().then(setKept).catch(() => {});
  }, [fam.data]);

  if (fam.status === "loading") return <Loading />;
  const data = fam.data;

  async function exportBackup(d: FamilyData) {
    setBusy(true);
    try {
      let files: Record<Id, string> | undefined;
      if (withFiles) {
        files = {};
        for (const m of Object.values(d.media)) {
          const b = await fam.readFile(m.id);
          if (b) files[m.id] = await blobToDataUrl(b);
        }
      }
      download(`${safeFileName(d.workspace.name)}-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(toBackup(d, files)), "application/json");
    } finally {
      setBusy(false);
    }
  }

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    setErr("");
    setMsg("");
    setSummary(null);
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_IMPORT) return setErr("That file is over 50 MB.");
    setBusy(true);
    try {
      const text = await file.text();
      const base = file.name.replace(/\.(ged|gedcom|json)$/i, "");
      if (/\.json$/i.test(file.name) || text.trimStart().startsWith("{")) {
        const r = readBackup(text);
        if (r.ok === false) return setErr(r.error);
        const { data: copy, idMap } = withFreshIds(r.backup.data, r.backup.data.workspace.name || base);
        await fam.addWorkspace(copy);
        for (const [oldId, url] of Object.entries(r.backup.files ?? {})) {
          const blob = await dataUrlToBlob(url);
          const nid = idMap.get(oldId);
          if (blob && nid) await fam.saveFile(nid, blob);
        }
        setMsg(`Restored “${copy.workspace.name}” as a separate family on this device.`);
        return;
      }
      if (!/^\s*0\s+HEAD/.test(text)) return setErr("That doesn't look like a GEDCOM file (it should start with “0 HEAD”).");
      const { data: imported, summary: s } = importGedcom(text, base || "Imported tree");
      await fam.addWorkspace(imported);
      setSummary({ ...s, audit: treeAudit(imported) });
    } catch {
      setErr("That file couldn't be read.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="w-page">
      <h1 className="w-h2">Your data</h1>
      <p className="w-muted" style={{ marginTop: 0, maxWidth: "44rem" }}>
        Everything is kept in this browser on this device. Nothing is on a server. Download a backup now and then: clearing your browser data, or losing the device, loses what isn&apos;t backed up.
      </p>

      <section className="w-panel" style={{ marginTop: 18 }} aria-labelledby="fams">
        <h2 id="fams" className="w-h3" style={{ fontSize: "1.15rem" }}>
          Families on this device
        </h2>
        {fam.workspaces.length ? (
          <ul className="w-list">
            {fam.workspaces.map((w) => (
              <li key={w.id} className="w-between">
                <div>
                  <strong>{w.name}</strong>
                  {data?.workspace.id === w.id ? <span className="w-tag" style={{ marginLeft: 8 }}>Open</span> : null}
                  <div className="w-tiny w-muted">
                    {w.kind === "example" ? "Made-up example · " : ""}Last changed {new Date(w.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="w-row">
                  {data?.workspace.id !== w.id ? (
                    <button type="button" className="w-btn w-btn-small" onClick={() => fam.openWorkspace(w.id)}>
                      Open
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="w-btn w-btn-small w-btn-quiet"
                    onClick={async () => {
                      if (!window.confirm(`Erase “${w.name}” from this browser? This can't be undone. Download a backup first if you might want it.`)) return;
                      await fam.removeWorkspace(w.id);
                      setMsg(`Erased “${w.name}”.`);
                    }}
                  >
                    Erase
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="w-small w-muted">None yet.</p>
        )}
        <div className="w-row" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="w-btn w-btn-small"
            onClick={async () => {
              await fam.addWorkspace(emptyData(newWorkspace("New family", "mine")));
              setMsg("Started an empty family.");
            }}
          >
            Start another family
          </button>
          {data && data.workspace.kind !== "example" ? (
            <form
              className="w-row"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!name.trim()) return;
                await fam.commit(renameWorkspace(data, name));
                setName("");
              }}
            >
              <input className="w-input" style={{ width: "14rem" }} value={name} onChange={(e) => setName(e.target.value)} placeholder={`Rename “${data.workspace.name}”`} aria-label="New name for the open family" maxLength={80} />
              <button type="submit" className="w-btn w-btn-small">
                Rename
              </button>
            </form>
          ) : null}
        </div>
      </section>

      <div className="w-grid2" style={{ marginTop: 18, alignItems: "start" }}>
        <section className="w-panel w-stack" aria-labelledby="exp">
          <h2 id="exp" className="w-h3" style={{ fontSize: "1.15rem" }}>
            Export {data ? `“${data.workspace.name}”` : ""}
          </h2>
          {data ? (
            <>
              <div>
                <button type="button" className="w-btn" onClick={() => download(`${safeFileName(data.workspace.name)}.ged`, exportGedcom(data), "text/plain")}>
                  GEDCOM file, complete
                </button>
                <p className="w-tiny w-muted">For Ancestry, MyHeritage, FamilySearch, Gramps, RootsMagic and other programs. Evidence strength travels as standard QUAY codes.</p>
              </div>
              <div>
                <button type="button" className="w-btn" onClick={() => download(`${safeFileName(data.workspace.name)}-to-share.ged`, exportGedcom(data, { redactLiving: true }), "text/plain")}>
                  GEDCOM file to share
                </button>
                <p className="w-tiny w-muted">Living people keep their place in the tree, but their names and details are removed.</p>
              </div>
              <div>
                <button type="button" className="w-btn" disabled={busy} onClick={() => exportBackup(data)}>
                  Full backup
                </button>
                <label className="w-row w-small" style={{ marginTop: 6 }}>
                  <input type="checkbox" checked={withFiles} onChange={(e) => setWithFiles(e.target.checked)} /> Include photos and documents
                </label>
                <p className="w-tiny w-muted">Everything WhatAmIAI knows about this family, including evidence, research progress, ideas and stories. Restore it here on any device.</p>
              </div>
            </>
          ) : (
            <p className="w-small w-muted">Open or start a family first.</p>
          )}
        </section>

        <section className="w-panel w-stack" id="import" aria-labelledby="imp" style={{ scrollMarginTop: 96 }}>
          <h2 id="imp" className="w-h3" style={{ fontSize: "1.15rem" }}>
            Import
          </h2>
          <p className="w-small w-muted" style={{ margin: 0 }}>
            A GEDCOM file (.ged) from any family tree program, or a WhatAmIAI full backup (.json). It comes in as a separate family; nothing you have is changed.
          </p>
          <label className="w-btn w-btn-primary" style={{ width: "fit-content" }}>
            {busy ? "Reading…" : "Choose a file"}
            <input type="file" accept=".ged,.gedcom,.json,application/json,text/plain" onChange={onImport} className="w-sr" />
          </label>
          <details className="w-more">
            <summary>How to get a GEDCOM file</summary>
            <ul className="w-small w-muted" style={{ paddingLeft: 18 }}>
              <li>Ancestry: Trees → your tree → Tree settings → Export tree.</li>
              <li>MyHeritage: Family tree → Manage trees → Export to GEDCOM.</li>
              <li>FamilySearch: its shared tree can&apos;t be exported in full; use a program that syncs with FamilySearch, or add people here.</li>
              <li>Desktop programs: File → Export → GEDCOM.</li>
            </ul>
          </details>
          {summary ? (
            <div className="w-well w-stack">
              <p style={{ margin: 0 }}>
                <strong>Imported {summary.people} people</strong>, {summary.families} families, {summary.facts} events and {summary.citations} source links
                {summary.fromProgram ? ` from ${summary.fromProgram}` : ""}.
              </p>
              <p className="w-small" style={{ margin: 0 }}>
                What the evidence looks like:{" "}
                {LEVELS.filter((l) => summary.audit.facts[l])
                  .map((l) => `${summary.audit.facts[l]} ${LEVEL_INFO[l].label.toLowerCase()}`)
                  .join(", ")}
                .
              </p>
              {summary.treeSources ? (
                <p className="w-small" style={{ margin: 0 }}>
                  {summary.treeSources} source{summary.treeSources > 1 ? "s are" : " is"} other people&apos;s online trees. Facts resting only on those are marked as possible matches until you find the record.
                </p>
              ) : null}
              <p className="w-small w-muted" style={{ margin: 0 }}>
                Imported sources come in as “later or second-hand” unless the file said otherwise. Open a fact to mark a record as made at the time.
              </p>
              {summary.warnings.map((w) => (
                <p key={w} className="w-small w-muted" style={{ margin: 0 }}>
                  {w}
                </p>
              ))}
              <div>
                <Link href="/family" className="w-btn w-btn-small w-btn-primary">
                  Open the imported tree
                </Link>
              </div>
            </div>
          ) : null}
          {msg ? (
            <p className="w-small" role="status">
              {msg}
            </p>
          ) : null}
          {err ? (
            <p className="w-error" role="alert">
              {err}
            </p>
          ) : null}
        </section>
      </div>

      <section className="w-panel w-stack" style={{ marginTop: 18 }} aria-labelledby="keep">
        <h2 id="keep" className="w-h3" style={{ fontSize: "1.15rem" }}>
          Keeping it safe
        </h2>
        <p className="w-small w-muted" style={{ margin: 0 }}>
          {space ? `Using about ${(space.used / 1024 / 1024).toFixed(1)} MB of this browser's storage. ` : ""}
          {kept ? "This browser has agreed not to clear WhatAmIAI's data on its own." : "Browsers can clear site data when a device runs low on space."}
        </p>
        {!kept ? (
          <div>
            <button
              type="button"
              className="w-btn w-btn-small"
              onClick={async () => {
                const ok = await requestPersistence();
                setKept(ok);
                fam.toast(ok ? "This browser will keep your data" : "This browser didn't agree. Keep backups.");
              }}
            >
              Ask the browser to keep it
            </button>
          </div>
        ) : null}
        <hr className="w-rule" style={{ margin: "8px 0" }} />
        <h3 className="w-h3">Erase everything</h3>
        <p className="w-small w-muted" style={{ margin: 0 }}>
          Removes every family, photo and document WhatAmIAI keeps in this browser. Type ERASE to confirm.
        </p>
        <div className="w-row">
          <input className="w-input" style={{ width: "10rem" }} value={confirmText} onChange={(e) => setConfirmText(e.target.value)} aria-label="Type ERASE to confirm" />
          <button
            type="button"
            className="w-btn w-btn-small"
            disabled={confirmText !== "ERASE"}
            onClick={async () => {
              await fam.eraseAll();
              setConfirmText("");
              setMsg("Erased.");
              fam.toast("Everything was erased from this browser");
            }}
          >
            Erase everything
          </button>
        </div>
        <p className="w-tiny w-muted" style={{ margin: 0 }}>
          Used WhatAmIAI&apos;s earlier reflection tools?{" "}
          <Link href="/earlier" className="w-link">
            Your saved reflections are still here
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
