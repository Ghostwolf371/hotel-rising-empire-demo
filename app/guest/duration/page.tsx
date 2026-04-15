"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { LanguageToggle } from "@/components/language-toggle";
import { useDemo } from "@/contexts/demo-context";
import { formatSrd } from "@/lib/format";
import { t } from "@/lib/i18n";

const DEMO_ROOM = "104";
const PRESETS = [1, 2, 3] as const;
type DurationChoice = (typeof PRESETS)[number] | "custom";

const CUSTOM_HOURS_MAX = 24;

function clampHours(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.min(CUSTOM_HOURS_MAX, Math.max(1, Math.round(n)));
}

function DurationContent() {
  const router = useRouter();
  const params = useSearchParams();
  const room = params.get("room") || DEMO_ROOM;
  const { hourlyRate, locale, theme, toggleTheme } = useDemo();
  const [choice, setChoice] = useState<DurationChoice>(2);
  const [customHours, setCustomHours] = useState(12);
  const [visible, setVisible] = useState(false);

  const effectiveHours = choice === "custom" ? clampHours(customHours) : choice;
  const cost = useMemo(() => effectiveHours * hourlyRate, [effectiveHours, hourlyRate]);

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(id);
  }, []);

  function presetLabel(h: 1 | 2 | 3): string {
    if (h === 1) return t(locale, "hours1");
    if (h === 2) return t(locale, "hours2");
    return t(locale, "hours3");
  }

  function goToWelcome() {
    router.push(
      `/guest/welcome?room=${encodeURIComponent(room)}&hours=${effectiveHours}`
    );
  }

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

      {/* Top bar — in document flow + safe-area so text never sits under the OS notch */}
      <header className="relative z-20 flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--card)]/95 px-4 py-3 shadow-sm backdrop-blur-md sm:px-6 sm:py-4" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <Image src="/logo.png" alt="Empire Apartments" width={40} height={40} className="h-9 w-9 shrink-0 rounded-lg shadow-md sm:h-10 sm:w-10" />
          <span className="truncate text-sm font-black uppercase tracking-[0.12em] text-[var(--foreground)] sm:text-base sm:tracking-[0.15em]">
            {t(locale, "brand")}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LanguageToggle variant="landing" />
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-full border border-[var(--border-light)] bg-[var(--surface)] text-[var(--foreground)] transition hover:border-[var(--gold)]/40 hover:text-[var(--gold)]"
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
      </header>

      {/* Main content */}
      <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div
          className="flex w-full max-w-2xl flex-col items-center transition-all duration-1000 ease-out"
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

          {/* 1 / 2 / 3 hour presets */}
          <div
            className="mt-10 grid w-full grid-cols-3 gap-2 sm:gap-4"
            style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "all 0.8s ease-out 0.45s" }}
          >
            {PRESETS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setChoice(h)}
                className={`group relative min-h-[7.5rem] overflow-hidden rounded-2xl border-2 py-5 text-center transition-all duration-300 active:scale-[0.98] sm:min-h-[9rem] sm:rounded-3xl sm:py-8 ${
                  choice === h
                    ? "border-[var(--gold)] bg-[var(--gold)] text-black shadow-xl shadow-[var(--gold)]/25"
                    : "border-[var(--border-light)] bg-[var(--card)]/80 text-[var(--foreground)] backdrop-blur-md hover:border-[var(--gold)]/40 hover:bg-[var(--card)]"
                }`}
              >
                {choice === h && (
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold-light)] via-[var(--gold)] to-[var(--gold)] opacity-100" />
                )}
                <div className="relative flex h-full flex-col items-center justify-center px-1">
                  <span className={`block text-[10px] font-bold uppercase leading-tight tracking-wider sm:text-xs ${choice === h ? "text-black/45" : "text-[var(--muted)]"}`}>
                    {t(locale, "durationEyebrow")}
                  </span>
                  <span className="mt-1.5 block text-xl font-black leading-tight sm:mt-2 sm:text-3xl">{presetLabel(h)}</span>
                  <span className={`mt-1.5 block text-xs font-bold tabular-nums sm:mt-2 sm:text-sm ${choice === h ? "text-black/55" : "text-[var(--muted)]"}`}>
                    {formatSrd(h * hourlyRate)}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Custom duration — full-width bar */}
          <button
            type="button"
            onClick={() => setChoice("custom")}
            className={`mt-3 flex w-full min-h-[3.5rem] items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all duration-300 active:scale-[0.99] sm:mt-4 sm:min-h-[4rem] sm:rounded-2xl sm:px-5 sm:py-4 ${
              choice === "custom"
                ? "border-[var(--gold)] bg-[var(--gold)] text-black shadow-lg shadow-[var(--gold)]/20"
                : "border-[var(--border-light)] bg-[var(--card)]/85 text-[var(--foreground)] backdrop-blur-md hover:border-[var(--gold)]/40"
            }`}
            style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)", transition: "all 0.8s ease-out 0.5s" }}
          >
            <div className="min-w-0 flex-1">
              <span className={`block text-[10px] font-bold uppercase tracking-wider sm:text-xs ${choice === "custom" ? "text-black/45" : "text-[var(--muted)]"}`}>
                {t(locale, "durationCustom")}
              </span>
              <span className={`mt-0.5 block text-sm font-semibold sm:text-base ${choice === "custom" ? "text-black/70" : "text-[var(--muted)]"}`}>
                {t(locale, "durationCustomSub")}
              </span>
            </div>
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10 ${
                choice === "custom" ? "bg-black/15 text-black" : "bg-[var(--surface)] text-[var(--gold)]"
              }`}
              aria-hidden
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </span>
          </button>

          {choice === "custom" && (
            <div
              className="mt-5 w-full rounded-2xl border border-[var(--border)] bg-[var(--card)]/90 px-5 py-4 backdrop-blur-sm"
              style={{ opacity: visible ? 1 : 0, transition: "opacity 0.5s ease-out" }}
            >
              <label htmlFor="custom-hours" className="block text-left text-sm font-semibold text-[var(--foreground)]">
                {t(locale, "customHoursLabel")}
              </label>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <input
                  id="custom-hours"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={CUSTOM_HOURS_MAX}
                  value={customHours}
                  onChange={(e) => {
                    const v = Number.parseInt(e.target.value, 10);
                    setCustomHours(Number.isFinite(v) ? v : 1);
                  }}
                  onBlur={() => setCustomHours((h) => clampHours(h))}
                  className="w-full min-w-[8rem] max-w-[12rem] rounded-xl border-2 border-[var(--border-light)] bg-[var(--surface)] px-4 py-3 text-center text-2xl font-black text-[var(--foreground)] outline-none transition focus:border-[var(--gold)] focus:ring-4 focus:ring-[var(--gold)]/20 sm:text-3xl"
                />
                <span className="text-lg font-bold text-[var(--muted)]">{t(locale, "hours")}</span>
              </div>
            </div>
          )}

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
                <p className="text-3xl font-black text-[var(--gold)]">{formatSrd(cost)}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={goToWelcome}
              className="animate-gold-pulse mt-5 w-full rounded-2xl bg-[var(--gold)] py-6 text-xl font-bold text-black shadow-xl shadow-[var(--gold)]/25 transition-all duration-300 hover:bg-[var(--gold-light)] hover:shadow-2xl active:scale-[0.97]"
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
