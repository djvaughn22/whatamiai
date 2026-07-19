import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "One Habit",
  description: "Pick one habit for one week, sized to real life.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
