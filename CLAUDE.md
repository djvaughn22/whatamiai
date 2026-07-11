# WhatAmIAI (whatamiai.com)
Secular self-reflection, three modes, all local + deterministic. Accent: **#E879F9**.
- **Modes:** `/mirror` (paste your own AI prompts → pattern analysis), `/situation` (one thing, thought through), `/patterns` (broader assessment). `/saved` lists local saves + combined view.
- **Engines are rule-based** (`app/lib/*Engine.ts`): every observation traces to an answer or matched prompts. No hidden scoring, no personality types, no paid APIs. Humble language only ("one possibility worth considering…", never "you are definitely…").
- **Privacy is a feature:** pasted prompts live in sessionStorage only; drafts/saves in localStorage; answers never in URLs, logs, or analytics. Safety regexes (`app/lib/safety.ts`) interrupt with crisis resources — keep them ahead of reflection output.
- No labels/boxes for the user; bridges to CrossHeartPray for the faith version.

## Open Mirror family rules
- One of 11 Open Mirror LLC sites (hub: openmirrorllc.com, repo djvaughn22/open-mirror). Baseline tag: `mvp-1`.
- **Design:** flat + cool. bg `#0b1220`, surface `#141d2e`, border `#26324c`, text `#e8edf5`, muted `#94a3b8`. No glass, no gradients, **no red**.
- **Shared chrome is SYNCED, not owned here:** `OpenMirrorNav.tsx`, `OpenMirrorFooter.tsx`, `OpenMirrorTheme.tsx` in the app folder are copies from the hub repo `packages/openmirror-ui/`. NEVER edit them here — edit in the hub, run its `scripts/sync-ui.sh`, then rebuild/commit each satellite.
- Nav + footer mount in `layout.tsx`. Footer = OPEN MIRROR LLC · ABOUT · ✝️ ❤️ 🙏 (the icons ARE the CrossHeartPray link — no word).
- ☀️/🌙 family toggle (`om-theme`) lives in the bar; pages that compute JS colors follow the `om-theme` window event.
- **Copy style:** DJ's words. Short, plain, human. Never wordy or AI-sounding.
- **Deploys:** push to `main` = production deploy (Vercel). Batch related edits into one commit.
