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

## Live

Deployed 2026-11-19 (push to `main`, Vercel production). Code commit `90188d7`; this handoff file followed in a docs-only commit.

- https://whatamiai.com/discover and https://whatamiai.com/family: 200. All ten reflection-tool URLs: 200. `/pricing`, `/earlier`, `/records`: 404 (left out). Unknown URLs: the site's 404 page with HTTP 404.
- Google Analytics: in the HTML of tools pages only (0 references on `/discover` and `/family`). In a browser on whatamiai.com, opening Discover from the tools menu was a full page load with no `gtag`, no `dataLayer` and no Google requests.
- robots.txt disallows `/saved`, `/person/`, `/family`, `/timeline`, `/stories`, `/book`, `/example`; the sitemap adds `/discover`.
- Live Discover run with a made-up person: 23 places to look; the Library of Congress search returned 3 pages from the whatamiai.com origin (about 50 seconds: their API is slow; the page says so and offers Cancel).

## Checks

`npm test` (vitest, 361 tests: 305 tools, 56 family history incl. Discover and the two-experience guards), `npm run typecheck`, `npm run build` (27 routes). No lint step is configured in this project. The production build was walked in a browser at desktop width and 390px: home, both menus, Discover (plan, keep, newspaper search, save as possible match), person page, My Family, timeline, stories, book, Your data, example family, About, Saved, My Situation, Money Check, 404, light mode. Session notes: `~/WatchedNotWatched/whatamiai-family-pages-2026-11-19/`.

## Known limits

- The Library of Congress search takes 14–60 seconds; FamilySearch and National Archives search inside the app need their approvals (links work today).
- Families live in one browser; no accounts or sync. People must download backups (Your data says so).
- Tools pages download a 1.2 KB family script chunk (the section tabs) that they never render; harmless Next.js chunk sharing between the two root layouts. Family pages never get the tools' layout chunk.
- The 404 page's share-image URL resolves through Vercel's default domain rather than `metadataBase` (Next.js warning at build time); share images for real pages are correct.

## Resume

```bash
cd ~/WhatAmIAI/whatamiai-family-pages
git status && git log --oneline -5
npm ci && npm test && npm run typecheck && npm run build
npx next start -p 3491
```

Before every commit: grep for the owner's family names (list in the private notes). The repo is public.
