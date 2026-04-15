"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { ManagementShell } from "@/components/management-shell";
import { RoomTimer, useTimeLeft } from "@/components/room-timer";
import { useDemo } from "@/contexts/demo-context";
import { formatCountdown, formatSrd, formatTimeRange } from "@/lib/format";
import { bcp47ForLocale } from "@/lib/locale-intl";
import { t, type TKey } from "@/lib/i18n";
import type { Locale, Room, RoomStatus } from "@/lib/types";

const STATUS_STYLE: Record<RoomStatus, { key: TKey; dot: string; bg: string; text: string }> = {
  available: { key: "mgmtStatusAvailable", dot: "bg-emerald-400", bg: "bg-emerald-400/10", text: "text-emerald-400" },
  occupied: { key: "mgmtStatusOccupied", dot: "bg-[var(--gold)]", bg: "bg-[var(--gold)]/10", text: "text-[var(--gold)]" },
  cleaning: { key: "mgmtStatusCleaning", dot: "bg-sky-400", bg: "bg-sky-400/10", text: "text-sky-400" },
  maintenance: { key: "mgmtStatusMaintenance", dot: "bg-red-400", bg: "bg-red-400/10", text: "text-red-400" },
};

function statusButtons(locale: Locale): { value: RoomStatus; label: string }[] {
  return [
    { value: "available", label: t(locale, "mgmtStatusAvailable") },
    { value: "cleaning", label: t(locale, "mgmtStatusCleaning") },
    { value: "maintenance", label: t(locale, "mgmtStatusMaintenance") },
  ];
}

type RoomStatusToggle = "available" | "cleaning" | "maintenance";

/** Neutral theme chips; hover previews green / blue / red; only the current status uses full color. */
function roomStatusToggleClass(value: RoomStatusToggle, selected: boolean): string {
  const base =
    "rounded-lg px-3.5 py-2 text-sm font-semibold ring-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]/35";

  if (selected) {
    if (value === "available") {
      return `${base} bg-emerald-600 text-white ring-emerald-700/40 hover:bg-emerald-700 hover:ring-emerald-800/45`;
    }
    if (value === "cleaning") {
      return `${base} bg-sky-600 text-white ring-sky-700/40 hover:bg-sky-700 hover:ring-sky-800/45`;
    }
    return `${base} bg-red-600 text-white ring-red-800/40 hover:bg-red-700 hover:ring-red-900/45`;
  }

  const neutral = `${base} bg-[var(--surface)] text-[var(--muted)] ring-[var(--border-light)] hover:text-[var(--foreground)]`;

  if (value === "available") {
    return `${neutral} hover:bg-emerald-500/14 hover:text-emerald-800 hover:ring-emerald-500/30 active:bg-emerald-600/20 active:text-emerald-900 active:ring-emerald-600/35 dark:hover:text-emerald-300 dark:active:text-emerald-200`;
  }
  if (value === "cleaning") {
    return `${neutral} hover:bg-sky-500/14 hover:text-sky-900 hover:ring-sky-500/30 active:bg-sky-600/20 active:text-sky-950 active:ring-sky-600/35 dark:hover:text-sky-300 dark:active:text-sky-200`;
  }
  return `${neutral} hover:bg-red-500/14 hover:text-red-900 hover:ring-red-500/30 active:bg-red-600/20 active:text-red-950 active:ring-red-600/35 dark:hover:text-red-300 dark:active:text-red-200`;
}

const DURATION_MAX = 24;
const QUICK_HOURS = [1, 2, 3, 4, 6, 8, 12, 24] as const;

function clampDuration(n: number): number {
  if (!Number.isFinite(n)) return 2;
  return Math.min(DURATION_MAX, Math.max(1, Math.round(n)));
}

