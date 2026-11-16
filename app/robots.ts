import type { MetadataRoute } from "next";

// Family pages are built in each visitor's browser from their own data and
// are never indexed.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/person/", "/family", "/timeline", "/stories", "/book", "/example", "/earlier"] }],
    sitemap: "https://whatamiai.com/sitemap.xml",
  };
}
