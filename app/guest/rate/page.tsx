"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useDemo } from "@/contexts/demo-context";
import { t } from "@/lib/i18n";

function StarGlyph({ filled }: { filled: boolean }) {
  const dim = "h-10 w-10 sm:h-11 sm:w-11";
  return (
    <svg
      className={`${dim} shrink-0 transition-all duration-150 ${
        filled ? "scale-105 fill-[var(--gold)] text-[var(--gold)]" : "fill-none text-[var(--border-light)]"
      }`}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.25}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  );
}

function StarRow({
  label,
  value,
  hover,
  onHover,
  onSelect,
}: {
  label: string;
  value: number;
  hover: number;
  onHover: (n: number) => void;
  onSelect: (n: number) => void;
}) {
  const active = hover || value;
  return (
    <div className="border-b border-[var(--border)] py-5 last:border-b-0">
      <p className="text-left text-[15px] font-semibold leading-snug text-[var(--foreground)] sm:text-base">{label}</p>
      <div
        className="mt-3 flex flex-wrap justify-start gap-0.5 sm:gap-1"
        role="group"
        aria-label={label}
        onMouseLeave={() => onHover(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onSelect(n)}
            onMouseEnter={() => onHover(n)}
            className="touch-manipulation rounded-md p-1 transition-transform duration-150 hover:scale-105 active:scale-95"
            aria-label={`${n} of 5`}
          >
            <StarGlyph filled={n <= active} />
          </button>
        ))}
      </div>
    </div>
  );
}

function RateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, dispatch, rooms, guestSession, armGuestNavToRatingAfterSessionEnd } = useDemo();
  const [cleanliness, setCleanliness] = useState(0);
  const [comfort, setComfort] = useState(0);
  const [service, setService] = useState(0);
  const [h1, setH1] = useState(0);
  const [h2, setH2] = useState(0);
  const [h3, setH3] = useState(0);
  const endedHandled = useRef(false);

  const roomParam = searchParams.get("room")?.trim() ?? "";

  useEffect(() => {
    if (searchParams.get("ended") !== "1" || endedHandled.current) return;
    endedHandled.current = true;
    const room = guestSession?.roomNumber ?? searchParams.get("room")?.trim() ?? "";
    if (guestSession) {
      armGuestNavToRatingAfterSessionEnd();
      dispatch({ type: "END_GUEST_SESSION" });
    }
    router.replace(room ? `/guest/rate?room=${encodeURIComponent(room)}` : "/guest/rate", { scroll: false });
  }, [armGuestNavToRatingAfterSessionEnd, dispatch, guestSession, router, searchParams]);

  useEffect(() => {
    if (!roomParam) return;
    const r = rooms.find((x) => x.number === roomParam);
    if (r?.status === "available") {
      router.replace(`/guest/duration?room=${encodeURIComponent(roomParam)}`);
    }
  }, [rooms, roomParam, router]);

  function goDuration() {
    const q = roomParam ? `?room=${encodeURIComponent(roomParam)}` : "";
    router.push(`/guest/duration${q}`);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (cleanliness < 1 || comfort < 1 || service < 1) return;
    if (roomParam) {
      dispatch({
        type: "SUBMIT_GUEST_RATING",
        roomNumber: roomParam,
        cleanliness,
        comfort,
        service,
      });
    }
    goDuration();
  }

  const canSubmit = cleanliness > 0 && comfort > 0 && service > 0;

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[var(--background)]">
      <div
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 50% -15%, color-mix(in srgb, var(--gold) 26%, transparent), transparent 52%),
            radial-gradient(ellipse 70% 55% at 100% 100%, color-mix(in srgb, var(--gold) 12%, transparent), transparent 45%),
            linear-gradient(168deg, var(--background) 0%, color-mix(in srgb, var(--gold) 5%, var(--background)) 40%, var(--dark) 100%)
          `,
        }}
      />

      <main className="relative z-10 flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-8 sm:px-5 sm:py-10 md:px-8">
        <div className="animate-fade-in-scale my-auto w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--card)]/95 p-6 shadow-2xl backdrop-blur-sm sm:p-8 md:p-10">
          <h1 className="text-center text-2xl font-black tracking-tight text-[var(--gold)] sm:text-3xl md:text-4xl">
            {t(locale, "rateTitle")}
          </h1>
          <p className="mt-3 text-center text-sm leading-relaxed text-[var(--muted)] sm:text-base">{t(locale, "rateSubStars")}</p>

          <form onSubmit={submit} className="mt-8">
            <StarRow
              label={t(locale, "rateStarCleanliness")}
              value={cleanliness}
              hover={h1}
              onHover={setH1}
              onSelect={setCleanliness}
            />
            <StarRow
              label={t(locale, "rateStarComfort")}
              value={comfort}
              hover={h2}
              onHover={setH2}
              onSelect={setComfort}
            />
            <StarRow
              label={t(locale, "rateStarService")}
              value={service}
              hover={h3}
              onHover={setH3}
              onSelect={setService}
            />

            <div className="mt-8 flex flex-col gap-3 sm:flex-row-reverse sm:justify-end">
              <button
                type="submit"
                disabled={!canSubmit}
                className="min-h-[52px] flex-1 rounded-2xl bg-[var(--gold)] py-4 text-lg font-bold text-[var(--dark)] shadow-lg transition hover:bg-[var(--gold-light)] enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {t(locale, "submit")}
              </button>
              <button
                type="button"
                onClick={goDuration}
                className="min-h-[52px] flex-1 rounded-2xl border-2 border-[var(--border-light)] bg-[var(--surface)] py-4 text-lg font-bold text-[var(--foreground)] transition hover:border-[var(--gold)]/35 hover:bg-[var(--card-hover)] active:scale-[0.99]"
              >
                {t(locale, "rateSkip")}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)] sm:text-xs">
            {t(locale, "feedbackFooterTagline")}
          </p>
        </div>
      </main>
    </div>
  );
}

export default function RatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[var(--background)] text-[var(--muted)]">
          …
        </div>
      }
    >
      <RateContent />
    </Suspense>
  );
}
