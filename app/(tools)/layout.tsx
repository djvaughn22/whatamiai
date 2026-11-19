import type { Metadata } from "next";
import "../globals.css";
import OpenMirrorFooter from "../OpenMirrorFooter";
import OpenMirrorNav from "../OpenMirrorNav";
import Script from "next/script";
import { TOOLS_MENU } from "../lib/siteNav";

// Reflection tools root layout (home, the seven tools, Saved, About). Family
// history pages have their own root layout without analytics: app/(family).
export const metadata: Metadata = {
  metadataBase: new URL("https://whatamiai.com"),
  title: {
    default: "WhatAmIAI",
    template: "%s | WhatAmIAI",
  },
  description:
    "Short tap-to-answer tools for thinking through a decision, your money, how you react, a habit, or your phone. Each ends with one small next step you can save or print.",
  // Link previews in texts and chats. The picture is app/opengraph-image.tsx.
  // No og:title/url here: set at the root they'd make every page's preview
  // claim to be the home page. Previews fall back to each page's own title.
  openGraph: { type: "website", siteName: "WhatAmIAI" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning lang="en">
      <body>
        <OpenMirrorNav
          site="WhatAmIAI.com"
          accent="#E879F9"
          groups={TOOLS_MENU}
        />
        {children}
        <OpenMirrorFooter />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-09TFJRG35S"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-09TFJRG35S');`}
        </Script>
      </body>
    </html>
  );
}
