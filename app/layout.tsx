import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WhatAmIAI",
  description: "Seven quick questions to help you reflect, notice patterns, and turn your answers into a thoughtful prompt for any AI. No labels, no accounts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
