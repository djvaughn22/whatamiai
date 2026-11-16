# WhatAmIAI (whatamiai.com)
Family history with the evidence showing. Accent: **#E879F9**. Rebuilt 2026-11-15 on branch `rebuild/family-history` (preview only until the owner approves cutover). The earlier self-reflection tools are preserved at tag `whatamiai-legacy-2026-11-15` / branch `archive/legacy-whatamiai` (docs/RESTORE-LEGACY.md).

- **Product rules (never break):** never invent ancestors, dates, places, relationships or records. Every fact's label comes from attached citations (app/lib/family/evidence.ts): Verified, Supported, Family memory, Possible match, Records disagree, No source yet. Other people's trees and AI chats never lift a fact above Possible match. No numeric confidence anywhere. Stories use only recorded facts, quote memories as memories, list gaps, and never write feelings, dialogue or scenes.
- **Data:** IndexedDB in the visitor's browser, normalized per record type (app/lib/family/store.ts). Every edit is a pure op returning a Patch (app/lib/family/ops.ts) that also writes change history. No server data, no API routes, no env vars.
- **Privacy:** no analytics script (GA removed: outbound research links carry names). Family pages are noindex. Living people are private by default (app/lib/family/living.ts). Page titles stay generic: never put a person's name in a title or a WhatAmIAI URL.
- **The owner's own family is never in this repo or on the site.** The repo is PUBLIC. Use the made-up example family (app/lib/family/example.ts) for demos and tests.
- **Outside data:** only the Library of Congress newspaper API, called from the browser (app/lib/family/loc.ts, 8/minute cap). Everything else is a link to the holder's own search page with an honest access label (app/lib/family/research.ts). FamilySearch and National Archives APIs need approvals (docs/RESEARCH.md).
- **Tests:** `npm test` (vitest), `npm run typecheck`, `npm run build`. Keep them green.
- Docs: docs/ARCHITECTURE.md, docs/PRIVACY-SECURITY.md, docs/BILLING.md, docs/RESEARCH.md, HANDOFF.md.

## Open Mirror family rules
- One of the Open Mirror LLC sites (hub: openmirrorllc.com, repo djvaughn22/open-mirror).
- **Design:** dark hub palette by default (bg `#0b1220`, surface `#141d2e`, border `#26324c`, text `#e8edf5`, muted `#94a3b8`), light mode via the family toggle. Solid surfaces: no glass, no gradients, no glow. Design system lives in app/wai.css; evidence colors always come with an icon and words.
- **Shared chrome is SYNCED, not owned here:** `OpenMirrorNav.tsx`, `OpenMirrorFooter.tsx`, `OpenMirrorTheme.tsx` are copies from the hub repo `packages/openmirror-ui/`. NEVER edit them here. The OPEN MIRROR FAMILY STYLE OVERRIDE block in globals.css is family-wide too: leave it.
- Footer = OpenMirrorLLC.com · About · ✝️ ❤️ 🙏; Contact and Disclaimer anchor into this site's About page (`#contact`, `#disclaimer`).
- **Copy style:** the owner's words. Short, plain, human. No filler, no slogans, no "founder".
- **Deploys:** push to `main` = production (Vercel). Other branches get preview deployments.
