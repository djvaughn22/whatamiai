import type { Metadata } from "next";
import "./globals.css";
import OpenMirrorFooter from "./OpenMirrorFooter";
import OpenMirrorNav from "./OpenMirrorNav";

export const metadata: Metadata = {
  title: "WhatAmIAI",
  description:
    "Take an honest look at where you are. Analyze your own AI prompts, think through one situation, or explore your patterns — guided reflection that stays on your device. No labels, no accounts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <OpenMirrorNav site="WhatAmIAI.com" />
        {children}
        <OpenMirrorFooter siteName="WhatAmIAI.com" accent="#E879F9" />
      </body>
    </html>
  );
}
