import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Situation",
  description: "Think through one real situation, step by step. Runs on your device.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
