import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Intentional Phone Use",
  description: "Pick one type of phone use to reduce, then seven small days of noticing what you choose.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
