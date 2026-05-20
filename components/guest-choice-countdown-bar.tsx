"use client";

import { useLayoutEffect, useRef } from "react";

/** Must stay in sync with guest idle redirects (ms). */
export const GUEST_TIMED_CHOICE_MS = 5000;

/** Rate page: after the guest dismisses the countdown, redirect if still idle. */
export const GUEST_RATE_IDLE_AFTER_DISMISS_MS = 5 * 60 * 1000;

export function GuestChoiceCountdownBar({
  active,
  className = "",
  ariaLabel = "Selection timer",
}: {
  /** When true, fill runs linearly left → right over {@link GUEST_TIMED_CHOICE_MS}. */
  active: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const fillElRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!active) return;
    const el = fillElRef.current;
    if (!el) return;

    /** Reset animation so each `active` pass runs a full-duration stroke (avoids snapped width). */
    el.style.animation = "none";
    el.style.transform = "scaleX(0)";
    void el.offsetHeight;
    el.style.animation = `guest-choice-bar-fill-lr ${GUEST_TIMED_CHOICE_MS}ms linear forwards`;

    return () => {
      el.style.animation = "none";
    };
  }, [active]);

  return (
    <div className={`w-full ${className}`}>
      <div
        className="guest-choice-bar-track relative mx-auto h-1.5 w-full max-w-[15rem] overflow-hidden rounded-full bg-[var(--border)] sm:max-w-[17rem]"
        role="progressbar"
        aria-label={ariaLabel}
      >
        <div
          ref={fillElRef}
          aria-hidden
          className="h-full w-full origin-left rounded-full bg-gradient-to-r from-[var(--gold-dim)] via-[var(--gold)] to-[var(--gold-light)] will-change-transform"
          style={{ transform: "scaleX(0)" }}
        />
      </div>
    </div>
  );
}
