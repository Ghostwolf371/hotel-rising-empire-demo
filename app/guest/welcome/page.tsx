"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useDemo } from "@/contexts/demo-context";
import { t } from "@/lib/i18n";

function WelcomeContent() {
  const router = useRouter();
  const params = useSearchParams();
  const room = params.get("room")?.trim() ?? "";
  const hoursRaw = params.get("hours");
  const hoursParsed = hoursRaw !== null ? Number.parseInt(hoursRaw, 10) : NaN;
  const hours =
    Number.isFinite(hoursParsed) && hoursParsed >= 1 && hoursParsed <= 168
      ? hoursParsed
      : null;
  const { dispatch, locale } = useDemo();
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!room || !hours) {
      router.replace("/guest/duration");
      return;
    }
    setReady(true);
    const showId = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(showId);
  }, [room, hours, router]);

  useEffect(() => {
    if (!ready || !room || !hours) return;
    const autoId = setTimeout(() => {
      dispatch({ type: "START_GUEST_SESSION", roomNumber: room, durationHours: hours });
      router.push("/guest/start");
    }, 5000);
    return () => clearTimeout(autoId);
  }, [ready, room, hours, dispatch, router]);

  function onContinue() {
    if (!room || !hours) return;
    dispatch({ type: "START_GUEST_SESSION", roomNumber: room, durationHours: hours });
    router.push("/guest/start");
  }

  if (!ready || !room || !hours) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--background)]">
        <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--gold)]/30" />
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-dvh cursor-pointer flex-col overflow-hidden bg-[var(--background)]"
      onClick={onContinue}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onContinue(); }}
    >
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

      {/* Content overlay */}
      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 py-16">
        <div
          className="flex max-w-xl flex-col items-center text-center transition-all duration-1000 ease-out"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(30px)",
          }}
        >
          {/* Logo */}
          <Image
            src="/logo.png"
            alt="Empire Apartments"
            width={72}
            height={72}
            className="rounded-2xl shadow-2xl"
          />

          {/* Brand tag */}
          <p className="mt-6 text-xs font-black uppercase tracking-[0.3em] text-[var(--gold)] md:text-sm">
            {t(locale, "brand")}
          </p>

          {/* Welcome headline */}
          <h1
            className="mt-4 text-5xl font-black tracking-tight text-[var(--foreground)] drop-shadow-sm md:text-6xl"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(20px)",
              transition: "all 1s ease-out 0.3s",
            }}
          >
            {t(locale, "welcomeTitle")}
          </h1>

          {/* Decorative gold divider */}
          <div
            className="mt-6 flex items-center gap-3"
            style={{
              opacity: visible ? 1 : 0,
              transition: "opacity 1s ease-out 0.5s",
            }}
          >
            <span className="h-px w-12 bg-[var(--gold)]/40" />
            <svg className="h-4 w-4 text-[var(--gold)]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.09 6.26L21 9.27l-5.18 4.73L17.82 22 12 18.27 6.18 22l1.09-7.73L2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="h-px w-12 bg-[var(--gold)]/40" />
          </div>

          {/* Subtitle */}
          <p
            className="mt-5 max-w-md text-lg leading-relaxed text-[var(--foreground)]/80 md:text-xl"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(15px)",
              transition: "all 1s ease-out 0.6s",
            }}
          >
            {t(locale, "welcomeSub")}
          </p>

          {/* Room info pill */}
          <div
            className="mt-10 flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]/85 px-8 py-4 shadow-sm backdrop-blur-md"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(15px)",
              transition: "all 0.8s ease-out 0.8s",
            }}
          >
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                {t(locale, "roomNumber")}
              </p>
              <p className="mt-0.5 text-3xl font-black text-[var(--gold)]">{room}</p>
            </div>
            <span className="h-10 w-px bg-[var(--border)]" />
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                {t(locale, "durationEyebrow")}
              </p>
              <p className="mt-0.5 text-xl font-black text-[var(--foreground)]">
                {hours === 1
                  ? t(locale, "hours1")
                  : hours === 2
                    ? t(locale, "hours2")
                    : hours === 3
                      ? t(locale, "hours3")
                      : `${hours}\u00a0${t(locale, "hours")}`}
              </p>
            </div>
          </div>

          {/* Auto-continue indicator */}
          <div
            className="mt-10 flex w-full max-w-sm flex-col items-center gap-3"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(15px)",
              transition: "opacity 0.8s ease-out 1s, transform 0.8s ease-out 1s",
            }}
          >
            <span className="text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
              {t(locale, "tapToContinue")}
            </span>
            <div className="h-1 w-48 overflow-hidden rounded-full bg-[var(--border)]">
              <div
                className="h-full rounded-full bg-[var(--gold)]"
                style={{
                  width: visible ? "100%" : "0%",
                  transition: "width 5s linear 0.5s",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GuestWelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[var(--background)]">
          <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--gold)]/30" />
        </div>
      }
    >
      <WelcomeContent />
    </Suspense>
  );
}
