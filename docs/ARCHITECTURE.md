# WhatAmIAI architecture

WhatAmIAI has two experiences on one site (since 2026-11-19):

- **Reflection tools** (the original site): `/`, `/situation`, `/react`, `/patterns`, `/mirror`, `/money`, `/habits`, `/phone`, `/saved`, `/about`. Code in `app/(tools)/`, `app/components/*.tsx`, `app/lib/*.ts`. Data in `localStorage` keys listed in `app/lib/backup.ts`.
- **Family history**: two products, **Discover** (`/discover`: where one person's records are likely kept, plus old-newspaper search, no tree needed) and **My Family** (`/family`: the evidence-first family tree, with `/person/[id]`, `/timeline`, `/stories`, `/book`, `/family/data`, `/example`). Code in `app/(family)/`, `app/components/family/`, `app/components/FamilyProvider.tsx`, `app/lib/family/`. Data in IndexedDB.

**Two root layouts, on purpose.** `app/(tools)/layout.tsx` and `app/(family)/layout.tsx` each render `<html>`; there is no `app/layout.tsx`. Next.js does a full page load when moving between different root layouts, so the reflection tools' Google Analytics (in the tools layout only) is never present on a family page, and each experience keeps its own CSS (`globals.css` vs `globals.css` + `wai.css`). Unmatched URLs get `app/global-not-found.tsx` (`experimental.globalNotFound` in next.config). Both menus come from `app/lib/siteNav.ts` and link to the other experience. Guards: `app/lib/__tests__/twoExperiences.test.ts`.

The family history code came from branch `rebuild/family-history` (2026-11-15), which had replaced the tools; on `main` it sits beside them instead. That branch's Pricing page, `/earlier` page and full-site cutover were left out.

## Family history details

## Shape

- **Next.js 15 App Router**, React 19, deployed on Vercel (push to `main` = production; other branches = preview).
- **No server-side data.** Every family lives in the visitor's browser (IndexedDB). Pages are static shells or client components; the only server output is HTML/JS.
- **No API routes, no environment variables, no third-party scripts.** The one outside call is the Library of Congress newspaper search, made from the visitor's browser.

## Folders

| Path | What |
|---|---|
| `app/lib/family/types.ts` | The data model (people, facts, relationships, sources, citations, leads, ideas, media, stories, change history) |
| `app/lib/family/evidence.ts` | The evidence engine: six labels derived from citations, conflict detection, tree audit |
| `app/lib/family/dates.ts` | Genealogy dates ("abt 1918", "BET 1900 AND 1905", "1910s"), ranges, GEDCOM dates, ages |
| `app/lib/family/places.ts` | Place comparison and map placement (Census Gazetteer for US towns/counties, built-in regions, country centers) |
| `app/lib/family/ops.ts` | Every edit as a pure function returning a Patch (puts, deletes, change-history lines) |
| `app/lib/family/graph.ts` | Parents, children, partners, siblings, ancestors, kinship wording, loop checks |
| `app/lib/family/duplicates.ts` | Duplicate detection with plain reasons; lossless merge |
| `app/lib/family/gedcom.ts` | GEDCOM 5.5.1 import/export (QUAY carries evidence strength) |
| `app/lib/family/research.ts` | Research plan rules (which record sets fit a person, with access labels) |
| `app/lib/family/history.ts` | Dated historical context with sources |
| `app/lib/family/stories.ts` | Story engine (facts → paragraphs with numbered sources) |
| `app/lib/family/journey.ts` | Stops and moves for the map (documented vs inferred) |
| `app/lib/family/loc.ts` | Library of Congress client (rate limit, cache, trimmed responses) |
| `app/lib/family/living.ts` | Living-person rules and redaction |
| `app/lib/family/aiPrompt.ts` | "Ask any AI" prompt builder (copy/paste, nothing sent) |
| `app/lib/family/backupJson.ts` | Lossless JSON backup and restore with fresh ids |
| `app/lib/family/store.ts` | IndexedDB adapter |
| `app/lib/family/example.ts` | The made-up example family |
| `app/components/FamilyProvider.tsx` | Holds the open family, applies patches to memory and IndexedDB in order, syncs tabs |
| `app/components/family/*` | Screens and forms |
| `app/lib/family/discover.ts` | Discover: the research plan for someone typed in, run on a scratch family in memory; "Keep" turns it into one patch for My Family |
| `public/geo/` | Map shapes (world-atlas, us-atlas; public domain) and per-state Census Gazetteer points |

## Data model

Records are normalized and stored one per row in IndexedDB object stores (`people`, `facts`, `relationships`, `sources`, `citations`, `leads`, `hypotheses`, `media`, `stories`, `changes`), each tagged with its workspace id. Files are Blobs in `blobs`. A workspace is one family; a browser can hold several (yours, imports, the example).

- **Facts** carry what was claimed: type, structured name parts, value, fuzzy date (original text kept), place as written.
- **Citations** connect a **Source** to a fact, a relationship, or (not yet tied) a person, and record *what kind of evidence* it gives (made at the time / later or second-hand / family memory) and *whether it's really this person* (checked / possible).
- **Evidence labels are never stored.** `assessFact` and `assessRelationship` derive them every time, so they change when evidence changes. No numeric confidence exists anywhere.
- **Conflicts:** single-valued facts (birth, death, baptism, burial, marriage, divorce) that can't both be true (non-overlapping date ranges or incompatible places) are "Records disagree" until one is chosen with a reason (`preferred`) or set aside (`rejected`, kept with its reason).
- **Leads** store only the person's progress on a suggested place to look; the suggestions themselves are recomputed from the facts.
- **Ideas** (hypotheses) are never facts. AI suggestions enter only as ideas.

## Edits

Every change is `op(data, args) → Patch`. The provider applies the patch to memory immediately and writes the same records to IndexedDB in one transaction, queued in order. A `BroadcastChannel` tells other open tabs to reload. Each patch adds change-history lines; the person page's History tab reads them.

## Server version (not built: needs owner decisions)

Collaboration, sync across devices and paid plans need accounts and a server database. Proposed shape, ready to implement when approved:

- **Postgres** (Neon or Supabase through the Vercel marketplace) with the same tables plus `workspace_members(workspace_id, user_id, role)`.
- **Row-level security** on every table: a row is visible only when `exists(select 1 from workspace_members where workspace_id = row.workspace_id and user_id = auth.uid())`; writes need role `editor` or `owner`.
- **Auth** with email magic links or passkeys (Auth.js or Supabase Auth); no passwords stored by us.
- **Sync** by uploading the same Patches (they are already the unit of change), with per-record `updatedAt` for last-writer-wins and the change log for audit.
- **Files** in Vercel Blob or Supabase Storage under per-workspace private paths with signed URLs. Mind the account-wide Blob operation quota.
- Local-only use stays available.

## Testing

`npm test` (vitest) runs the reflection tools' tests and the family history tests: Discover (plan from typed facts, typed facts stay "No source yet", the year typed is the year searched), the two-experience guards, and dates, names, places, evidence labels and conflicts, kinship, duplicates and merge, GEDCOM parse/import/round-trip/redaction, privacy rules, research plan rules, story rules (no invented feelings or dialogue, memories quoted, unconfirmed details marked), journey legs, backups, the Library of Congress client and rate limit, plus footer, sitemap and robots guards. `npm run typecheck`, `npm run build`.
