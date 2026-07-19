import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How I React",
  description: "Scenario deck: see how you actually react, one honest choice at a time.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
