import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My AI Mirror",
  description: "Paste your own prompts and see the repeated topics, goals, and habits in how you use AI. Runs on your device.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
