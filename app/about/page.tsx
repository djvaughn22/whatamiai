import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About WhatAmIAI",
  description: "WhatAmIAI helps people explore their family history through real records, documented relationships, historical context, and stories worth preserving.",
};

// Body copy is the owner's "WhatAmIAI About — New Direction" text (2026-11-15).
// Contact and Disclaimer sections are required by the family footer standard.

export default function AboutPage() {
  return (
    <main className="w-read">
      <h1 className="w-h1">
        Discover how you <span className="w-accent">came to be.</span>
      </h1>
      <div className="w-story" style={{ marginTop: 22 }}>
        <p>WhatAmIAI helps people explore their family history through real records, documented relationships, historical context, and stories worth preserving.</p>
        <p>We believe every family has a history worth discovering — and that understanding it should be accessible to everyone.</p>
        <p>Our technology helps people investigate the past, but it does not invent the past.</p>
        <p>Facts are supported by evidence. Family memories are preserved as memories. Unanswered questions remain open until the evidence tells us more.</p>
        <p>Our mission is to make family discovery more accessible, understandable, and meaningful for generations to come.</p>
      </div>
      <p className="w-small w-muted" style={{ marginTop: 8 }}>
        An independent product of{" "}
        <a className="w-link" href="https://openmirrorllc.com">
          Open Mirror LLC
        </a>
        .
      </p>

      <section style={{ marginTop: 32 }}>
        <h2 className="w-h3" style={{ fontSize: "1.1rem" }}>
          Your family&apos;s information
        </h2>
        <p className="w-small w-muted">
          Your tree is kept in this browser on this device. There&apos;s no account and no server copy. Newspaper searches go straight from your browser to the Library of Congress. Export everything at any time from{" "}
          <Link className="w-link" href="/family/data">
            Your data
          </Link>
          , where you can also erase it. WhatAmIAI doesn&apos;t collect DNA, doesn&apos;t sell data, and doesn&apos;t use advertising trackers.
        </p>
      </section>

      <section id="contact" style={{ marginTop: 28, scrollMarginTop: 96 }}>
        <h2 className="w-h3" style={{ fontSize: "1.1rem" }}>
          Contact
        </h2>
        <p className="w-small w-muted">
          Have a question or an idea? Email{" "}
          <a href="mailto:ask@openmirrorllc.com?subject=WhatAmIAI" className="w-link">
            ask@openmirrorllc.com
          </a>
          .
        </p>
      </section>

      <section id="disclaimer" style={{ marginTop: 28, scrollMarginTop: 96 }}>
        <h2 className="w-h3" style={{ fontSize: "1.1rem" }}>
          Disclaimer
        </h2>
        <p className="w-small w-muted">
          WhatAmIAI is a research and record-keeping tool. It does not hold or sell historical records, and it can&apos;t confirm that any record is about a particular person: that judgment is yours. Links to archives and other websites are provided for convenience; their content, access rules and prices are set by them. Example families on this site are made up. Open Mirror LLC and its projects are independently owned and operated. They are not affiliated with, sponsored by, or endorsed by the owner&rsquo;s current or former employers or their affiliates. Read the{" "}
          <a href="https://openmirrorllc.com/disclaimer" className="w-link">
            full Open Mirror disclaimer
          </a>
          .
        </p>
      </section>
    </main>
  );
}
