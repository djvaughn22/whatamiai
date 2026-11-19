import type { Metadata } from "next";
import "./globals.css";
import OpenMirrorFooter from "./OpenMirrorFooter";
import OpenMirrorNav from "./OpenMirrorNav";
import { TOOLS_MENU } from "./lib/siteNav";

// The site has two root layouts (app/(tools), app/(family)), so a URL that
// matches nothing gets this whole page (next.config: experimental.globalNotFound).
// Same family bar, footer and words as the 404 inside the old single layout.
// No analytics script here. Keep the copy plain.
export const metadata: Metadata = {
  metadataBase: new URL("https://whatamiai.com"),
  title: "Page not found | WhatAmIAI",
};

export default function GlobalNotFound() {
  return (
    <html suppressHydrationWarning lang="en">
      <body>
        <OpenMirrorNav site="WhatAmIAI.com" accent="#E879F9" groups={TOOLS_MENU} />
        <main style={{ minHeight: "55vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: "80px 20px", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "#94a3b8" }}>404</p>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#e8edf5" }}>Page not found</h1>
          <p style={{ margin: 0, fontSize: 15, color: "#94a3b8" }}>That page doesn&rsquo;t exist here.</p>
          <a
            href="/"
            style={{ marginTop: 8, display: "inline-flex", alignItems: "center", borderRadius: 50, border: "1px solid #26324c", background: "#141d2e", color: "#e8edf5", padding: "12px 22px", fontSize: 14, fontWeight: 900, textDecoration: "none", minHeight: 44 }}
          >
            Back to the home page
          </a>
        </main>
        <OpenMirrorFooter />
      </body>
    </html>
  );
}
