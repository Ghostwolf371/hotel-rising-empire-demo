"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LanguageToggle } from "@/components/language-toggle";
import { useTimeLeft } from "@/components/room-timer";
import { useDemo } from "@/contexts/demo-context";
import {
  formatCountdown,
  formatSrd,
  formatTimeRange,
} from "@/lib/format";
import { categoryLabel } from "@/lib/category-styles";
import { t } from "@/lib/i18n";
import type { ProductCategory } from "@/lib/types";

type Modal = "expired" | "extend" | "confirm-end" | "panic-sent" | null;

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
    guestSession,
    catalog,
    categories,
    locale,
    theme,
    toggleTheme,
    dispatch,
    hourlyRate,
    addToCart,
    setCartQty,
    cart,
  } = useDemo();
  const [modal, setModal] = useState<Modal>(null);
  const [extendHours, setExtendHours] = useState(2);
  const [category, setCategory] = useState<"all" | ProductCategory>("all");
  const [expiredShown, setExpiredShown] = useState(false);
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
    if (!guestSession) router.replace("/guest/duration");
  }, [guestSession, router]);

  const effectiveCategory = useMemo(() => {
    if (category === "all") return "all";
    return categories.some((c) => c.id === category) ? category : "all";
  }, [category, categories]);

  const endsAt = guestSession?.sessionEndsAt ?? 0;
  const leftMs = useTimeLeft(endsAt);
  const isExpired = !!guestSession && leftMs <= 0;

  useEffect(() => {
    if (!isExpired) return;
    if (expiredShown) return;
    const id = setTimeout(() => {
      setExpiredShown(true);
      setModal("expired");
    }, 0);
    return () => clearTimeout(id);
  }, [isExpired, expiredShown]);

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
        label: locale === "nl" ? c.nameNl : c.name,
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

  function panic() {
    if (!guestSession) return;
    dispatch({ type: "PANIC", roomNumber: guestSession.roomNumber });
    setModal("panic-sent");
  }

  function confirmExtend() {
    if (!guestSession) return;
    dispatch({ type: "EXTEND_GUEST_SESSION", extraHours: extendHours });
    setExpiredShown(false);
    setModal(null);
  }

  function endSession() {
    if (!guestSession) return;
    setModal(null);
    router.push("/guest/rate?ended=1");
  }

  function handleTapProduct(productId: string) {
    addToCart(productId);
    setTapped(productId);
    setTimeout(() => setTapped(null), 400);
  }

  const extendCost = extendHours * hourlyRate;
  const currentSlide = PROMO_SLIDES[slide];

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[var(--background)] md:flex-row">
      {/* ─── SIDEBAR: full-width strip on small tablets, column from md up ─── */}
      <aside className="flex max-h-[min(42dvh,400px)] w-full shrink-0 flex-col overflow-y-auto overscroll-y-contain border-b border-[var(--border)] bg-[var(--card)] md:max-h-none md:h-full md:w-64 md:overflow-visible md:border-b-0 md:border-r lg:w-72">
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-4">
          <Image src="/logo.png" alt="Empire Apartments" width={36} height={36} className="rounded-lg" />
          <span className="text-sm font-black uppercase tracking-wider text-[var(--gold)]">
            {t(locale, "brand")}
          </span>
        </div>

        {/* Room info */}
        <div className="border-b border-[var(--border)] px-5 py-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{t(locale, "roomNumber")}</p>
          <p className="mt-1 text-3xl font-black text-[var(--gold)]">{guestSession.roomNumber}</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--muted)]">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {range}
          </p>
        </div>

        {/* Timer */}
        <div className="border-b border-[var(--border)] px-5 py-5 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{t(locale, "timeLeft")}</p>
          <p className={`mt-2 font-mono text-4xl font-black tabular-nums ${leftMs <= 0 ? "text-red-500" : nearlyDone ? "text-amber-500" : "text-[var(--gold)]"}`}>
            {formatCountdown(leftMs)}
          </p>
          {nearlyDone && leftMs > 0 && (
            <span className="mt-2 inline-flex animate-pulse items-center rounded-full bg-amber-500/15 px-3 py-1 text-[10px] font-bold text-amber-400">
              {t(locale, "nearlyDone")}
            </span>
          )}
        </div>

        <div className="min-h-0 flex-1" aria-hidden />

        {/* Action buttons — pinned to bottom of sidebar */}
        <div className="border-t border-[var(--border)] space-y-3 px-4 py-4 sm:px-5 sm:py-5">
          <button
            type="button"
            onClick={() => setModal("extend")}
            className="flex w-full touch-manipulation items-center gap-2.5 rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 px-4 py-3.5 text-sm font-bold text-[var(--gold)] transition hover:bg-[var(--gold)]/10 active:scale-[0.98]"
          >
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t(locale, "addTime")}
          </button>
          <button
            type="button"
            onClick={() => setModal("confirm-end")}
            className="flex w-full touch-manipulation items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 text-sm font-bold text-[var(--foreground)] transition hover:bg-[var(--card-hover)] active:scale-[0.98]"
          >
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {t(locale, "endNow")}
          </button>
          <button
            type="button"
            onClick={panic}
            className="flex w-full touch-manipulation items-center gap-2.5 rounded-xl bg-red-600/10 px-4 py-3.5 text-sm font-bold text-red-400 transition hover:bg-red-600/20 active:scale-[0.98]"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z" />
            </svg>
            {t(locale, "panic")}
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="sticky top-0 z-20 flex items-center justify-end gap-2 border-b border-[var(--border)] bg-[var(--background)]/95 px-4 py-2.5 backdrop-blur-sm sm:gap-3 sm:px-6 sm:py-3">
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
              const name = locale === "nl" ? p.nameNl : p.name;
              const catLabel = categoryLabel(categories, p.category, locale);
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
          <div className="sticky bottom-0 z-10 border-t border-[var(--border)] bg-[var(--card)]/95 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] backdrop-blur">
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

      {/* ─── MODALS ─── */}

      {/* Staff alert confirmation */}
      {modal === "panic-sent" && guestSession && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md sm:p-6"
          onClick={() => setModal(null)}
          role="presentation"
        >
          <div
            className="animate-fade-in-scale w-full max-w-md rounded-3xl border border-red-500/25 bg-[var(--card)] px-6 py-9 text-center shadow-2xl shadow-red-900/20 sm:px-8 sm:py-10"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="panic-sent-title"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/15 text-red-400 ring-2 ring-red-500/20">
              <svg className="h-11 w-11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z" />
              </svg>
            </div>
            <p id="panic-sent-title" className="mt-6 text-2xl font-black tracking-tight text-[var(--foreground)]">
              {t(locale, "panicSentTitle")}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/30 bg-[var(--gold)]/10 px-4 py-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{t(locale, "roomNumber")}</span>
              <span className="text-lg font-black text-[var(--gold)]">{guestSession.roomNumber}</span>
            </div>
            <p className="mt-5 text-left text-base leading-relaxed text-[var(--muted)]">{t(locale, "panicSentBody")}</p>
            <p className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left text-sm leading-relaxed text-[var(--foreground)]">
              {t(locale, "panicSentReassure")}
            </p>
            <p className="mt-4 text-xs font-medium text-[var(--muted)]">{t(locale, "panicSentDemo")}</p>
            <button
              type="button"
              onClick={() => setModal(null)}
              className="mt-8 w-full touch-manipulation rounded-2xl bg-[var(--gold)] py-4 text-lg font-bold text-[var(--dark)] shadow-lg transition hover:bg-[var(--gold-light)] active:scale-[0.98] sm:py-5"
            >
              {t(locale, "panicSentDismiss")}
            </button>
          </div>
        </div>
      )}

      {/* Expired modal */}
      {modal === "expired" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-md">
          <div className="animate-fade-in-scale w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--card)] px-8 py-10 text-center shadow-2xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--gold)]/10 text-[var(--gold)]">
              <svg className="h-11 w-11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="mt-6 text-2xl font-bold tracking-tight text-[var(--gold)]">{t(locale, "extendSessionTitle")}</h3>
            <p className="mt-3 text-base leading-relaxed text-[var(--muted)]">{t(locale, "extendSessionSub")}</p>
            <div className="mt-10 flex flex-col gap-4">
              <button type="button" onClick={() => setModal("extend")} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[var(--gold)] py-5 text-lg font-bold text-[var(--dark)] shadow-lg transition hover:bg-[var(--gold-light)] active:scale-[0.99]">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                {t(locale, "extend")}
              </button>
              <button type="button" onClick={endSession} className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-[var(--gold)] bg-transparent py-5 text-lg font-bold text-[var(--gold)] transition hover:bg-[var(--gold)]/5 active:scale-[0.99]">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                {t(locale, "endStay")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm end modal */}
      {modal === "confirm-end" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-md">
          <div className="animate-fade-in-scale w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--card)] px-8 py-10 text-center shadow-2xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 text-red-400">
              <svg className="h-11 w-11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </div>
            <h3 className="mt-6 text-2xl font-bold tracking-tight text-[var(--foreground)]">{t(locale, "confirmEndTitle")}</h3>
            <p className="mt-3 text-base leading-relaxed text-[var(--muted)]">{t(locale, "confirmEndSub")}</p>
            <div className="mt-10 flex flex-col gap-4">
              <button type="button" onClick={endSession} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-red-600 py-5 text-lg font-bold text-white shadow-lg transition hover:bg-red-700 active:scale-[0.99]">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                {t(locale, "confirmEndYes")}
              </button>
              <button type="button" onClick={() => setModal(null)} className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-[var(--border-light)] bg-transparent py-5 text-lg font-bold text-[var(--foreground)] transition hover:bg-[var(--surface)] active:scale-[0.99]">
                {t(locale, "confirmEndCancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extend modal */}
      {modal === "extend" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-md">
          <div className="animate-fade-in-scale w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--card)] px-8 py-10 shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--gold)]/10 text-[var(--gold)]">
              <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="mt-6 text-center text-2xl font-bold text-[var(--gold)]">{t(locale, "extendModalTitle")}</h3>
            <p className="mt-3 text-center text-sm leading-relaxed text-[var(--muted)]">{t(locale, "extendModalIntro")}</p>
            <div className="mt-8 overflow-x-auto px-1 [-webkit-overflow-scrolling:touch]">
              <div className="flex min-w-[min(100%,18rem)] justify-between gap-1 px-[2px] sm:min-w-0">
                {[1, 2, 3, 4, 5, 6].map((h) => (
                  <button key={h} type="button" onClick={() => setExtendHours(h)} className={`flex min-h-11 min-w-10 touch-manipulation flex-col items-center justify-center gap-1 transition-all duration-200 sm:min-h-0 ${extendHours === h ? "scale-110" : ""}`}>
                    <span className={`text-base font-black transition-colors duration-200 ${h <= extendHours ? "text-[var(--gold)]" : "text-[var(--muted)]"}`}>+{h}u</span>
                  </button>
                ))}
              </div>
              <div className="relative mt-3">
                <input type="range" min={1} max={6} step={1} value={extendHours} onChange={(e) => setExtendHours(Number(e.target.value))} className="gold-slider" style={{ "--slider-pct": `${((extendHours - 1) / 5) * 100}%` } as React.CSSProperties} />
                <div className="pointer-events-none absolute top-1/2 left-[2px] right-[2px] -translate-y-1/2">
                  <div className="flex justify-between">
                    {[1, 2, 3, 4, 5, 6].map((h) => (
                      <span key={h} className={`block h-2 w-2 rounded-full transition-all duration-200 ${h <= extendHours ? "bg-[var(--gold)] shadow-sm shadow-[var(--gold)]/40" : "bg-[var(--border-light)]"}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--gold)]/20 bg-[var(--gold)]/5">
              <div className="flex items-center justify-between px-6 py-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{t(locale, "extraCost")}</p>
                  <p className="mt-0.5 text-sm text-[var(--muted)]">{extendHours} × {formatSrd(hourlyRate)}</p>
                </div>
                <p className="text-3xl font-black text-[var(--gold)]">{formatSrd(extendCost)}</p>
              </div>
            </div>
            <button type="button" onClick={confirmExtend} className="mt-6 w-full rounded-2xl bg-[var(--gold)] py-5 text-lg font-bold text-[var(--dark)] shadow-lg transition hover:bg-[var(--gold-light)] active:scale-[0.98]">
              {t(locale, "extendBy")} {extendHours} {t(locale, "hours")} →
            </button>
            <button type="button" onClick={() => setModal(null)} className="mt-5 w-full py-2 text-center text-base font-semibold text-[var(--muted)] transition hover:text-[var(--gold)]">
              {t(locale, "maybeLater")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
