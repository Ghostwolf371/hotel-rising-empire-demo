"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { guestPath } from "@/lib/guest-routes";
import { useEffect } from "react";
import { GuestFlowHeader, guestFlowThemeButtonClassName } from "@/components/guest-flow-header";
import { LanguageToggle } from "@/components/language-toggle";
import { GuestSessionModals } from "@/components/guest-session-modals";
import { GuestSessionPanel } from "@/components/guest-session-panel";
import { useDemo } from "@/contexts/demo-context";
import { formatTimeRange } from "@/lib/format";
import { useGuestSessionUi } from "@/hooks/use-guest-session-ui";
import { t } from "@/lib/i18n";

export default function GuestStayOnlyPage() {
  const router = useRouter();
  const { locale, theme, toggleTheme, guestPostSessionEndNavRef } = useDemo();
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

  useEffect(() => {
    if (guestSession) return;
    if (guestPostSessionEndNavRef.current.skipDurationRedirectOnce) {
      guestPostSessionEndNavRef.current.skipDurationRedirectOnce = false;
      return;
    }
    router.replace(guestPath("/guest/duration"));
  }, [guestSession, router, guestPostSessionEndNavRef]);

  if (!guestSession) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--background)]">
        <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--gold)]/30" />
      </div>
    );
  }

  const start = new Date(guestSession.sessionStartedAt);
  const end = new Date(guestSession.sessionEndsAt);
  const range = formatTimeRange(start, end, locale);
  const nearlyDone = leftMs > 0 && leftMs < 15 * 60 * 1000;

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
        <div
          className="flex h-11 min-w-0 items-center gap-3 opacity-90"
          aria-hidden
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
        </div>
        <div className="flex h-11 min-h-[44px] shrink-0 items-center gap-2">
          <LanguageToggle variant="landing" />
          <button
            type="button"
            onClick={toggleTheme}
            className={guestFlowThemeButtonClassName}
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
      </GuestFlowHeader>

      {/* `justify-center` keeps the session card + menu CTA vertically
          centered, so on short landscape tablets the "Browse menu" button
          never falls below the fold. `max-w-xl` on tablet gives the card
          more horizontal presence than the previous `max-w-lg` (which left
          a lot of empty side margin on an 11" tablet). */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-4 sm:px-6 sm:py-6">
        <p className="mb-3 text-center text-sm font-semibold text-[var(--muted)] sm:mb-4">{t(locale, "yourStay")}</p>
        <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)]/90 shadow-2xl backdrop-blur-sm sm:max-w-xl">
          <GuestSessionPanel
            variant="fullscreen"
            guestSession={guestSession}
            locale={locale}
            leftMs={leftMs}
            range={range}
            nearlyDone={nearlyDone}
            onAddTime={() => setModal("extend")}
            onEndNow={() => setModal("confirm-end")}
            onStaffAlert={panic}
          />
        </div>
        <Link
          href="/guest"
          className="mt-4 flex w-full max-w-lg min-h-[48px] touch-manipulation items-center justify-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--gold)_55%,transparent)] bg-[var(--gold)] px-6 py-3.5 text-center text-base font-black tracking-wide text-[var(--dark)] shadow-lg shadow-[color-mix(in_srgb,var(--gold)_35%,transparent)] transition hover:bg-[var(--gold-light)] hover:shadow-xl active:scale-[0.98] sm:mt-5 sm:max-w-xl"
        >
          <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M9.25 2.1c0 2.95-1.5 5.5-3.5 6.85V21.9h1.65V8.95c2-1.35 3.5-3.9 3.5-6.85 0-1-.85-1.85-1.85-1.85S7.4 1.45 6.5 2.1s2.75 0 2.75 0ZM8.1 2.1h.75v4.75c0 1.35-.85 2.45-2 2.95v12.1H5.1V9.8c-1.15-.5-2-1.6-2-2.95V2.1h5ZM7.35 2.1h.55v2.65c0 .5-.4.9-.9.9s-.9-.4-.9-.9V2.1h1.25ZM6.2 2.1h.55v2.65c0 .5-.4.9-.9.9s-.9-.4-.9-.9V2.1h.55Z" transform="rotate(-36 12 12)" />
            <path d="M15.1 2.35 20.65 8.6 16.2 21.75l-1.55-.4 3.45-9.55L13.75 3.55l1.35-1.2Z" />
          </svg>
          {t(locale, "staySwitchToMenu")}
        </Link>
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
