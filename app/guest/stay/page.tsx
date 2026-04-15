"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
    router.replace("/guest/duration");
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

      <header className="relative z-20 flex items-center justify-between gap-3 px-4 py-4 sm:px-8 sm:py-5">
        <div className="flex min-w-0 items-center gap-3">
          <Image src="/logo.png" alt={t(locale, "brand")} width={40} height={40} className="rounded-lg shadow-lg" />
          <span className="truncate text-sm font-black uppercase tracking-[0.2em] text-[var(--gold)]">{t(locale, "brand")}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageToggle variant="landing" />
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-full border border-[var(--border-light)] bg-[var(--surface)] text-[var(--foreground)] backdrop-blur-sm transition hover:border-[var(--gold)]/40 hover:text-[var(--gold)]"
            title={theme === "dark" ? t(locale, "lightMode") : t(locale, "darkMode")}
          >
            {theme === "dark" ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center px-4 py-8 sm:px-6 sm:py-12">
        <p className="mb-6 text-center text-sm font-semibold text-[var(--muted)]">{t(locale, "yourStay")}</p>
        <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)]/90 shadow-2xl backdrop-blur-sm">
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
          className="mt-10 flex w-full max-w-lg min-h-[52px] touch-manipulation items-center justify-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--gold)_55%,transparent)] bg-[var(--gold)] px-6 py-4 text-center text-base font-black tracking-wide text-[var(--dark)] shadow-lg shadow-[color-mix(in_srgb,var(--gold)_35%,transparent)] transition hover:bg-[var(--gold-light)] hover:shadow-xl active:scale-[0.98]"
        >
          <svg className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
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
