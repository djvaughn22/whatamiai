import Link from "next/link";
import StartForm from "./components/family/StartForm";
import ContinueRow from "./components/family/ContinueRow";
import { EvidenceKey } from "./components/family/bits";

export default function Discover() {
  return (
    <main className="w-page">
      <ContinueRow />
      <section className="w-hero" aria-labelledby="hero-title">
        <div>
          <h1 id="hero-title" className="w-h1">
            Discover how you <span className="w-accent">came to be.</span>
          </h1>
          <p className="w-lede">
            Start with one person: a name, a place, a year. WhatAmIAI shows where their records are likely kept, searches old newspapers with you, and keeps
            what records prove apart from what the family remembers.
          </p>
          <ul className="w-trust" aria-label="Your data">
            <li>No account needed</li>
            <li>No DNA collected</li>
            <li>Your family is never sold</li>
            <li>Export any time</li>
          </ul>
          <p className="w-small w-muted" style={{ marginTop: 22 }}>
            Already have a tree?{" "}
            <Link className="w-link" href="/family/data#import">
              Bring in a GEDCOM file
            </Link>{" "}
            from Ancestry, MyHeritage, FamilySearch or any family tree program and see how much of it rests on records. Or{" "}
            <Link className="w-link" href="/example">
              look around a made-up example family
            </Link>
            .
          </p>
        </div>
        <div style={{ marginTop: 24 }}>
          <StartForm />
        </div>
      </section>

      <hr className="w-rule" />

      <section aria-labelledby="how-title">
        <h2 id="how-title" className="w-h2">
          How it works
        </h2>
        <div className="w-steps">
          <div className="w-step">
            <h3>Start with what you know</h3>
            <p>A name, a rough year, a town. Say whether it's a family memory or something you've seen in a record.</p>
          </div>
          <div className="w-step">
            <h3>Follow the evidence</h3>
            <p>Each person gets a research plan: the censuses, draft cards, death certificates and passenger lists that fit their dates and places, and who holds them.</p>
          </div>
          <div className="w-step">
            <h3>Keep what you find</h3>
            <p>Every fact shows how it's supported. Turn what you've found into stories and a printable book, with the sources listed.</p>
          </div>
        </div>
      </section>

      <hr className="w-rule" />

      <section aria-labelledby="key-title">
        <h2 id="key-title" className="w-h2">
          Every fact shows where it came from
        </h2>
        <p className="w-muted" style={{ marginTop: 0, maxWidth: "42rem" }}>
          Labels come from the sources you attach, never from a guess. Someone else&apos;s online tree or an AI chat can point you somewhere, but it can&apos;t prove a fact.
        </p>
        <div style={{ marginTop: 18 }}>
          <EvidenceKey />
        </div>
      </section>
    </main>
  );
}
