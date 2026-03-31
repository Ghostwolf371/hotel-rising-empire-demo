"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GuestHeader } from "@/components/guest-header";
import { useDemo } from "@/contexts/demo-context";
import { formatSrd } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { OrderLine } from "@/lib/types";

export default function GuestCartPage() {
  const router = useRouter();
  const {
    guestSession,
    cart,
    productById,
    setCartQty,
    clearCart,
    dispatch,
    locale,
  } = useDemo();
  const [notes, setNotes] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!guestSession) router.replace("/guest/duration");
  }, [guestSession, router]);

  const lines = useMemo(() => {
    return cart
      .map((c) => {
        const p = productById(c.productId);
        if (!p) return null;
        const name = locale === "nl" ? p.nameNl : p.name;
        return { ...c, product: p, name, lineTotal: p.priceSrd * c.qty };
      })
      .filter(Boolean) as {
      productId: string;
      qty: number;
      product: NonNullable<ReturnType<typeof productById>>;
      name: string;
      lineTotal: number;
    }[];
  }, [cart, productById, locale]);

  const total = lines.reduce((s, l) => s + l.lineTotal, 0);

  if (!guestSession) return null;

  function placeOrder() {
    if (!guestSession || lines.length === 0) return;
    const items: OrderLine[] = lines.map((l) => ({
      productId: l.productId,
      name: l.name,
      qty: l.qty,
      unitPrice: l.product.priceSrd,
    }));
    dispatch({
      type: "ADD_ORDER",
      order: {
        id: `o-${Date.now()}`,
        roomNumber: guestSession.roomNumber,
        createdAt: Date.now(),
        status: "processing",
        items,
        notes: notes.trim() || undefined,
      },
    });
    clearCart();
    setNotes("");
    setShowSuccess(true);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--background)]">
      <GuestHeader showCart={false} />

      {/* Page header */}
      <div className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--gold)]/10 text-[var(--gold)]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-[var(--gold)]">{t(locale, "orderSummaryTitle")}</h1>
              <p className="text-sm text-[var(--muted)]">Room {guestSession.roomNumber}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-5xl flex-1 gap-8 px-6 py-8 lg:grid-cols-[1fr_360px]">
        <div className="animate-fade-in">
          <div className="mb-5 flex items-center justify-between">
            <Link
              href="/guest"
              className="inline-flex items-center gap-2 text-base font-semibold text-[var(--gold)] hover:underline"
            >
              ← {t(locale, "back")}
            </Link>
            {lines.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="rounded-xl px-4 py-2 text-base font-semibold text-red-400 transition hover:bg-red-500/10"
              >
                {t(locale, "removeAll")}
              </button>
            )}
          </div>
          <ul className="space-y-4">
            {lines.map((l) => (
              <li
                key={l.productId}
                className="flex flex-wrap items-center gap-5 rounded-2xl bg-[var(--card)] p-5 shadow-md ring-1 ring-[var(--border)] transition hover:shadow-lg"
              >
                <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-[var(--surface)]">
                  <Image
                    src={l.product.image}
                    alt={l.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-[var(--foreground)]">{l.name}</p>
                  <p className="text-base text-[var(--muted)]">
                    {formatSrd(l.product.priceSrd)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <span className="text-lg font-bold text-[var(--gold)]">{formatSrd(l.lineTotal)}</span>
                  <div className="flex items-center gap-2 rounded-xl bg-[var(--surface)] p-1.5">
                    <button
                      type="button"
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--card)] text-lg font-bold text-[var(--foreground)] shadow-sm transition active:scale-90"
                      onClick={() => setCartQty(l.productId, l.qty - 1)}
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-mono text-lg font-bold text-[var(--foreground)]">{l.qty}</span>
                    <button
                      type="button"
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--card)] text-lg font-bold text-[var(--foreground)] shadow-sm transition active:scale-90"
                      onClick={() => setCartQty(l.productId, l.qty + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </li>
            ))}
            {lines.length === 0 && !showSuccess && (
              <p className="rounded-2xl bg-[var(--card)] p-10 text-center text-lg text-[var(--muted)] ring-1 ring-[var(--border)]">
                Cart is empty.{" "}
                <Link href="/guest" className="text-[var(--gold)] underline">
                  {t(locale, "menu")}
                </Link>
              </p>
            )}
          </ul>
          {lines.length > 0 && (
            <div className="mt-8">
              <label className="mb-3 block text-base font-bold text-[var(--gold)]">
                {t(locale, "notes")}
              </label>
              <textarea
                className="min-h-[120px] w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-base text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:ring-4 focus:ring-[var(--gold)]/20"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}
        </div>

        <aside className="animate-slide-up h-fit rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-xl">
          <h2 className="text-center text-xl font-black text-[var(--gold)]">
            {t(locale, "summaryOrder")}
          </h2>
          <ul className="mt-6 space-y-3 text-base text-[var(--foreground)]">
            {lines.map((l) => (
              <li key={l.productId} className="flex justify-between gap-2">
                <span>{l.qty}× {l.name}</span>
                <span className="shrink-0 font-semibold text-[var(--gold)]">{formatSrd(l.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex justify-between border-t border-[var(--border)] pt-6 text-xl font-black text-[var(--gold)]">
            <span>{t(locale, "total")}</span>
            <span>{formatSrd(total)}</span>
          </div>
          <button
            type="button"
            disabled={lines.length === 0}
            onClick={placeOrder}
            className="mt-8 w-full rounded-2xl bg-[var(--gold)] py-5 text-xl font-bold text-[var(--dark)] shadow-lg transition-all duration-200 hover:bg-[var(--gold-light)] hover:shadow-xl active:scale-[0.98] disabled:opacity-40"
          >
            {t(locale, "placeOrder")}
          </button>
        </aside>
      </div>

      {/* Success overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-md">
          <div className="animate-fade-in-scale w-full max-w-sm rounded-3xl border border-[var(--border)] bg-[var(--card)] px-8 py-10 text-center shadow-2xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <svg className="h-11 w-11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mt-6 text-2xl font-bold tracking-tight text-[var(--foreground)]">
              {t(locale, "orderSuccessTitle")}
            </h3>
            <p className="mt-3 text-base leading-relaxed text-[var(--muted)]">
              {t(locale, "orderSuccessSub")}
            </p>
            <button
              type="button"
              onClick={() => router.push("/guest")}
              className="mt-8 w-full rounded-2xl bg-[var(--gold)] py-4 text-lg font-bold text-[var(--dark)] shadow-lg transition hover:bg-[var(--gold-light)] active:scale-[0.98]"
            >
              {t(locale, "orderSuccessOk")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
