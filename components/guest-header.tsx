"use client";

import Image from "next/image";
import Link from "next/link";
import { useDemo } from "@/contexts/demo-context";
import { t } from "@/lib/i18n";

export function GuestHeader({
  showCart = true,
}: {
  showCart?: boolean;
}) {
  const { locale, setLocale, theme, toggleTheme, cart } = useDemo();
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  return (
    <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-6 py-4">
      <div className="flex items-center gap-3">
        <Image src="/logo.png" alt="Empire Apartments" width={44} height={44} className="rounded-lg" />
        <span className="text-xl font-black uppercase tracking-wider text-[var(--gold)]">
          {t(locale, "brand")}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex rounded-full bg-[var(--surface)] p-1">
          <button
            type="button"
            onClick={() => setLocale("en")}
            className={`rounded-full px-5 py-2 text-base font-medium transition ${
              locale === "en"
                ? "bg-[var(--gold)] text-[var(--dark)] shadow-sm"
                : "text-[var(--muted)]"
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLocale("nl")}
            className={`rounded-full px-5 py-2 text-base font-medium transition ${
              locale === "nl"
                ? "bg-[var(--gold)] text-[var(--dark)] shadow-sm"
                : "text-[var(--muted)]"
            }`}
          >
            NL
          </button>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-light)] text-[var(--muted)] transition hover:bg-[var(--card-hover)] hover:text-[var(--gold)]"
          title={theme === "dark" ? t(locale, "lightMode") : t(locale, "darkMode")}
        >
          {theme === "dark" ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
        {showCart && (
          <Link
            href="/guest/cart"
            className="relative flex items-center gap-2 rounded-xl border border-[var(--border-light)] px-5 py-3 text-base font-semibold text-[var(--gold)] transition hover:bg-[var(--card-hover)] hover:shadow-md"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {t(locale, "cart")}
            {cartCount > 0 && (
              <span className="animate-pop-in absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--gold)] bg-[var(--dark)] text-xs font-black text-[var(--gold)] shadow-md">
                {cartCount}
              </span>
            )}
          </Link>
        )}
      </div>
    </header>
  );
}
