import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WhatAmIAI",
  description: "A Gospel-first reflection tool for noticing what is growing, what is hurting, what is hidden, and where you may feel called to serve.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
