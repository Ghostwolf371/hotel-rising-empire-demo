import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

/**
 * Read `process.env.HRE_USE_DATABASE` at request time, not at build time.
 * Without this, the value is baked into the prerendered RSC payload and
 * installed PWAs stay locked to whatever the toggle was at `next build`.
 */
export const dynamic = "force-dynamic";

/** Must match `STORAGE_KEY` in `contexts/demo-context.tsx` — read before React hydrates. */
const THEME_BOOT_SCRIPT = `(function(){try{var k='hre-demo-v2';var r=localStorage.getItem(k);if(!r)return;var j=JSON.parse(r);var th=j&&j.theme;if(th==='light'||th==='dark')document.documentElement.setAttribute('data-theme',th);}catch(e){}})();`;

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
});

const APP_NAME = "Empire Apartments";
const APP_DESCRIPTION = "Short-stay pension guest tablet demo.";

/**
 * iOS PWA launch splash screens. Without these, every cold launch flashes white
 * for several seconds before React mounts. One pair per device (portrait + landscape).
 * Sizes come from Apple's published device CSS dimensions × DPR.
 */
type SplashImage = {
  device: { w: number; h: number; dpr: number };
  orientation: "portrait" | "landscape";
  src: string;
};

const APPLE_SPLASH: SplashImage[] = [
  // iPad Pro 12.9" — 1024×1366 @2x
  { device: { w: 1024, h: 1366, dpr: 2 }, orientation: "portrait",  src: "/splash/apple-launch-2048x2732.png" },
  { device: { w: 1024, h: 1366, dpr: 2 }, orientation: "landscape", src: "/splash/apple-launch-2732x2048.png" },
  // iPad Pro 11" — 834×1194 @2x
  { device: { w: 834,  h: 1194, dpr: 2 }, orientation: "portrait",  src: "/splash/apple-launch-1668x2388.png" },
  { device: { w: 834,  h: 1194, dpr: 2 }, orientation: "landscape", src: "/splash/apple-launch-2388x1668.png" },
  // iPad 10.2" — 810×1080 @2x
  { device: { w: 810,  h: 1080, dpr: 2 }, orientation: "portrait",  src: "/splash/apple-launch-1620x2160.png" },
  { device: { w: 810,  h: 1080, dpr: 2 }, orientation: "landscape", src: "/splash/apple-launch-2160x1620.png" },
  // iPad 9.7" / iPad mini — 768×1024 @2x
  { device: { w: 768,  h: 1024, dpr: 2 }, orientation: "portrait",  src: "/splash/apple-launch-1536x2048.png" },
  { device: { w: 768,  h: 1024, dpr: 2 }, orientation: "landscape", src: "/splash/apple-launch-2048x1536.png" },
  // iPhone 14 Plus / 13 Pro Max — 428×926 @3x
  { device: { w: 428,  h: 926,  dpr: 3 }, orientation: "portrait",  src: "/splash/apple-launch-1284x2778.png" },
  { device: { w: 428,  h: 926,  dpr: 3 }, orientation: "landscape", src: "/splash/apple-launch-2778x1284.png" },
  // iPhone 14 / 13 — 390×844 @3x
  { device: { w: 390,  h: 844,  dpr: 3 }, orientation: "portrait",  src: "/splash/apple-launch-1170x2532.png" },
  { device: { w: 390,  h: 844,  dpr: 3 }, orientation: "landscape", src: "/splash/apple-launch-2532x1170.png" },
  // iPhone SE — 375×667 @2x (smallest supported, portrait only)
  { device: { w: 375,  h: 667,  dpr: 2 }, orientation: "portrait",  src: "/splash/apple-launch-750x1334.png" },
];

const appleSplashMedia = ({ device: { w, h, dpr }, orientation }: SplashImage) =>
  `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: ${orientation})`;

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: "Empire Apartments — Tablet demo",
  description: APP_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#f8f5f0" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const useDatabase = process.env.HRE_USE_DATABASE === "true";

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme="dark"
      className={`${inter.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        {/* iOS PWA launch images — React hoists <link> elements into <head>. */}
        {APPLE_SPLASH.map((s) => (
          <link
            key={`${s.device.w}x${s.device.h}-${s.orientation}`}
            rel="apple-touch-startup-image"
            media={appleSplashMedia(s)}
            href={s.src}
          />
        ))}
        {/* Runs as soon as the parser reaches it, before React hydrates. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <Providers useDatabase={useDatabase}>{children}</Providers>
        <div id="guest-portal-root" className="contents" />
      </body>
    </html>
  );
}
