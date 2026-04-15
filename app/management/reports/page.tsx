"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { ManagementShell } from "@/components/management-shell";
import { useDemo } from "@/contexts/demo-context";
import { formatSrd } from "@/lib/format";
import { t, type TKey } from "@/lib/i18n";
import { bcp47ForLocale } from "@/lib/locale-intl";
import type { GuestRating, Order } from "@/lib/types";

type RoomSortKey = "room" | "orders" | "units" | "revenue" | "avgOrder";
type SortDir = "asc" | "desc";

const DAY_KEYS: TKey[] = ["mgmtDaySun", "mgmtDayMon", "mgmtDayTue", "mgmtDayWed", "mgmtDayThu", "mgmtDayFri", "mgmtDaySat"];
const PERIOD_KEYS = { today: "mgmtToday", week: "mgmtWeek", month: "mgmtMonth" } as const;
type Preset = keyof typeof PERIOD_KEYS | "custom";

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseYmdLocal(s: string): Date {
  const [y, mo, da] = s.split("-").map(Number);
  return new Date(y, mo - 1, da);
}

function rangeBounds(fromStr: string, toStr: string): { start: number; end: number } {
  let a = parseYmdLocal(fromStr);
  let b = parseYmdLocal(toStr);
  if (a.getTime() > b.getTime()) [a, b] = [b, a];
  const start = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const end = new Date(b.getFullYear(), b.getMonth(), b.getDate(), 23, 59, 59, 999).getTime();
  return { start, end };
}

function orderTotal(o: Order): number {
  return o.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
}

function totalUnits(o: Order): number {
  return o.items.reduce((s, i) => s + i.qty, 0);
}

function overallStars(r: Pick<GuestRating, "cleanliness" | "comfort" | "service">): number {
  return (r.cleanliness + r.comfort + r.service) / 3;
}

function defaultMonthFrom(): string {
  const f = new Date();
  f.setDate(f.getDate() - 30);
  return toYmd(f);
}

function roomSortNumber(room: string): number {
  const n = Number.parseInt(room, 10);
  return Number.isFinite(n) ? n : 0;
}

function SortableRoomTh({
  align,
  children,
  sortKey,
  roomSort,
  onSort,
  sortHint,
}: {
  align: "left" | "right";
  children: ReactNode;
  sortKey: RoomSortKey;
  roomSort: { key: RoomSortKey; dir: SortDir } | null;
  onSort: (k: RoomSortKey) => void;
  sortHint: string;
}) {
  const active = roomSort?.key === sortKey;
  const dir = active ? roomSort.dir : null;
  return (
    <th
      scope="col"
      className={`select-none px-4 py-3 sm:px-6 ${align === "right" ? "text-right" : "text-left"}`}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : undefined}
    >
      <button
        type="button"
        title={sortHint}
        onClick={() => onSort(sortKey)}
        className={`group inline-flex max-w-full items-center gap-1.5 font-bold text-[var(--foreground)] transition hover:text-[var(--gold)] ${align === "right" ? "ml-auto flex-row-reverse" : ""}`}
      >
        <span className="min-w-0">{children}</span>
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[var(--muted)] group-hover:text-[var(--gold)]">
          {active ? (
            <svg className="h-4 w-4 text-[var(--gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              {dir === "desc" ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              )}
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          )}
        </span>
      </button>
    </th>
  );
}

