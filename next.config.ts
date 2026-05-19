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
      // Bundled product/promo art under /products/*. Hashed at request time
      // via the Next image optimizer, so SWR is safe.
      {
        urlPattern: /\/products\/.+/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "demo-images",
          expiration: { maxEntries: 48, maxAgeSeconds: 60 * 60 * 24 * 30 },
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
  // No `images.remotePatterns` — every demo image is now bundled in
  // `public/products/` so the kiosk tablet doesn't need to reach an
  // external image CDN that hotel Wi-Fi sometimes filters.
  // Silences Next 16's "Turbopack with a webpack config" warning during dev.
  // `withPWA` only injects its webpack plugin in production builds, so this
  // empty Turbopack config is fine for the dev / `--turbopack` path.
  turbopack: {},
  // Allow the dev server to accept HMR/RSC requests originating from the
  // loopback host explicitly. Some embedded webviews (Cursor's IDE browser,
  // some Android Chrome WebViews) resolve `localhost` to `127.0.0.1` and
  // then trip Next 16's cross-origin guard. Production builds ignore this.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

// In development Next 16 uses Turbopack by default. `withPWA` is a no-op when
// `disable: true`, but its wrapper still attaches a webpack key that triggers
// the Turbopack-vs-webpack conflict warning. Skip the wrapper entirely in dev.
const isDev = process.env.NODE_ENV === "development";
export default isDev ? nextConfig : withPWA(nextConfig);
