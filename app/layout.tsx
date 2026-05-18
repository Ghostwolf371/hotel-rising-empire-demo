import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import Script from "next/script";
import { Providers } from "./providers";
import "./globals.css";

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
  viewportFit: "cover",
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
        {/* Runs as soon as the parser reaches it (before React). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <Script id="hre-theme-boot" strategy="beforeInteractive">
          {THEME_BOOT_SCRIPT}
        </Script>
        <Providers useDatabase={useDatabase}>{children}</Providers>
        <div id="guest-portal-root" className="contents" />
      </body>
    </html>
  );
}
