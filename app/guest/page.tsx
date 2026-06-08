"use client";

import { ProductThumb } from "@/components/product-thumb";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { guestPath } from "@/lib/guest-routes";
import { useEffect, useMemo, useState } from "react";
import { LanguageToggle } from "@/components/language-toggle";
import { useDemo } from "@/contexts/demo-context";
import {
  GUEST_MENU_STICKY_PAD_INSET,
  GUEST_MENU_STICKY_SHEET,
} from "@/lib/guest-toolbar-styles";
import { GuestSessionModals } from "@/components/guest-session-modals";
import { GuestSessionPanel } from "@/components/guest-session-panel";
import { formatSrd, formatTimeRange } from "@/lib/format";
import { useGuestSessionUi } from "@/hooks/use-guest-session-ui";
import { categoryLabel } from "@/lib/category-styles";
import { t } from "@/lib/i18n";
import type { ProductCategory } from "@/lib/types";

export default function GuestMainPage() {
  const router = useRouter();
  const {
    catalog,
    categories,
    locale,
    theme,
    toggleTheme,
    addToCart,
    setCartQty,
    cart,
    guestPostSessionEndNavRef,
  } = useDemo();
  const {
    guestSession,
    hourlyRate,
    modal,
    setModal,
    extendHours,
    setExtendHours,
    leftMs,
    confirmExtend,
    endSession,
    dismissCheckoutSent,
    checkoutRoomNumber,
    panic,
  } = useGuestSessionUi();
  const [category, setCategory] = useState<"all" | ProductCategory>("all");
  const [tapped, setTapped] = useState<string | null>(null);

  useEffect(() => {
    if (guestSession) return;
    if (modal === "checkout-sent") return;
    if (guestPostSessionEndNavRef.current.skipDurationRedirectOnce) {
      guestPostSessionEndNavRef.current.skipDurationRedirectOnce = false;
      return;
    }
    router.replace(guestPath("/guest/language"));
  }, [guestSession, modal, router, guestPostSessionEndNavRef]);

  const effectiveCategory = useMemo(() => {
    if (category === "all") return "all";
    return categories.some((c) => c.id === category) ? category : "all";
  }, [category, categories]);

  const availableCatalog = useMemo(() => catalog.filter((p) => p.available !== false), [catalog]);

  const filtered = useMemo(() => {
    if (effectiveCategory === "all") return availableCatalog;
    return availableCatalog.filter((p) => p.category === effectiveCategory);
  }, [availableCatalog, effectiveCategory]);

  const categoryFilterButtons = useMemo(() => {
    const tabs: { id: ProductCategory | "all"; label: string }[] = [
      { id: "all", label: t(locale, "all") },
      ...categories.map((c) => ({
        id: c.id,
        label: c.name,
      })),
    ];
    return tabs;
  }, [categories, locale]);

  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const cartMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of cart) m.set(c.productId, c.qty);
    return m;
  }, [cart]);

  // Brief render with guestSession=null while navigating after checkout.
  // Show a lightweight loader so the transition reads as "in flight".
  if (!guestSession && modal !== "checkout-sent") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--background)]">
        <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--gold)]/30" />
      </div>
    );
  }

  if (!guestSession) {
    return (
      <div className="min-h-dvh bg-[var(--background)]">
        <GuestSessionModals
          modal={modal}
          setModal={setModal}
          guestSession={null}
          checkoutRoomNumber={checkoutRoomNumber}
          locale={locale}
          extendHours={extendHours}
          setExtendHours={setExtendHours}
          hourlyRate={hourlyRate}
          confirmExtend={confirmExtend}
          endSession={endSession}
          dismissCheckoutSent={dismissCheckoutSent}
        />
      </div>
    );
  }

  const start = new Date(guestSession.sessionStartedAt);
  const end = new Date(guestSession.sessionEndsAt);
  const range = formatTimeRange(start, end, locale);
  const nearlyDone = leftMs > 0 && leftMs < 15 * 60 * 1000;

  function handleTapProduct(productId: string) {
    addToCart(productId);
    setTapped(productId);
    setTimeout(() => setTapped(null), 400);
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[var(--background)] md:flex-row">
      {/* ─── SIDEBAR: full-width strip on small tablets, column from md up ─── */}
      <aside className="flex max-h-[min(42dvh,400px)] w-full shrink-0 flex-col overflow-hidden border-b border-[var(--border)] bg-[var(--card)] md:max-h-none md:h-full md:w-64 md:border-b-0 md:border-r lg:w-72">
        <GuestSessionPanel
          variant="sidebar"
          guestSession={guestSession}
          locale={locale}
          leftMs={leftMs}
          range={range}
          nearlyDone={nearlyDone}
          onAddTime={() => setModal("extend")}
          onEndNow={() => setModal("confirm-end")}
          onStaffAlert={panic}
        />
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <div className={`sticky top-0 z-20 ${GUEST_MENU_STICKY_SHEET} ${GUEST_MENU_STICKY_PAD_INSET}`}>
          <Link
            href="/guest/stay"
            className="inline-flex h-11 min-w-0 max-w-[min(100%,14rem)] shrink-0 touch-manipulation items-center gap-2 rounded-xl border border-[var(--border-light)] bg-[var(--surface)] px-3 text-sm font-bold leading-none text-[var(--foreground)] transition hover:border-[var(--gold)]/35 hover:bg-[var(--card-hover)] hover:text-[var(--gold)] sm:max-w-none sm:px-4"
            aria-label={t(locale, "yourStay")}
          >
            <svg className="h-5 w-5 shrink-0 text-[var(--gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="truncate leading-none">{t(locale, "yourStay")}</span>
          </Link>
          <div className="flex h-11 min-h-[44px] shrink-0 items-center gap-2 sm:gap-3">
            <LanguageToggle variant="shell" />
            <Link
              href="/guest/cart"
              className={`relative flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] transition hover:border-[var(--gold)]/30 ${
                cartCount > 0 ? "text-[var(--gold)]" : "text-[var(--muted)] hover:text-[var(--gold)]"
              }`}
              aria-label={t(locale, "cart")}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--gold)] px-1 text-[10px] font-black leading-none text-[var(--dark)]">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:border-[var(--gold)]/30 hover:text-[var(--gold)]"
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
        </div>
        <div className="flex-1 space-y-4 p-4 sm:space-y-6 sm:p-6">

          {/* Menu section header */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-black text-[var(--foreground)] sm:text-2xl">{t(locale, "menuSectionTitle")}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{t(locale, "menuSectionSub")}</p>
            </div>
            {/* Category filter */}
            <div className="flex max-w-full flex-wrap gap-2 lg:justify-end">
              {categoryFilterButtons.map(({ id: key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={`touch-manipulation rounded-full px-4 py-2.5 text-sm font-bold transition-all duration-200 sm:px-5 ${
                    effectiveCategory === key
                      ? "bg-[var(--gold)] text-[var(--dark)] shadow-md"
                      : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--card-hover)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Product grid — 1 col on phones, 2 on small tablets in portrait,
              3 from md (≥768 px) so an 11" landscape tablet always shows
              three cards per row. */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3">
            {filtered.map((p, idx) => {
              const name = p.name;
              const catLabel = categoryLabel(categories, p.category);
              const qty = cartMap.get(p.id) ?? 0;
              const isInCart = qty > 0;
              const justTapped = tapped === p.id;

              return (
                <div
                  key={p.id}
                  className={`animate-fade-in stagger-${Math.min(idx + 1, 6)} group relative rounded-2xl shadow-md transition-all duration-200 hover:shadow-lg ${
                    isInCart
                      ? "ring-2 ring-[var(--gold)] bg-[var(--card)] shadow-[var(--gold)]/10"
                      : "bg-[var(--card)] ring-1 ring-[var(--border)]"
                  }`}
                >
                  {isInCart && (
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCartQty(p.id, qty - 1); }}
                      className="absolute left-2 top-2 z-20 flex h-11 w-11 touch-manipulation items-center justify-center rounded-full bg-red-600 text-white shadow-lg ring-2 ring-white/25 transition hover:scale-110 hover:bg-red-500 active:scale-95 sm:h-12 sm:w-12"
                      aria-label={t(locale, "removeOneFromCart")}
                    >
                      <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                  {isInCart && (
                    <span className={`pointer-events-none absolute right-2 top-2 z-10 flex min-h-11 min-w-11 items-center justify-center rounded-full border-[3px] border-[var(--gold)] bg-[var(--dark)] px-2 text-base font-black tabular-nums text-[var(--gold)] shadow-md sm:min-h-12 sm:min-w-12 sm:text-lg ${justTapped ? "animate-pop-in" : ""}`}>
                      {qty}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleTapProduct(p.id)}
                    className="flex w-full touch-manipulation flex-col overflow-hidden rounded-2xl text-left active:scale-[0.97]"
                  >
                    {/* Padding-bottom aspect-ratio hack: `padding-bottom: 75%`
                        makes the box 3/4 as tall as it is wide, i.e. 4:3,
                        with no dependency on the CSS `aspect-ratio` property
                        which some older Android WebView/Chrome builds drop
                        when applied to a flex-column child (collapsing the
                        photo to 0 px). Image is positioned absolute inset-0
                        inside, so it fills the computed box. */}
                    <div
                      className="relative w-full overflow-hidden bg-[var(--surface)]"
                      style={{ paddingBottom: "75%" }}
                    >
                      <ProductThumb
                        src={p.image}
                        alt={name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 33vw"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-3 sm:p-3.5">
                      <h3 className="text-sm font-bold leading-tight text-[var(--foreground)] sm:text-base">{name}</h3>
                      <p className="mt-0.5 text-[0.7rem] text-[var(--muted)] sm:text-xs">{catLabel}</p>
                      {/* The whole card is a tap-to-add button, so we just
                          show the price on its own at the bottom — no
                          dedicated "+ Add" chip. */}
                      <p className="mt-auto pt-2 text-sm font-bold text-[var(--gold)] sm:pt-3 sm:text-base">{formatSrd(p.priceSrd)}</p>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sticky bottom cart bar */}
        {cartCount > 0 && (
          <div
            className={`sticky bottom-0 z-10 border-t border-[var(--border)] bg-[var(--card)]/95 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur ${
              theme === "light"
                ? "shadow-[0_-6px_24px_-6px_rgba(42,36,30,0.1)]"
                : "shadow-[0_-8px_28px_-8px_rgba(0,0,0,0.22)]"
            }`}
          >
            <Link
              href="/guest/cart"
              className="relative flex w-full items-center justify-center gap-3 rounded-xl bg-[var(--gold)] py-4 text-lg font-bold text-[var(--dark)] shadow-lg transition-all duration-200 hover:bg-[var(--gold-light)] hover:shadow-xl active:scale-[0.98]"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {t(locale, "continueToCart")}
              <span className="absolute right-4 flex min-h-11 min-w-11 items-center justify-center rounded-full border-[3px] border-[var(--dark)] bg-[var(--dark)] text-base font-black tabular-nums text-[var(--gold)] sm:right-5 sm:min-h-12 sm:min-w-12 sm:text-lg">{cartCount}</span>
            </Link>
          </div>
        )}
      </main>

      <GuestSessionModals
        modal={modal}
        setModal={setModal}
        guestSession={guestSession}
        checkoutRoomNumber={checkoutRoomNumber}
        locale={locale}
        extendHours={extendHours}
        setExtendHours={setExtendHours}
        hourlyRate={hourlyRate}
        confirmExtend={confirmExtend}
        endSession={endSession}
        dismissCheckoutSent={dismissCheckoutSent}
      />
    </div>
  );
}
