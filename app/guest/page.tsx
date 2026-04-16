"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LanguageToggle } from "@/components/language-toggle";
import { useDemo } from "@/contexts/demo-context";
import { GuestSessionModals } from "@/components/guest-session-modals";
import { GuestSessionPanel } from "@/components/guest-session-panel";
import { formatSrd, formatTimeRange } from "@/lib/format";
import { useGuestSessionUi } from "@/hooks/use-guest-session-ui";
import { categoryLabel } from "@/lib/category-styles";
import { t } from "@/lib/i18n";
import type { ProductCategory } from "@/lib/types";

const PROMO_SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&h=500&fit=crop&q=80",
    tag: "Spa & Wellness",
    title: "Spa evening",
    highlight: "20% off",
    rest: "this week",
    desc: "Relax and enjoy our premium spa experience. Book directly from your room.",
  },
  {
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=500&fit=crop&q=80",
    tag: "Dining",
    title: "Room service",
    highlight: "Free delivery",
    rest: "after 6 PM",
    desc: "Enjoy gourmet meals delivered to your room. Fresh and hot, every time.",
  },
  {
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&h=500&fit=crop&q=80",
    tag: "Special Offer",
    title: "Extended stay",
    highlight: "Save 15%",
    rest: "on 3+ hours",
    desc: "Stay longer and pay less. The perfect deal for a relaxing afternoon.",
  },
];

const SLIDE_INTERVAL = 5000;

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
    panic,
  } = useGuestSessionUi();
  const [category, setCategory] = useState<"all" | ProductCategory>("all");
  const [tapped, setTapped] = useState<string | null>(null);

  const [slide, setSlide] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSlide((s) => (s + 1) % PROMO_SLIDES.length);
    }, SLIDE_INTERVAL);
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  function goToSlide(idx: number) {
    setSlide(idx);
    startTimer();
  }

  useEffect(() => {
    if (guestSession) return;
    if (guestPostSessionEndNavRef.current.skipDurationRedirectOnce) {
      guestPostSessionEndNavRef.current.skipDurationRedirectOnce = false;
      return;
    }
    router.replace("/guest/duration");
  }, [guestSession, router, guestPostSessionEndNavRef]);

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

  if (!guestSession) return null;

  const start = new Date(guestSession.sessionStartedAt);
  const end = new Date(guestSession.sessionEndsAt);
  const range = formatTimeRange(start, end, locale);
  const nearlyDone = leftMs > 0 && leftMs < 15 * 60 * 1000;

  function handleTapProduct(productId: string) {
    addToCart(productId);
    setTapped(productId);
    setTimeout(() => setTapped(null), 400);
  }

  const currentSlide = PROMO_SLIDES[slide];

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[var(--background)] md:flex-row">
      {/* ─── SIDEBAR: full-width strip on small tablets, column from md up ─── */}
      <aside className="flex max-h-[min(42dvh,400px)] w-full shrink-0 flex-col overflow-y-auto overscroll-y-contain border-b border-[var(--border)] bg-[var(--card)] md:max-h-none md:h-full md:w-64 md:overflow-visible md:border-b-0 md:border-r lg:w-72">
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
        <div className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--background)]/95 px-4 py-2.5 backdrop-blur-sm sm:gap-3 sm:px-6 sm:py-3">
          <Link
            href="/guest/stay"
            className="inline-flex min-h-11 min-w-0 max-w-[min(100%,14rem)] touch-manipulation items-center gap-2 rounded-xl border border-[var(--border-light)] bg-[var(--surface)] px-3 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--gold)]/35 hover:bg-[var(--card-hover)] hover:text-[var(--gold)] sm:max-w-none sm:px-4"
            aria-label={t(locale, "yourStay")}
          >
            <svg className="h-5 w-5 shrink-0 text-[var(--gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="truncate">{t(locale, "yourStay")}</span>
          </Link>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
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

          {/* Promo carousel */}
          <div className="animate-slide-up relative overflow-hidden rounded-2xl shadow-xl ring-1 ring-[var(--border)]">
            <div className="relative h-44 min-h-[11rem] sm:h-52 md:h-60">
              {PROMO_SLIDES.map((s, i) => (
                <div
                  key={s.image}
                  className="absolute inset-0 transition-all duration-700 ease-in-out"
                  style={{
                    opacity: i === slide ? 1 : 0,
                    transform: i === slide ? "scale(1)" : "scale(1.05)",
                    pointerEvents: i === slide ? "auto" : "none",
                    zIndex: i === slide ? 2 : 0,
                  }}
                >
                  <Image
                    src={s.image}
                    alt={s.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1200px) 100vw, 900px"
                    priority={i === slide}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
                </div>
              ))}
              <div className="relative z-10 flex h-full flex-col justify-center px-4 py-6 text-white sm:px-8 sm:py-8">
                <p key={`tag-${slide}`} className="animate-fade-in text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">{currentSlide.tag}</p>
                <p key={`title-${slide}`} className="animate-fade-in stagger-1 mt-2 text-2xl font-black leading-tight sm:mt-3 sm:text-3xl">
                  {currentSlide.title}<br />
                  <span className="text-[var(--gold)]">{currentSlide.highlight}</span> {currentSlide.rest}
                </p>
                <p key={`desc-${slide}`} className="animate-fade-in stagger-2 mt-3 max-w-md text-sm text-white/70">{currentSlide.desc}</p>
              </div>
            </div>
            <div className="absolute bottom-3 left-4 z-10 flex items-center gap-2 sm:bottom-4 sm:left-8">
              {PROMO_SLIDES.map((_, i) => (
                <button key={i} type="button" onClick={() => goToSlide(i)} className={`h-2 rounded-full transition-all duration-300 ${i === slide ? "w-6 bg-[var(--gold)]" : "w-2 bg-white/30 hover:bg-white/50"}`} aria-label={`Slide ${i + 1}`} />
              ))}
            </div>
            <div className="absolute bottom-3 right-4 z-10 flex gap-1.5 sm:bottom-4 sm:right-5">
              <button type="button" onClick={() => goToSlide((slide - 1 + PROMO_SLIDES.length) % PROMO_SLIDES.length)} className="flex h-10 w-10 touch-manipulation items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30" aria-label="Previous">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button type="button" onClick={() => goToSlide((slide + 1) % PROMO_SLIDES.length)} className="flex h-10 w-10 touch-manipulation items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30" aria-label="Next">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>

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

          {/* Product grid — 1 col on very narrow, 2 from ~520px, 3 on xl */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                    <div className="relative aspect-[4/3] overflow-hidden bg-[var(--surface)]">
                      <Image src={p.image} alt={name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 33vw" />
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="text-base font-bold text-[var(--foreground)]">{name}</h3>
                      <p className="text-xs text-[var(--muted)]">{catLabel}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-base font-bold text-[var(--gold)]">{formatSrd(p.priceSrd)}</span>
                        <span className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
                          isInCart
                            ? "bg-[var(--gold)] text-[var(--dark)]"
                            : "bg-[var(--gold)]/10 text-[var(--gold)] group-hover:bg-[var(--gold)] group-hover:text-[var(--dark)]"
                        }`}>
                          + {t(locale, "add")}
                        </span>
                      </div>
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
            className={`sticky bottom-0 z-10 border-t border-[var(--border)] bg-[var(--card)]/95 p-4 backdrop-blur ${
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
        locale={locale}
        extendHours={extendHours}
        setExtendHours={setExtendHours}
        hourlyRate={hourlyRate}
        confirmExtend={confirmExtend}
        endSession={endSession}
      />
    </div>
  );
}
