"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { GuestFlowHeader, guestFlowThemeButtonClassName } from "@/components/guest-flow-header";
import { useDemo } from "@/contexts/demo-context";
import { GUEST_LANGUAGE_OPTIONS } from "@/lib/guest-languages";
import {
  clearGuestLanguageChosen,
  markGuestLanguageChosen,
} from "@/lib/guest-language-chosen";
import { guestPath } from "@/lib/guest-routes";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

const STAFF_LOGOUT_TAPS = 5;
const STAFF_LOGOUT_TAP_WINDOW_MS = 2000;

function LanguageContent() {
  const router = useRouter();
  const {
    locale,
    setLocale,
    theme,
    toggleTheme,
    registeredGuestRoom,
    guestSession,
    dispatch,
    unbindGuestDeviceRoom,
  } = useDemo();
  const room = registeredGuestRoom ?? "";

  const [visible, setVisible] = useState(false);
  const [logoutTapCount, setLogoutTapCount] = useState(0);
  const logoutTapResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (guestSession) {
      router.replace("/guest/start");
    }
  }, [guestSession, router]);

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    return () => {
      if (logoutTapResetRef.current) clearTimeout(logoutTapResetRef.current);
    };
  }, []);

  function handleLogoTap() {
    if (logoutTapResetRef.current) clearTimeout(logoutTapResetRef.current);
    const next = logoutTapCount + 1;
    if (next >= STAFF_LOGOUT_TAPS) {
      setLogoutTapCount(0);
      if (guestSession) dispatch({ type: "END_GUEST_SESSION" });
      clearGuestLanguageChosen();
      unbindGuestDeviceRoom();
      router.replace("/");
      return;
    }
    setLogoutTapCount(next);
    logoutTapResetRef.current = setTimeout(() => {
      setLogoutTapCount(0);
      logoutTapResetRef.current = null;
    }, STAFF_LOGOUT_TAP_WINDOW_MS);
  }

  function selectLanguage(code: Locale) {
    setLocale(code);
    markGuestLanguageChosen();
    router.push(guestPath("/guest/duration", room));
  }

  if (guestSession) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--background)]">
        <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--gold)]/30" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[var(--background)]">
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
        <button
          type="button"
          onClick={handleLogoTap}
          className="flex h-11 min-w-0 items-center gap-3 transition opacity-90 hover:opacity-100"
          aria-label={t(locale, "brand")}
        >
          <Image
            src="/logo.png"
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 shrink-0 self-center rounded-lg shadow-lg sm:h-10 sm:w-10"
          />
          <span className="truncate text-sm font-black uppercase leading-none tracking-[0.2em] text-[var(--gold)]">
            {t(locale, "brand")}
          </span>
        </button>
        <div className="flex h-11 min-h-[44px] shrink-0 items-center gap-2">
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

      <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div
          className="flex w-full max-w-2xl flex-col items-center transition-all duration-1000 ease-out"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(30px)" }}
        >
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

          <h1
            className="mt-8 text-center text-3xl font-black tracking-tight text-[var(--foreground)] sm:text-4xl"
            style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "all 0.8s ease-out 0.25s" }}
          >
            {t(locale, "chooseLanguage")}
          </h1>

          <ul
            className="mt-10 grid w-full grid-cols-2 gap-3 sm:gap-4"
            role="listbox"
            aria-label={t(locale, "chooseLanguage")}
            style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "all 0.8s ease-out 0.45s" }}
          >
            {GUEST_LANGUAGE_OPTIONS.map((opt, index) => {
              const isLastOdd =
                index === GUEST_LANGUAGE_OPTIONS.length - 1 &&
                GUEST_LANGUAGE_OPTIONS.length % 2 !== 0;
              return (
                <li
                  key={opt.locale}
                  role="presentation"
                  className={isLastOdd ? "col-span-2 flex justify-center" : ""}
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={locale === opt.locale}
                    onClick={() => selectLanguage(opt.locale)}
                    className={`group flex w-full touch-manipulation items-center gap-3 rounded-2xl border-2 border-[var(--border-light)] bg-[var(--card)]/90 px-4 py-4 text-left shadow-md transition-[border-color,background-color,box-shadow,transform] motion-safe:duration-300 motion-safe:ease-out hover:border-[var(--gold)]/55 hover:bg-[var(--card-hover)] motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg motion-safe:active:scale-[0.99] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--gold)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] sm:gap-4 sm:px-5 sm:py-5 ${
                      isLastOdd ? "max-w-[calc(50%-0.375rem)] sm:max-w-[calc(50%-0.5rem)]" : ""
                    }`}
                  >
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-2xl leading-none shadow-inner sm:h-14 sm:w-14 sm:text-3xl"
                      aria-hidden
                    >
                      {opt.flag}
                    </span>
                    <span className="text-xl font-black text-[var(--foreground)] sm:text-2xl">{opt.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
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

export default function GuestLanguagePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[var(--background)]">
          <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--gold)]/30" />
        </div>
      }
    >
      <LanguageContent />
    </Suspense>
  );
}
