"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageToggle } from "@/components/language-toggle";
import { useDemo } from "@/contexts/demo-context";
import { t } from "@/lib/i18n";

export function GuestHeader({
  showCart = true,
}: {
  showCart?: boolean;
}) {
  const pathname = usePathname();
  const onCartPage = pathname === "/guest/cart";
  const { locale, theme, toggleTheme, cart } = useDemo();
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--card)]/95 px-4 py-3 backdrop-blur-md sm:px-6 sm:py-4">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Image src="/logo.png" alt="Empire Apartments" width={44} height={44} className="h-10 w-10 shrink-0 rounded-lg sm:h-11 sm:w-11" />
        <span className="truncate text-lg font-black uppercase tracking-wider text-[var(--gold)] sm:text-xl">
          {t(locale, "brand")}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <LanguageToggle variant="guest" />
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
            aria-current={onCartPage ? "page" : undefined}
            className={`relative flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition sm:px-5 sm:text-base ${
              onCartPage
                ? "border-[var(--gold)]/40 bg-[var(--gold)]/15 text-[var(--gold)] shadow-[0_0_20px_-4px_rgba(201,165,78,0.35)]"
                : "border-[var(--border-light)] text-[var(--gold)] hover:border-[var(--gold)]/25 hover:bg-[var(--card-hover)]"
            }`}
          >
            <svg
              className="h-5 w-5 shrink-0 sm:h-6 sm:w-6"
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
            <span className="hidden sm:inline">{t(locale, "cart")}</span>
            {cartCount > 0 && (
              <span
                className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-black ${
                  onCartPage
                    ? "bg-[var(--gold)] text-[var(--dark)]"
                    : "border border-[var(--gold)]/50 bg-[var(--dark)] text-[var(--gold)]"
                }`}
              >
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
        )}
      </div>
    </header>
  );
}
