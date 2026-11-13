import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import sitemap, { PUBLIC_PATHS } from "./sitemap";
import robots from "./robots";

describe("sitemap and robots", () => {
  it("lists only pages that exist, on the real domain, and never /saved", () => {
    for (const p of PUBLIC_PATHS) expect(existsSync(`app${p === "/" ? "" : p}/page.tsx`), p).toBe(true);
    const urls = sitemap().map((e) => e.url);
    expect(urls.every((u) => u.startsWith("https://whatamiai.com"))).toBe(true);
    expect(urls.some((u) => u.includes("/saved"))).toBe(false);
  });
  it("keeps personal pages out of search and points at the sitemap", () => {
    const r = robots();
    expect(JSON.stringify(r.rules)).toContain("/saved");
    expect(r.sitemap).toBe("https://whatamiai.com/sitemap.xml");
  });
});
