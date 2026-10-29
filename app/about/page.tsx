import { ANALYTICS_NOTE, STORAGE_NOTE } from "../lib/privacyCopy";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About WhatAmIAI",
  description:
    "Short tap-to-answer tools for thinking through a decision, your money, how you react, a habit, or your phone. Your answers stay on your device.",
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

        <h2 style={{ fontSize: 17, fontWeight: 900, margin: "0 0 8px" }}>Your data</h2>
        <p style={{ background: "#141d2e", border: "1px solid #26324c", borderRadius: 14, padding: "14px 16px", fontSize: 15, lineHeight: 1.65, margin: "0 0 28px" }}>
          No account needed. The tools are rule-based and run in your browser. {STORAGE_NOTE}{" "}
          {ANALYTICS_NOTE} If you choose to continue a reflection with another AI, you copy it
          yourself, and you can review what will be included first.
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
            Open Mirror LLC is independently owned and operated. Nothing
            published by Open Mirror LLC is sponsored by, affiliated with,
            endorsed by, or representative of the owner&rsquo;s full-time
            employer. Read the{" "}
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
