import type { Metadata, Viewport } from "next";
import "@fontsource-variable/source-serif-4";
import "./globals.css";
import "./wai.css";
import OpenMirrorFooter from "./OpenMirrorFooter";
import OpenMirrorNav from "./OpenMirrorNav";
import { FamilyProvider } from "./components/FamilyProvider";
import SectionNav from "./components/family/SectionNav";

// No analytics script in the family-history version: names, places and dates
// people type must never reach a third party, and outbound record links carry
// names in their search terms. See docs/PRIVACY-SECURITY.md before adding any.

export const metadata: Metadata = {
  metadataBase: new URL("https://whatamiai.com"),
  title: {
    default: "WhatAmIAI: discover how you came to be",
    template: "%s | WhatAmIAI",
  },
  description:
    "Build your family tree with the evidence showing: what's proven by records, what's a family memory, and what's still a question. Free newspaper search, a research plan for every person, and stories with sources.",
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
          groups={[
            {
              label: "Your family",
              links: [
                { emoji: "🧭", name: "Discover", href: "/", note: "Start with a name, place or year" },
                { emoji: "🌳", name: "My Family", href: "/family", note: "Your tree and everyone in it" },
                { emoji: "🗓️", name: "Timeline", href: "/timeline", note: "Lives in order, with history beside them" },
                { emoji: "📜", name: "Records", href: "/records", note: "Newspapers and where to look" },
                { emoji: "📖", name: "Stories", href: "/stories", note: "Stories and a printable book, with sources" },
              ],
            },
            {
              label: "WhatAmIAI",
              links: [
                { emoji: "💾", name: "Your data", href: "/family/data", note: "Import, export, back up, erase" },
                { emoji: "🏷️", name: "Pricing", href: "/pricing" },
                { emoji: "ℹ️", name: "About WhatAmIAI", href: "/about" },
              ],
            },
          ]}
        />
        <SectionNav />
        <FamilyProvider>{children}</FamilyProvider>
        <OpenMirrorFooter />
      </body>
    </html>
  );
}
