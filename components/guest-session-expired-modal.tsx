"use client";

import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  GuestChoiceCountdownBar,
  GUEST_RATE_IDLE_AFTER_DISMISS_MS,
  GUEST_TIMED_CHOICE_MS,
} from "@/components/guest-choice-countdown-bar";
import { GuestChoiceCountdownPortal } from "@/components/guest-choice-countdown-portal";
import { useTimeLeft } from "@/components/room-timer";
import { useDemo } from "@/contexts/demo-context";
import { useGuestSessionExpiryUi } from "@/contexts/guest-session-expiry-ui";
import { formatSrd } from "@/lib/format";
import { guestPath } from "@/lib/guest-routes";
import { t } from "@/lib/i18n";

type ExpiredView = "choice" | "extend";

function ExpiredModalIdleChooser({
  onAutoEnd,
  ariaLabel,
}: {
  onAutoEnd: () => void;
  ariaLabel: string;
}) {
  const [countdownVisible, setCountdownVisible] = useState(true);
  const countdownDismissedRef = useRef(false);
  const initialTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function clearInitial() {
      if (initialTimerRef.current !== null) {
        clearTimeout(initialTimerRef.current);
        initialTimerRef.current = null;
      }
    }

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
        onAutoEnd();
      }, GUEST_RATE_IDLE_AFTER_DISMISS_MS);
    }

    function onActivity() {
      if (!countdownDismissedRef.current) {
        countdownDismissedRef.current = true;
        setCountdownVisible(false);
        clearInitial();
        scheduleIdleEnd();
        return;
      }
      scheduleIdleEnd();
    }

    initialTimerRef.current = setTimeout(() => {
      initialTimerRef.current = null;
      onAutoEnd();
    }, GUEST_TIMED_CHOICE_MS);

    window.addEventListener("pointerdown", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);

    return () => {
      clearInitial();
      clearIdle();
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
    };
  }, [onAutoEnd]);

  if (!countdownVisible) return null;

  return (
    <GuestChoiceCountdownPortal>
      <div className="guest-choice-countdown-slot" data-slot="guest-session-expired">
        <GuestChoiceCountdownBar active ariaLabel={ariaLabel} className="px-6" />
      </div>
    </GuestChoiceCountdownPortal>
  );
}

export function GuestSessionExpiredModal() {
  const router = useRouter();
  const { sessionExpiredOpen, closeSessionExpiredModal } = useGuestSessionExpiryUi();
  const { guestSession, dispatch, locale, hourlyRate, registeredGuestRoom } = useDemo();
  const [view, setView] = useState<ExpiredView>("choice");
  const [extendHours, setExtendHours] = useState(2);

  const endsAt = guestSession?.sessionEndsAt ?? 0;
  const leftMs = useTimeLeft(endsAt);
  const extendCost = extendHours * hourlyRate;

  const finishToDuration = useCallback(() => {
    if (guestSession) {
      dispatch({ type: "END_GUEST_SESSION" });
    }
    closeSessionExpiredModal();
    setView("choice");
    router.replace(guestPath("/guest/duration", registeredGuestRoom));
  }, [
    guestSession,
    dispatch,
    closeSessionExpiredModal,
    router,
    registeredGuestRoom,
  ]);

  useEffect(() => {
    if (!sessionExpiredOpen) {
      setView("choice");
      return;
    }
    if (!guestSession) {
      closeSessionExpiredModal();
      return;
    }
    if (leftMs > 0) {
      closeSessionExpiredModal();
    }
  }, [sessionExpiredOpen, guestSession, leftMs, closeSessionExpiredModal]);

  if (!sessionExpiredOpen || !guestSession) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[55] flex items-center justify-center bg-black/70 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:px-6"
        role="presentation"
      >
        <div
          className="animate-fade-in-scale w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--card)] px-6 py-8 shadow-2xl sm:px-8 sm:py-10"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="session-expired-title"
        >
          {view === "choice" ? (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
                <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2
                id="session-expired-title"
                className="mt-6 text-center text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl"
              >
                {t(locale, "extendSessionTitle")}
              </h2>
              <p className="mt-3 text-center text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                {t(locale, "extendSessionSub")}
              </p>
              <div className="mt-8 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setView("extend")}
                  className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-[var(--gold)] py-4 text-lg font-bold text-[var(--dark)] shadow-lg transition hover:bg-[var(--gold-light)] active:scale-[0.99]"
                >
                  {t(locale, "addTime")}
                </button>
                <button
                  type="button"
                  onClick={finishToDuration}
                  className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-2xl border-2 border-[var(--border-light)] bg-[var(--surface)] py-4 text-lg font-bold text-[var(--foreground)] transition hover:border-red-500/40 hover:bg-red-500/10 active:scale-[0.99]"
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
              <div className="mt-8 overflow-x-auto px-1 [-webkit-overflow-scrolling:touch]">
                <div className="flex min-w-[min(100%,18rem)] justify-between gap-1 px-[2px] sm:min-w-0">
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
                <div className="relative mt-3">
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

      {view === "choice" ? (
        <ExpiredModalIdleChooser
          onAutoEnd={finishToDuration}
          ariaLabel={t(locale, "guestTimerAria")}
        />
      ) : null}
    </>
  );
}
