"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useDemo } from "@/contexts/demo-context";
import { formatSrd } from "@/lib/format";
import { t } from "@/lib/i18n";

const DEMO_ROOM = "104";

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&h=900&fit=crop&q=80",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1600&h=900&fit=crop&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1600&h=900&fit=crop&q=80",
];

function DurationContent() {
  const router = useRouter();
  const params = useSearchParams();
  const room = params.get("room") || DEMO_ROOM;
  const { hourlyRate, locale, setLocale, theme, toggleTheme } = useDemo();
  const [hours, setHours] = useState<2 | 3>(2);
  const [visible, setVisible] = useState(false);
  const [bgIdx, setBgIdx] = useState(0);
  const cost = useMemo(() => hours * hourlyRate, [hours, hourlyRate]);

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setBgIdx((i) => (i + 1) % HERO_IMAGES.length), 8000);
    return () => clearInterval(id);
  }, []);

  function goToWelcome() {
    router.push(
      `/guest/welcome?room=${encodeURIComponent(room)}&hours=${hours}`
    );
  }

  return (
    <div className="relative flex min-h-dvh overflow-hidden bg-black">
      {/* Crossfading backgrounds */}
      {HERO_IMAGES.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out"
          style={{ opacity: i === bgIdx ? 1 : 0, zIndex: 0 }}
        >
          <Image
            src={src}
            alt=""
            fill
            className="object-cover"
            priority={i === 0}
            sizes="100vw"
          />
        </div>
      ))}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black/60 via-transparent to-black/40" />

      {/* Top bar */}
      <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Empire Apartments" width={40} height={40} className="rounded-lg shadow-lg" />
          <span className="text-sm font-black uppercase tracking-[0.2em] text-[var(--gold)]">
            {t(locale, "brand")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full bg-white/10 p-0.5 backdrop-blur-sm">
            <button type="button" onClick={() => setLocale("en")} className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${locale === "en" ? "bg-[var(--gold)] text-black" : "text-white/60"}`}>EN</button>
            <button type="button" onClick={() => setLocale("nl")} className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${locale === "nl" ? "bg-[var(--gold)] text-black" : "text-white/60"}`}>NL</button>
          </div>
          <button type="button" onClick={toggleTheme} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/60 backdrop-blur-sm transition hover:text-[var(--gold)]">
            {theme === "dark" ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex min-h-dvh w-full flex-col items-center justify-center px-6 py-24">
        <div
          className="flex w-full max-w-lg flex-col items-center transition-all duration-1000 ease-out"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(30px)" }}
        >
          {/* Logo */}
          <Image
            src="/logo.png"
            alt="Empire Apartments"
            width={72}
            height={72}
            className="rounded-2xl shadow-2xl shadow-black/60"
          />

          {/* Branding */}
          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.35em] text-[var(--gold)]/80">
            {t(locale, "brand")}
          </p>

          {/* Divider */}
          <div className="mt-3 flex items-center gap-3">
            <span className="h-px w-10 bg-[var(--gold)]/30" />
            <svg className="h-3 w-3 text-[var(--gold)]/50" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.09 6.26L21 9.27l-5.18 4.73L17.82 22 12 18.27 6.18 22l1.09-7.73L2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="h-px w-10 bg-[var(--gold)]/30" />
          </div>

          {/* Room pill */}
          <div
            className="mt-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-2.5 backdrop-blur-sm"
            style={{ opacity: visible ? 1 : 0, transition: "opacity 0.8s ease-out 0.3s" }}
          >
            <svg className="h-4 w-4 text-[var(--gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider text-white/40">{t(locale, "roomNumber")}</span>
            <span className="text-lg font-black text-[var(--gold)]">{room}</span>
          </div>

          {/* Headline */}
          <h1
            className="mt-8 text-center text-4xl font-black tracking-tight text-white lg:text-5xl"
            style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "all 0.8s ease-out 0.4s" }}
          >
            {t(locale, "chooseStay")}
          </h1>

          {/* Duration cards */}
          <div
            className="mt-10 grid w-full grid-cols-2 gap-5"
            style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "all 0.8s ease-out 0.6s" }}
          >
            {([2, 3] as const).map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHours(h)}
                className={`group relative overflow-hidden rounded-3xl border-2 py-10 text-center transition-all duration-300 active:scale-[0.97] ${
                  hours === h
                    ? "border-[var(--gold)] bg-[var(--gold)] text-black shadow-2xl shadow-[var(--gold)]/30"
                    : "border-white/15 bg-white/5 text-white backdrop-blur-md hover:border-white/30 hover:bg-white/10"
                }`}
              >
                {hours === h && (
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold-light)] via-[var(--gold)] to-[var(--gold)] opacity-100" />
                )}
                <div className="relative">
                  <span className={`block text-xs font-bold uppercase tracking-wider ${hours === h ? "text-black/40" : "text-white/30"}`}>
                    {t(locale, "chooseStay").split(" ")[0]}
                  </span>
                  <span className="mt-2 block text-4xl font-black">
                    {h === 2 ? t(locale, "hours2") : t(locale, "hours3")}
                  </span>
                  <span className={`mt-2 block text-base font-bold ${hours === h ? "text-black/50" : "text-white/40"}`}>
                    {formatSrd(h * hourlyRate)}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Price + CTA */}
          <div
            className="mt-8 w-full"
            style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(15px)", transition: "all 0.8s ease-out 0.8s" }}
          >
            {/* Price summary */}
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-sm">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">{t(locale, "perHour")}</p>
                <p className="text-sm text-white/50">{formatSrd(hourlyRate)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">{t(locale, "total")}</p>
                <p className="text-3xl font-black text-[var(--gold)]">{formatSrd(cost)}</p>
              </div>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={goToWelcome}
              className="animate-gold-pulse mt-5 w-full rounded-2xl bg-[var(--gold)] py-6 text-xl font-bold text-black shadow-xl shadow-[var(--gold)]/25 transition-all duration-300 hover:bg-[var(--gold-light)] hover:shadow-2xl active:scale-[0.97]"
            >
              {t(locale, "startSession")} →
            </button>
          </div>
        </div>

        {/* Footer */}
        <p
          className="mt-14 text-center text-[9px] font-semibold uppercase tracking-[0.2em] text-white/15"
          style={{ opacity: visible ? 1 : 0, transition: "opacity 1s ease-out 1.2s" }}
        >
          {t(locale, "copyright")}
        </p>
      </div>
    </div>
  );
}

export default function GuestDurationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-black">
          <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--gold)]/30" />
        </div>
      }
    >
      <DurationContent />
    </Suspense>
  );
}
