"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  requestRoomCheckInCode,
  verifyRoomCheckInCode,
} from "@/app/actions/checkin-codes";
import { FullscreenButton } from "@/components/fullscreen-button";
import { LanguageToggle } from "@/components/language-toggle";
import {
  requestCheckInCodeLocal,
  verifyCheckInCodeLocal,
} from "@/lib/checkin-codes-local";
import { useDemo } from "@/contexts/demo-context";
import { t } from "@/lib/i18n";

const DIGITS = 6;

export default function RoomEntryPage() {
  const router = useRouter();
  const { locale, theme, toggleTheme, rooms, useDatabase } = useDemo();
  const [room, setRoom] = useState("");
  const [showVerify, setShowVerify] = useState(false);
  const [code, setCode] = useState("");
  const [codeFocused, setCodeFocused] = useState(false);
  const [error, setError] = useState(false);
  const [roomError, setRoomError] = useState(false);
  const [codeRequesting, setCodeRequesting] = useState(false);
  const [codeRequestError, setCodeRequestError] = useState<string | null>(null);
  const codeInputRef = useRef<HTMLInputElement | null>(null);

  const digits = Array.from({ length: DIGITS }, (_, i) => code[i] ?? "");
  const activeIndex = Math.min(code.length, DIGITS - 1);

  function onSubmitRoom(e: React.FormEvent) {
    e.preventDefault();
    const n = room.trim();
    if (!n) return;
    const exists = rooms.some((r) => r.number === n);
    if (!exists) {
      setRoomError(true);
      return;
    }
    // Flush the state update synchronously so the modal (and its hidden
    // input) is in the DOM before we focus it. Calling .focus() in the
    // same user gesture is what convinces iPadOS/iOS Safari to actually
    // pop the soft keyboard for the code input.
    flushSync(() => {
      setRoomError(false);
      setShowVerify(true);
      setCode("");
      setError(false);
      setCodeRequestError(null);
    });
    codeInputRef.current?.focus({ preventScroll: true });
  }

  // Belt-and-suspenders: if showVerify flips on via some other path (e.g.
  // React StrictMode or a future entry point), still try to focus once the
  // modal commits. Harmless when the synchronous focus above already won.
  useEffect(() => {
    if (!showVerify) return;
    const id = requestAnimationFrame(() => {
      codeInputRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [showVerify]);

  useEffect(() => {
    if (!showVerify) return;
    const n = room.trim();
    if (!n) return;
    setCodeRequesting(true);
    setCodeRequestError(null);
    let cancelled = false;
    void (async () => {
      try {
        if (useDatabase) {
          await requestRoomCheckInCode(n);
        } else {
          requestCheckInCodeLocal(n);
        }
      } catch (err) {
        if (!cancelled) {
          setCodeRequestError(
            err instanceof Error ? err.message : "Could not request code",
          );
        }
      } finally {
        if (!cancelled) setCodeRequesting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showVerify, room, useDatabase]);

  function handleCodeChange(value: string) {
    const cleaned = value.replace(/\D/g, "").slice(0, DIGITS);
    setCode(cleaned);
    setError(false);
  }

  async function onSubmitCode(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== DIGITS) return;
    const n = room.trim();
    let ok = false;
    try {
      ok = useDatabase
        ? await verifyRoomCheckInCode(n, code)
        : verifyCheckInCodeLocal(n, code);
    } catch {
      ok = false;
    }
    if (!ok) {
      setError(true);
      return;
    }
    setShowVerify(false);
    router.push(`/guest/duration?room=${encodeURIComponent(n)}`);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--background)]">
      <header className="flex items-center justify-between gap-3 bg-[var(--card)] px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 shadow-sm shadow-black/30 sm:px-8 sm:pt-[max(1.25rem,env(safe-area-inset-top))] sm:pb-5">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Image src="/logo.png" alt="Empire Apartments" width={48} height={48} className="h-10 w-10 shrink-0 rounded-lg sm:h-12 sm:w-12" />
          <span className="truncate text-lg font-black uppercase tracking-wider text-[var(--gold)] sm:text-2xl">
            {t(locale, "brand")}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageToggle variant="landing" />
          <FullscreenButton
            labelEnter={t(locale, "enterFullscreen")}
            labelExit={t(locale, "exitFullscreen")}
          />
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:border-[var(--gold)]/30 hover:text-[var(--gold)]"
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
      </header>

      <main className="relative flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: "radial-gradient(circle at 30% 20%, rgba(201,165,78,0.08) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(201,165,78,0.05) 0%, transparent 45%)" }} />
        <div className="animate-fade-in-scale relative w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-2xl shadow-black/30 sm:p-12">
          <h1 className="text-center text-3xl font-black text-[var(--gold)]">{t(locale, "guestLoginTitle")}</h1>
          <p className="mt-4 text-center text-base leading-relaxed text-[var(--muted)]">{t(locale, "guestLoginSubtitle")}</p>
          <form onSubmit={onSubmitRoom} className="mt-10 space-y-8">
            <div>
              <label className="mb-3 block text-base font-semibold text-[var(--gold-light)]">{t(locale, "roomNumber")}</label>
              <div className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] px-5 py-4">
                <svg className="h-7 w-7 shrink-0 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <input
                  className="w-full bg-transparent text-xl text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
                  placeholder={t(locale, "roomPlaceholder")}
                  value={room}
                  onChange={(e) => {
                    setRoom(e.target.value);
                    setRoomError(false);
                  }}
                  inputMode="numeric"
                />
              </div>
              {roomError ? (
                <p className="mt-3 text-sm font-semibold text-red-400">{t(locale, "roomNotFound")}</p>
              ) : null}
            </div>
            <button type="submit" className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[var(--gold)] py-5 text-xl font-bold text-[var(--dark)] shadow-lg transition-all duration-200 hover:bg-[var(--gold-light)] hover:shadow-xl active:scale-[0.98]">
              {t(locale, "continue")}
              <span aria-hidden className="text-2xl">→</span>
            </button>
          </form>
        </div>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] bg-[var(--card)] px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-xs uppercase tracking-wide text-[var(--muted)] sm:px-8 sm:pt-5 sm:pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <span>{t(locale, "copyright")}</span>
        <nav className="flex flex-wrap items-center gap-6">
          <span className="cursor-default">{t(locale, "privacy")}</span>
          <span className="cursor-default">{t(locale, "terms")}</span>
          <span className="cursor-default">{t(locale, "support")}</span>
          <button type="button" onClick={() => router.push("/management")} className="rounded-lg border border-[var(--border-light)] px-4 py-2 text-xs font-semibold normal-case tracking-normal text-[var(--gold-dim)] transition hover:border-[var(--gold)]/40 hover:text-[var(--gold)]">
            Management Demo →
          </button>
        </nav>
      </footer>

      {/* Verify code modal */}
      {showVerify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-[max(1.5rem,env(safe-area-inset-top))] sm:pb-[max(1.5rem,env(safe-area-inset-bottom))]" onClick={() => setShowVerify(false)}>
          <div className="animate-fade-in-scale w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 text-center shadow-2xl shadow-black/30 sm:p-10" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-black text-[var(--gold)] sm:text-3xl">{t(locale, "enterCode")}</h2>
            <p className="mt-3 text-sm text-[var(--muted)] sm:text-base">{t(locale, "codeHint")}</p>
            {codeRequesting ? (
              <p className="mt-4 text-sm font-semibold text-[var(--gold)]">{t(locale, "codeRequesting")}</p>
            ) : (
              <p className="mt-4 text-sm text-[var(--muted)]">{t(locale, "codeSentToStaff")}</p>
            )}
            {codeRequestError ? (
              <p className="mt-3 text-sm font-semibold text-red-400">{codeRequestError}</p>
            ) : null}
            <form onSubmit={onSubmitCode} className="mt-6 sm:mt-8">
              <div
                className="relative mx-auto w-full min-w-0 max-w-md py-1"
                onClick={() => codeInputRef.current?.focus({ preventScroll: true })}
              >
                {/* Single real input — invisible but covers all 6 cells. Keeps
                    focus and the soft keyboard rock-steady on tablets; the
                    cells below are pure presentation that read from `code`. */}
                <input
                  ref={codeInputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={DIGITS}
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  onFocus={() => setCodeFocused(true)}
                  onBlur={() => setCodeFocused(false)}
                  aria-label={t(locale, "enterCode")}
                  className="absolute inset-0 z-10 h-full w-full cursor-pointer bg-transparent text-transparent caret-transparent outline-none"
                  style={{
                    // Hide the native caret/selection without using opacity:0
                    // (Safari sometimes refuses to focus opacity:0 inputs).
                    WebkitTextFillColor: "transparent",
                  }}
                />
                <div
                  className="grid w-full items-stretch gap-x-1 sm:gap-x-2"
                  style={{
                    gridTemplateColumns:
                      "minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) auto minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)",
                  }}
                  aria-hidden
                >
                  {[0, 1, 2, "sep", 3, 4, 5].map((slot, idx) => {
                    if (slot === "sep") {
                      return (
                        <span
                          key="sep"
                          className="flex min-h-[3rem] min-w-[1.25rem] items-center justify-center text-lg font-black leading-none text-[var(--gold)] sm:min-h-[4.25rem] sm:min-w-[1.5rem] sm:text-2xl"
                        >
                          –
                        </span>
                      );
                    }
                    const i = slot as number;
                    const filled = digits[i] !== "";
                    const isActive = codeFocused && i === activeIndex;
                    return (
                      <div
                        key={idx}
                        className={`box-border flex min-h-[3rem] w-full min-w-0 items-center justify-center rounded-xl border-2 px-0.5 text-center text-lg font-black tabular-nums sm:min-h-[4.25rem] sm:rounded-2xl sm:text-2xl ${
                          error
                            ? "border-red-500 bg-red-500/10 text-[var(--foreground)]"
                            : isActive
                              ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--foreground)] shadow-[0_0_0_2px_color-mix(in_srgb,var(--gold)_25%,transparent)]"
                              : filled
                                ? "border-[var(--gold)] bg-[var(--gold)]/5 text-[var(--foreground)]"
                                : "border-[var(--border-light)] bg-[var(--surface)] text-[var(--foreground)]"
                        } ${codeRequesting ? "opacity-50" : ""}`}
                      >
                        {digits[i]}
                      </div>
                    );
                  })}
                </div>
              </div>
              {error && <p className="mt-4 text-base font-semibold text-red-400 animate-fade-in">{t(locale, "invalidCode")}</p>}
              <button
                type="submit"
                disabled={codeRequesting}
                className="mt-8 w-full rounded-2xl bg-[var(--gold)] py-5 text-xl font-bold text-[var(--dark)] shadow-lg transition-all duration-200 hover:bg-[var(--gold-light)] hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
              >
                {t(locale, "continue")}
              </button>
              <button type="button" onClick={() => setShowVerify(false)} className="mt-4 text-sm font-semibold text-[var(--muted)] hover:text-[var(--gold)]">
                {t(locale, "back")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