function RoomModal({ room, onClose }: { room: Room; onClose: () => void }) {
  const { orders, dispatch, locale, hourlyRate } = useDemo();
  const [durationHours, setDurationHours] = useState(2);
  const endsAt = room.sessionEndsAt ?? 0;
  const leftMs = useTimeLeft(endsAt);
  const roomOrders = orders.filter((o) => o.roomNumber === room.number);
  const cost = durationHours * hourlyRate;
  const isOccupied = room.status === "occupied";
  const timeLoc = bcp47ForLocale(locale);

  function startSession() {
    dispatch({ type: "START_ROOM_SESSION", roomId: room.id, durationHours: clampDuration(durationHours) });
  }
  function endSession() {
    dispatch({ type: "END_ROOM_SESSION", roomId: room.id });
  }
  function setStatus(status: RoomStatus) {
    dispatch({ type: "UPDATE_ROOM_STATUS", roomId: room.id, status });
  }

  const cfg = STATUS_STYLE[room.status];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-6 pt-16 backdrop-blur-sm" onClick={onClose}>
      <div className="animate-fade-in-scale w-full max-w-3xl rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-[var(--gold)]">{t(locale, "mgmtRoom")} {room.number}</h2>
            <span className={`inline-flex items-center gap-1.5 rounded-full ${cfg.bg} px-3 py-1`}>
              <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
              <span className={`text-xs font-bold ${cfg.text}`}>{t(locale, cfg.key)}</span>
            </span>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_280px]">
          <div>
            {isOccupied && room.sessionEndsAt && room.sessionStartedAt ? (
              <>
                <div className="flex items-center gap-5">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--gold)]/10">
                    <svg className="h-10 w-10 text-[var(--gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--muted)]">{t(locale, "mgmtActiveSession")}</p>
                    <p className={`font-mono text-4xl font-black tabular-nums ${leftMs <= 0 ? "text-red-500" : leftMs < 15 * 60 * 1000 ? "text-amber-500" : "text-[var(--gold)]"}`}>
                      {formatCountdown(leftMs)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {formatTimeRange(new Date(room.sessionStartedAt), new Date(room.sessionEndsAt), locale)}
                    </p>
                  </div>
                </div>

                {room.durationHours && (
                  <div className="mt-5 rounded-xl bg-[var(--surface)] px-4 py-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--muted)]">{t(locale, "mgmtDuration")}</span>
                      <span className="font-semibold text-[var(--foreground)]">{room.durationHours} {t(locale, "mgmtHours")}</span>
                    </div>
                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-[var(--muted)]">{t(locale, "total")}</span>
                      <span className="font-bold text-[var(--gold)]">{formatSrd(room.durationHours * hourlyRate)}</span>
                    </div>
                  </div>
                )}

                <button type="button" onClick={endSession} className="mt-5 w-full rounded-xl bg-red-600 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-red-700 active:scale-[0.98]">
                  {t(locale, "mgmtEndSession")}
                </button>
              </>
            ) : (
              <>
                <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.04]">
                  <div className="border-b border-[var(--border)] bg-gradient-to-r from-[var(--gold)]/12 via-[var(--gold)]/6 to-transparent px-5 py-4 sm:px-6">
                    <h3 className="text-lg font-black tracking-tight text-[var(--gold)] sm:text-xl">{t(locale, "mgmtStartNewSession")}</h3>
                  </div>

                  <div className="space-y-5 px-5 py-5 sm:px-6">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">{t(locale, "mgmtQuickPresets")}</p>
                      <div className="mt-3 grid grid-cols-4 gap-2 sm:gap-2.5">
                        {QUICK_HOURS.map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setDurationHours(h)}
                            className={`flex min-h-[48px] touch-manipulation items-center justify-center rounded-xl text-[15px] font-black tabular-nums transition sm:min-h-[52px] sm:text-base ${
                              durationHours === h
                                ? "bg-[var(--gold)] text-[var(--dark)] shadow-md ring-2 ring-[var(--gold)]/35 ring-offset-2 ring-offset-[var(--card)]"
                                : "border-2 border-[var(--border-light)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--gold)]/45 hover:bg-[var(--card-hover)]"
                            }`}
                          >
                            {h}h
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative flex items-center gap-3 py-1">
                      <div className="h-px flex-1 bg-[var(--border)]" aria-hidden />
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">{t(locale, "mgmtFineTune")}</span>
                      <div className="h-px flex-1 bg-[var(--border)]" aria-hidden />
                    </div>

                    <div className="rounded-xl border border-[var(--border-light)] bg-[var(--surface)]/70 px-4 py-4 sm:px-5">
                      <label htmlFor={`duration-${room.id}`} className="text-xs font-bold uppercase tracking-wider text-[var(--gold)]">
                        {t(locale, "mgmtCustomHoursLabel")}
                      </label>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{t(locale, "mgmtCustomHoursHint")}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <input
                          id={`duration-${room.id}`}
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={DURATION_MAX}
                          value={durationHours}
                          onChange={(e) => {
                            const v = Number.parseInt(e.target.value, 10);
                            if (Number.isFinite(v)) setDurationHours(clampDuration(v));
                          }}
                          onBlur={() => setDurationHours((h) => clampDuration(h))}
                          className="h-12 w-[5.5rem] rounded-xl border-2 border-[var(--border-light)] bg-[var(--card)] px-2 text-center text-xl font-black text-[var(--foreground)] outline-none transition focus:border-[var(--gold)] focus:ring-4 focus:ring-[var(--gold)]/18"
                        />
                        <span className="text-sm font-bold text-[var(--foreground)]">{t(locale, "mgmtHours")}</span>
                      </div>
                      <div className="relative mt-5 px-0.5">
                        <input
                          type="range"
                          min={1}
                          max={DURATION_MAX}
                          step={1}
                          value={durationHours}
                          onChange={(e) => setDurationHours(Number(e.target.value))}
                          className="gold-slider"
                          style={
                            { "--slider-pct": `${((durationHours - 1) / (DURATION_MAX - 1)) * 100}%` } as CSSProperties
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cost display */}
                <div className="mt-5 overflow-hidden rounded-xl border border-[var(--gold)]/20 bg-[var(--gold)]/5">
                  <div className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{t(locale, "mgmtRate")}</p>
                      <p className="mt-0.5 text-sm text-[var(--muted)]">
                        {durationHours} × {formatSrd(hourlyRate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{t(locale, "total")}</p>
                      <p className="mt-0.5 text-2xl font-black text-[var(--gold)]">{formatSrd(cost)}</p>
                    </div>
                  </div>
                </div>

                <button type="button" onClick={startSession} className="mt-4 w-full rounded-xl bg-[var(--gold)] py-3.5 text-base font-bold text-[var(--dark)] shadow-lg transition hover:bg-[var(--gold-light)] active:scale-[0.98]">
                  {t(locale, "mgmtStartSession")}
                </button>

                <div className="mt-6">
                  <p className="mb-2 text-sm font-semibold text-[var(--gold-light)]">{t(locale, "mgmtRoomStatus")}</p>
                  <div className="flex flex-wrap gap-2">
                    {statusButtons(locale).map((s) => {
                      const selected = room.status === s.value;
                      return (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setStatus(s.value)}
                          className={roomStatusToggleClass(s.value as RoomStatusToggle, selected)}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h3 className="text-sm font-bold text-[var(--gold)]">{t(locale, "mgmtOrders")}</h3>
            {roomOrders.length === 0 ? (
              <p className="mt-3 text-xs text-[var(--muted)]">{t(locale, "mgmtNoOrdersYet")}</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {roomOrders.slice(0, 6).map((order) => {
                  const total = order.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
                  return (
                    <li key={order.id} className="rounded-lg bg-[var(--card)] p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-[var(--muted)]">
                          {new Date(order.createdAt).toLocaleTimeString(timeLoc, { hour: "numeric", minute: "2-digit" })}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                          order.status === "processing" ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"
                        }`}>{order.status === "processing" ? t(locale, "mgmtProcessing") : t(locale, "mgmtCompleted")}</span>
                      </div>
                      <ul className="mt-1.5 space-y-0.5">
                        {order.items.map((item) => (
                          <li key={item.productId} className="flex justify-between text-xs">
                            <span className="text-[var(--foreground)]">{item.qty}× {item.name}</span>
                            <span className="text-[var(--muted)]">{formatSrd(item.qty * item.unitPrice)}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-1.5 flex justify-end border-t border-[var(--border)] pt-1.5 text-xs font-bold text-[var(--gold)]">{formatSrd(total)}</div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ManagementRoomsPage() {
  const { rooms, panicAlerts, locale } = useDemo();
  const panicRoomNumbers = new Set(panicAlerts.map((a) => a.roomNumber));
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? null;

  const counts = {
    available: rooms.filter((r) => r.status === "available").length,
    occupied: rooms.filter((r) => r.status === "occupied").length,
    cleaning: rooms.filter((r) => r.status === "cleaning").length,
    maintenance: rooms.filter((r) => r.status === "maintenance").length,
  };

  return (
    <ManagementShell>
      <div className="px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-[var(--gold)]">{t(locale, "mgmtRoomSelection")}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{t(locale, "mgmtRoomSelectionSub")}</p>
        </div>

        <div className="mb-8 flex flex-wrap gap-4">
          {(Object.entries(counts) as [RoomStatus, number][]).map(([status, count]) => {
            const cfg = STATUS_STYLE[status];
            return (
              <div key={status} className={`flex items-center gap-2 rounded-full ${cfg.bg} px-4 py-2`}>
                <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                <span className={`text-sm font-semibold ${cfg.text}`}>{t(locale, cfg.key)}: {count}</span>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {rooms.map((room) => {
            const cfg = STATUS_STYLE[room.status];
            const hasPanic = panicRoomNumbers.has(room.number);

            return (
              <button
                key={room.id}
                type="button"
                onClick={() => setSelectedRoomId(room.id)}
                className="group relative animate-fade-in rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-left shadow-md transition-all duration-200 hover:border-[var(--gold)]/30 hover:shadow-xl active:scale-[0.98]"
              >
                {hasPanic && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                  </span>
                )}

                <div className="flex items-start justify-between">
                  <h3 className="text-3xl font-black text-[var(--foreground)]">{room.number}</h3>
                  <span className={`inline-flex items-center gap-1.5 rounded-full ${cfg.bg} px-3 py-1`}>
                    <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                    <span className={`text-xs font-bold ${cfg.text}`}>{t(locale, cfg.key)}</span>
                  </span>
                </div>

                {room.status === "occupied" && room.sessionEndsAt && (
                  <div className="mt-5">
                    <p className="text-xs text-[var(--muted)]">{t(locale, "mgmtTimeRemaining")}</p>
                    <div className="mt-1 text-[var(--gold)]">
                      <RoomTimer endsAt={room.sessionEndsAt} showWarning />
                    </div>
                  </div>
                )}

                {room.status === "available" && <p className="mt-5 text-sm text-[var(--muted)]">{t(locale, "mgmtReadyForCheckin")}</p>}
                {room.status === "cleaning" && <p className="mt-5 text-sm text-[var(--muted)]">{t(locale, "mgmtBeingCleaned")}</p>}
                {room.status === "maintenance" && <p className="mt-5 text-sm text-[var(--muted)]">{t(locale, "mgmtUnderMaintenance")}</p>}

                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[var(--gold)] opacity-0 transition group-hover:opacity-100">
                  {t(locale, "mgmtManage")} <span>→</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedRoom && <RoomModal room={selectedRoom} onClose={() => setSelectedRoomId(null)} />}
    </ManagementShell>
  );
}
