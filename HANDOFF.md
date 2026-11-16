# WhatAmIAI family history rebuild: handoff

Updated 2026-11-15 (night). Branch `rebuild/family-history`. **Not in production.** whatamiai.com still serves the earlier reflection tools until the owner approves cutover.

## Where things are

| What | Where |
|---|---|
| Rebuild branch | `rebuild/family-history` (worktree on the owner's machine: `~/WhatAmIAI/whatamiai-rebuild`) |
| Preview (owner-only, Vercel sign-in) | https://whatamiai-git-rebuild-family-history-djvaughn22s-projects.vercel.app |
| Legacy app, frozen | tag `whatamiai-legacy-2026-11-15` and branch `archive/legacy-whatamiai` → `7814abf` |
| Legacy app, running (owner-only) | its production deployment, https://whatamiai-kg8q3xr14-djvaughn22s-projects.vercel.app |
| Legacy restore steps | docs/RESTORE-LEGACY.md |
| Research, architecture, privacy, billing | docs/RESEARCH.md, docs/ARCHITECTURE.md, docs/PRIVACY-SECURITY.md, docs/BILLING.md |
| Owner's private test case | outside this repo, on the owner's machine (see the private notes there). Never commit it. |

## Commits on the branch

| Commit | What |
|---|---|
| `258e2d1` | The rebuild: evidence engine, tree, research plans, newspaper search, timeline and map, stories and book, GEDCOM, backups, pricing (not open), legacy data page; reflection tools removed from this branch |
| `201b05f` | Docs, README, CLAUDE.md |
| `8f0ae1d` | Birth estimates from relatives; "early 1900s"-style dates |
| (this file) | Handoff |

## What actually works (verified 2026-11-15)

- `npm test`: 48 passing. `npm run typecheck`: clean. `npm run build`: clean (20 routes).
- Production build served locally and checked in headless Chrome at 1280px and 390px: home, My Family (tree, audit, records-disagree panel, duplicate merge), person page (facts with evidence, research plan, sources, timeline, ideas, files, history), timeline, journey map, records, stories, story view, book, pricing, Your data. No page scrolls sideways at 390px. No console errors.
- Library of Congress newspaper search works from the browser. The Library's API was slow during testing (14 to 60 seconds); the page says so after 6 seconds, offers Cancel, stops at 90 seconds and links the same search on loc.gov.
- Vercel preview builds of `201b05f` succeeded. Preview content wasn't opened in a browser: it needs the owner's Vercel sign-in.

## Proposed, not built

- Accounts, sync, shared family workspaces, server database with row-level security (design in docs/ARCHITECTURE.md).
- Paid plans and Stripe (plan in docs/BILLING.md). The Pricing page says plans aren't open.
- AI transcription and AI research assistance (needs a provider key, a cost cap and a decision).
- FamilySearch and National Archives API search inside the app (need approvals; links work today).
- Content-Security-Policy, privacy notice page, analytics decision (docs/PRIVACY-SECURITY.md).

## Blockers needing the owner

1. **Approve the preview** before anything goes to whatamiai.com. Cutover = merge `rebuild/family-history` into `main` (Vercel deploys). Rollback = docs/RESTORE-LEGACY.md or promote the old deployment in Vercel.
2. **"No pricing / free copy" rule (Oct 17)** conflicts with the Pricing page and "Free" plan this brief asked for. They exist only on the preview; confirm before cutover.
3. **Analytics** was removed (privacy). Decide whether to bring any back.
4. **FamilySearch developer program** application and **National Archives API key** (email Catalog_API@nara.gov) if in-app search of those is wanted.
5. **Stripe, terms, privacy policy, employment check** before any paid plan.

## Known issues

- Library of Congress search speed depends on loc.gov.
- The map's built-in place list covers U.S. towns and counties (Census), countries, and main regions of Italy, Germany, Canada, Britain, Ireland and Sweden. Smaller towns abroad show at region or country level, with a ring saying so.
- One family per browser at a time is open; families don't sync between devices (by design until accounts exist). People must download backups.
- Lifespan on cards shows the first birth year even when two versions disagree; the person page shows the disagreement.

## Resume work

```bash
cd ~/WhatAmIAI/whatamiai-rebuild
git pull
npm ci
npm test && npm run typecheck && npm run build
npx next start -p 3491
```

Before every commit: `grep -rni` the code for the owner's family names (list in the private notes). The repo is public.

## Remaining before production

1. Owner review of the preview on desktop and phone.
2. CSP in report-only, then enforced.
3. Privacy notice page.
4. Decide analytics.
5. Merge to `main`, watch the deploy, check the live site, keep the legacy deployment for rollback.
