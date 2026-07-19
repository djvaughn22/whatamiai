import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "One Situation",
  description: "Think through one real situation, step by step. Runs on your device.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
