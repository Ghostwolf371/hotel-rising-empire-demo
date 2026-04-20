import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Empire Apartments — Tablet demo",
  description: "Short-stay pension guest tablet demo (Next.js).",
  icons: {
    icon: [{ url: "/logo.png", type: "image/png" }],
    apple: [{ url: "/logo.png", type: "image/png" }],
  },
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
      </body>
    </html>
  );
}
