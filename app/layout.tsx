import type { Metadata } from "next";
import "./globals.css";
import OpenMirrorFooter from "./OpenMirrorFooter";
import OpenMirrorNav from "./OpenMirrorNav";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL("https://whatamiai.com"),
  title: {
    default: "WhatAmIAI",
    template: "%s | WhatAmIAI",
  },
  description:
    "Fast, honest tools for real life — how you react, one situation named, your money math, a 7-day habit starter, your AI mirror. Tap-first, on your device, no labels, no accounts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning lang="en">
      <body>
        <OpenMirrorNav site="WhatAmIAI.com" />
        {children}
        <OpenMirrorFooter siteName="WhatAmIAI.com" accent="#E879F9" />
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
