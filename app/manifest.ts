import type { MetadataRoute } from "next";

// Installable-app manifest — same app-readiness layer as thedjcares.com,
// stepinthering.com, and idontcry.com.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WhatAmIAI",
    short_name: "WhatAmIAI",
    description:
      "Short tap-to-answer tools for a decision, your money, how you react, a habit, or your phone. Each ends with one small next step.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b1220",
    theme_color: "#0b1220",
    icons: [
      { src: "/icons/wai-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/wai-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/wai-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/wai-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
