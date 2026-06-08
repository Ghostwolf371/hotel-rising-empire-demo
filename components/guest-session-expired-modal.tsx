"use client";

import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { GUEST_RATE_IDLE_AFTER_DISMISS_MS } from "@/components/guest-choice-countdown-bar";
import { useTimeLeft } from "@/components/room-timer";
import { useDemo } from "@/contexts/demo-context";
import { useGuestSessionExpiryUi } from "@/contexts/guest-session-expiry-ui";
import { formatSrd } from "@/lib/format";
import { clearGuestLanguageChosen } from "@/lib/guest-language-chosen";
import { guestPath } from "@/lib/guest-routes";
import { t } from "@/lib/i18n";

type ExpiredView = "choice" | "extend" | "checkout-sent";

/** After 5 minutes of no touch, end session and go to feedback. Resets on activity. */
function ExpiredModalIdleTimeout({ onIdleEnd }: { onIdleEnd: () => void }) {
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function clearIdle() {
      if (idleTimerRef.current !== null) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    }

    function scheduleIdleEnd() {
      clearIdle();
      idleTimerRef.current = setTimeout(() => {
        idleTimerRef.current = null;
        onIdleEnd();
      }, GUEST_RATE_IDLE_AFTER_DISMISS_MS);
    }

    function onActivity() {
      scheduleIdleEnd();
    }

    scheduleIdleEnd();

    window.addEventListener("pointerdown", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);

    return () => {
      clearIdle();
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
    };
  }, [onIdleEnd]);

  return null;
}

