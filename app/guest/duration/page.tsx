"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { GuestFlowHeader, guestFlowThemeButtonClassName } from "@/components/guest-flow-header";
import { LanguageToggle } from "@/components/language-toggle";
import { useDemo } from "@/contexts/demo-context";
import { formatSrd } from "@/lib/format";
import { t } from "@/lib/i18n";

const DEMO_ROOM = "104";

function clampHours(n: number): number {
  if (!Number.isFinite(n)) return 4;
  return Math.max(4, Math.round(n));
}

function DurationContent() {
  const router = useRouter();
  const params = useSearchParams();
  const room = params.get("room") || DEMO_ROOM;
  const { hourlyRate, locale, theme, toggleTheme, dispatch } = useDemo();

  const [choice, setChoice] = useState<"preset" | "custom">("preset");
  const [customHours, setCustomHours] = useState(12);
  const [visible, setVisible] = useState(false);

  const effectiveHours = choice === "custom" ? clampHours(customHours) : 2;
  const cost = useMemo(() => effectiveHours * hourlyRate, [effectiveHours, hourlyRate]);

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(id);
  }, []);

  function goToStart() {
    dispatch({
      type: "START_GUEST_SESSION",
      roomNumber: room,
      durationHours: effectiveHours,
    });
    router.push("/guest/start");
  }

  const cardBase =
    "group relative overflow-hidden rounded-2xl border-2 py-6 text-center touch-manipulation " +
    "transition-[border-color,background-color,box-shadow,transform] motion-safe:duration-450 motion-safe:ease-out " +
    "motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lg " +
    "motion-safe:active:translate-y-0 motion-safe:active:transition-transform motion-safe:active:duration-150 " +
    "focus-visible:-translate-y-px focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--gold)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]";

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[var(--background)]">
      {/* Brand gradient background */}
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

      <GuestFlowHeader>
        <Link
          href="/"
          className="flex h-11 min-w-0 items-center gap-3 transition opacity-90 hover:opacity-100"
        >
          <Image
            src="/logo.png"
            alt={t(locale, "brand")}
            width={40}
            height={40}
            className="h-9 w-9 shrink-0 self-center rounded-lg shadow-lg sm:h-10 sm:w-10"
          />
          <span className="truncate text-sm font-black uppercase leading-none tracking-[0.2em] text-[var(--gold)]">
            {t(locale, "brand")}
          </span>
        </Link>
        <div className="flex h-11 min-h-[44px] shrink-0 items-center gap-2">
          <LanguageToggle variant="landing" />
          <button
            type="button"
            onClick={toggleTheme}
            className={guestFlowThemeButtonClassName}
            aria-label={theme === "dark" ? t(locale, "lightMode") : t(locale, "darkMode")}
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
      </GuestFlowHeader>

      {/* Main content */}
      <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div
          className="flex w-full max-w-xl flex-col items-center transition-all duration-1000 ease-out"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(30px)" }}
        >
          {/* Room pill */}
          <div
            className="inline-flex items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--card)]/85 px-6 py-2.5 shadow-sm backdrop-blur-sm"
            style={{ opacity: visible ? 1 : 0, transition: "opacity 0.8s ease-out 0.15s" }}
          >
            <svg className="h-4 w-4 text-[var(--gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{t(locale, "roomNumber")}</span>
            <span className="text-lg font-black text-[var(--gold)]">{room}</span>
          </div>

          {/* Headline */}
          <h1
            className="mt-8 text-center text-4xl font-black tracking-tight text-[var(--foreground)] lg:text-5xl"
            style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "all 0.8s ease-out 0.25s" }}
          >
            {t(locale, "chooseStay")}
          </h1>

          {/* Duration picker */}
          <div
            className="mt-8 w-full"
            style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.8s ease-out 0.45s, transform 0.8s ease-out 0.45s" }}
          >
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* 2 hours card */}
              <button
                type="button"
                onClick={() => setChoice("preset")}
                className={`${cardBase} ${
                  choice === "preset"
                    ? "border-[var(--gold)] bg-[var(--gold)] text-black shadow-xl shadow-[var(--gold)]/25"
                    : "border-[var(--border-light)] bg-[var(--card)]/90 text-[var(--foreground)] hover:border-[var(--gold)]/55 motion-safe:hover:shadow-[var(--gold)]/8"
                }`}
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--gold-light)] via-[var(--gold)] to-[var(--gold)] transition-opacity motion-safe:duration-450 ${
                    choice === "preset" ? "opacity-100" : "opacity-0 group-hover:opacity-[0.18]"
                  }`}
                  aria-hidden
                />
                <div className="relative flex flex-col items-center gap-1">
                  <span className={`text-xs font-bold uppercase tracking-wider ${choice === "preset" ? "text-black/45" : "text-[var(--muted)]"}`}>
                    {t(locale, "durationEyebrow")}
                  </span>
                  <span className="text-3xl font-black sm:text-4xl">{t(locale, "hours2")}</span>
                  <span className={`text-sm font-semibold tabular-nums ${choice === "preset" ? "text-black/60" : "text-[var(--muted)]"}`}>
                    {formatSrd(2 * hourlyRate)}
                  </span>
                </div>
              </button>

              {/* Custom card */}
              <button
                type="button"
                onClick={() => setChoice("custom")}
                className={`${cardBase} ${
                  choice === "custom"
                    ? "border-[var(--gold)] bg-[var(--gold)] text-black shadow-xl shadow-[var(--gold)]/25"
                    : "border-[var(--border-light)] bg-[var(--card)]/90 text-[var(--foreground)] hover:border-[var(--gold)]/55 motion-safe:hover:shadow-[var(--gold)]/8"
                }`}
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--gold-light)] via-[var(--gold)] to-[var(--gold)] transition-opacity motion-safe:duration-450 ${
                    choice === "custom" ? "opacity-100" : "opacity-0 group-hover:opacity-[0.18]"
                  }`}
                  aria-hidden
                />
                <div className="relative flex flex-col items-center gap-1">
                  <span className={`text-xs font-bold uppercase tracking-wider ${choice === "custom" ? "text-black/45" : "text-[var(--muted)]"}`}>
                    {t(locale, "durationEyebrow")}
                  </span>
                  <span className="text-3xl font-black sm:text-4xl">{t(locale, "durationCustom")}</span>
                  <span className={`text-sm font-semibold ${choice === "custom" ? "text-black/60" : "text-[var(--muted)]"}`}>
                    {t(locale, "durationCustomSub")}
                  </span>
                </div>
              </button>
            </div>

            {/* Custom hours panel */}
            {choice === "custom" && (
              <div className="mt-3 w-full">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/95 px-5 py-4 shadow-lg shadow-black/20 sm:shadow-black/14 motion-safe:[animation:duration-choice-in_0.32s_ease-out_both] motion-safe:[will-change:opacity,transform]">
                  <label htmlFor="custom-hours" className="block text-left text-sm font-semibold text-[var(--foreground)]">
                    {t(locale, "customHoursLabel")}
                  </label>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <input
                      id="custom-hours"
                      type="number"
                      inputMode="numeric"
                      min={4}
                      value={customHours}
                      onChange={(e) => {
                        const v = Number.parseInt(e.target.value, 10);
                        setCustomHours(Number.isFinite(v) ? v : 1);
                      }}
                      onBlur={() => setCustomHours((h) => clampHours(h))}
                      className="motion-safe:duration-300 w-full min-w-[8rem] max-w-[12rem] rounded-xl border-2 border-[var(--border-light)] bg-[var(--surface)] px-4 py-3 text-center text-2xl font-black text-[var(--foreground)] outline-none transition-colors motion-safe:ease-out focus:border-[var(--gold)] focus:ring-[3px] focus:ring-[var(--gold)]/25 hover:border-[color-mix(in_srgb,var(--gold)_52%,transparent)] sm:text-3xl sm:focus:ring-4"
                    />
                    <span className="motion-safe:duration-200 text-lg font-bold motion-safe:ease-out text-[var(--muted)]">{t(locale, "hours")}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Price + CTA */}
          <div
            className="mt-8 w-full"
            style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(15px)", transition: "all 0.8s ease-out 0.65s" }}
          >
            <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)]/85 px-6 py-4 backdrop-blur-sm">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">{t(locale, "perHour")}</p>
                <p className="text-sm text-[var(--foreground)]">{formatSrd(hourlyRate)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">{t(locale, "total")}</p>
                <p key={`total-${effectiveHours}-${cost}`} className="text-3xl font-black motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] text-[var(--gold)] motion-safe:[animation:duration-choice-total_0.38s_ease-out_both] motion-reduce:[animation-duration:0ms] tabular-nums">
                  {formatSrd(cost)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={goToStart}
              className="animate-gold-pulse mt-5 w-full rounded-2xl bg-[var(--gold)] py-6 text-xl font-bold text-black shadow-xl shadow-[var(--gold)]/25 transition-[transform,box-shadow] duration-300 motion-safe:ease-out hover:bg-[var(--gold-light)] hover:shadow-2xl focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--gold)]/65 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] motion-safe:active:scale-[0.985]"
            >
              {t(locale, "startSession")} →
            </button>
          </div>
        </div>

        <p
          className="mt-14 text-center text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]"
          style={{ opacity: visible ? 1 : 0, transition: "opacity 1s ease-out 1s" }}
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
        <div className="flex min-h-dvh items-center justify-center bg-[var(--background)]">
          <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--gold)]/30" />
        </div>
      }
    >
      <DurationContent />
    </Suspense>
  );
}
