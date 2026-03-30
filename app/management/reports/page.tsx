"use client";

import { useCallback, useMemo, useState } from "react";
import { ManagementShell } from "@/components/management-shell";
import { useDemo } from "@/contexts/demo-context";
import { formatSrd } from "@/lib/format";
import type { Order } from "@/lib/types";

type Period = "today" | "week" | "month";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function orderTotal(o: Order): number {
  return o.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
}

function isWithinPeriod(ts: number, period: Period): boolean {
  const now = new Date();
  const d = new Date(ts);
  if (period === "today") {
    return d.toDateString() === now.toDateString();
  }
  if (period === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  }
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);
  return d >= monthAgo;
}

export default function ManagementReportsPage() {
  const { orders } = useDemo();
  const [period, setPeriod] = useState<Period>("month");

  const filtered = useMemo(
    () => orders.filter((o) => isWithinPeriod(o.createdAt, period)),
    [orders, period]
  );

  const stats = useMemo(() => {
    const totalRevenue = filtered.reduce((s, o) => s + orderTotal(o), 0);
    const totalOrders = filtered.length;
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    return { totalRevenue, totalOrders, avgOrder };
  }, [filtered]);

  const bestSelling = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of filtered) {
      for (const item of o.items) {
        map.set(item.name, (map.get(item.name) ?? 0) + item.qty);
      }
    }
    return [...map.entries()]
      .map(([name, units]) => ({ name, units }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 6);
  }, [filtered]);

  const revenuePerRoom = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of filtered) {
      map.set(o.roomNumber, (map.get(o.roomNumber) ?? 0) + orderTotal(o));
    }
    return [...map.entries()]
      .map(([room, srd]) => ({ room, srd }))
      .sort((a, b) => b.srd - a.srd)
      .slice(0, 6);
  }, [filtered]);

  const busiestHours = useMemo(() => {
    const counts = new Map<number, number>();
    for (const o of filtered) {
      const h = new Date(o.createdAt).getHours();
      counts.set(h, (counts.get(h) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([hour, count]) => ({ hour: `${String(hour).padStart(2, "0")}:00`, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [filtered]);

  const busiestDays = useMemo(() => {
    const counts = Array(7).fill(0) as number[];
    for (const o of filtered) {
      const day = new Date(o.createdAt).getDay();
      counts[day]++;
    }
    return DAY_NAMES.map((name, i) => ({ name, count: counts[i] }));
  }, [filtered]);

  const bestSellingMax = Math.max(1, ...bestSelling.map((b) => b.units));
  const revenueMax = Math.max(1, ...revenuePerRoom.map((b) => b.srd));
  const busiestHoursMax = Math.max(1, ...busiestHours.map((b) => b.count));
  const busiestDaysMax = Math.max(1, ...busiestDays.map((b) => b.count));

  const exportCsv = useCallback(() => {
    const header = "Order ID,Room,Date,Time,Items,Total (SRD)\n";
    const rows = filtered
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((o) => {
        const d = new Date(o.createdAt);
        const date = d.toLocaleDateString("en-US");
        const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
        const items = o.items.map((i) => `${i.qty}x ${i.name}`).join("; ");
        return `${o.id},${o.roomNumber},${date},${time},"${items}",${orderTotal(o).toFixed(2)}`;
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `empire-report-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered, period]);

  const exportPdf = useCallback(() => {
    window.print();
  }, []);

  return (
    <ManagementShell>
      <div className="px-8 py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[var(--gold)]">Management Reporting</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">Revenue, products, and analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-xl bg-[var(--surface)] p-1">
              {(["today", "week", "month"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`rounded-lg px-4 py-2 text-sm font-bold capitalize transition ${
                    period === p
                      ? "bg-[var(--gold)] text-[var(--dark)] shadow"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={exportCsv}
              className="flex items-center gap-2 rounded-xl border border-[var(--border-light)] px-4 py-2 text-sm font-semibold text-[var(--gold)] transition hover:bg-[var(--gold)]/10"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV
            </button>
            <button
              type="button"
              onClick={exportPdf}
              className="flex items-center gap-2 rounded-xl border border-[var(--border-light)] px-4 py-2 text-sm font-semibold text-[var(--gold)] transition hover:bg-[var(--gold)]/10"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z" />
              </svg>
              PDF
            </button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <KpiCard label={`Revenue (${period})`} value={formatSrd(stats.totalRevenue)} icon="revenue" />
          <KpiCard label="Total Orders" value={String(stats.totalOrders)} icon="orders" />
          <KpiCard label="Avg. per Order" value={formatSrd(stats.avgOrder)} icon="avg" />
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Best Selling */}
          <section className="animate-fade-in rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
            <h2 className="text-lg font-bold text-[var(--gold)]">Best Selling Products</h2>
            {bestSelling.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--muted)]">No orders in this period.</p>
            ) : (
              <ul className="mt-5 space-y-4">
                {bestSelling.map((item, i) => (
                  <li key={item.name} className="flex items-center gap-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--gold)]/10 text-sm font-bold text-[var(--gold)]">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold text-[var(--foreground)]">{item.name}</span>
                        <span className="text-sm font-bold text-[var(--gold)]">{item.units} units</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--surface)]">
                        <div
                          className="h-full rounded-full bg-[var(--gold)] transition-all duration-700"
                          style={{ width: `${(item.units / bestSellingMax) * 100}%` }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Revenue per Room */}
          <section className="animate-fade-in rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
            <h2 className="text-lg font-bold text-[var(--gold)]">Revenue per Room</h2>
            {revenuePerRoom.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--muted)]">No orders in this period.</p>
            ) : (
              <ul className="mt-5 space-y-4">
                {revenuePerRoom.map((item) => (
                  <li key={item.room} className="flex items-center gap-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface)] text-sm font-bold text-[var(--foreground)]">
                      {item.room}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-[var(--muted)]">Room {item.room}</span>
                        <span className="text-sm font-bold text-[var(--gold)]">{formatSrd(item.srd)}</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--surface)]">
                        <div
                          className="h-full rounded-full bg-[var(--gold-dim)] transition-all duration-700"
                          style={{ width: `${(item.srd / revenueMax) * 100}%` }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Busiest Hours */}
          <section className="animate-fade-in rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
            <h2 className="text-lg font-bold text-[var(--gold)]">Busiest Hours</h2>
            {busiestHours.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--muted)]">No data.</p>
            ) : (
              <div className="mt-5 flex items-end gap-3">
                {busiestHours.map((item) => (
                  <div key={item.hour} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-xs font-bold text-[var(--gold)]">{item.count}</span>
                    <div className="w-full overflow-hidden rounded-t-lg bg-[var(--surface)]" style={{ height: "140px" }}>
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-[var(--gold-dim)] to-[var(--gold)] transition-all duration-700"
                        style={{ height: `${(item.count / busiestHoursMax) * 100}%`, marginTop: `${100 - (item.count / busiestHoursMax) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-[var(--muted)]">{item.hour}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Busiest Days */}
          <section className="animate-fade-in rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
            <h2 className="text-lg font-bold text-[var(--gold)]">Busiest Days</h2>
            <div className="mt-5 flex items-end gap-3">
              {busiestDays.map((item) => (
                <div key={item.name} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-bold text-[var(--gold)]">{item.count}</span>
                  <div className="w-full overflow-hidden rounded-t-lg bg-[var(--surface)]" style={{ height: "140px" }}>
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-[var(--gold-dim)] to-[var(--gold)] transition-all duration-700"
                      style={{ height: `${busiestDaysMax > 0 ? (item.count / busiestDaysMax) * 100 : 0}%`, marginTop: `${busiestDaysMax > 0 ? 100 - (item.count / busiestDaysMax) * 100 : 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-[var(--muted)]">{item.name}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </ManagementShell>
  );
}

function KpiCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="animate-fade-in rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--gold)]/10">
          {icon === "revenue" && (
            <svg className="h-6 w-6 text-[var(--gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {icon === "orders" && (
            <svg className="h-6 w-6 text-[var(--gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          )}
          {icon === "avg" && (
            <svg className="h-6 w-6 text-[var(--gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          )}
        </div>
        <div>
          <p className="text-sm text-[var(--muted)]">{label}</p>
          <p className="text-2xl font-black text-[var(--gold)]">{value}</p>
        </div>
      </div>
    </div>
  );
}
