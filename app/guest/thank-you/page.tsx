"use client";

import Image from "next/image";
import { GuestHeader } from "@/components/guest-header";
import { useDemo } from "@/contexts/demo-context";
import { t } from "@/lib/i18n";

const BANNER_IMAGE =
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&h=400&fit=crop";

export default function ThankYouPage() {
  const { locale } = useDemo();

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--background)]">
      <GuestHeader showCart={false} />

      <main className="flex flex-1 flex-col items-center px-6 py-12 md:py-16">
        <div className="animate-fade-in flex w-full max-w-2xl flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-[var(--gold)] shadow-lg shadow-[var(--gold)]/20 md:h-24 md:w-24">
            <svg
              className="h-10 w-10 text-[var(--dark)] md:h-12 md:w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-10 text-3xl font-bold tracking-tight text-[var(--gold)] md:text-4xl">
            {t(locale, "thankYou")}
          </h1>
          <p className="mt-3 text-lg text-[var(--muted)] md:text-xl">{t(locale, "thankSub")}</p>
        </div>

        <div className="animate-slide-up mt-12 w-full max-w-4xl overflow-hidden rounded-2xl shadow-xl ring-1 ring-[var(--border)]">
          <div className="grid md:grid-cols-2 md:items-stretch">
            <div className="flex flex-col items-center justify-center bg-[var(--card)] px-8 py-10 md:py-12">
              <Image src="/logo.png" alt="Empire Apartments" width={80} height={80} className="rounded-xl" />
              <p className="mt-4 text-2xl font-black uppercase tracking-wider leading-tight text-[var(--gold)] md:text-3xl">
                {t(locale, "thankBannerLine1")}
              </p>
              <p className="mt-2 text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)] md:text-base">
                {t(locale, "thankBannerLine2")}
              </p>
            </div>
            <div className="relative min-h-[200px] md:min-h-[240px]">
              <Image
                src={BANNER_IMAGE}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t border-[var(--border)] bg-[var(--card)] px-6 py-5 md:px-10">
        <nav className="flex flex-wrap justify-center gap-6 text-xs font-semibold uppercase tracking-wide text-[var(--muted)] md:text-sm">
          <span className="cursor-default hover:text-[var(--gold)]">{t(locale, "privacy")}</span>
          <span className="cursor-default hover:text-[var(--gold)]">{t(locale, "terms")}</span>
          <span className="cursor-default hover:text-[var(--gold)]">
            {t(locale, "contactConcierge")}
          </span>
        </nav>
      </footer>
    </div>
  );
}
