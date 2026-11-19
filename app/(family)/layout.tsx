import type { Metadata, Viewport } from "next";
import "@fontsource-variable/source-serif-4";
import "../globals.css";
import "../wai.css";
import OpenMirrorFooter from "../OpenMirrorFooter";
import OpenMirrorNav from "../OpenMirrorNav";
import { FamilyProvider } from "../components/FamilyProvider";
import SectionNav from "../components/family/SectionNav";
import { FAMILY_MENU } from "../lib/siteNav";

// Family history root layout (Discover, My Family and its pages). No analytics
// script here, ever: names, places and dates people type must never reach a
// third party, and outbound record links carry names in their search terms.
// The reflection tools keep Google Analytics in their own root layout
// (app/(tools)/layout.tsx); because the two root layouts differ, moving between
// them is a full page load, so the tools' analytics never runs on these pages.
// See docs/PRIVACY-SECURITY.md before adding any script.

export const metadata: Metadata = {
  metadataBase: new URL("https://whatamiai.com"),
  title: {
    default: "WhatAmIAI family history",
    template: "%s | WhatAmIAI",
  },
  description:
    "Find where an ancestor's records are kept, search old newspapers, and build your family tree with the evidence showing: what's proven by records, what's a family memory, and what's still a question.",
  openGraph: { type: "website", siteName: "WhatAmIAI" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning lang="en">
      <body>
        <OpenMirrorNav
          site="WhatAmIAI.com"
          accent="#E879F9"
          groups={FAMILY_MENU}
        />
        <SectionNav />
        <FamilyProvider>{children}</FamilyProvider>
        <OpenMirrorFooter />
      </body>
    </html>
  );
}
