import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Money Check",
  description: "Three numbers, three taps — the real math on a money decision.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
