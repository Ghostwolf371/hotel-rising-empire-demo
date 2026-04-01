"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useDemo } from "@/contexts/demo-context";
import { t } from "@/lib/i18n";

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className={`h-16 w-16 transition-all duration-200 md:h-[4.25rem] md:w-[4.25rem] ${
        filled
          ? "scale-105 fill-[var(--gold)] text-[var(--gold)]"
          : "fill-none text-[var(--border-light)]"
      }`}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  );
}

function RateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, dispatch } = useDemo();
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const [q3, setQ3] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showMore, setShowMore] = useState(false);

  const endedFlow = searchParams.get("ended");
  useEffect(() => {
    if (endedFlow !== "1") return;
    dispatch({ type: "END_GUEST_SESSION" });
    router.replace("/guest/rate", { scroll: false });
  }, [dispatch, router, endedFlow]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/guest/duration");
  }

  const comfortOpts = [
    { value: "excellent", label: t(locale, "ansExcellent") },
    { value: "good", label: t(locale, "ansGood") },
    { value: "average", label: t(locale, "ansAverage") },
    { value: "poor", label: t(locale, "ansPoor") },
  ];
  const speedOpts = comfortOpts;
  const recommendOpts = [
    { value: "yes", label: t(locale, "ansYes") },
    { value: "maybe", label: t(locale, "ansMaybe") },
    { value: "no", label: t(locale, "ansNo") },
  ];

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center blur-sm"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&h=900&fit=crop)",
        }}
      />
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      <main className="relative z-10 flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-8 sm:px-5 sm:py-10 md:px-8">
        <div className="animate-fade-in-scale my-auto w-full max-w-xl rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl sm:p-8 md:p-12">
          <h1 className="text-center text-3xl font-bold tracking-tight text-[var(--gold)] md:text-4xl">
            {t(locale, "rateTitle")}
          </h1>
          <p className="mt-4 text-center text-base leading-relaxed text-[var(--muted)] md:text-lg">
            {t(locale, "rateSubExtended")}
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-2 md:gap-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setStars(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                className="rounded-lg p-1 transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                <StarIcon filled={n <= (hover || stars)} />
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-10">
            <textarea
              className="min-h-[160px] w-full resize-none rounded-2xl border-0 bg-[var(--surface)] p-5 text-base text-[var(--foreground)] outline-none ring-1 ring-transparent transition placeholder:text-[var(--muted)] focus:ring-2 focus:ring-[var(--gold)]/25 md:min-h-[180px] md:text-lg"
              placeholder={t(locale, "feedbackPlaceholderLong")}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />

            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              className="mt-4 text-sm font-semibold text-[var(--gold)] underline-offset-2 hover:underline"
            >
              {showMore ? t(locale, "fewerQuestions") : t(locale, "moreQuestions")}
            </button>

            {showMore && (
              <div className="mt-6 space-y-6 border-t border-[var(--border)] pt-6">
                <fieldset>
                  <legend className="text-sm font-bold text-[var(--gold)]">
                    {t(locale, "q1")}
                  </legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {comfortOpts.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setQ1(o.value)}
                        className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                          q1 === o.value
                            ? "bg-[var(--gold)] text-[var(--dark)]"
                            : "bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--card-hover)]"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="text-sm font-bold text-[var(--gold)]">
                    {t(locale, "q2")}
                  </legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {speedOpts.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setQ2(o.value)}
                        className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                          q2 === o.value
                            ? "bg-[var(--gold)] text-[var(--dark)]"
                            : "bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--card-hover)]"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="text-sm font-bold text-[var(--gold)]">
                    {t(locale, "q3")}
                  </legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {recommendOpts.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setQ3(o.value)}
                        className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                          q3 === o.value
                            ? "bg-[var(--gold)] text-[var(--dark)]"
                            : "bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--card-hover)]"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>
            )}

            <button
              type="submit"
              className="mt-8 w-full rounded-2xl bg-[var(--gold)] py-5 text-lg font-bold text-[var(--dark)] shadow-lg transition hover:bg-[var(--gold-light)] active:scale-[0.99]"
            >
              {t(locale, "submit")}
            </button>
          </form>

          <p className="mt-8 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)] md:text-xs">
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
