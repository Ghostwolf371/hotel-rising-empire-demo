"use client";

import type { CSSProperties } from "react";
import type { GuestSession } from "@/contexts/demo-context";
import { formatSrd } from "@/lib/format";
import type { Locale } from "@/lib/types";
import { t } from "@/lib/i18n";
import type { GuestModal } from "@/hooks/use-guest-session-ui";

interface GuestSessionModalsProps {
  modal: GuestModal;
  setModal: (m: GuestModal) => void;
  guestSession: GuestSession;
  locale: Locale;
  extendHours: number;
  setExtendHours: (n: number) => void;
  hourlyRate: number;
  confirmExtend: () => void;
  endSession: () => void;
}

export function GuestSessionModals({
  modal,
  setModal,
  guestSession,
  locale,
  extendHours,
  setExtendHours,
  hourlyRate,
  confirmExtend,
  endSession,
}: GuestSessionModalsProps) {
  const extendCost = extendHours * hourlyRate;

  return (
    <>
      {modal === "panic-sent" && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md sm:p-6"
          onClick={() => setModal(null)}
          role="presentation"
        >
          <div
            className="animate-fade-in-scale w-full max-w-md rounded-3xl border border-red-500/25 bg-[var(--card)] px-6 py-9 text-center shadow-2xl shadow-red-900/20 sm:px-8 sm:py-10"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="panic-sent-title"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/15 text-red-400 ring-2 ring-red-500/20">
              <svg className="h-11 w-11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z" />
              </svg>
            </div>
            <p id="panic-sent-title" className="mt-6 text-2xl font-black tracking-tight text-[var(--foreground)]">
              {t(locale, "panicSentTitle")}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/30 bg-[var(--gold)]/10 px-4 py-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{t(locale, "roomNumber")}</span>
              <span className="text-lg font-black text-[var(--gold)]">{guestSession.roomNumber}</span>
            </div>
            <p className="mt-5 text-left text-base leading-relaxed text-[var(--muted)]">{t(locale, "panicSentBody")}</p>
            <p className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left text-sm leading-relaxed text-[var(--foreground)]">
              {t(locale, "panicSentReassure")}
            </p>
            <p className="mt-4 text-xs font-medium text-[var(--muted)]">{t(locale, "panicSentDemo")}</p>
            <button
              type="button"
              onClick={() => setModal(null)}
              className="mt-8 w-full touch-manipulation rounded-2xl bg-[var(--gold)] py-4 text-lg font-bold text-[var(--dark)] shadow-lg transition hover:bg-[var(--gold-light)] active:scale-[0.98] sm:py-5"
            >
              {t(locale, "panicSentDismiss")}
            </button>
          </div>
        </div>
      )}

      {modal === "confirm-end" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-md">
          <div className="animate-fade-in-scale w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--card)] px-8 py-10 text-center shadow-2xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 text-red-400">
              <svg className="h-11 w-11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h3 className="mt-6 text-2xl font-bold tracking-tight text-[var(--foreground)]">{t(locale, "confirmEndTitle")}</h3>
            <p className="mt-3 text-base leading-relaxed text-[var(--muted)]">{t(locale, "confirmEndSub")}</p>
            <div className="mt-10 flex flex-col gap-4">
              <button
                type="button"
                onClick={endSession}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-red-600 py-5 text-lg font-bold text-white shadow-lg transition hover:bg-red-700 active:scale-[0.99]"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {t(locale, "confirmEndYes")}
              </button>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-[var(--border-light)] bg-transparent py-5 text-lg font-bold text-[var(--foreground)] transition hover:bg-[var(--surface)] active:scale-[0.99]"
              >
                {t(locale, "confirmEndCancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "extend" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-md">
          <div className="animate-fade-in-scale w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--card)] px-8 py-10 shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--gold)]/10 text-[var(--gold)]">
              <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mt-6 text-center text-2xl font-bold text-[var(--gold)]">{t(locale, "extendModalTitle")}</h3>
            <p className="mt-3 text-center text-sm leading-relaxed text-[var(--muted)]">{t(locale, "extendModalIntro")}</p>
            <div className="mt-8 overflow-x-auto px-1 [-webkit-overflow-scrolling:touch]">
              <div className="flex min-w-[min(100%,18rem)] justify-between gap-1 px-[2px] sm:min-w-0">
                {[1, 2, 3, 4, 5, 6].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setExtendHours(h)}
                    className={`flex min-h-11 min-w-10 touch-manipulation flex-col items-center justify-center gap-1 transition-all duration-200 sm:min-h-0 ${extendHours === h ? "scale-110" : ""}`}
                  >
                    <span className={`text-base font-black transition-colors duration-200 ${h <= extendHours ? "text-[var(--gold)]" : "text-[var(--muted)]"}`}>
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
                  style={{ "--slider-pct": `${((extendHours - 1) / 5) * 100}%` } as CSSProperties}
                />
                <div className="pointer-events-none absolute top-1/2 left-[2px] right-[2px] -translate-y-1/2">
                  <div className="flex justify-between">
                    {[1, 2, 3, 4, 5, 6].map((h) => (
                      <span
                        key={h}
                        className={`block h-2 w-2 rounded-full transition-all duration-200 ${h <= extendHours ? "bg-[var(--gold)] shadow-sm shadow-[var(--gold)]/40" : "bg-[var(--border-light)]"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--gold)]/20 bg-[var(--gold)]/5">
              <div className="flex items-center justify-between px-6 py-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{t(locale, "extraCost")}</p>
                  <p className="mt-0.5 text-sm text-[var(--muted)]">
                    {extendHours} × {formatSrd(hourlyRate)}
                  </p>
                </div>
                <p className="text-3xl font-black text-[var(--gold)]">{formatSrd(extendCost)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={confirmExtend}
              className="mt-6 w-full rounded-2xl bg-[var(--gold)] py-5 text-lg font-bold text-[var(--dark)] shadow-lg transition hover:bg-[var(--gold-light)] active:scale-[0.98]"
            >
              {t(locale, "extendBy")} {extendHours} {t(locale, "hours")} →
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
    </>
  );
}
