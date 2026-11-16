# whatamiai

Family history with the evidence showing: what records prove, what the family remembers, and what is still a question.

**Live:** https://whatamiai.com (the earlier reflection tools, until the rebuild is approved)
**Part of:** [Open Mirror LLC](https://openmirrorllc.com)

## Local dev
```bash
npm install
npm run dev
```

## Checks
```bash
npm test
npm run typecheck
npm run build
```

## Deploy
Push to `main` — Vercel auto-deploys production. Other branches get preview deployments.

## Repo map
- **Routes:** `/` Discover, `/family` My Family, `/person/[id]`, `/family/data` Your data, `/timeline` (with journey map), `/records`, `/stories`, `/stories/[id]`, `/book`, `/pricing`, `/about`, `/example`, `/earlier`. The old tool routes redirect to `/earlier`.
- **Code:** domain logic in `app/lib/family/`, screens in `app/components/family/`, design system in `app/wai.css`.
- **Data:** IndexedDB database `whatamiai-family` in the visitor's browser. Nothing on a server.
- **Docs:** `docs/ARCHITECTURE.md`, `docs/PRIVACY-SECURITY.md`, `docs/BILLING.md`, `docs/RESEARCH.md`, `docs/RESTORE-LEGACY.md`, `HANDOFF.md`.
- **Map data:** world-atlas and us-atlas (public domain Natural Earth / US Census shapes) and the US Census Bureau 2024 Gazetteer (public domain), in `public/geo/`.
