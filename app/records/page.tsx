import type { Metadata } from "next";
import NewspaperSearch from "../components/family/NewspaperSearch";
import WhereToLook from "../components/family/WhereToLook";

export const metadata: Metadata = {
  title: "Records",
  description: "Search Library of Congress newspapers from 1770 to 1963, and see which archives hold the records for each person in your tree.",
};

const SOURCES: { name: string; what: string; how: string; status: "live" | "link" | "waiting" | "paid" }[] = [
  { name: "Library of Congress, Chronicling America", what: "U.S. newspaper pages, 1770–1963", how: "Searched right here, from your browser.", status: "live" },
  { name: "FamilySearch", what: "Censuses, vital records, draft cards, immigration, deeds and wills", how: "Each person's research plan links to the matching collection. A free FamilySearch account is needed to view.", status: "link" },
  { name: "U.S. National Archives", what: "The 1950 census, naturalization guides, military personnel files", how: "Linked from the research plan. Service files are ordered from the National Personnel Records Center.", status: "link" },
  { name: "Missouri State Archives", what: "Death certificates 1910–1974, earlier county birth and death records, soldiers' records", how: "Linked, with the words to search for.", status: "link" },
  { name: "Find a Grave", what: "Burials and headstone photos", how: "Linked with the name and years filled in.", status: "link" },
  { name: "Ellis Island Foundation", what: "New York arrivals, 1892–1924 and later", how: "Linked. Free account.", status: "link" },
  { name: "Antenati, Matricula, Riksarkivet, FreeBMD, Irish civil records, Geneteka", what: "Church and civil registers in Italy, Catholic Europe, Sweden, England and Wales, Ireland and Poland", how: "Linked from the research plan when a person has a connection there.", status: "link" },
  { name: "FamilySearch API", what: "Searching FamilySearch from inside WhatAmIAI", how: "Needs approval from FamilySearch's developer program. Until then, the links above.", status: "waiting" },
  { name: "National Archives Catalog API", what: "Searching the National Archives catalog from inside WhatAmIAI", how: "Needs an API key from the National Archives. Until then, links.", status: "waiting" },
  { name: "Ancestry, MyHeritage, Fold3, Newspapers.com", what: "Subscription record sites", how: "Linked only where they hold something unique, always labeled Subscription. Many public libraries offer free in-library access.", status: "paid" },
];

const STATUS_LABEL = { live: "Searched here", link: "Linked", waiting: "Waiting on approval", paid: "Subscription, linked" };

export default function RecordsPage() {
  return (
    <main className="w-page">
      <h1 className="w-h2">Records</h1>
      <p className="w-muted" style={{ marginTop: 0, maxWidth: "44rem" }}>
        Search old newspapers here, or open a person&apos;s research plan to see which censuses, certificates and lists fit their life. WhatAmIAI doesn&apos;t hold or sell records: it shows you where they are.
      </p>
      <div className="w-grid2" style={{ marginTop: 18, alignItems: "start" }}>
        <section className="w-panel" aria-labelledby="np">
          <h2 id="np" className="w-h3" style={{ fontSize: "1.15rem" }}>
            Search old newspapers
          </h2>
          <NewspaperSearch />
        </section>
        <section className="w-panel" aria-labelledby="wtl">
          <h2 id="wtl" className="w-h3" style={{ fontSize: "1.15rem" }}>
            Where to look for someone
          </h2>
          <WhereToLook />
        </section>
      </div>
      <section style={{ marginTop: 32 }} aria-labelledby="src">
        <h2 id="src" className="w-h2">
          Where the records come from
        </h2>
        <ul className="w-list">
          {SOURCES.map((s) => (
            <li key={s.name} className="w-between" style={{ alignItems: "flex-start" }}>
              <div style={{ flex: "1 1 22rem" }}>
                <strong>{s.name}</strong>
                <div className="w-small">{s.what}</div>
                <div className="w-tiny w-muted">{s.how}</div>
              </div>
              <span className={`w-status ${s.status === "live" ? "w-status-live" : s.status === "waiting" ? "w-status-planned" : ""}`}>{STATUS_LABEL[s.status]}</span>
            </li>
          ))}
        </ul>
        <p className="w-tiny w-muted">
          WhatAmIAI never copies records from other sites, never gets around a paywall, and never shows a paid record as free. Newspaper pages courtesy of the Library of Congress.
        </p>
      </section>
    </main>
  );
}
