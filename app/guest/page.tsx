"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GuestHeader } from "@/components/guest-header";
import { useTimeLeft } from "@/components/room-timer";
import { useDemo } from "@/contexts/demo-context";
import {
  formatCountdown,
  formatSrd,
  formatTimeRange,
} from "@/lib/format";
import { t } from "@/lib/i18n";
import type { ProductCategory } from "@/lib/types";

type Modal = "expired" | "extend" | null;

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
    locale,
    dispatch,
    hourlyRate,
    addToCart,
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
    if (!guestSession) router.replace("/");
  }, [guestSession, router]);

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

  const filtered = useMemo(() => {
    if (category === "all") return catalog;
    return catalog.filter((p) => p.category === category);
  }, [catalog, category]);

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
    window.alert(t(locale, "panicSent"));
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
    <div className="flex min-h-dvh flex-col bg-[var(--background)]">
      <GuestHeader />

      {/* Room info bar */}
      <section className="animate-fade-in border-b border-[var(--border)] bg-[var(--card)] px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5">
          <div className="flex-1">
            <h2 className="text-4xl font-bold text-[var(--gold)]">
              Room {guestSession.roomNumber}
            </h2>
            <p className="mt-2 flex items-center gap-2 text-base text-[var(--muted)]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {range}
            </p>
            <p className="mt-3">
              <span className="text-base text-[var(--muted)]">{t(locale, "timeLeft")}: </span>
              <span className={`font-mono text-3xl font-black tabular-nums ${leftMs <= 0 ? "text-red-500" : nearlyDone ? "text-amber-500" : "text-[var(--gold)]"}`}>
                {formatCountdown(leftMs)}
              </span>
              {nearlyDone && leftMs > 0 && (
                <span className="ml-3 inline-flex animate-pulse items-center rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-400">
                  {t(locale, "nearlyDone")}
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setModal("extend")}
              className="flex items-center gap-2 rounded-2xl border-2 border-[var(--gold)] bg-transparent px-6 py-4 text-base font-bold text-[var(--gold)] shadow transition-all duration-200 hover:bg-[var(--gold)]/10 active:scale-95"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t(locale, "addTime")}
            </button>
            <button
              type="button"
              onClick={endSession}
              className="flex items-center gap-2 rounded-2xl bg-[var(--gold)] px-6 py-4 text-base font-bold text-[var(--dark)] shadow-lg transition-all duration-200 hover:bg-[var(--gold-light)] active:scale-95"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {t(locale, "endNow")}
            </button>
            <button
              type="button"
              onClick={panic}
              className="flex items-center gap-2 rounded-2xl bg-red-600 px-6 py-4 text-base font-bold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-red-700 active:scale-95"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z" />
              </svg>
              {t(locale, "panic")}
            </button>
          </div>
        </div>
      </section>

      {/* Main scrollable area */}
      <div className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-6 py-8">

        {/* Promo carousel */}
        <div className="animate-slide-up relative overflow-hidden rounded-3xl shadow-2xl shadow-black/30 ring-1 ring-[var(--border)]">
          <div className="relative h-[300px] lg:h-[340px]">
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
                  sizes="(max-width: 1200px) 100vw, 1200px"
                  priority={i === slide}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
              </div>
            ))}

            <div className="relative z-10 flex h-full flex-col justify-center px-10 py-10 text-white">
              <p
                key={`tag-${slide}`}
                className="animate-fade-in text-sm font-semibold uppercase tracking-[0.2em] text-[var(--gold)]"
              >
                {currentSlide.tag}
              </p>
              <p
                key={`title-${slide}`}
                className="animate-fade-in stagger-1 mt-4 text-4xl font-black leading-tight lg:text-5xl"
              >
                {currentSlide.title}<br />
                <span className="text-[var(--gold)]">{currentSlide.highlight}</span> {currentSlide.rest}
              </p>
              <p
                key={`desc-${slide}`}
                className="animate-fade-in stagger-2 mt-4 max-w-lg text-lg text-white/70"
              >
                {currentSlide.desc}
              </p>
            </div>
          </div>

          {/* Dots & arrows */}
          <div className="absolute bottom-5 left-10 z-10 flex items-center gap-3">
            {PROMO_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goToSlide(i)}
                className={`h-3 rounded-full transition-all duration-300 ${
                  i === slide ? "w-8 bg-[var(--gold)]" : "w-3 bg-white/30 hover:bg-white/50"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
          <div className="absolute bottom-5 right-6 z-10 flex gap-2">
            <button
              type="button"
              onClick={() => goToSlide((slide - 1 + PROMO_SLIDES.length) % PROMO_SLIDES.length)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30"
              aria-label="Previous slide"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => goToSlide((slide + 1) % PROMO_SLIDES.length)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30"
              aria-label="Next slide"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Category filter */}
        <div className="animate-fade-in stagger-2 flex flex-wrap gap-3">
          {(
            [
              ["all", t(locale, "all")] as const,
              ["snack", t(locale, "snacks")] as const,
              ["drink", t(locale, "drinks")] as const,
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={`rounded-full px-7 py-3 text-base font-bold transition-all duration-200 ${
                category === key
                  ? "bg-[var(--gold)] text-[var(--dark)] shadow-lg shadow-[var(--gold)]/20"
                  : "bg-[var(--card)] text-[var(--foreground)] ring-1 ring-[var(--border-light)] hover:bg-[var(--card-hover)] hover:ring-[var(--gold)]/30"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Product grid — tap card to add */}
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
          {filtered.map((p, idx) => {
            const name = locale === "nl" ? p.nameNl : p.name;
            const catLabel =
              p.category === "drink" ? t(locale, "drinks") : t(locale, "snacks");
            const qty = cartMap.get(p.id) ?? 0;
            const isInCart = qty > 0;
            const justTapped = tapped === p.id;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleTapProduct(p.id)}
                className={`animate-fade-in stagger-${Math.min(idx + 1, 6)} group relative flex flex-col overflow-hidden rounded-2xl text-left shadow-md transition-all duration-200 hover:shadow-xl active:scale-[0.97] ${
                  isInCart
                    ? "ring-2 ring-[var(--gold)] bg-[var(--card)] shadow-lg shadow-[var(--gold)]/10"
                    : "bg-[var(--card)] ring-1 ring-[var(--border)]"
                }`}
              >
                {isInCart && (
                  <span className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[var(--gold)] bg-[var(--dark)] text-sm font-black text-[var(--gold)] shadow-md ${justTapped ? "animate-pop-in" : ""}`}>
                    {qty}
                  </span>
                )}

                <div className="relative aspect-[4/3] overflow-hidden bg-[var(--surface)]">
                  <Image
                    src={p.image}
                    alt={name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-bold text-[var(--foreground)]">{name}</h3>
                  <p className="text-sm text-[var(--muted)]">{catLabel}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-bold text-[var(--gold)]">{formatSrd(p.priceSrd)}</span>
                    <span className={`rounded-xl px-5 py-2 text-sm font-bold transition-all duration-200 ${
                      isInCart
                        ? "bg-[var(--gold)] text-[var(--dark)]"
                        : "bg-[var(--gold)]/10 text-[var(--gold)] group-hover:bg-[var(--gold)] group-hover:text-[var(--dark)]"
                    }`}>
                      + {t(locale, "add")}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="sticky bottom-0 z-10 border-t border-[var(--border)] bg-[var(--card)]/95 p-5 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] backdrop-blur">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/guest/cart"
            className="relative flex w-full items-center justify-center gap-3 rounded-2xl bg-[var(--gold)] py-5 text-xl font-bold text-[var(--dark)] shadow-lg transition-all duration-200 hover:bg-[var(--gold-light)] hover:shadow-xl active:scale-[0.98]"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {t(locale, "continueToCart")}
            {cartCount > 0 && (
              <span className="absolute right-6 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--dark)] bg-[var(--dark)] text-base font-black text-[var(--gold)] shadow-md">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Session choice modal */}
      {modal === "expired" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-md">
          <div className="animate-fade-in-scale w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--card)] px-8 py-10 text-center shadow-2xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--gold)]/10 text-[var(--gold)]">
              <svg className="h-11 w-11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mt-6 text-2xl font-bold tracking-tight text-[var(--gold)]">
              {t(locale, "extendSessionTitle")}
            </h3>
            <p className="mt-3 text-base leading-relaxed text-[var(--muted)]">
              {t(locale, "extendSessionSub")}
            </p>
            <div className="mt-10 flex flex-col gap-4">
              <button
                type="button"
                onClick={() => setModal("extend")}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[var(--gold)] py-5 text-lg font-bold text-[var(--dark)] shadow-lg transition hover:bg-[var(--gold-light)] active:scale-[0.99]"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                {t(locale, "extend")}
              </button>
              <button
                type="button"
                onClick={endSession}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-[var(--gold)] bg-transparent py-5 text-lg font-bold text-[var(--gold)] transition hover:bg-[var(--gold)]/5 active:scale-[0.99]"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {t(locale, "endStay")}
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
              <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mt-6 text-center text-2xl font-bold text-[var(--gold)]">
              {t(locale, "extendModalTitle")}
            </h3>
            <p className="mt-3 text-center text-sm leading-relaxed text-[var(--muted)]">
              {t(locale, "extendModalIntro")}
            </p>

            <div className="mt-8">
              <div className="flex justify-between px-1 text-xs font-semibold text-[var(--muted)]">
                {[1, 2, 3, 4, 5, 6].map((h) => (
                  <span key={h} className="w-8 text-center">
                    +{h}u
                  </span>
                ))}
              </div>
              <input
                type="range"
                min={1}
                max={6}
                step={1}
                value={extendHours}
                onChange={(e) => setExtendHours(Number(e.target.value))}
                className="extend-hours-slider mt-3 h-2 w-full cursor-pointer"
              />
            </div>

            <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-center">
              <p className="text-sm text-[var(--muted)]">{t(locale, "extraCost")}</p>
              <p className="mt-1 text-2xl font-black text-[var(--gold)]">{formatSrd(extendCost)}</p>
            </div>

            <button
              type="button"
              onClick={confirmExtend}
              className="mt-6 w-full rounded-2xl bg-[var(--gold)] py-5 text-lg font-bold text-[var(--dark)] shadow-lg transition hover:bg-[var(--gold-light)] active:scale-[0.98]"
            >
              {t(locale, "extendBy")} {extendHours} {t(locale, "hours")}
            </button>
            <button
              type="button"
              onClick={() => setModal(null)}
              className="mt-5 w-full py-2 text-center text-base font-semibold text-[var(--muted)] transition hover:text-[var(--gold)]"
            >
              {t(locale, "maybeLater")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
