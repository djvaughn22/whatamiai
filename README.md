# whatamiai

Two things on one site: short self-reflection tools, and family history (Discover: where one person's records are likely kept; My Family: a family tree with the evidence showing).

**Live:** https://whatamiai.com
**Part of:** [Open Mirror LLC](https://openmirrorllc.com)

## Local dev
```bash
npm install
npm run dev
```

## Deploy
Push to `main` — Vercel auto-deploys production.

## Repo map

- **Production:** https://whatamiai.com — branch `main`, auto-deploys on push (Vercel).
- **Framework:** Next.js 15.5 (App Router). Build: `npm run build`. Tests: `npm test` (vitest); `npm run typecheck`.
- **Routes, reflection tools** (`app/(tools)`): `/` , `/mirror`, `/patterns`, `/react`, `/money`, `/habits`, `/situation`, `/phone`, `/saved`, `/about`.
- **Routes, family history** (`app/(family)`): `/discover`, `/family`, `/family/data`, `/person/[id]`, `/timeline`, `/stories`, `/stories/[id]`, `/book`, `/example`. Separate root layout, no analytics (see docs/ARCHITECTURE.md). No API routes; no owner area.
- **Family chrome:** `OpenMirrorNav.tsx` / `OpenMirrorFooter.tsx` / `OpenMirrorTheme.tsx` are synced copies — canonical source is the hub repo `packages/openmirror-ui/` + `scripts/sync-ui.sh`. Never edit the local copies.
- **Theme:** family ☀️/🌙 toggle; light mode remaps family hexes (see hub `docs/OPEN_MIRROR_PATTERNS.md`).
- **Browser storage** (no server, no account). Key list lives in `app/lib/backup.ts` (`KEPT_KEYS`); Saved → "Your data in this browser" backs these up, restores them (merge, never overwrite), and erases them:
  - `wai3-saved-v1` — saved reflections
  - `wai-habit-streak-v1` — habit streak
  - `wai-phone-plan-v1` — Phone plan
  - `wai-react-v1` — How Do I React? picks
  - `wai-money-draft-v1` — Money Check numbers
  - `wai3-patterns-draft`, `wai3-situation-draft` — unfinished answers
- **sessionStorage:** `wai3-mirror-session` — pasted Mirror prompts; never in a backup. Erase removes it from the current tab.
- **Theme keys** (set by the synced theme file, not backed up or erased): `om-theme`, `crossheartpray-visual-theme`.
- **Protected:** tap-first six-mode design; named patterns; /react Bible-based scenario deck.
- **Family history storage:** IndexedDB (one database, several families); backup, GEDCOM import/export and erase on `/family/data`. Separate from the keys above.
- **Make changes in:** `app/(tools)/page.tsx` and the per-mode pages; family history in `app/(family)/`, `app/components/family/`, `app/lib/family/`.
