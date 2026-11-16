# WhatAmIAI family history: research notes (2026-11-15)

Prices and features change often. Everything here was checked on 2026-11-15 from public pages and third-party trackers; confirm on each company's own site before quoting a number publicly.

## The market

| Service | What it is | Price (US, approx.) | Notes |
|---|---|---|---|
| Ancestry | Largest commercial records + trees + DNA | US Discovery about $25/mo; World Explorer about $35–40/mo; All Access about $45–60/mo (third-party estimates disagree) | Hints often point to other members' trees; many complaints about renewal cost and cancellation. Records attached to your tree go dark when you stop paying. |
| MyHeritage | Records + trees + DNA, strong in Europe | Complete about $299/yr list, often $199 first year | BBB lists ~988 complaints in 3 years; the common theme is being charged a full year after a free trial. AI tools: Scribe AI (2026), AI Biographer. |
| FamilySearch | Nonprofit, free with an account | Free | One shared world tree that anyone can edit, so edits get undone. Huge free record and image collection, AI full-text search of handwritten deeds and wills. |
| WikiTree, Geni | Shared collaborative trees | Free / freemium | Same shared-tree problem; Geni is owned by MyHeritage. |
| Gramps, RootsMagic | Desktop software | Free / about $40 one time | Your data stays yours, but no record discovery and dated design. |

Sources: [Family Tree Magazine, Ancestry plans](https://familytreemagazine.com/websites/ancestry-help/subscription-plans-explained/), [Genealogy Explained, MyHeritage](https://www.genealogyexplained.com/myheritage-review/), [BBB MyHeritage complaints](https://prod.bbb.org/us/ut/lehi/profile/genealogy/myheritage-usa-inc-1166-22311143/complaints), [Family Tree Magazine AI tools roundup](https://familytreemagazine.com/websites/ai-tools-roundup-big-websites/).

## User frustrations worth solving

1. **Errors copied from other trees.** "Hints" that cite only other people's trees spread mistakes. Professionals complain that tree-checking tools miss them.
2. **Paying to keep access to your own work.** Records attached to a tree stop opening when the subscription ends; cancellation is a top complaint.
3. **No idea how strong a fact is.** Trees show a date as a date, whether it came from a birth certificate or a cousin's guess.
4. **Shared-tree edit wars** on FamilySearch, WikiTree and Geni.
5. **DNA privacy worries** after the 2023 23andMe breach and its 2025 bankruptcy sale.

## Where WhatAmIAI is different

- **Evidence you can see.** Every fact shows one of six labels, worked out from the sources attached: Verified, Supported, Family memory, Possible match, Records disagree, No source yet. Other people's trees and AI chats can never raise a fact above "Possible match".
- **A research plan, not hints.** For each person: which censuses, draft cards, death certificates, passenger lists and old-country registers fit their dates and places, who holds them, and what access costs. You mark each one done, found or nothing found. "Searched and found nothing" is kept too.
- **Your tree stays yours.** No account needed. Data stays in the browser. GEDCOM and full backups are always free. No DNA, no selling data.
- **Stories with footnotes.** Stories are built only from recorded facts, with numbered sources. Family memories are quoted as memories. Gaps are listed instead of filled in.
- **The family journey.** Places on a map with a documented move drawn solid and an inferred move dashed, beside dated history.

## Record sources: what we can legally use

| Source | Status in the app | Terms |
|---|---|---|
| Library of Congress, Chronicling America (1770–1963 newspapers) | **Live search inside the app**, from the visitor's browser | No key. 20 requests a minute; going over gets a one-hour block ([limits](https://www.loc.gov/apis/json-and-yaml/working-within-limits/)). Site moved into loc.gov on 2025-08-04 ([migration](https://loc.gov/ndnp/migration)). The app allows 8 searches a minute per tab and caches repeats. |
| FamilySearch | Search links only | The API is closed to the public. Production access needs acceptance into FamilySearch's Compatible Solution / Innovator program and signed Compatible Products and Use agreements ([getting started](https://developers.familysearch.org/main/docs/getting-started), [approval](https://www.familysearch.org/innovate/app-approval-considerations)). **Blocker: owner must apply.** |
| National Archives Catalog | Search links only | API v2 needs a key requested by email from Catalog_API@nara.gov; 10,000 queries a month by default ([API](https://www.archives.gov/research/catalog/help/api)). **Blocker: owner must request a key.** |
| 1950 census (NARA site) | Search link | Free, no account. |
| Missouri State Archives (death certificates 1910–1974, pre-1910 birth/death, soldiers 1812–1919) | Link to each search page | Searches are form posts, so the link opens the page and the app shows what to type. |
| Find a Grave | Search link | Owned by Ancestry; no API; scraping not allowed. Linking is fine. |
| Ellis Island (Statue of Liberty–Ellis Island Foundation) | Link | Free account. |
| Canada → US border crossings 1895–1954 ("St. Albans lists") | FamilySearch collection link (2185163) | Free account. |
| NPRC military personnel files | Link to the request page | Files are open to anyone 62 years after separation; copying fees may apply. Navy and Marine Corps files were not affected by the 1973 fire; about 80% of Army files for discharges 1912–1960 were ([NPRC fire](https://www.archives.gov/personnel-records-center/fire-1973)). |
| Antenati (Italy), Matricula (Catholic Europe), Archion (German Protestant, paid), GenWiki, Riksarkivet (Sweden), FreeBMD, Irish civil records, Geneteka (Poland) | Links | All public search pages. Archion is labeled "Subscription". |
| Ancestry Marine Corps muster rolls | Link labeled "Subscription" with a note that many libraries give free access | Never shown as free. |

FamilySearch collection numbers used (checked 2026-11-15): 1850 1401638, 1860 1473181, 1870 1438024, 1880 1417683, 1900 1325221, 1910 1727033, 1920 1488411, 1930 1810731, 1940 2000219, 1950 4464515; WWI draft 1968530; WWII 1942 draft 1861144; SSDI 1202535; St. Albans 2185163.

Not used: anything behind a login we don't own, any scraping, any paid record presented as free.

## Pricing hypothesis (not live)

The owner's proposed tiers (Free; Discovery Plus $6.99/mo or $59/yr; Family Archive $12.99/mo or $109/yr) undercut Ancestry and MyHeritage by a wide margin. Because WhatAmIAI does not license record collections, the paid tiers must earn their price with features: research help that costs money to run (AI transcription, research assistance), shared family workspaces, storage, and printed books. Test before charging:

1. Track how many people finish the first person, add a source, and come back within a week.
2. On the Pricing page, measure "Tell me when this opens" emails per plan.
3. Only build checkout once at least one paid feature exists that costs real money to provide.
