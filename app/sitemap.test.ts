import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import sitemap, { PUBLIC_PATHS } from "./sitemap";
import robots from "./robots";

describe("sitemap and robots", () => {
  it("lists only public pages that exist, on the real domain", () => {
    for (const p of PUBLIC_PATHS) expect(existsSync(`app${p === "/" ? "" : p}/page.tsx`), p).toBe(true);
    const urls = sitemap().map((e) => e.url);
    expect(urls.every((u) => u.startsWith("https://whatamiai.com"))).toBe(true);
    expect(urls.some((u) => /person|family|timeline|stories|book/.test(u))).toBe(false);
  });
  it("keeps family pages out of search and points at the sitemap", () => {
    const r = JSON.stringify(robots().rules);
    for (const p of ["/person/", "/family", "/timeline", "/stories", "/book"]) expect(r).toContain(p);
    expect(robots().sitemap).toBe("https://whatamiai.com/sitemap.xml");
  });
});
