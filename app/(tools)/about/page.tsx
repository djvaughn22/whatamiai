import { ANALYTICS_NOTE, STORAGE_NOTE } from "../../lib/privacyCopy";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About WhatAmIAI",
  description:
    "Short tap-to-answer tools for thinking through a decision, your money, how you react, a habit, or your phone, and family history pages for finding records and keeping a family tree. Your answers and your tree stay on your device.",
};

const A = "#E879F9";

export default function AboutPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#0b1220", color: "#e8edf5", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 20px 80px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 12px" }}>
          About WhatAmIAI<span style={{ color: A }}>.com</span>
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.65, color: "#94a3b8", margin: "0 0 28px" }}>
          WhatAmIAI is a set of short tools for thinking about how you decide, react, spend,
          and use your time, your phone, and AI chat tools. They describe situations and habits,
          never people.
        </p>

        <h2 style={{ fontSize: 17, fontWeight: 900, margin: "0 0 8px" }}>What you can do here</h2>
        <ul style={{ fontSize: 15, lineHeight: 1.8, color: "#94a3b8", margin: "0 0 28px", paddingLeft: 18 }}>
          <li>My AI Mirror — paste your own prompts and see the repeated topics and goals in them.</li>
          <li>My Situation — think through one real situation, step by step.</li>
          <li>My Overall Patterns and How Do I React? — an honest look at how you answered, with the evidence shown.</li>
          <li>Money Check — three numbers, three taps, the real math kept separate from any reading of it.</li>
          <li>7-Day Habit Starter — pick one habit for one week, sized to real life.</li>
          <li>Intentional Phone Use — pick one phone use to reduce, run seven small days.</li>
        </ul>

        <h2 style={{ fontSize: 17, fontWeight: 900, margin: "0 0 8px" }}>Family history</h2>
        <ul style={{ fontSize: 15, lineHeight: 1.8, color: "#94a3b8", margin: "0 0 28px", paddingLeft: 18 }}>
          <li>
            <a href="/discover" style={{ color: A }}>Discover</a> — type a name, a rough year and a place. See where that person&rsquo;s records are likely kept, and search old newspapers at the Library of Congress.
          </li>
          <li>
            <a href="/family" style={{ color: A }}>My Family</a> — build your family tree. Every fact is labeled by its sources: verified, supported, family memory, possible match, records disagree, or no source yet. Stories and a printable book use only what&rsquo;s recorded.
          </li>
        </ul>

        <h2 style={{ fontSize: 17, fontWeight: 900, margin: "0 0 8px" }}>Your data</h2>
        <p style={{ background: "#141d2e", border: "1px solid #26324c", borderRadius: 14, padding: "14px 16px", fontSize: 15, lineHeight: 1.65, margin: "0 0 28px" }}>
          The tools are rule-based and run in your browser. {STORAGE_NOTE}{" "}
          {ANALYTICS_NOTE} If you choose to continue a reflection with another AI, you copy it
          yourself, and you can review what will be included first.
        </p>
        <p style={{ background: "#141d2e", border: "1px solid #26324c", borderRadius: 14, padding: "14px 16px", fontSize: 15, lineHeight: 1.65, margin: "-14px 0 28px" }}>
          Family history pages keep your tree in this browser, with no account and no server copy,
          and they don&rsquo;t load Google Analytics. A newspaper search goes from your browser to
          the Library of Congress. Export or erase your tree from{" "}
          <a href="/family/data" style={{ color: A }}>Your data</a>.
        </p>

        <p style={{ fontSize: 13, lineHeight: 1.7, color: "#64748b", margin: 0 }}>
          WhatAmIAI is an{" "}
          <a href="https://openmirrorllc.com" style={{ color: A, textDecoration: "none" }}>
            Open Mirror LLC
          </a>{" "}
          project.
        </p>

        {/* The footer's Contact and Disclaimer links land on these two
            sections (family standard, 2026-08-02). */}
        <section id="contact" style={{ marginTop: 28, scrollMarginTop: 96 }}>
          <h2 style={{ fontSize: 17, fontWeight: 900, margin: "0 0 8px" }}>Contact</h2>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: "#94a3b8", margin: 0 }}>
            Have a question or an idea? Email{" "}
            <a
              href="mailto:ask@openmirrorllc.com?subject=Open%20Mirror%20Inquiry"
              style={{ color: A }}
            >
              ask@openmirrorllc.com
            </a>
            .
          </p>
        </section>

        <section id="disclaimer" style={{ marginTop: 28, scrollMarginTop: 96 }}>
          <h2 style={{ fontSize: 17, fontWeight: 900, margin: "0 0 8px" }}>Disclaimer</h2>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: "#94a3b8", margin: 0 }}>
            These tools are for reflection and learning. They are not medical,
            mental-health, financial, or legal advice. The family history pages are a
            research and record-keeping tool: they don&rsquo;t hold or sell historical
            records, and they can&rsquo;t confirm that a record is about a particular person.
            That judgment is yours. Links to archives and other websites are for convenience;
            their content, access rules and prices are set by them. The example family is
            made up. Open Mirror LLC and its projects
            are independently owned and operated. They are not affiliated with, sponsored
            by, or endorsed by the owner&rsquo;s current or former employers or their
            affiliates. Read the{" "}
            <a href="https://openmirrorllc.com/disclaimer" style={{ color: A }}>
              full Open Mirror disclaimer
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
