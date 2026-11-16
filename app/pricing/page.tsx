import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing",
  description: "The family tree, sources, research plans, newspaper search, stories and full exports work today with no account. Paid plans are planned, not open.",
};

// Plans are a hypothesis (docs/BILLING.md). No checkout exists. Nothing here
// takes payment details, and nothing says a paid plan is available.

type Row = { text: string; live: boolean };
const FREE: Row[] = [
  { text: "Family tree with parents, partners, children and siblings", live: true },
  { text: "Evidence labels on every fact and relationship", live: true },
  { text: "A research plan for every person", live: true },
  { text: "Library of Congress newspaper search", live: true },
  { text: "Timeline with history alongside, and the journey map", live: true },
  { text: "Stories with sources, and a printable book", live: true },
  { text: "GEDCOM import and export, full backups", live: true },
  { text: "Living people kept private", live: true },
];
const PLUS: Row[] = [
  { text: "Everything in Free", live: true },
  { text: "AI help reading old handwriting (transcription)", live: false },
  { text: "AI research help that cites real collections, with a set number of requests a month", live: false },
  { text: "Side-by-side source comparison", live: false },
  { text: "More story kinds and book layouts", live: false },
];
const FAMILY: Row[] = [
  { text: "Everything in Discovery Plus", live: false },
  { text: "A shared family workspace: invite relatives to add memories and check records", live: false },
  { text: "Your tree kept in your account, on every device", live: false },
  { text: "More storage for photos and documents", live: false },
  { text: "Printed, bound family history books", live: false },
];

function Checks({ rows }: { rows: Row[] }) {
  return (
    <ul className="w-checks">
      {rows.map((r) => (
        <li key={r.text}>
          <span aria-hidden="true">{r.live ? "✓" : "·"}</span>
          <span>
            {r.text} {r.live ? null : <span className="w-status w-status-planned">Planned</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function PricingPage() {
  return (
    <main className="w-page">
      <h1 className="w-h2">Pricing</h1>
      <p className="w-muted" style={{ marginTop: 0, maxWidth: "44rem" }}>
        Everything that works today is in the Free plan. Paid plans aren&apos;t open: nothing on this site takes payment. These are the plans being considered.
      </p>
      <div className="w-plans" style={{ marginTop: 20 }}>
        <section className="w-panel w-plan w-plan-free" aria-labelledby="p-free">
          <div className="w-between">
            <h2 id="p-free" className="w-h3" style={{ fontSize: "1.2rem", margin: 0 }}>
              Free
            </h2>
            <span className="w-status w-status-live">Available now</span>
          </div>
          <div className="w-price">$0</div>
          <p className="w-small w-muted" style={{ margin: 0 }}>
            No account. Your tree stays in this browser.
          </p>
          <Checks rows={FREE} />
          <Link href="/" className="w-btn w-btn-primary" style={{ marginTop: 16 }}>
            Start
          </Link>
        </section>
        <section className="w-panel w-plan w-plan-plus" aria-labelledby="p-plus">
          <div className="w-between">
            <h2 id="p-plus" className="w-h3" style={{ fontSize: "1.2rem", margin: 0 }}>
              Discovery Plus
            </h2>
            <span className="w-status w-status-planned">Not open yet</span>
          </div>
          <div className="w-price">
            $6.99<span className="w-small w-muted">/month</span>
          </div>
          <p className="w-small w-muted" style={{ margin: 0 }}>
            or $59 a year (planned)
          </p>
          <Checks rows={PLUS} />
        </section>
        <section className="w-panel w-plan w-plan-family" aria-labelledby="p-family">
          <div className="w-between">
            <h2 id="p-family" className="w-h3" style={{ fontSize: "1.2rem", margin: 0 }}>
              Family Archive
            </h2>
            <span className="w-status w-status-planned">Not open yet</span>
          </div>
          <div className="w-price">
            $12.99<span className="w-small w-muted">/month</span>
          </div>
          <p className="w-small w-muted" style={{ margin: 0 }}>
            or $109 a year (planned)
          </p>
          <Checks rows={FAMILY} />
        </section>
      </div>
      <section style={{ marginTop: 32, maxWidth: "44rem" }} aria-labelledby="promises">
        <h2 id="promises" className="w-h2">
          On every plan
        </h2>
        <ul className="w-checks">
          <li>
            <span aria-hidden="true">✓</span>
            <span>Exporting your own family is never behind a paywall: GEDCOM and full backups, always.</span>
          </li>
          <li>
            <span aria-hidden="true">✓</span>
            <span>Your family&apos;s information is never sold or shared for advertising.</span>
          </li>
          <li>
            <span aria-hidden="true">✓</span>
            <span>No DNA is collected.</span>
          </li>
          <li>
            <span aria-hidden="true">✓</span>
            <span>When paid plans open, the price, what&apos;s included, and how to cancel will be stated before you pay.</span>
          </li>
        </ul>
        <p className="w-small w-muted" style={{ marginTop: 18 }}>
          Would you use a paid plan? Tell us which one and why at{" "}
          <a className="w-link" href="mailto:ask@openmirrorllc.com?subject=WhatAmIAI%20plans">
            ask@openmirrorllc.com
          </a>
          .
        </p>
      </section>
    </main>
  );
}
