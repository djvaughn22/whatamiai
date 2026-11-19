import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  // Two root layouts (reflection tools, family history): unmatched URLs get
  // app/global-not-found.tsx, a full page with the site's bar and footer.
  experimental: { globalNotFound: true },
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
