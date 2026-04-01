"use client";

import { useMemo } from "react";
import { ManagementShell } from "@/components/management-shell";
import { useDemo } from "@/contexts/demo-context";
import { formatSrd } from "@/lib/format";
import { bcp47ForLocale } from "@/lib/locale-intl";
import { t } from "@/lib/i18n";

export default function ManagementOrdersPage() {
  const { orders, dispatch, panicAlerts, locale } = useDemo();
  const timeLoc = bcp47ForLocale(locale);

  const sorted = useMemo(
    () => [...orders].sort((a, b) => b.createdAt - a.createdAt),
    [orders]
  );

  const processingCount = orders.filter((o) => o.status === "processing").length;

  function toggleStatus(orderId: string, current: string) {
    const next = current === "processing" ? "completed" : "processing";
    dispatch({ type: "SET_ORDER_STATUS", orderId, status: next as "processing" | "completed" });
  }

  return (
    <ManagementShell>
      <div className="px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-[var(--gold)]">{t(locale, "mgmtActiveOrders")}</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {processingCount} {t(locale, "mgmtProcessing")} · {orders.length - processingCount} {t(locale, "mgmtCompleted")}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-[var(--gold)]/10 px-4 py-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--gold)]" />
            <span className="text-sm font-bold text-[var(--gold)]">{t(locale, "mgmtLive")}</span>
          </div>
        </div>

        {panicAlerts.length > 0 && (
          <div className="mb-6 space-y-3">
            {panicAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between rounded-2xl border border-red-500/30 bg-red-500/10 p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600">
                    <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-400">{t(locale, "mgmtPanicAlert")} — {t(locale, "mgmtRoom")} {alert.roomNumber}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {new Date(alert.at).toLocaleTimeString(timeLoc, { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "CLEAR_PANICS" })}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
                >
                  {t(locale, "mgmtDismiss")}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {sorted.map((order) => {
            const total = order.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
            const isProcessing = order.status === "processing";
            const time = new Date(order.createdAt);

            return (
              <div
                key={order.id}
                className={`animate-fade-in rounded-2xl border bg-[var(--card)] p-6 shadow-md transition ${
                  isProcessing
                    ? "border-[var(--gold)]/20"
                    : "border-[var(--border)] opacity-70"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--gold)]/10">
                      <span className="text-xl font-black text-[var(--gold)]">{order.roomNumber}</span>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-[var(--foreground)]">{t(locale, "mgmtRoom")} {order.roomNumber}</p>
                      <p className="text-sm text-[var(--muted)]">
                        {time.toLocaleTimeString(timeLoc, { hour: "numeric", minute: "2-digit" })}
                        {" · "}
                        {time.toLocaleDateString(timeLoc, { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                      isProcessing
                        ? "bg-amber-500/15 text-amber-400"
                        : "bg-emerald-500/15 text-emerald-400"
                    }`}>
                      {isProcessing ? t(locale, "mgmtProcessing") : t(locale, "mgmtCompleted")}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleStatus(order.id, order.status)}
                      className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                        isProcessing
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "bg-[var(--surface)] text-[var(--muted)] ring-1 ring-[var(--border-light)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      {isProcessing ? t(locale, "mgmtMarkDone") : t(locale, "mgmtReopen")}
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  {order.items.map((item) => (
                    <span
                      key={item.productId}
                      className="rounded-lg bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--foreground)]"
                    >
                      {item.qty}× {item.name}
                    </span>
                  ))}
                </div>

                {order.notes && (
                  <p className="mt-3 text-sm italic text-[var(--muted)]">&ldquo;{order.notes}&rdquo;</p>
                )}

                <div className="mt-4 flex justify-end text-lg font-bold text-[var(--gold)]">
                  {formatSrd(total)}
                </div>
              </div>
            );
          })}

          {sorted.length === 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12 text-center text-[var(--muted)]">
              {t(locale, "mgmtNoOrdersYet")}
            </div>
          )}
        </div>
      </div>
    </ManagementShell>
  );
}
