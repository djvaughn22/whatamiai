"use client";
// "Your data in this browser" — back up everything to a file, restore it
// on another browser or after clearing, or erase it all. Logic lives in
// lib/backup.ts; this is the UI only.

import { useEffect, useRef, useState } from "react";
import { buildBackup, countKept, eraseAll, KEY_LABEL, restoreBackup } from "../lib/backup";
import { Card, GhostBtn, PrimaryBtn, type Palette } from "./ui";

export default function DataCard({ pal, onChange }: { pal: Palette; onChange: () => void }) {
  const [count, setCount] = useState(0);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const recount = () => {
    try {
      setCount(countKept(localStorage));
    } catch {
      setCount(0);
    }
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(recount, []);

  const backup = () => {
    try {
      const b = buildBackup(localStorage);
      const blob = new Blob([JSON.stringify(b, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `whatamiai-backup-${b.exportedAt.slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      setMsg("Backup downloaded. Keep the file somewhere you trust — anyone who opens it can read it.");
    } catch {
      setMsg("This browser blocked the backup. Try another browser.");
    }
  };

  const restore = async (file: File) => {
    try {
      const r = restoreBackup(localStorage, await file.text());
      if ("error" in r) setMsg(r.error);
      else {
        const parts: string[] = [];
        if (r.added) parts.push(`${r.added} saved reflection${r.added === 1 ? "" : "s"} added`);
        if (r.filled.length) parts.push(`restored: ${r.filled.map((k) => KEY_LABEL[k]).join(", ")}`);
        if (r.skipped.length) parts.push(`kept what's already here for: ${r.skipped.map((k) => KEY_LABEL[k]).join(", ")}`);
        setMsg(parts.length ? `Done — ${parts.join("; ")}.` : "Nothing new in that file — everything in it is already here.");
      }
    } catch {
      setMsg("This browser blocked the restore. Nothing was changed.");
    }
    if (fileRef.current) fileRef.current.value = "";
    recount();
    onChange();
  };

  const erase = () => {
    if (!window.confirm("Erase everything WhatAmIAI keeps in this browser — saved reflections, streak, phone week, and unfinished answers? This can't be undone. Download a backup first if you might want it.")) return;
    try {
      eraseAll(localStorage, sessionStorage);
      setMsg("Erased. Nothing from WhatAmIAI is left in this browser.");
    } catch {
      setMsg("This browser blocked the erase. Try clearing site data in your browser settings.");
    }
    recount();
    onChange();
  };

  return (
    <Card pal={pal} style={{ marginTop: 26 }}>
      <h2 style={{ fontSize: 17, fontWeight: 900, color: pal.text, margin: "0 0 8px" }}>Your data in this browser</h2>
      <p style={{ fontSize: 14, color: pal.sub, lineHeight: 1.65, margin: "0 0 14px" }}>
        There&apos;s no account, so nothing is backed up for you. Clearing browser data or switching phones loses it. A backup file lets you carry it over: download it here, then restore it on the other browser. Restoring adds to what&apos;s here and never replaces it.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <PrimaryBtn pal={pal} disabled={count === 0} onClick={backup}>Download a backup</PrimaryBtn>
        <GhostBtn pal={pal} onClick={() => fileRef.current?.click()}>Restore from a backup</GhostBtn>
        <GhostBtn pal={pal} danger onClick={erase}>Erase everything</GhostBtn>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        aria-label="Choose a backup file"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void restore(f);
        }}
      />
      {count === 0 && <p style={{ fontSize: 13, color: pal.sub, margin: "10px 0 0" }}>Nothing is kept here yet.</p>}
      {msg && (
        <p role="status" aria-live="polite" style={{ fontSize: 14, fontWeight: 700, color: pal.text, lineHeight: 1.55, margin: "12px 0 0" }}>
          {msg}
        </p>
      )}
    </Card>
  );
}
