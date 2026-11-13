import type { MetadataRoute } from "next";

// Overnight 2026-11-12: the site had no sitemap. Every public page, nothing else.
// /saved is personal (on-device reflections) and stays out.
const BASE = "https://whatamiai.com";
export const PUBLIC_PATHS = ["/", "/about", "/situation", "/money", "/habits", "/phone", "/react", "/mirror", "/patterns"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((p) => ({ url: `${BASE}${p === "/" ? "" : p}`, changeFrequency: "monthly", priority: p === "/" ? 1 : 0.7 }));
}
