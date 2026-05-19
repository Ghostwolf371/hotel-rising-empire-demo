import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  reloadOnOnline: true,
  // Do NOT precache `/`: the layout reads `process.env.HRE_USE_DATABASE`
  // at request time, so each cold launch must hit the network.
  cacheStartUrl: false,
  dynamicStartUrl: false,
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    disableDevLogs: true,
    // Replace the default ruleset entirely. The defaults use CacheFirst on
    // `_next/static/*.js` which strands installed PWAs on stale builds.
    runtimeCaching: [
      // Hashed Next static assets: URLs change every build, so stale-while-
      // revalidate is safe and gives instant repeat loads.
      {
        urlPattern: /\/_next\/static\/.+/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "next-static",
          expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
      // Optimised images: long-lived; the underlying source URL change busts the cache.
      {
        urlPattern: /\/_next\/image\?url=.+/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "next-image",
          expiration: { maxEntries: 96, maxAgeSeconds: 60 * 60 * 24 * 7 },
        },
      },
      // App icons / manifest assets.
      {
        urlPattern: /\/(icons|manifest\.webmanifest|logo\.png|favicon\.ico)/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "app-assets",
          expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
      // Google Fonts (next/font caches at build, but the CSS file is fetched live).
      {
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "google-fonts",
          expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 365 },
        },
      },
      // Unsplash images used by guest landing carousels.
      {
        urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "unsplash",
          expiration: { maxEntries: 48, maxAgeSeconds: 60 * 60 * 24 * 14 },
        },
      },
      // Server Actions (POSTs that Next routes to the page URL). NEVER cache —
      // and queue them for replay via Background Sync when the network is down.
      {
        urlPattern: ({ request }) =>
          request.method === "POST" &&
          request.headers.get("next-action") !== null,
        handler: "NetworkOnly",
        method: "POST",
        options: {
          backgroundSync: {
            name: "hre-actions-queue",
            options: { maxRetentionTime: 24 * 60 },
          },
        },
      },
      // REST API: never cache (auth-gated, mutating, time-sensitive).
      {
        urlPattern: /\/api\/.*/i,
        handler: "NetworkOnly",
      },
      // RSC payloads: same staleness risk as HTML — network with a short fallback.
      {
        urlPattern: ({ url }) => url.searchParams.has("_rsc"),
        handler: "NetworkFirst",
        options: {
          cacheName: "rsc-payloads",
          networkTimeoutSeconds: 3,
          expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 },
        },
      },
      // HTML documents (navigations). NetworkFirst with a 3 s timeout so a slow
      // hotel AP still serves something, then falls back to /offline if dead.
      {
        urlPattern: ({ request, sameOrigin }) =>
          sameOrigin && request.destination === "document",
        handler: "NetworkFirst",
        options: {
          cacheName: "pages",
          networkTimeoutSeconds: 3,
          expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default withPWA(nextConfig);
