// WhatAmIAI has two experiences side by side (Nov 19 2026): the reflection
// tools that were already live, and family history (Discover and My Family).
// These guards keep the old URLs working, keep the two apart, and keep
// analytics off every family history page.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FAMILY_MENU, TOOLS_MENU } from "../siteNav";

const app = join(__dirname, "../..");

function routes(group: string): string[] {
  const out: string[] = [];
  const walk = (dir: string, url: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p, `${url}/${name}`);
      else if (name === "page.tsx") out.push(url || "/");
    }
  };
  walk(join(app, group), "");
  return out;
}

function sourceFiles(dir: string): string[] {
  const p = join(app, dir);
  if (statSync(p).isFile()) return [p];
  return readdirSync(p).flatMap((n) => sourceFiles(join(dir, n)));
}

const TOOLS = routes("(tools)");
const FAMILY = routes("(family)");

describe("two experiences, one site", () => {
  it("every reflection tool URL that was live still has its page", () => {
    for (const r of ["/", "/about", "/situation", "/react", "/patterns", "/mirror", "/money", "/habits", "/phone", "/saved"]) expect(TOOLS, r).toContain(r);
  });

  it("family history has its two products and My Family's pages", () => {
    for (const r of ["/discover", "/family", "/family/data", "/person/[id]", "/timeline", "/stories", "/stories/[id]", "/book", "/example"]) expect(FAMILY, r).toContain(r);
  });

  it("no URL belongs to both", () => {
    expect(TOOLS.filter((r) => FAMILY.includes(r))).toEqual([]);
  });

  it("there is no shared root layout (it would let the tools' analytics reach family pages)", () => {
    expect(existsSync(join(app, "layout.tsx"))).toBe(false);
    expect(readFileSync(join(app, "(tools)", "layout.tsx"), "utf8")).toContain("<html");
    expect(readFileSync(join(app, "(family)", "layout.tsx"), "utf8")).toContain("<html");
  });

  it("the reflection tools keep their analytics exactly where they were", () => {
    expect(readFileSync(join(app, "(tools)", "layout.tsx"), "utf8")).toContain("googletagmanager.com/gtag/js?id=G-09TFJRG35S");
  });

  it("no family history file loads or calls analytics", () => {
    const files = [...sourceFiles("(family)"), ...sourceFiles("components/family"), ...sourceFiles("components/FamilyProvider.tsx"), ...sourceFiles("lib/family"), join(app, "wai.css")];
    expect(files.length).toBeGreaterThan(30);
    for (const f of files) {
      if (f.includes("__tests__")) continue;
      const src = readFileSync(f, "utf8");
      for (const banned of ["googletagmanager", "google-analytics", "gtag(", "dataLayer", "next/script"]) expect(src.includes(banned), `${f}: ${banned}`).toBe(false);
    }
  });

  it("each menu reaches the other experience", () => {
    const hrefs = (m: typeof TOOLS_MENU) => m.flatMap((g) => g.links.map((l) => l.href));
    expect(hrefs(TOOLS_MENU)).toEqual(expect.arrayContaining(["/discover", "/family", "/situation", "/about"]));
    expect(hrefs(FAMILY_MENU)).toEqual(expect.arrayContaining(["/discover", "/family", "/", "/about"]));
    for (const h of [...hrefs(TOOLS_MENU), ...hrefs(FAMILY_MENU)]) expect([...TOOLS, ...FAMILY], h).toContain(h);
  });

  it("pages left out of this release stay out: no pricing, no retired-tools page", () => {
    for (const r of ["/pricing", "/earlier", "/records"]) expect([...TOOLS, ...FAMILY]).not.toContain(r);
    const files = [...sourceFiles("(family)"), ...sourceFiles("components/family"), join(app, "lib", "siteNav.ts")];
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      for (const href of ['"/pricing"', '"/earlier"', '"/records"']) expect(src.includes(href), `${f}: ${href}`).toBe(false);
    }
  });
});