export function GuestSessionExpiredModal() {
  const router = useRouter();
  const { sessionExpiredOpen, closeSessionExpiredModal } = useGuestSessionExpiryUi();
  const {
    guestSession,
    dispatch,
    locale,
    hourlyRate,
    registeredGuestRoom,
    guestPostSessionEndNavRef,
  } = useDemo();
  const [view, setView] = useState<ExpiredView>("choice");
  const [extendHours, setExtendHours] = useState(2);
  const [checkoutRoomNumber, setCheckoutRoomNumber] = useState<string | null>(null);

  const endsAt = guestSession?.sessionEndsAt ?? 0;
  const leftMs = useTimeLeft(endsAt);
  const extendCost = extendHours * hourlyRate;

  const dismissCheckoutSent = useCallback(() => {
    closeSessionExpiredModal();
    setView("choice");
    setCheckoutRoomNumber(null);
    router.replace(guestPath("/guest/language", checkoutRoomNumber ?? registeredGuestRoom));
  }, [closeSessionExpiredModal, router, checkoutRoomNumber, registeredGuestRoom]);

  const requestCheckout = useCallback(() => {
    const room = guestSession?.roomNumber ?? registeredGuestRoom;
    if (guestSession) {
      clearGuestLanguageChosen();
      guestPostSessionEndNavRef.current.skipDurationRedirectOnce = true;
      dispatch({ type: "END_GUEST_SESSION" });
    }
    setCheckoutRoomNumber(room);
    setView("checkout-sent");
  }, [guestSession, guestPostSessionEndNavRef, dispatch, registeredGuestRoom]);

  useEffect(() => {
    if (!sessionExpiredOpen) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [sessionExpiredOpen]);

  useEffect(() => {
    if (!sessionExpiredOpen) {
      setView("choice");
      return;
    }
    if (!guestSession && view !== "checkout-sent") {
      closeSessionExpiredModal();
      return;
    }
    if (guestSession && leftMs > 0) {
      closeSessionExpiredModal();
    }
  }, [sessionExpiredOpen, guestSession, leftMs, view, closeSessionExpiredModal]);

  if (!sessionExpiredOpen) return null;
  if (!guestSession && view !== "checkout-sent") return null;

  const roomNumber = guestSession?.roomNumber ?? checkoutRoomNumber;

  return (
    <>
      <div
        className="fixed inset-0 z-[55] flex touch-none flex-col items-center justify-center overflow-hidden bg-black/70 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:px-6"
        role="presentation"
      >
        <div
          className="animate-fade-in-scale max-h-[min(88dvh,720px)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-3xl border border-[var(--border)] bg-[var(--card)] px-6 py-8 text-center shadow-2xl sm:px-8 max-h-[850px]:py-6"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="session-expired-title"
        >
          {view === "checkout-sent" && roomNumber ? (
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--gold)]/15 text-[var(--gold)] ring-2 ring-[var(--gold)]/20">
                <svg className="h-11 w-11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <p className="mt-6 text-2xl font-black tracking-tight text-[var(--foreground)]">
                {t(locale, "checkoutSentTitle")}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/30 bg-[var(--gold)]/10 px-4 py-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{t(locale, "roomNumber")}</span>
                <span className="text-lg font-black text-[var(--gold)]">{roomNumber}</span>
              </div>
              <p className="mt-5 text-left text-base leading-relaxed text-[var(--muted)]">{t(locale, "checkoutSentBody")}</p>
              <p className="mt-4 text-xs font-medium text-[var(--muted)]">{t(locale, "checkoutSentDemo")}</p>
              <button
                type="button"
                onClick={dismissCheckoutSent}
                className="mt-8 w-full touch-manipulation rounded-2xl bg-[var(--gold)] py-4 text-lg font-bold text-[var(--dark)] shadow-lg transition hover:bg-[var(--gold-light)] active:scale-[0.98] sm:py-5"
              >
                {t(locale, "checkoutSentDismiss")}
              </button>
            </>
          ) : view === "choice" ? (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
                <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2
                id="session-expired-title"
                className="mt-6 text-center text-2xl font-black leading-tight tracking-tight text-[var(--foreground)] sm:text-3xl"
              >
                {t(locale, "extendSessionTitle")}
              </h2>
              <p className="mt-3 text-center text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                {t(locale, "extendSessionSub")}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={() => setView("extend")}
                  className="min-h-[52px] flex-1 rounded-2xl bg-[var(--gold)] px-6 py-4 text-lg font-bold text-[var(--dark)] shadow-lg transition hover:bg-[var(--gold-light)] active:scale-[0.99] sm:min-w-[200px] sm:flex-none"
                >
                  {t(locale, "addTime")}
                </button>
                <button
                  type="button"
                  onClick={requestCheckout}
                  className="min-h-[52px] flex-1 rounded-2xl border-2 border-[var(--border-light)] bg-[var(--surface)] px-6 py-4 text-lg font-bold text-[var(--foreground)] transition hover:border-[var(--gold)]/40 hover:bg-[var(--card-hover)] active:scale-[0.99] sm:min-w-[200px] sm:flex-none"
                >
                  {t(locale, "endNow")}
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setView("choice")}
                className="text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--gold)]"
              >
                ← {t(locale, "back")}
              </button>
              <h3 className="mt-4 text-center text-2xl font-bold text-[var(--gold)]">
                {t(locale, "extendModalTitle")}
              </h3>
              <p className="mt-3 text-center text-sm leading-relaxed text-[var(--muted)]">
                {t(locale, "extendModalIntro")}
              </p>
              <div className="mt-6 px-1">
                <div className="grid grid-cols-6 gap-1 px-[2px]">
                  {[1, 2, 3, 4, 5, 6].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setExtendHours(h)}
                      className={`flex min-h-11 min-w-10 touch-manipulation flex-col items-center justify-center gap-1 transition-all duration-200 sm:min-h-0 ${extendHours === h ? "scale-110" : ""}`}
                    >
                      <span
                        className={`text-base font-black transition-colors duration-200 ${h <= extendHours ? "text-[var(--gold)]" : "text-[var(--muted)]"}`}
                      >
                        +{h}u
                      </span>
                    </button>
                  ))}
                </div>
                <div className="gold-slider-wrap mt-3">
                  <div className="gold-slider-track">
                    <input
                      type="range"
                      min={1}
                      max={6}
                      step={1}
                      value={extendHours}
                      onChange={(e) => setExtendHours(Number(e.target.value))}
                      className="gold-slider"
                      style={
                        {
                          "--slider-pct": `${((extendHours - 1) / 5) * 100}%`,
                        } as CSSProperties
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--gold)]/20 bg-[var(--gold)]/5">
                <div className="flex items-center justify-between px-6 py-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                      {t(locale, "extraCost")}
                    </p>
                    <p className="mt-0.5 text-sm text-[var(--muted)]">
                      {extendHours} × {formatSrd(hourlyRate)}
                    </p>
                  </div>
                  <p className="text-3xl font-black text-[var(--gold)]">{formatSrd(extendCost)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: "EXTEND_GUEST_SESSION", extraHours: extendHours });
                  closeSessionExpiredModal();
                  setView("choice");
                }}
                className="mt-6 w-full rounded-2xl bg-[var(--gold)] py-5 text-lg font-bold text-[var(--dark)] shadow-lg transition hover:bg-[var(--gold-light)] active:scale-[0.98]"
              >
                {t(locale, "extendBy")} {extendHours} {t(locale, "hours")} →
              </button>
            </>
          )}
        </div>
      </div>

      {view !== "checkout-sent" && <ExpiredModalIdleTimeout onIdleEnd={requestCheckout} />}
    </>
  );
}
