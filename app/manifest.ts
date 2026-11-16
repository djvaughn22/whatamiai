import type { MetadataRoute } from "next";

// Installable-app manifest, same app-readiness layer as the other Open Mirror sites.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WhatAmIAI",
    short_name: "WhatAmIAI",
    description: "Family history with the evidence showing: records, family memories and open questions, kept apart.",
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
