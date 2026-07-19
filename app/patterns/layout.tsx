import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Patterns",
  description: "Look at how you actually operate — your bigger patterns, no labels.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
