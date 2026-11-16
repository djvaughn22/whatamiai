"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const SECTIONS = [
  { name: "Discover", href: "/" },
  { name: "My Family", href: "/family" },
  { name: "Timeline", href: "/timeline" },
  { name: "Records", href: "/records" },
  { name: "Stories", href: "/stories" },
  { name: "Pricing", href: "/pricing" },
];

function current(pathname: string): string {
  if (pathname === "/") return "/";
  if (pathname.startsWith("/person")) return "/family";
  if (pathname.startsWith("/book")) return "/stories";
  const hit = SECTIONS.filter((s) => s.href !== "/" && (pathname === s.href || pathname.startsWith(`${s.href}/`)));
  return hit[0]?.href ?? "";
}

export default function SectionNav() {
  const pathname = usePathname() ?? "/";
  const active = current(pathname);
  return (
    <nav className="w-sections w-no-print" aria-label="WhatAmIAI sections">
      <div className="w-sections-in">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} aria-current={active === s.href ? "page" : undefined}>
            {s.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
