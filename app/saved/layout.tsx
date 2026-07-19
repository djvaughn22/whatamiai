import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved Reflections",
  description: "Your saved reflections — stored on this device only.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
