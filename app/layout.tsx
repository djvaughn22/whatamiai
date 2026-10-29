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
    "Short tap-to-answer tools for thinking through a decision, your money, how you react, a habit, or your phone. Each ends with one small next step you can save or print.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning lang="en">
      <body>
        <OpenMirrorNav
          site="WhatAmIAI.com"
          accent="#E879F9"
          links={[
            { emoji: "🧭", name: "My Situation", href: "/situation" },
            { emoji: "⚡", name: "How Do I React?", href: "/react" },
            { emoji: "🔁", name: "My Overall Patterns", href: "/patterns" },
            { emoji: "🪞", name: "My AI Mirror", href: "/mirror" },
            { emoji: "💵", name: "Money Check", href: "/money" },
            { emoji: "🏃", name: "7-Day Habit Starter", href: "/habits" },
            { emoji: "📵", name: "Intentional Phone Use", href: "/phone" },
            { emoji: "💾", name: "Saved Reflections", href: "/saved" },
            { emoji: "ℹ️", name: "About WhatAmIAI", href: "/about" },
          ]}
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
