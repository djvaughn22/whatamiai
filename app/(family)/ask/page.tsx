import type { Metadata } from "next";
import Link from "next/link";
import PrintButton from "../../components/family/PrintButton";
import { ASK_COUNT, ASK_SETS, ASK_TIPS } from "../../lib/family/askQuestions";

export const metadata: Metadata = {
  title: "Ask a relative",
  description:
    "Questions that bring out a relative's stories: growing up, names and roots, school, love and family, work, hard times and what matters. Print them with room to write the answers.",
  alternates: { canonical: "/ask" },
};

// A public page with nothing personal on it: no form, no storage, no script.
export default function AskPage() {
  return (
    <main className="w-page" style={{ maxWidth: "46rem" }}>
      <h1 className="w-h2">Ask a relative</h1>
      <p className="w-muted" style={{ marginTop: 0 }}>
        The people who remember are part of your family history too. Pick a few of these {ASK_COUNT} questions, sit down together, and write down what they say.
      </p>
      <div className="w-no-print" style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "14px 0 24px" }}>
        <PrintButton label="Print with room for answers" className="w-btn w-btn-primary" />
        <Link className="w-btn" href="/family">Open My Family</Link>
      </div>

      <section className="w-panel" aria-labelledby="ask-tips" style={{ marginBottom: 24 }}>
        <h2 id="ask-tips" className="w-h3" style={{ marginTop: 0 }}>Before you start</h2>
        <ul style={{ margin: 0, paddingLeft: "1.2rem", lineHeight: 1.6, listStyle: "disc" }}>
          {ASK_TIPS.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </section>

      {ASK_SETS.map((s) => (
        <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} style={{ marginBottom: 22 }}>
          <h2 id={`${s.id}-h`} className="w-h3">{s.title}</h2>
          <ol style={{ margin: 0, paddingLeft: "1.4rem", lineHeight: 1.6, listStyle: "decimal" }}>
            {s.questions.map((q) => <li key={q} className="w-ask-q">{q}</li>)}
          </ol>
        </section>
      ))}

      <section className="w-panel w-no-print" aria-labelledby="ask-after" style={{ marginTop: 28 }}>
        <h2 id="ask-after" className="w-h3" style={{ marginTop: 0 }}>After you talk</h2>
        <p style={{ margin: "0 0 12px", lineHeight: 1.6 }}>
          Add what you learned to My Family. It shows there as a Family memory, worth keeping and not yet backed by a record. Discover can help you look for the records.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <Link className="w-btn w-btn-primary" href="/family">Add to My Family</Link>
          <Link className="w-btn" href="/stories">Start a story</Link>
          <Link className="w-btn" href="/discover">Look for records</Link>
        </div>
      </section>
    </main>
  );
}
