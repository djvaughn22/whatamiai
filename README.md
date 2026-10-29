# whatamiai

A 7-question self-reflection tool. Answer, get a quick reflection, then take it deeper with any AI. Don't put me in a box — just help me think.

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
- **Framework:** Next.js 15.3.3 (App Router). Build: `npm run build`. Tests: `npm test` (vitest); `npm run typecheck`.
- **Routes:** `/` , `/mirror`, `/patterns`, `/react`, `/money`, `/habits`, `/situation`, `/phone`, `/saved`, `/about`. No API routes; no owner area.
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
- **Make changes in:** `app/page.tsx` and the per-mode pages.
