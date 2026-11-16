import type { NextConfig } from "next";
// The seven reflection tools were retired in the family-history rebuild.
// Old links land on a page that explains and lets people download or erase
// what they kept. Temporary redirects, so the decision can be reversed.
const RETIRED = ["/mirror", "/situation", "/patterns", "/react", "/money", "/habits", "/phone", "/saved"];

const nextConfig: NextConfig = {
  async redirects() {
    return RETIRED.map((source) => ({ source, destination: "/earlier", permanent: false }));
  },
  // Nov 15 2026 (Nov 14 audit): three low-risk security headers on every page.
  // No Content-Security-Policy yet; that needs a report-only trial first.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};
export default nextConfig;
