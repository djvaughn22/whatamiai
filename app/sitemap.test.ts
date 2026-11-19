import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import sitemap, { PUBLIC_PATHS } from "./sitemap";
import robots, { PRIVATE_PATHS } from "./robots";

// Pages live in two route groups: app/(tools) and app/(family).
const pageExists = (p: string) => ["(tools)", "(family)"].some((g) => existsSync(`app/${g}${p === "/" ? "" : p}/page.tsx`));

describe("sitemap and robots", () => {
  it("lists only pages that exist, on the real domain, and never personal pages", () => {
    for (const p of PUBLIC_PATHS) expect(pageExists(p), p).toBe(true);
    const urls = sitemap().map((e) => e.url);
    expect(urls.every((u) => u.startsWith("https://whatamiai.com"))).toBe(true);
    expect(urls.some((u) => /\/saved|\/person|\/family|\/timeline|\/stories|\/book|\/example/.test(u))).toBe(false);
    expect(urls).toContain("https://whatamiai.com/discover");
  });
  it("keeps personal pages out of search and points at the sitemap", () => {
    const r = JSON.stringify(robots().rules);
    for (const p of ["/saved", "/person/", "/family", "/timeline", "/stories", "/book", "/example"]) expect(r).toContain(p);
    for (const p of PRIVATE_PATHS) expect(PUBLIC_PATHS as readonly string[]).not.toContain(p);
    expect(robots().sitemap).toBe("https://whatamiai.com/sitemap.xml");
  });
});
