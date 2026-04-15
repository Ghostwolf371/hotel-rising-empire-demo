"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LanguageToggle } from "@/components/language-toggle";
import { useDemo } from "@/contexts/demo-context";
import { t } from "@/lib/i18n";

export default function GuestStartPage() {
  const router = useRouter();
  const { guestSession, locale, theme, toggleTheme, guestPostSessionEndNavRef } = useDemo();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (guestSession) return;
    if (guestPostSessionEndNavRef.current.skipDurationRedirectOnce) {
      guestPostSessionEndNavRef.current.skipDurationRedirectOnce = false;
      return;
    }
    router.replace("/guest/duration");
  }, [guestSession, router, guestPostSessionEndNavRef]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!guestSession) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--background)]">
        <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--gold)]/30" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[var(--background)]">
      <div
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 50% -15%, color-mix(in srgb, var(--gold) 28%, transparent), transparent 52%),
            radial-gradient(ellipse 70% 55% at 100% 100%, color-mix(in srgb, var(--gold) 14%, transparent), transparent 45%),
            radial-gradient(ellipse 60% 45% at 0% 80%, color-mix(in srgb, var(--gold-dim) 12%, transparent), transparent 40%),
            linear-gradient(168deg, var(--background) 0%, color-mix(in srgb, var(--gold) 6%, var(--background)) 38%, var(--dark) 100%)
          `,
        }}
      />

      <header className="relative z-20 flex items-center justify-between gap-3 px-4 py-4 sm:px-8 sm:py-5">
        <Link href="/" className="flex items-center gap-3 transition opacity-90 hover:opacity-100">
          <Image src="/logo.png" alt={t(locale, "brand")} width={40} height={40} className="rounded-lg shadow-lg" />
          <span className="text-sm font-black uppercase tracking-[0.2em] text-[var(--gold)]">{t(locale, "brand")}</span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageToggle variant="landing" />
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-full border border-[var(--border-light)] bg-[var(--surface)] text-[var(--foreground)] backdrop-blur-sm transition hover:border-[var(--gold)]/40 hover:text-[var(--gold)]"
            title={theme === "dark" ? t(locale, "lightMode") : t(locale, "darkMode")}
          >
            {theme === "dark" ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-16 pt-8 sm:px-6">
        <div
          className="w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--card)]/90 p-8 text-center shadow-2xl backdrop-blur-sm transition-all duration-700 sm:p-12"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)" }}
        >
          <h1 className="text-2xl font-black leading-tight text-[var(--foreground)] sm:text-3xl">{t(locale, "orderSomethingTitle")}</h1>
          <p className="mt-4 text-base leading-relaxed text-[var(--muted)]">{t(locale, "orderSomethingSub")}</p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => router.push("/guest")}
              className="min-h-[52px] flex-1 rounded-2xl bg-[var(--gold)] px-6 py-4 text-lg font-bold text-[var(--dark)] shadow-lg transition hover:bg-[var(--gold-light)] active:scale-[0.98] sm:flex-none sm:min-w-[200px]"
            >
              {t(locale, "orderSomethingYes")}
            </button>
            <button
              type="button"
              onClick={() => router.push("/guest/stay")}
              className="min-h-[52px] flex-1 rounded-2xl border-2 border-[var(--border-light)] bg-[var(--surface)] px-6 py-4 text-lg font-bold text-[var(--foreground)] transition hover:border-[var(--gold)]/40 hover:bg-[var(--card-hover)] active:scale-[0.98] sm:flex-none sm:min-w-[200px]"
            >
              {t(locale, "orderSomethingNo")}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
