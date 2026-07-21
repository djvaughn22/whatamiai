import type { Metadata } from "next";
import AboutDestinationCard from "../components/AboutDestinationCard";
import { BE_PREPARED_CARD } from "../lib/destinations";

export const metadata: Metadata = {
  title: "About WhatAmIAI",
  description:
    "Fast, honest tools for real life — see your patterns, think through one situation, size one habit. On your device, no labels, no accounts.",
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
          WhatAmIAI is a set of fast, honest tools for looking at yourself — the questions you
          ask, how you react, what you avoid, what a decision really costs. No labels; you&rsquo;re
          not a category.
        </p>

        <h2 style={{ fontSize: 17, fontWeight: 900, margin: "0 0 8px" }}>What you can do here</h2>
        <ul style={{ fontSize: 15, lineHeight: 1.8, color: "#94a3b8", margin: "0 0 28px", paddingLeft: 18 }}>
          <li>My AI Mirror — paste your own prompts and see the repeated topics and goals in them.</li>
          <li>One Situation — think through one real situation, step by step.</li>
          <li>My Patterns and How I React — an honest look at how you actually operate.</li>
          <li>Money Check — three numbers, three taps, the real math.</li>
          <li>One Habit — pick one habit for one week, sized to real life.</li>
        </ul>

        <h2 style={{ fontSize: 17, fontWeight: 900, margin: "0 0 8px" }}>Your data</h2>
        <p style={{ background: "#141d2e", border: "1px solid #26324c", borderRadius: 14, padding: "14px 16px", fontSize: 15, lineHeight: 1.65, margin: "0 0 28px" }}>
          Free, no account. Everything runs and saves on this device — nothing you type is sent
          anywhere.
        </p>

        {/* The one quiet destination card — after the site's own story. */}
        <div style={{ margin: "0 0 28px" }}>
          <AboutDestinationCard card={BE_PREPARED_CARD} />
        </div>

        <p style={{ fontSize: 13, lineHeight: 1.7, color: "#64748b", margin: 0 }}>
          WhatAmIAI is an{" "}
          <a href="https://openmirrorllc.com" style={{ color: A, textDecoration: "none" }}>
            Open Mirror LLC
          </a>{" "}
          project.
        </p>
      </div>
    </main>
  );
}
