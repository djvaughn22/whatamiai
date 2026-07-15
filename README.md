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
- **Framework:** Next.js 15.3.3 (App Router). Build: `npm run build`. No test suite.
- **Routes:** `/` , `/mirror`, `/patterns`, `/react`, `/money`, `/habits`, `/situation`, `/saved`
- **Family chrome:** `OpenMirrorNav.tsx` / `OpenMirrorFooter.tsx` / `OpenMirrorTheme.tsx` are synced copies — canonical source is the hub repo `packages/openmirror-ui/` + `scripts/sync-ui.sh`. Never edit the local copies.
- **Theme:** family ☀️/🌙 toggle; `om-theme` localStorage key; light mode remaps family hexes (see hub `docs/OPEN_MIRROR_PATTERNS.md`).
- **Persistence (localStorage):** `wai3-mirror-session`, `wai3-patterns-draft`, `wai3-situation-draft`, `wai3-saved-v1`, `wai-habit-streak-v1`, `wai-react-v1`
- **Protected:** tap-first six-mode design; named patterns; /react Bible-based scenario deck.
- **Make changes in:** `app/page.tsx` and the per-mode pages.
