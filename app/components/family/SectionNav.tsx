"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const SECTIONS = [
  { name: "Discover", href: "/discover" },
  { name: "My Family", href: "/family" },
  { name: "Timeline", href: "/timeline" },
  { name: "Stories", href: "/stories" },
];

function current(pathname: string): string {
  if (pathname.startsWith("/person")) return "/family";
  if (pathname.startsWith("/book")) return "/stories";
  const hit = SECTIONS.filter((s) => pathname === s.href || pathname.startsWith(`${s.href}/`));
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
