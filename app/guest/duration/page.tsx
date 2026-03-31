"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { GuestHeader } from "@/components/guest-header";
import { useDemo } from "@/contexts/demo-context";
import { formatSrd } from "@/lib/format";
import { t } from "@/lib/i18n";

function DurationContent() {
  const router = useRouter();
  const params = useSearchParams();
  const room = params.get("room") ?? "";
  const { hourlyRate, locale } = useDemo();
  const [hours, setHours] = useState<2 | 3>(2);

  const cost = useMemo(() => hours * hourlyRate, [hours, hourlyRate]);

  if (!room) {
    return (
      <div className="flex min-h-dvh flex-col">
        <GuestHeader showCart={false} />
        <div className="flex flex-1 items-center justify-center">
          <Link href="/" className="text-lg text-[var(--gold)] underline">
            {t(locale, "back")}
          </Link>
        </div>
      </div>
    );
  }

  function goToWelcome() {
    router.push(
      `/guest/welcome?room=${encodeURIComponent(room)}&hours=${hours}`
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--background)]">
      <GuestHeader showCart={false} />
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="animate-fade-in-scale w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--card)] p-12 shadow-2xl shadow-black/30">
          <h1 className="text-center text-3xl font-black text-[var(--gold)]">
            {t(locale, "chooseStay")}
          </h1>
          <p className="mt-3 text-center text-base text-[var(--muted)]">
            {t(locale, "roomNumber")}: <strong className="text-[var(--gold)]">{room}</strong>
          </p>

          <div className="mt-10 grid grid-cols-2 gap-5">
            {([2, 3] as const).map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHours(h)}
                className={`rounded-2xl border-3 py-7 text-2xl font-black transition-all duration-200 active:scale-95 ${
                  hours === h
                    ? "border-[var(--gold)] bg-[var(--gold)] text-[var(--dark)] shadow-xl shadow-[var(--gold)]/20"
                    : "border-[var(--border-light)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--gold)]/40 hover:shadow-md"
                }`}
              >
                {h === 2 ? t(locale, "hours2") : t(locale, "hours3")}
              </button>
            ))}
          </div>

          <div className="mt-10 rounded-2xl bg-[var(--surface)] p-6">
            <div className="flex justify-between text-base text-[var(--muted)]">
              <span>{t(locale, "perHour")}</span>
              <span>{formatSrd(hourlyRate)}</span>
            </div>
            <div className="mt-4 flex justify-between text-2xl font-black text-[var(--gold)]">
              <span>{t(locale, "total")}</span>
              <span>{formatSrd(cost)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={goToWelcome}
            className="mt-10 w-full rounded-2xl bg-[var(--gold)] py-6 text-xl font-bold text-[var(--dark)] shadow-lg transition-all duration-200 hover:bg-[var(--gold-light)] hover:shadow-xl active:scale-[0.98]"
          >
            {t(locale, "continue")}
          </button>
          <p className="mt-8 text-center text-base">
            <Link href="/" className="text-[var(--gold)] underline">
              {t(locale, "back")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function GuestDurationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-[var(--muted)]">…</div>
      }
    >
      <DurationContent />
    </Suspense>
  );
}
