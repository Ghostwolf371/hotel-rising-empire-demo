"use client";

import { ProductThumb } from "@/components/product-thumb";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { guestPath } from "@/lib/guest-routes";
import { useEffect, useMemo, useState } from "react";
import { GuestHeader } from "@/components/guest-header";
import { useDemo } from "@/contexts/demo-context";
import { formatSrd } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { OrderLine } from "@/lib/types";

type PlacedReceiptLine = {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

type PlacedReceipt = {
  orderId: string;
  placedAt: number;
  roomNumber: string;
  durationHours: number;
  hourlyRate: number;
  roomCostSrd: number;
  items: PlacedReceiptLine[];
  orderSubtotal: number;
  notes?: string;
};

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
    theme,
    hourlyRate,
    guestPostSessionEndNavRef,
  } = useDemo();
  const [notes, setNotes] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [receipt, setReceipt] = useState<PlacedReceipt | null>(null);
  const [receiptDetailsOpen, setReceiptDetailsOpen] = useState(false);

  useEffect(() => {
    if (guestSession) return;
    if (guestPostSessionEndNavRef.current.skipDurationRedirectOnce) {
      guestPostSessionEndNavRef.current.skipDurationRedirectOnce = false;
      return;
    }
    router.replace(guestPath("/guest/language"));
  }, [guestSession, router, guestPostSessionEndNavRef]);

  const lines = useMemo(() => {
    return cart
      .map((c) => {
        const p = productById(c.productId);
        if (!p) return null;
        const name = p.name;
        return { ...c, product: p, name, lineTotal: p.priceSrd * c.qty };
      })
      .filter(Boolean) as {
      productId: string;
      qty: number;
      product: NonNullable<ReturnType<typeof productById>>;
      name: string;
      lineTotal: number;
    }[];
  }, [cart, productById]);

  const total = lines.reduce((s, l) => s + l.lineTotal, 0);

  if (!guestSession) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--background)]">
        <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--gold)]/30" />
      </div>
    );
  }

  function placeOrder() {
    if (!guestSession || lines.length === 0) return;
    const orderId = `o-${Date.now()}`;
    const placedAt = Date.now();
    const orderSubtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const roomCostSrd = guestSession.durationHours * hourlyRate;
    const receiptItems: PlacedReceiptLine[] = lines.map((l) => ({
      productId: l.productId,
      name: l.name,
      qty: l.qty,
      unitPrice: l.product.priceSrd,
      lineTotal: l.lineTotal,
    }));

    setReceipt({
      orderId,
      placedAt,
      roomNumber: guestSession.roomNumber,
      durationHours: guestSession.durationHours,
      hourlyRate,
      roomCostSrd,
      items: receiptItems,
      orderSubtotal,
      notes: notes.trim() || undefined,
    });

    const items: OrderLine[] = lines.map((l) => ({
      productId: l.productId,
      name: l.name,
      qty: l.qty,
      unitPrice: l.product.priceSrd,
    }));
    dispatch({
      type: "ADD_ORDER",
      order: {
        id: orderId,
        roomNumber: guestSession.roomNumber,
        createdAt: placedAt,
        status: "processing",
        items,
        notes: notes.trim() || undefined,
      },
    });
    clearCart();
    setNotes("");
    setReceiptDetailsOpen(false);
    setShowSuccess(true);
  }

  function dismissReceipt() {
    setShowSuccess(false);
    setReceipt(null);
    setReceiptDetailsOpen(false);
    router.push("/guest/stay");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--background)]">
      <GuestHeader showCart />

      {/* Title band */}
      <div className="border-b border-[var(--border)] bg-[var(--card)] px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--muted)]">
            {t(locale, "orderSummaryTitle")}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--foreground)] sm:text-4xl">
            {t(locale, "summaryOrder")}
          </h1>
        </div>
      </div>

      <div className="relative mx-auto flex w-full max-w-5xl min-h-0 flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[1fr_minmax(300px,400px)] lg:items-start lg:gap-10">
          {/* Line items + notes */}
          <div className="flex min-h-0 flex-col gap-6">
            <div className="flex shrink-0 items-center justify-between gap-3">
              <Link
                href="/guest"
                className="inline-flex min-h-11 min-w-0 shrink-0 touch-manipulation items-center gap-2 rounded-xl border border-[var(--border-light)] bg-[var(--surface)] px-4 py-2.5 text-sm font-bold text-[var(--foreground)] shadow-sm transition hover:border-[var(--gold)]/35 hover:bg-[var(--card-hover)] hover:text-[var(--gold)] sm:px-5"
                aria-label={t(locale, "back")}
              >
                <svg className="h-5 w-5 shrink-0 text-[var(--gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                {t(locale, "back")}
              </Link>
              {lines.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-red-400/90 transition hover:bg-red-500/10 hover:text-red-400"
                >
                  {t(locale, "removeAll")}
                </button>
              )}
            </div>

            <ul className="flex flex-col gap-4">
              {lines.map((l) => (
                <li
                  key={l.productId}
                  className="group flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-md transition hover:border-[var(--gold)]/25 hover:shadow-lg sm:gap-5 sm:p-5"
                >
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-[var(--surface)] ring-1 ring-[var(--border)] sm:h-28 sm:w-28">
                    <ProductThumb
                      src={l.product.image}
                      alt={l.name}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 96px, 112px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-bold leading-tight text-[var(--foreground)] sm:text-xl">
                      {l.name}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {formatSrd(l.product.priceSrd)}{" "}
                      <span className="text-[var(--muted)]/80">{t(locale, "perHour")}</span>
                    </p>
                  </div>
                  <div className="flex w-full flex-row items-center justify-between gap-4 sm:w-auto sm:flex-col sm:items-end">
                    <span className="text-xl font-black tabular-nums text-[var(--gold)] sm:text-2xl">
                      {formatSrd(l.lineTotal)}
                    </span>
                    <div className="flex items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-1">
                      <button
                        type="button"
                        className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-xl text-lg font-bold text-[var(--foreground)] transition hover:bg-[var(--card)] active:scale-95"
                        onClick={() => setCartQty(l.productId, l.qty - 1)}
                        aria-label={t(locale, "removeOneFromCart")}
                      >
                        −
                      </button>
                      <span className="min-w-[2rem] text-center font-mono text-lg font-black text-[var(--foreground)]">
                        {l.qty}
                      </span>
                      <button
                        type="button"
                        className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-xl text-lg font-bold text-[var(--foreground)] transition hover:bg-[var(--card)] active:scale-95"
                        onClick={() => setCartQty(l.productId, l.qty + 1)}
                        aria-label={t(locale, "add")}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </li>
              ))}
              {lines.length === 0 && !showSuccess && (
                <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/40 px-8 py-16 text-center">
                  <p className="text-base text-[var(--muted)]">
                    <Link href="/guest" className="font-bold text-[var(--gold)] underline-offset-4 hover:underline">
                      {t(locale, "menu")}
                    </Link>
                  </p>
                </div>
              )}
            </ul>

            {lines.length > 0 && (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-5 shadow-inner sm:p-6">
                <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--gold)]">
                  {t(locale, "notes")}
                </label>
                <textarea
                  className="min-h-[5.5rem] w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base leading-relaxed text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/70 focus:border-[var(--gold)]/35 focus:ring-2 focus:ring-[var(--gold)]/15"
                  placeholder={t(locale, "feedbackPlaceholder")}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* Checkout card */}
          <aside className="lg:sticky lg:top-6">
            <div className="flex flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-lg lg:shadow-xl">
              <div className="shrink-0 border-b border-[var(--border)] bg-[var(--surface)] px-6 py-5">
                <h2 className="text-center text-sm font-bold uppercase tracking-[0.2em] text-[var(--gold)]">
                  {t(locale, "summaryOrder")}
                </h2>
              </div>
              <div className="max-h-[min(50vh,20rem)] overflow-y-auto overscroll-contain px-6 py-5">
                {lines.length === 0 ? (
                  <p className="py-6 text-center text-sm text-[var(--muted)]">—</p>
                ) : (
                  <ul className="space-y-3">
                    {lines.map((l) => (
                      <li
                        key={l.productId}
                        className="flex items-start justify-between gap-3 border-b border-[var(--border)]/60 pb-3 last:border-0 last:pb-0"
                      >
                        <span className="min-w-0 text-[15px] leading-snug text-[var(--foreground)]">
                          <span className="font-bold text-[var(--gold)]">{l.qty}×</span>{" "}
                          <span className="text-[var(--foreground)]">{l.name}</span>
                        </span>
                        <span className="shrink-0 text-[15px] font-bold tabular-nums text-[var(--gold)]">
                          {formatSrd(l.lineTotal)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="shrink-0 space-y-5 border-t border-[var(--border)] bg-[var(--surface)]/25 px-6 pb-7 pt-6">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
                    {t(locale, "total")}
                  </span>
                  <span className="text-2xl font-black tabular-nums text-[var(--gold)] sm:text-3xl">
                    {formatSrd(total)}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={lines.length === 0}
                  onClick={placeOrder}
                  className="w-full origin-center touch-manipulation rounded-2xl bg-[var(--gold)] py-4 text-lg font-black tracking-wide text-[var(--dark)] shadow-[0_8px_28px_-12px_color-mix(in_srgb,var(--gold)_42%,transparent)] transition-all duration-200 ease-out hover:scale-[1.03] hover:bg-[var(--gold-light)] hover:py-[1.125rem] hover:shadow-[0_12px_36px_-12px_color-mix(in_srgb,var(--gold)_52%,transparent)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-35 disabled:hover:scale-100 disabled:hover:py-4"
                >
                  {t(locale, "placeOrder")}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {showSuccess && receipt && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t(locale, "receiptTitle")}
          onClick={dismissReceipt}
          className={`fixed inset-0 z-50 flex cursor-default flex-col items-center justify-center px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] backdrop-blur-md touch-manipulation sm:px-8 ${
            theme === "light" ? "bg-[color-mix(in_srgb,var(--foreground)_28%,transparent)]" : "bg-black/65"
          }`}
        >
          <div className="animate-fade-in-scale w-full max-w-xl overflow-y-auto overscroll-contain">
            <div className="rounded-3xl border-2 border-dashed border-[var(--border-light)] bg-[var(--card)] px-6 py-7 font-mono text-base leading-relaxed text-[var(--foreground)] shadow-2xl sm:px-9 sm:py-9 sm:text-lg">
              <div className="border-b border-dashed border-[var(--border)] pb-5 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--gold)] sm:text-sm">
                  {t(locale, "brand")}
                </p>
                <p className="mt-2 text-2xl font-black uppercase tracking-wide text-[var(--foreground)] sm:text-3xl">
                  {t(locale, "receiptTitle")}
                </p>
              </div>

              <dl className="mt-5 space-y-2.5 text-base text-[var(--muted)] sm:space-y-3 sm:text-lg">
                <div className="flex justify-between gap-4">
                  <dt>{t(locale, "receiptOrderNo")}</dt>
                  <dd className="font-semibold tabular-nums text-[var(--foreground)]">
                    #{receipt.orderId.replace(/^o-/, "")}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>{t(locale, "receiptRoom")}</dt>
                  <dd className="text-xl font-black text-[var(--gold)] sm:text-2xl">{receipt.roomNumber}</dd>
                </div>
              </dl>

              <div className="my-5 border-t border-dashed border-[var(--border)] sm:my-6" />

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setReceiptDetailsOpen((open) => !open);
                }}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--border)]/80 bg-[var(--surface)] px-4 py-3 text-left transition-colors hover:bg-[var(--surface)]/80 sm:px-5 sm:py-3.5"
                aria-expanded={receiptDetailsOpen}
              >
                <span className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] sm:text-base">
                  {t(locale, "receiptOrderDetails")}
                </span>
                <svg
                  className={`h-5 w-5 shrink-0 text-[var(--gold)] transition-transform duration-200 sm:h-6 sm:w-6 ${
                    receiptDetailsOpen ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {receiptDetailsOpen && (
                <div className="mt-3 space-y-4 border-l-2 border-[var(--border)] pl-4 sm:mt-4 sm:pl-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] sm:text-sm">
                      {t(locale, "receiptRoomCharge")}
                    </p>
                    <div className="mt-2 flex items-start justify-between gap-4 text-[var(--foreground)]">
                      <span className="min-w-0 font-medium">
                        {receipt.durationHours} {t(locale, "hours")} × {formatSrd(receipt.hourlyRate)}
                      </span>
                      <span className="shrink-0 font-bold tabular-nums">
                        {formatSrd(receipt.roomCostSrd)}
                      </span>
                    </div>
                  </div>

                  {receipt.items.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] sm:text-sm">
                        {t(locale, "receiptOrderItems")}
                      </p>
                      <ul className="mt-2 space-y-2.5 sm:space-y-3">
                        {receipt.items.map((item) => (
                          <li key={item.productId} className="flex items-start justify-between gap-4">
                            <span className="min-w-0 text-[var(--foreground)]">
                              <span className="font-bold text-[var(--gold)]">{item.qty}×</span>{" "}
                              <span className="font-medium">{item.name}</span>
                              <span className="mt-0.5 block text-sm text-[var(--muted)]">
                                @ {formatSrd(item.unitPrice)}
                              </span>
                            </span>
                            <span className="shrink-0 font-bold tabular-nums text-[var(--foreground)]">
                              {formatSrd(item.lineTotal)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {receipt.notes && (
                    <p className="rounded-xl border border-[var(--border)]/80 bg-[var(--surface)] px-3 py-2.5 text-sm italic text-[var(--muted)] sm:text-base">
                      {receipt.notes}
                    </p>
                  )}
                </div>
              )}

              <div className="my-6 border-t border-dashed border-[var(--border)] pt-8 text-center sm:my-8 sm:pt-10">
                <p className="text-lg font-bold uppercase tracking-[0.2em] text-[var(--muted)] sm:text-xl">
                  {t(locale, "receiptPayAtHatch")}
                </p>
                <p className="mt-4 text-5xl font-black tabular-nums leading-none text-[var(--gold)] sm:text-6xl">
                  {formatSrd(receipt.orderSubtotal + receipt.roomCostSrd)}
                </p>
              </div>
            </div>
          </div>
          <p
            className={`pointer-events-none mt-6 text-center text-sm font-semibold uppercase tracking-[0.2em] sm:text-base ${
              theme === "light" ? "text-[var(--muted)]" : "text-white/55"
            }`}
          >
            {t(locale, "tapToContinue")}
          </p>
        </div>
      )}
    </div>
  );
}
