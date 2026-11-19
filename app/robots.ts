import type { MetadataRoute } from "next";

// Personal pages stay out of search: /saved (on-device reflections) and every
// family history page built from a visitor's own data. /discover is a public
// tool page and is listed in the sitemap.
export const PRIVATE_PATHS = ["/saved", "/person/", "/family", "/timeline", "/stories", "/book", "/example"] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: [...PRIVATE_PATHS] }],
    sitemap: "https://whatamiai.com/sitemap.xml",
  };
}