export default function ManagementReportsPage() {
  const { orders, rooms, locale, guestRatings } = useDemo();
  const [dateFrom, setDateFrom] = useState(defaultMonthFrom);
  const [dateTo, setDateTo] = useState(() => toYmd(new Date()));
  const [preset, setPreset] = useState<Preset>("month");
  const [roomSort, setRoomSort] = useState<{ key: RoomSortKey; dir: SortDir } | null>(null);

  const { start, end } = useMemo(() => rangeBounds(dateFrom, dateTo), [dateFrom, dateTo]);

  const filtered = useMemo(
    () => orders.filter((o) => o.createdAt >= start && o.createdAt <= end),
    [orders, start, end]
  );

  const ratingsFiltered = useMemo(
    () => guestRatings.filter((r) => r.submittedAt >= start && r.submittedAt <= end),
    [guestRatings, start, end]
  );

  const ratingStats = useMemo(() => {
    const n = ratingsFiltered.length;
    if (n === 0) {
      return { count: 0, avgClean: 0, avgComfort: 0, avgService: 0, avgOverall: 0 };
    }
    let c = 0;
    let co = 0;
    let s = 0;
    let o = 0;
    for (const r of ratingsFiltered) {
      c += r.cleanliness;
      co += r.comfort;
      s += r.service;
      o += overallStars(r);
    }
    return {
      count: n,
      avgClean: c / n,
      avgComfort: co / n,
      avgService: s / n,
      avgOverall: o / n,
    };
  }, [ratingsFiltered]);

  const ratingsTableRows = useMemo(
    () => [...ratingsFiltered].sort((a, b) => b.submittedAt - a.submittedAt).slice(0, 50),
    [ratingsFiltered]
  );

  const timeLoc = bcp47ForLocale(locale);

  const stats = useMemo(() => {
    const totalRevenue = filtered.reduce((s, o) => s + orderTotal(o), 0);
    const totalOrders = filtered.length;
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const unitsSold = filtered.reduce((s, o) => s + totalUnits(o), 0);
    const avgPerUnit = unitsSold > 0 ? totalRevenue / unitsSold : 0;
    const spanDays = Math.max(1, (end - start) / (1000 * 60 * 60 * 24) + 1e-9);
    const months = spanDays / 30.44;
    const avgPerMonth = totalRevenue / Math.max(months, 1 / 30.44);
    return { totalRevenue, totalOrders, avgOrder, unitsSold, avgPerUnit, avgPerMonth };
  }, [filtered, start, end]);

  const roomRows = useMemo(() => {
    const map = new Map<string, { orders: number; units: number; revenue: number }>();
    for (const r of rooms) {
      map.set(r.number, { orders: 0, units: 0, revenue: 0 });
    }
    for (const o of filtered) {
      const cur = map.get(o.roomNumber) ?? { orders: 0, units: 0, revenue: 0 };
      cur.orders += 1;
      cur.units += totalUnits(o);
      cur.revenue += orderTotal(o);
      map.set(o.roomNumber, cur);
    }
    return [...map.entries()]
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([room, v]) => ({
        room,
        orders: v.orders,
        units: v.units,
        revenue: v.revenue,
        avgOrder: v.orders > 0 ? v.revenue / v.orders : 0,
      }));
  }, [rooms, filtered]);

  const tableTotals = useMemo(() => {
    return roomRows.reduce(
      (acc, r) => ({
        orders: acc.orders + r.orders,
        units: acc.units + r.units,
        revenue: acc.revenue + r.revenue,
      }),
      { orders: 0, units: 0, revenue: 0 }
    );
  }, [roomRows]);

  const sortedRoomRows = useMemo(() => {
    const rows = [...roomRows];
    if (!roomSort) {
      rows.sort(
        (a, b) => roomSortNumber(a.room) - roomSortNumber(b.room) || a.room.localeCompare(b.room)
      );
      return rows;
    }
    const mult = roomSort.dir === "asc" ? 1 : -1;
    const val = (r: (typeof roomRows)[0]): number => {
      switch (roomSort.key) {
        case "room":
          return roomSortNumber(r.room);
        case "orders":
          return r.orders;
        case "units":
          return r.units;
        case "revenue":
          return r.revenue;
        case "avgOrder":
          return r.avgOrder;
        default:
          return 0;
      }
    };
    rows.sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      if (va !== vb) return va < vb ? -mult : mult;
      return (
        (roomSortNumber(a.room) - roomSortNumber(b.room)) * mult ||
        a.room.localeCompare(b.room) * mult
      );
    });
    return rows;
  }, [roomRows, roomSort]);

  const toggleRoomSort = useCallback((key: RoomSortKey) => {
    setRoomSort((prev) => {
      if (prev?.key === key) {
        return { key, dir: prev.dir === "desc" ? "asc" : "desc" };
      }
      if (key === "room") return { key, dir: "asc" };
      return { key, dir: "desc" };
    });
  }, []);

  const resetRoomSort = useCallback(() => {
    setRoomSort(null);
  }, []);

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
    return [...roomRows]
      .filter((r) => r.revenue > 0)
      .map((r) => ({ room: r.room, srd: r.revenue }))
      .sort((a, b) => b.srd - a.srd)
      .slice(0, 6);
  }, [roomRows]);

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
    return DAY_KEYS.map((key, i) => ({ key, count: counts[i] }));
  }, [filtered]);

  const bestSellingMax = Math.max(1, ...bestSelling.map((b) => b.units));
  const revenueMax = Math.max(1, ...revenuePerRoom.map((b) => b.srd));
  const busiestHoursMax = Math.max(1, ...busiestHours.map((b) => b.count));
  const busiestDaysMax = Math.max(1, ...busiestDays.map((b) => b.count));

  function applyPreset(p: Preset) {
    setPreset(p);
    const now = new Date();
    const to = toYmd(now);
    if (p === "today") {
      setDateFrom(to);
      setDateTo(to);
    } else if (p === "week") {
      const f = new Date(now);
      f.setDate(f.getDate() - 7);
      setDateFrom(toYmd(f));
      setDateTo(to);
    } else if (p === "month") {
      const f = new Date(now);
      f.setDate(f.getDate() - 30);
      setDateFrom(toYmd(f));
      setDateTo(to);
    }
  }

  const exportCsv = useCallback(() => {
    const lines: string[] = [];
    lines.push(`Filter,${dateFrom},${dateTo}`);
    lines.push(`ReportFilters,roomSort,${roomSort ? `${roomSort.key}:${roomSort.dir}` : "default"}`);
    lines.push(
      `Summary,${stats.totalOrders},${stats.totalRevenue.toFixed(2)},${stats.unitsSold},${stats.avgOrder.toFixed(2)},${stats.avgPerMonth.toFixed(2)},${stats.avgPerUnit.toFixed(2)}`
    );
    lines.push(`Columns,totalOrders,totalRevenueSrd,unitsSold,avgOrderSrd,avgPerMonthSrd,avgPerUnitSrd`);
    lines.push("");
    lines.push("Room,Orders,ItemsSold,RevenueSrd,AvgOrderSrd");
    for (const r of sortedRoomRows) {
      lines.push(`${r.room},${r.orders},${r.units},${r.revenue.toFixed(2)},${r.avgOrder.toFixed(2)}`);
    }
    lines.push("");
    lines.push("Order ID,Room,Date,Time,Items,Total (SRD)");
    for (const o of filtered.sort((a, b) => b.createdAt - a.createdAt)) {
      const d = new Date(o.createdAt);
      const date = d.toLocaleDateString(timeLoc);
      const time = d.toLocaleTimeString(timeLoc, { hour: "numeric", minute: "2-digit" });
      const items = o.items.map((i) => `${i.qty}x ${i.name}`).join("; ");
      lines.push(`${o.id},${o.roomNumber},${date},${time},"${items}",${orderTotal(o).toFixed(2)}`);
    }
    lines.push("");
    lines.push(
      "Guest ratings summary,count,avgCleanliness,avgComfort,avgService,avgOverall"
    );
    lines.push(
      `Summary,${ratingStats.count},${ratingStats.avgClean.toFixed(2)},${ratingStats.avgComfort.toFixed(2)},${ratingStats.avgService.toFixed(2)},${ratingStats.avgOverall.toFixed(2)}`
    );
    lines.push("Rating ID,Room,Date,Time,cleanliness,comfort,service,overall");
    for (const r of [...ratingsFiltered].sort((a, b) => b.submittedAt - a.submittedAt)) {
      const d = new Date(r.submittedAt);
      const date = d.toLocaleDateString(timeLoc);
      const time = d.toLocaleTimeString(timeLoc, { hour: "numeric", minute: "2-digit" });
      const ov = overallStars(r);
      lines.push(`${r.id},${r.roomNumber},${date},${time},${r.cleanliness},${r.comfort},${r.service},${ov.toFixed(2)}`);
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `empire-report-${dateFrom}_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [dateFrom, dateTo, filtered, ratingStats, ratingsFiltered, roomSort, sortedRoomRows, stats, timeLoc]);

  const exportPdf = useCallback(() => {
    window.print();
  }, []);

  const filterLabel =
    preset === "custom"
      ? `${dateFrom} → ${dateTo}`
      : t(locale, PERIOD_KEYS[preset as keyof typeof PERIOD_KEYS]);

  const sortHint = t(locale, "mgmtReportsSortHint");

  const hasRoomSort = roomSort !== null;

  return (
    <ManagementShell>
      <div className="reports-page px-4 py-8 sm:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-black text-[var(--gold)]">{t(locale, "mgmtReporting")}</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">{t(locale, "mgmtReportingSub")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={exportCsv}
              className="flex items-center gap-2 rounded-xl border border-[var(--border-light)] px-4 py-2.5 text-sm font-semibold text-[var(--gold)] transition hover:bg-[var(--gold)]/10"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV
            </button>
            <button
              type="button"
              onClick={exportPdf}
              className="flex items-center gap-2 rounded-xl border border-[var(--border-light)] px-4 py-2.5 text-sm font-semibold text-[var(--gold)] transition hover:bg-[var(--gold)]/10 print:hidden"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z" />
              </svg>
              PDF
            </button>
          </div>
        </div>

        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)] print:hidden">
          {t(locale, "mgmtRevenue")} · {filterLabel}
        </p>

        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
          <KpiCard label={t(locale, "mgmtRevenue")} value={formatSrd(stats.totalRevenue)} icon="revenue" size="hero" />
          <KpiCard label={t(locale, "mgmtTotalOrders")} value={String(stats.totalOrders)} icon="orders" size="hero" />
          <KpiCard label={t(locale, "mgmtUnitsSold")} value={String(stats.unitsSold)} icon="units" size="hero" />
        </div>

        <section className="mb-10 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-lg print:hidden">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--gold)]">{t(locale, "mgmtReportsFilterTitle")}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {(["today", "week", "month"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => applyPreset(p)}
                className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                  preset === p ? "bg-[var(--gold)] text-[var(--dark)] shadow" : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {t(locale, PERIOD_KEYS[p])}
              </button>
            ))}
          </div>
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4 md:gap-6">
            <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-xs font-semibold text-[var(--muted)] sm:min-w-[12rem] sm:max-w-[18rem]">
              {t(locale, "mgmtDateFrom")}
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPreset("custom");
                }}
                className="min-h-[2.75rem] w-full min-w-0 rounded-xl border border-[var(--border-light)] bg-[var(--surface)] px-3 py-2.5 text-sm font-medium text-[var(--foreground)] outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20"
              />
            </label>
            <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-xs font-semibold text-[var(--muted)] sm:min-w-[12rem] sm:max-w-[18rem]">
              {t(locale, "mgmtDateTo")}
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPreset("custom");
                }}
                className="min-h-[2.75rem] w-full min-w-0 rounded-xl border border-[var(--border-light)] bg-[var(--surface)] px-3 py-2.5 text-sm font-medium text-[var(--foreground)] outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20"
              />
            </label>
          </div>
          {hasRoomSort && (
            <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
              <button
                type="button"
                onClick={resetRoomSort}
                className="rounded-xl border border-[var(--border-light)] px-4 py-2 text-sm font-bold text-[var(--gold)] transition hover:bg-[var(--gold)]/10"
              >
                {t(locale, "mgmtReportsClearFilters")}
              </button>
            </div>
          )}
        </section>

        <section className="mb-10 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg">
          <div className="border-b border-[var(--border)] px-5 py-4 sm:px-6">
            <h2 className="text-lg font-bold text-[var(--gold)]">{t(locale, "mgmtRoomBreakdown")}</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {dateFrom} — {dateTo}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface)]/80">
                  <SortableRoomTh
                    align="left"
                    sortKey="room"
                    roomSort={roomSort}
                    onSort={toggleRoomSort}
                    sortHint={sortHint}
                  >
                    {t(locale, "mgmtRoom")}
                  </SortableRoomTh>
                  <SortableRoomTh
                    align="right"
                    sortKey="orders"
                    roomSort={roomSort}
                    onSort={toggleRoomSort}
                    sortHint={sortHint}
                  >
                    {t(locale, "mgmtRoomTableOrders")}
                  </SortableRoomTh>
                  <SortableRoomTh
                    align="right"
                    sortKey="units"
                    roomSort={roomSort}
                    onSort={toggleRoomSort}
                    sortHint={sortHint}
                  >
                    {t(locale, "mgmtRoomTableItemsSold")}
                  </SortableRoomTh>
                  <SortableRoomTh
                    align="right"
                    sortKey="revenue"
                    roomSort={roomSort}
                    onSort={toggleRoomSort}
                    sortHint={sortHint}
                  >
                    {t(locale, "mgmtRoomTableRevenue")}
                  </SortableRoomTh>
                  <SortableRoomTh
                    align="right"
                    sortKey="avgOrder"
                    roomSort={roomSort}
                    onSort={toggleRoomSort}
                    sortHint={sortHint}
                  >
                    {t(locale, "mgmtRoomTableAvgOrder")}
                  </SortableRoomTh>
                </tr>
              </thead>
              <tbody>
                {sortedRoomRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-[var(--muted)] sm:px-6">
                      {t(locale, "mgmtReportsNoRoomRows")}
                    </td>
                  </tr>
                ) : (
                  sortedRoomRows.map((row) => (
                    <tr key={row.room} className="border-b border-[var(--border)] last:border-0 odd:bg-[var(--background)]/40">
                      <td className="px-4 py-3 font-black text-[var(--gold)] sm:px-6">{row.room}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[var(--foreground)] sm:px-6">{row.orders}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[var(--foreground)] sm:px-6">{row.units}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-[var(--gold)] sm:px-6">{formatSrd(row.revenue)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[var(--muted)] sm:px-6">{formatSrd(row.avgOrder)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-[var(--gold)]/10 font-bold">
                  <td className="px-4 py-3 text-[var(--foreground)] sm:px-6">{t(locale, "mgmtTotals")}</td>
                  <td className="px-4 py-3 text-right tabular-nums sm:px-6">{tableTotals.orders}</td>
                  <td className="px-4 py-3 text-right tabular-nums sm:px-6">{tableTotals.units}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--gold)] sm:px-6">{formatSrd(tableTotals.revenue)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--muted)] sm:px-6">
                    {tableTotals.orders > 0 ? formatSrd(tableTotals.revenue / tableTotals.orders) : formatSrd(0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <section className="mb-10 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg">
          <div className="border-b border-[var(--border)] px-5 py-4 sm:px-6">
            <h2 className="text-lg font-bold text-[var(--gold)]">{t(locale, "mgmtGuestFeedbackTitle")}</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">{t(locale, "mgmtGuestFeedbackSub")}</p>
          </div>
          {ratingStats.count === 0 ? (
            <p className="px-5 py-8 text-sm text-[var(--muted)] sm:px-6">{t(locale, "mgmtNoRatingsPeriod")}</p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5 sm:p-6">
                <KpiCard label={t(locale, "mgmtRatingsCount")} value={String(ratingStats.count)} icon="orders" />
                <KpiCard
                  label={t(locale, "mgmtRatingsAvgClean")}
                  value={ratingStats.avgClean.toFixed(1)}
                  icon="avg"
                />
                <KpiCard
                  label={t(locale, "mgmtRatingsAvgComfort")}
                  value={ratingStats.avgComfort.toFixed(1)}
                  icon="avg"
                />
                <KpiCard
                  label={t(locale, "mgmtRatingsAvgService")}
                  value={ratingStats.avgService.toFixed(1)}
                  icon="avg"
                />
                <KpiCard
                  label={t(locale, "mgmtRatingsAvgOverall")}
                  value={ratingStats.avgOverall.toFixed(1)}
                  icon="avg"
                />
              </div>
              <div className="overflow-x-auto border-t border-[var(--border)]">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--surface)]/80">
                      <th className="px-4 py-3 font-bold text-[var(--foreground)] sm:px-6">{t(locale, "mgmtRatingsTableRoom")}</th>
                      <th className="px-4 py-3 font-bold text-[var(--foreground)] sm:px-6">{t(locale, "mgmtRatingsTableDate")}</th>
                      <th className="px-4 py-3 text-right font-bold text-[var(--foreground)] sm:px-6">{t(locale, "mgmtRatingsTableClean")}</th>
                      <th className="px-4 py-3 text-right font-bold text-[var(--foreground)] sm:px-6">{t(locale, "mgmtRatingsTableComfort")}</th>
                      <th className="px-4 py-3 text-right font-bold text-[var(--foreground)] sm:px-6">{t(locale, "mgmtRatingsTableService")}</th>
                      <th className="px-4 py-3 text-right font-bold text-[var(--foreground)] sm:px-6">{t(locale, "mgmtRatingsTableOverall")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ratingsTableRows.map((row) => {
                      const d = new Date(row.submittedAt);
                      return (
                        <tr key={row.id} className="border-b border-[var(--border)] last:border-0 odd:bg-[var(--background)]/40">
                          <td className="px-4 py-3 font-black text-[var(--gold)] sm:px-6">{row.roomNumber}</td>
                          <td className="px-4 py-3 tabular-nums text-[var(--muted)] sm:px-6">
                            {d.toLocaleDateString(timeLoc, { day: "numeric", month: "short" })}{" "}
                            <span className="text-[var(--foreground)]">
                              {d.toLocaleTimeString(timeLoc, { hour: "numeric", minute: "2-digit" })}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums sm:px-6">{row.cleanliness}</td>
                          <td className="px-4 py-3 text-right tabular-nums sm:px-6">{row.comfort}</td>
                          <td className="px-4 py-3 text-right tabular-nums sm:px-6">{row.service}</td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums text-[var(--gold)] sm:px-6">
                            {overallStars(row).toFixed(1)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <div className="grid gap-8 lg:grid-cols-2 print:hidden">
          <section className="animate-fade-in rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
            <h2 className="text-lg font-bold text-[var(--gold)]">{t(locale, "mgmtBestSelling")}</h2>
            {bestSelling.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--muted)]">{t(locale, "mgmtNoOrdersPeriod")}</p>
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
                        <span className="text-sm font-bold text-[var(--gold)]">
                          {item.units} {t(locale, "mgmtUnits")}
                        </span>
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

          <section className="animate-fade-in rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
            <h2 className="text-lg font-bold text-[var(--gold)]">{t(locale, "mgmtRevenuePerRoom")}</h2>
            {revenuePerRoom.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--muted)]">{t(locale, "mgmtNoOrdersPeriod")}</p>
            ) : (
              <ul className="mt-5 space-y-4">
                {revenuePerRoom.map((item) => (
                  <li key={item.room} className="flex items-center gap-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface)] text-sm font-bold text-[var(--foreground)]">
                      {item.room}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-[var(--muted)]">
                          {t(locale, "mgmtRoom")} {item.room}
                        </span>
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

          <section className="animate-fade-in rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
            <h2 className="text-lg font-bold text-[var(--gold)]">{t(locale, "mgmtBusiestHours")}</h2>
            {busiestHours.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--muted)]">{t(locale, "mgmtNoData")}</p>
            ) : (
              <div className="mt-5 flex items-end gap-3">
                {busiestHours.map((item) => (
                  <div key={item.hour} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-xs font-bold text-[var(--gold)]">{item.count}</span>
                    <div
                      className="flex w-full flex-col justify-end overflow-hidden rounded-t-lg bg-[var(--surface)]"
                      style={{ height: "140px" }}
                    >
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-[var(--gold-dim)] to-[var(--gold)] transition-all duration-700"
                        style={{ height: `${(item.count / busiestHoursMax) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-[var(--muted)]">{item.hour}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="animate-fade-in rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
            <h2 className="text-lg font-bold text-[var(--gold)]">{t(locale, "mgmtBusiestDays")}</h2>
            <div className="mt-5 flex items-end gap-3">
              {busiestDays.map((item) => (
                <div key={item.key} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-bold text-[var(--gold)]">{item.count}</span>
                  <div
                    className="flex w-full flex-col justify-end overflow-hidden rounded-t-lg bg-[var(--surface)]"
                    style={{ height: "140px" }}
                  >
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-[var(--gold-dim)] to-[var(--gold)] transition-all duration-700"
                      style={{
                        height: `${busiestDaysMax > 0 ? (item.count / busiestDaysMax) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-[var(--muted)]">{t(locale, item.key)}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </ManagementShell>
  );
}

function KpiCard({
  label,
  value,
  icon,
  size = "default",
}: {
  label: string;
  value: string;
  icon: string;
  size?: "default" | "hero";
}) {
  const valueClass =
    size === "hero"
      ? "text-2xl font-black tabular-nums leading-tight text-[var(--gold)] sm:text-3xl lg:text-4xl"
      : "text-xl font-black tabular-nums text-[var(--gold)] sm:text-2xl";
  return (
    <div className="animate-fade-in rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-lg sm:p-6">
      <div className="flex items-start gap-3 sm:items-center sm:gap-4">
        <div className={`flex shrink-0 items-center justify-center rounded-xl bg-[var(--gold)]/10 ${size === "hero" ? "h-12 w-12 sm:h-14 sm:w-14" : "h-11 w-11"}`}>
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
          {icon === "month" && (
            <svg className="h-6 w-6 text-[var(--gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
          {icon === "unit" && (
            <svg className="h-6 w-6 text-[var(--gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          )}
          {icon === "units" && (
            <svg className="h-6 w-6 text-[var(--gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-[var(--muted)] sm:text-sm">{label}</p>
          <p className={`mt-1 whitespace-normal break-words ${valueClass}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}
