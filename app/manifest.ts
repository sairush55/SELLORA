import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SELLORA — Retail Intelligence",
    short_name: "SELLORA",
    description:
      "Turn every sale into a smarter stock decision. Modern POS and Retail Intelligence for Small Businesses.",
    start_url: "/sales/pos",
    id: "/sellora-pos",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#090d16",
    theme_color: "#4f46e5",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    categories: ["business", "finance", "productivity", "utilities"],
  };
}
