"use client";
// Saved reflections — list, view, rename, delete, clear all, and the
// combined view across modes. Everything lives in this browser only.

import { useEffect, useState } from "react";
import type { Reflection } from "../lib/types";
import { MODE_LABEL } from "../lib/types";
import { clearAllSaved, deleteReflection, listSaved, renameReflection, saveReflection } from "../lib/storage";
import { composeCombined } from "../lib/combined";
import ResultView from "../components/ResultView";
import { Card, GhostBtn, PageHead, PrimaryBtn, Shell, TextLink, TopBar, usePalette } from "../components/ui";

export default function SavedPage() {
  const pal = usePalette();
  const [items, setItems] = useState<Reflection[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [combined, setCombined] = useState<Reflection | null>(null);

  const refresh = () => setItems(listSaved());
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(listSaved());
  }, []);

  const distinctModes = new Set(items.filter((i) => i.mode !== "combined").map((i) => i.mode)).size;
  const open = items.find((i) => i.id === openId) ?? null;

  if (combined) {
    return (
      <Shell pal={pal} narrow>
        <TopBar pal={pal} label="Combined view" />
        <ResultView pal={pal} reflection={combined} onRestart={() => setCombined(null)} restartLabel="← Back to saved" />
      </Shell>
    );
  }

  if (open) {
    return (
      <Shell pal={pal} narrow>
        <TopBar pal={pal} label={MODE_LABEL[open.mode]} />
        <ResultView pal={pal} reflection={open} readOnly onRestart={() => setOpenId(null)} restartLabel="← Back to saved" />
      </Shell>
    );
  }

  return (
    <Shell pal={pal} narrow>
      <TopBar pal={pal} label="Saved reflections" />
      <PageHead pal={pal} title="My saved reflections" sub="Stored only in this browser — no account, no cloud, no sync. Clearing browser data clears these too." />

      {items.length === 0 && (
        <Card pal={pal} style={{ textAlign: "center" }}>
          <p style={{ fontSize: 15, color: pal.sub, lineHeight: 1.7, margin: "0 0 16px" }}>
            Nothing saved yet. Finish a reflection and tap “Save on this device” — it will show up here to revisit, export, or print.
          </p>
          <PrimaryBtn pal={pal} onClick={() => (window.location.href = "/")}>Start a reflection →</PrimaryBtn>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((r) => (
          <Card pal={pal} key={r.id}>
            {renaming === r.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newName.trim()) renameReflection(r.id, newName.trim());
                  setRenaming(null);
                  refresh();
                }}
                style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
              >
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  aria-label="New name"
                  autoFocus
                  style={{ flex: 1, background: pal.input, border: `2px solid ${pal.brand}`, borderRadius: 12, padding: "10px 14px", fontSize: 15, color: pal.text, fontFamily: "inherit", minWidth: 160 }}
                />
                <PrimaryBtn pal={pal} type="submit">Save name</PrimaryBtn>
              </form>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                  <h2 style={{ fontSize: 17, fontWeight: 900, color: pal.text, margin: 0 }}>{r.title}</h2>
                  <span style={{ fontSize: 12, fontWeight: 800, color: pal.brand, textTransform: "uppercase", letterSpacing: "0.1em" }}>{MODE_LABEL[r.mode]}</span>
                </div>
                <p style={{ fontSize: 13, color: pal.sub, margin: "6px 0 14px" }}>
                  {new Date(r.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <GhostBtn pal={pal} small onClick={() => setOpenId(r.id)}>View</GhostBtn>
                  <GhostBtn pal={pal} small onClick={() => { setRenaming(r.id); setNewName(r.title); }}>Rename</GhostBtn>
                  <GhostBtn pal={pal} small danger onClick={() => {
                    if (window.confirm(`Delete “${r.title}”? This can't be undone.`)) {
                      deleteReflection(r.id);
                      refresh();
                    }
                  }}>Delete</GhostBtn>
                </div>
              </>
            )}
          </Card>
        ))}
      </div>

      {distinctModes >= 2 && (
        <Card pal={pal} accent style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 900, color: pal.text, margin: "0 0 8px" }}>Combine your reflections</h2>
          <p style={{ fontSize: 14, color: pal.sub, lineHeight: 1.65, margin: "0 0 14px" }}>
            You&apos;ve completed more than one mode. A combined view compares them — where your prompts, your situation, and your patterns agree, and where they don&apos;t. Private like everything else.
          </p>
          <PrimaryBtn
            pal={pal}
            onClick={() => {
              const c = composeCombined(items);
              if (c) {
                saveReflection(c);
                refresh();
                setCombined(c);
                window.scrollTo(0, 0);
              }
            }}
          >
            Create combined summary →
          </PrimaryBtn>
        </Card>
      )}

      {items.length > 0 && (
        <p style={{ textAlign: "center", marginTop: 26 }}>
          <TextLink
            pal={pal}
            onClick={() => {
              if (window.confirm("Clear ALL saved reflections from this browser? This can't be undone.")) {
                clearAllSaved();
                refresh();
              }
            }}
          >
            Clear all local data
          </TextLink>
        </p>
      )}
    </Shell>
  );
}
