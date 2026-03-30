"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { useDemo } from "@/contexts/demo-context";
import { t } from "@/lib/i18n";

const DEMO_CODE = "000000";
const DIGITS = 6;

export default function RoomEntryPage() {
  const router = useRouter();
  const { locale, setLocale } = useDemo();
  const [room, setRoom] = useState("");
  const [showVerify, setShowVerify] = useState(false);
  const [digits, setDigits] = useState<string[]>(Array(DIGITS).fill(""));
  const [error, setError] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const setRef = useCallback((i: number) => (el: HTMLInputElement | null) => {
    inputRefs.current[i] = el;
  }, []);

  function onSubmitRoom(e: React.FormEvent) {
    e.preventDefault();
    const n = room.trim();
    if (!n) return;
    setShowVerify(true);
    setDigits(Array(DIGITS).fill(""));
    setError(false);
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }

  function handleChange(i: number, value: string) {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = char;
    setDigits(next);
    setError(false);
    if (char && i < DIGITS - 1) inputRefs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputRefs.current[i - 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, DIGITS);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, DIGITS - 1)]?.focus();
  }

  function onSubmitCode(e: React.FormEvent) {
    e.preventDefault();
    if (digits.join("") !== DEMO_CODE) { setError(true); return; }
    setShowVerify(false);
    router.push(`/guest/duration?room=${encodeURIComponent(room.trim())}`);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--background)]">
      <header className="flex items-center justify-between bg-[var(--card)] px-8 py-5 shadow-sm shadow-black/30">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Empire Apartments" width={48} height={48} className="rounded-lg" />
          <span className="text-2xl font-black uppercase tracking-wider text-[var(--gold)]">
            {t(locale, "brand")}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex rounded-full bg-[var(--surface)] p-1">
            <button type="button" onClick={() => setLocale("en")} className={`rounded-full px-5 py-2.5 text-base font-medium transition ${locale === "en" ? "bg-[var(--gold)] text-[var(--dark)] shadow-sm" : "text-[var(--muted)]"}`}>EN</button>
            <button type="button" onClick={() => setLocale("nl")} className={`rounded-full px-5 py-2.5 text-base font-medium transition ${locale === "nl" ? "bg-[var(--gold)] text-[var(--dark)] shadow-sm" : "text-[var(--muted)]"}`}>NL</button>
          </div>
        </div>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-6 py-12">
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: "radial-gradient(circle at 30% 20%, rgba(201,165,78,0.08) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(201,165,78,0.05) 0%, transparent 45%)" }} />
        <div className="animate-fade-in-scale relative w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--card)] p-12 shadow-2xl shadow-black/30">
          <h1 className="text-center text-3xl font-black text-[var(--gold)]">{t(locale, "guestLoginTitle")}</h1>
          <p className="mt-4 text-center text-base leading-relaxed text-[var(--muted)]">{t(locale, "guestLoginSubtitle")}</p>
          <form onSubmit={onSubmitRoom} className="mt-10 space-y-8">
            <div>
              <label className="mb-3 block text-base font-semibold text-[var(--gold-light)]">{t(locale, "roomNumber")}</label>
              <div className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] px-5 py-4">
                <svg className="h-7 w-7 shrink-0 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <input className="w-full bg-transparent text-xl text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]" placeholder={t(locale, "roomPlaceholder")} value={room} onChange={(e) => setRoom(e.target.value)} inputMode="numeric" />
              </div>
            </div>
            <button type="submit" className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[var(--gold)] py-5 text-xl font-bold text-[var(--dark)] shadow-lg transition-all duration-200 hover:bg-[var(--gold-light)] hover:shadow-xl active:scale-[0.98]">
              {t(locale, "continue")}
              <span aria-hidden className="text-2xl">→</span>
            </button>
          </form>
        </div>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] bg-[var(--card)] px-8 py-5 text-xs uppercase tracking-wide text-[var(--muted)]">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm" onClick={() => setShowVerify(false)}>
          <div className="animate-fade-in-scale w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--card)] p-10 text-center shadow-2xl shadow-black/30" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-3xl font-black text-[var(--gold)]">{t(locale, "enterCode")}</h2>
            <p className="mt-3 text-base text-[var(--muted)]">{t(locale, "codeHint")}</p>
            <form onSubmit={onSubmitCode} className="mt-8">
              <div className="flex items-center justify-center gap-3" onPaste={handlePaste}>
                {digits.map((d, i) => (
                  <span key={i} className="contents">
                    {i === 3 && <span className="mx-2 text-3xl font-black text-[var(--gold)]">–</span>}
                    <input
                      ref={setRef(i)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className={`h-20 w-16 rounded-2xl border-2 bg-[var(--surface)] text-center text-3xl font-black text-[var(--foreground)] outline-none transition-all duration-200 ${
                        error ? "border-red-500 bg-red-500/10" : d ? "border-[var(--gold)] bg-[var(--gold)]/5" : "border-[var(--border-light)]"
                      } focus:border-[var(--gold)] focus:ring-4 focus:ring-[var(--gold)]/20`}
                    />
                  </span>
                ))}
              </div>
              {error && <p className="mt-4 text-base font-semibold text-red-400 animate-fade-in">{t(locale, "invalidCode")}</p>}
              <button type="submit" className="mt-8 w-full rounded-2xl bg-[var(--gold)] py-5 text-xl font-bold text-[var(--dark)] shadow-lg transition-all duration-200 hover:bg-[var(--gold-light)] hover:shadow-xl active:scale-[0.98]">
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
