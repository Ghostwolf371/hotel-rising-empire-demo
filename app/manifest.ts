import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Empire Apartments",
    short_name: "Empire",
    description: "Short-stay pension guest tablet demo.",
    start_url: "/",
    scope: "/",
    lang: "en",
    dir: "ltr",
    // Hide *all* system chrome on Android (status bar + nav bar) so the tablet
    // runs edge-to-edge as a kiosk. `display_override` lets browsers that
    // don't honour "fullscreen" fall back to the next-best display mode.
    display: "fullscreen",
    display_override: ["fullscreen", "standalone", "minimal-ui"],
    orientation: "any",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    categories: ["business", "lifestyle"],
    shortcuts: [
      {
        name: "Staff dashboard",
        short_name: "Staff",
        description: "Open the staff management view",
        url: "/management",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Guest tablet",
        short_name: "Guest",
        description: "Open the guest welcome screen",
        url: "/guest",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-monochrome.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "monochrome",
      },
    ],
  };
}
