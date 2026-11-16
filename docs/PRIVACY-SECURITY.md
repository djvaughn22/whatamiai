# Privacy and security (family history rebuild)

Status as of 2026-11-15: requirements and current state. Items marked **Before launch** must be done or consciously accepted by the owner before production cutover.

## What is true today

| Area | Current state |
|---|---|
| Where data lives | IndexedDB in the visitor's browser. No server copy, no account, no sync. |
| Cross-account exposure | Not possible: there are no accounts and no server data. |
| Search engines | Family pages (`/person`, `/family`, `/timeline`, `/stories`, `/book`, `/example`, `/earlier`) are `noindex` and disallowed in robots.txt. They contain no family data server-side anyway. |
| Analytics | **None.** Google Analytics was removed in the rebuild: GA4's automatic outbound-link tracking would send research links (which contain ancestors' names) to Google, and page titles could carry names. Re-adding analytics needs the rules below. |
| Names in URLs | Person and story URLs use random ids. Search terms are never put in WhatAmIAI URLs. Outbound research links do carry names in *the archive's* search URL; the visitor chooses to open them. `Referrer-Policy: strict-origin-when-cross-origin` keeps our page paths out of the archive's logs. |
| Outside requests | Only the Library of Congress newspaper search, from the visitor's browser, with the words they typed. |
| Living people | Presumed living unless marked deceased, a death/burial is recorded, or born 110+ years ago. Living people are left out of stories and the book, replaced with "Living Surname" in shared GEDCOM exports, and withheld from AI prompts unless the visitor ticks a box. |
| Uploads | Photos (JPEG, PNG, WebP, GIF) and PDFs only, 10 MB each, stored as Blobs in IndexedDB, shown through object URLs. SVG and HTML are refused (script risk). Restored backups only accept those same data-URL types. |
| Export and deletion | GEDCOM (complete or living-redacted) and full JSON backup on every plan. Erase one family or everything (typed confirmation). Legacy reflection data has its own download/erase page. |
| DNA | Not collected. |
| Secrets | None in the repo or the app. No environment variables are used. |
| Headers | `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN` (from next.config). |
| Rate limiting | Library of Congress calls are limited to 8 a minute per tab, cached, and abortable. There are no WhatAmIAI endpoints to abuse. |
| Example data | Entirely made up, labeled on every page while open, and every source title says "(example)". |
| Owner's own family | Never in the repo or the public site. The owner's private test case is a local file outside the repo (see the private handoff). |

## Before launch

1. **Content-Security-Policy**, report-only first: `default-src 'self'; connect-src 'self' https://www.loc.gov; img-src 'self' data: blob: https://tile.loc.gov; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'` (Next inline bootstrap), then enforce.
2. **Privacy notice page** that matches the table above (what's stored, where, how to erase, the Library of Congress request, no analytics). The About page has a short version.
3. **Owner decision on analytics.** If wanted: load only on public pages (`/`, `/records`, `/pricing`, `/about`), cookieless if possible, outbound-link tracking off, generic page titles everywhere (already the case), and say so on the privacy page.
4. **Data loss warning:** the app asks the browser for persistent storage and tells people to download backups. Consider a reminder after N changes without a backup.

## When accounts arrive (Family Archive plan)

- Row-level security on every table keyed to workspace membership (see ARCHITECTURE.md), tested with a cross-account test suite before any real data.
- Invitations are consent-based: an invite link creates a pending membership the invitee must accept; owners can remove members; members see living people only if the owner allows.
- Rate limits on auth, invitations and uploads; upload scanning for type and size server-side; private storage paths with short-lived signed URLs.
- Retention: deleted workspaces purged within 30 days, backups within 35; account deletion removes everything the person owns.
- Legal pages: privacy policy, terms, and (for paid plans) refund and cancellation terms. Children: not directed at children under 13.
