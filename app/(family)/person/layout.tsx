import type { Metadata } from "next";

export const metadata: Metadata = { title: "Person", robots: { index: false, follow: false } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
