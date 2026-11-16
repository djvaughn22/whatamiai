"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { download } from "../components/family/bits";
import { legacyBackup, legacyCount, legacyErase, legacySavedCount } from "../lib/legacy";

export default function EarlierTools() {
  const [count, setCount] = useState<number | null>(null);
  const [saved, setSaved] = useState(0);
  const refresh = () => {
    try {
      setCount(legacyCount(localStorage));
      setSaved(legacySavedCount(localStorage));
    } catch {
      setCount(0);
    }
  };
  useEffect(refresh, []);
  return (
    <main className="w-read">
      <h1 className="w-h2">The earlier WhatAmIAI tools</h1>
      <p>
        WhatAmIAI used to offer seven short reflection tools: My Situation, How Do I React?, My Overall Patterns, My AI Mirror, Money Check, the 7-Day Habit Starter and Intentional Phone Use. They were retired when WhatAmIAI became a family history site.
      </p>
      {count === null ? null : count ? (
        <div className="w-panel w-stack">
          <p style={{ margin: 0 }}>
            This browser still has what you kept with them{saved ? `, including ${saved} saved reflection${saved === 1 ? "" : "s"}` : ""}. It stays here until you erase it.
          </p>
          <div className="w-row">
            <button type="button" className="w-btn w-btn-primary" onClick={() => download(`whatamiai-reflections-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(legacyBackup(localStorage), null, 2), "application/json")}>
              Download it
            </button>
            <button
              type="button"
              className="w-btn"
              onClick={() => {
                if (!window.confirm("Erase the earlier tools' data from this browser? This can't be undone.")) return;
                try {
                  legacyErase(localStorage, sessionStorage);
                } catch {}
                refresh();
              }}
            >
              Erase it
            </button>
          </div>
        </div>
      ) : (
        <p className="w-muted">Nothing from the earlier tools is stored in this browser.</p>
      )}
      <p className="w-small w-muted" style={{ marginTop: 22 }}>
        Questions? Email{" "}
        <a className="w-link" href="mailto:ask@openmirrorllc.com?subject=WhatAmIAI%20earlier%20tools">
          ask@openmirrorllc.com
        </a>
        . <Link href="/" className="w-link">Go to WhatAmIAI</Link>
      </p>
    </main>
  );
}
