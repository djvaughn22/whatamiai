# WhatAmIAI handoff: family history beside the reflection tools

Updated 2026-11-19. Branch `family-history-pages` (worktree `~/WhatAmIAI/whatamiai-family-pages`), built from live `main` 7b46eae.

## What this release is

The Nov 15 rebuild (branch `rebuild/family-history`) turned all of WhatAmIAI into a family history app and retired the reflection tools. It never went live. This release ships its working parts beside the tools instead, as two products:

| Product | Page | What it does | Who it's for |
|---|---|---|---|
| **Discover** | `/discover` | Type a name, rough years and places. See which censuses, draft cards, death records, passenger lists, burials and old-country archives fit that person, with who holds them and what access costs. Search Library of Congress newspapers (1770–1963) for them. Nothing is saved unless they choose "Keep in My Family". | Anyone with a name and a place, no tree needed |
| **My Family** | `/family` | The evidence-first family tree: people and relationships, facts labeled by their sources, records-disagree and duplicate checks, research plan with progress per person, timeline and journey map, stories and a printable book, GEDCOM import/export, backups. Kept in this browser. | Whoever keeps the family's history |

The reflection tools (home, seven tools, Saved, About) keep their URLs, look and Google Analytics. The home page and both menus link the two experiences.

## Not in this release (on purpose)

- The rebuild's **Pricing** page and plans: conflicts with the Oct 17 no-money-copy rule; plans aren't open. Still on `rebuild/family-history`.
- The rebuild's `/earlier` page and redirects: the tools were not retired.
- Accounts, sync, sharing, paid features, AI transcription, FamilySearch / National Archives API search (need approvals or keys; Discover links to them and says so).

## Rollback

- Tag `live-before-family-history-pages-20261119` = 7b46eae (production before this release). Vercel keeps that deployment: https://whatamiai-1909q5w6a-djvaughn22s-projects.vercel.app (promote it in Vercel for an instant rollback).
- Or: `git revert` the release commit(s) on `main` and push.

## Checks

`npm test` (vitest, 361 tests), `npm run typecheck`, `npm run build` (27 routes). No lint step is configured in this project. Browser checks of the production build: see the session notes in `~/WatchedNotWatched/whatamiai-family-pages-2026-11-19/`.

## Resume

```bash
cd ~/WhatAmIAI/whatamiai-family-pages
git status && git log --oneline -5
npm ci && npm test && npm run typecheck && npm run build
npx next start -p 3491
```

Before every commit: grep for the owner's family names (list in the private notes). The repo is public.
