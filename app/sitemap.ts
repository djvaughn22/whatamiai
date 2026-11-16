import type { MetadataRoute } from "next";

// Public pages only. Everything about a family lives in the visitor's browser.
const BASE = "https://whatamiai.com";
export const PUBLIC_PATHS = ["/", "/records", "/pricing", "/about"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((p) => ({ url: `${BASE}${p === "/" ? "" : p}`, changeFrequency: "monthly", priority: p === "/" ? 1 : 0.7 }));
}
