"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageToggle } from "@/components/language-toggle";
import { useDemo } from "@/contexts/demo-context";
import {
  GUEST_MENU_STICKY_PAD_SAFE_TOP,
  GUEST_MENU_STICKY_SHEET,
} from "@/lib/guest-toolbar-styles";
import { t } from "@/lib/i18n";

const guestMainToolbarClass = `sticky top-0 z-20 ${GUEST_MENU_STICKY_SHEET} ${GUEST_MENU_STICKY_PAD_SAFE_TOP}`;

const iconChromeClass =
  "flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:border-[var(--gold)]/30 hover:text-[var(--gold)]";

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
    <header className={guestMainToolbarClass}>
      <div className="flex h-11 min-w-0 items-center gap-2 sm:gap-2.5">
        <Image
          src="/logo.png"
          alt={t(locale, "brand")}
          width={40}
          height={40}
          className="h-9 w-9 shrink-0 self-center rounded-lg sm:h-10 sm:w-10"
        />
        <span className="truncate text-sm font-black uppercase leading-none tracking-[0.12em] text-[var(--gold)] sm:text-base sm:tracking-[0.15em]">
          {t(locale, "brand")}
        </span>
      </div>

      <div className="ml-auto flex h-11 min-h-[44px] shrink-0 items-center gap-2 sm:gap-3">
        <LanguageToggle variant="shell" />
        {showCart && (
          <Link
            href="/guest/cart"
            aria-current={onCartPage ? "page" : undefined}
            className={`relative flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] transition hover:border-[var(--gold)]/30 ${
              cartCount > 0 ? "text-[var(--gold)]" : "text-[var(--muted)] hover:text-[var(--gold)]"
            }`}
            aria-label={t(locale, "cart")}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--gold)] px-1 text-[10px] font-black leading-none text-[var(--dark)]">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
        )}
        <button
          type="button"
          onClick={toggleTheme}
          className={iconChromeClass}
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
      </div>
    </header>
  );
}
