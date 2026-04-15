"use client";

import Image from "next/image";
import type { GuestSession } from "@/contexts/demo-context";
import { formatCountdown } from "@/lib/format";
import type { Locale } from "@/lib/types";
import { t } from "@/lib/i18n";

interface GuestSessionPanelProps {
  variant: "sidebar" | "fullscreen";
  guestSession: GuestSession;
  locale: Locale;
  leftMs: number;
  range: string;
  nearlyDone: boolean;
  onAddTime: () => void;
  onEndNow: () => void;
  onStaffAlert: () => void;
}

export function GuestSessionPanel({
  variant,
  guestSession,
  locale,
  leftMs,
  range,
  nearlyDone,
  onAddTime,
  onEndNow,
  onStaffAlert,
}: GuestSessionPanelProps) {
  const isFs = variant === "fullscreen";

  return (
    <>
      {!isFs && (
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-4">
          <Image src="/logo.png" alt="Empire Apartments" width={36} height={36} className="rounded-lg" />
          <span className="text-sm font-black uppercase tracking-wider text-[var(--gold)]">{t(locale, "brand")}</span>
        </div>
      )}

      <div className={`border-b border-[var(--border)] ${isFs ? "px-6 py-8 text-center sm:px-10 sm:py-10" : "px-5 py-5"}`}>
        <p className={`font-bold uppercase tracking-wider text-[var(--muted)] ${isFs ? "text-sm" : "text-xs"}`}>{t(locale, "roomNumber")}</p>
        <p className={`mt-2 font-black text-[var(--gold)] ${isFs ? "text-5xl sm:text-6xl" : "mt-1 text-3xl"}`}>{guestSession.roomNumber}</p>
        <p className={`mt-3 flex items-center justify-center gap-1.5 text-[var(--muted)] ${isFs ? "text-base" : "mt-2 text-xs"}`}>
          <svg className={isFs ? "h-5 w-5" : "h-3.5 w-3.5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {range}
        </p>
      </div>

      <div className={`border-b border-[var(--border)] text-center ${isFs ? "px-6 py-10 sm:px-10 sm:py-12" : "px-5 py-5"}`}>
        <p className={`font-bold uppercase tracking-wider text-[var(--muted)] ${isFs ? "text-sm" : "text-xs"}`}>{t(locale, "timeLeft")}</p>
        <p
          className={`mt-3 font-mono font-black tabular-nums ${isFs ? "text-5xl sm:text-7xl" : "mt-2 text-4xl"} ${
            leftMs <= 0 ? "text-red-500" : nearlyDone ? "text-amber-500" : "text-[var(--gold)]"
          }`}
        >
          {formatCountdown(leftMs)}
        </p>
        {nearlyDone && leftMs > 0 && (
          <span
            className={`mt-3 inline-flex animate-pulse items-center rounded-full bg-amber-500/25 font-bold text-amber-950 ${isFs ? "px-4 py-2 text-sm" : "mt-2 px-3 py-1 text-[10px]"}`}
          >
            {t(locale, "nearlyDone")}
          </span>
        )}
      </div>

      {!isFs && <div className="min-h-0 flex-1" aria-hidden />}

      <div className={`space-y-3 border-[var(--border)] ${isFs ? "mt-2 border-t px-4 pb-10 pt-8 sm:px-6" : "border-t px-4 py-4 sm:px-5 sm:py-5"}`}>
        <button
          type="button"
          onClick={onAddTime}
          className={`flex w-full touch-manipulation items-center justify-center gap-2.5 rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 font-bold text-[var(--gold-foreground)] transition hover:bg-[var(--gold)]/10 hover:text-[var(--gold)] active:scale-[0.98] ${isFs ? "py-5 text-lg" : "px-4 py-3.5 text-sm"}`}
        >
          <svg className={isFs ? "h-6 w-6" : "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t(locale, "addTime")}
        </button>
        <button
          type="button"
          onClick={onEndNow}
          className={`flex w-full touch-manipulation items-center justify-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] font-bold text-[var(--foreground)] transition hover:bg-[var(--card-hover)] active:scale-[0.98] ${isFs ? "py-5 text-lg" : "px-4 py-3.5 text-sm"}`}
        >
          <svg className={isFs ? "h-6 w-6" : "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {t(locale, "endNow")}
        </button>
        <button
          type="button"
          onClick={onStaffAlert}
          className={`flex w-full touch-manipulation items-center justify-center gap-2.5 rounded-xl bg-red-600/10 font-bold text-red-600 transition hover:bg-red-600/20 active:scale-[0.98] ${isFs ? "py-5 text-lg" : "px-4 py-3.5 text-sm"}`}
        >
          <svg className={isFs ? "h-6 w-6" : "h-5 w-5"} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z" />
          </svg>
          {t(locale, "panic")}
        </button>
      </div>
    </>
  );
}
