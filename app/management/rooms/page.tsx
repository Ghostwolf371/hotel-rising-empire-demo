"use client";

import { useState } from "react";
import { ManagementShell } from "@/components/management-shell";
import { RoomTimer, useTimeLeft } from "@/components/room-timer";
import { useDemo } from "@/contexts/demo-context";
import { formatCountdown, formatSrd, formatTimeRange } from "@/lib/format";
import { HOURLY_RATE_SRD } from "@/lib/mock-data";
import type { Room, RoomStatus } from "@/lib/types";

const STATUS_CONFIG: Record<RoomStatus, { label: string; dot: string; bg: string; text: string }> = {
  available: { label: "Available", dot: "bg-emerald-400", bg: "bg-emerald-400/10", text: "text-emerald-400" },
  occupied: { label: "Occupied", dot: "bg-[var(--gold)]", bg: "bg-[var(--gold)]/10", text: "text-[var(--gold)]" },
  cleaning: { label: "Cleaning", dot: "bg-sky-400", bg: "bg-sky-400/10", text: "text-sky-400" },
  maintenance: { label: "Maintenance", dot: "bg-red-400", bg: "bg-red-400/10", text: "text-red-400" },
};

const STATUSES: { value: RoomStatus; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "cleaning", label: "Cleaning" },
  { value: "maintenance", label: "Maintenance" },
];

function RoomModal({ room, onClose }: { room: Room; onClose: () => void }) {
  const { orders, dispatch } = useDemo();
  const [durationHours, setDurationHours] = useState(2);
  const endsAt = room.sessionEndsAt ?? 0;
  const leftMs = useTimeLeft(endsAt);
  const roomOrders = orders.filter((o) => o.roomNumber === room.number);
  const cost = durationHours * HOURLY_RATE_SRD;
  const isOccupied = room.status === "occupied";

  function startSession() {
    dispatch({ type: "START_ROOM_SESSION", roomId: room.id, durationHours });
  }
  function endSession() {
    dispatch({ type: "END_ROOM_SESSION", roomId: room.id });
  }
  function setStatus(status: RoomStatus) {
    dispatch({ type: "UPDATE_ROOM_STATUS", roomId: room.id, status });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-6 pt-16 backdrop-blur-sm" onClick={onClose}>
      <div className="animate-fade-in-scale w-full max-w-3xl rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Modal header with room grid bar */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-[var(--gold)]">Room {room.number}</h2>
            <span className={`inline-flex items-center gap-1.5 rounded-full ${STATUS_CONFIG[room.status].bg} px-3 py-1`}>
              <span className={`h-2 w-2 rounded-full ${STATUS_CONFIG[room.status].dot}`} />
              <span className={`text-xs font-bold ${STATUS_CONFIG[room.status].text}`}>{STATUS_CONFIG[room.status].label}</span>
            </span>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_280px]">
          {/* Main content */}
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
                    <p className="text-xs text-[var(--muted)]">Active Session</p>
                    <p className={`font-mono text-4xl font-black tabular-nums ${leftMs <= 0 ? "text-red-500" : leftMs < 15 * 60 * 1000 ? "text-amber-500" : "text-[var(--gold)]"}`}>
                      {formatCountdown(leftMs)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {formatTimeRange(new Date(room.sessionStartedAt), new Date(room.sessionEndsAt), "en")}
                    </p>
                  </div>
                </div>

                {room.durationHours && (
                  <div className="mt-5 rounded-xl bg-[var(--surface)] px-4 py-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--muted)]">Duration</span>
                      <span className="font-semibold text-[var(--foreground)]">{room.durationHours} hours</span>
                    </div>
                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-[var(--muted)]">Total</span>
                      <span className="font-bold text-[var(--gold)]">{formatSrd(room.durationHours * HOURLY_RATE_SRD)}</span>
                    </div>
                  </div>
                )}

                <button type="button" onClick={endSession} className="mt-5 w-full rounded-xl bg-red-600 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-red-700 active:scale-[0.98]">
                  End Session
                </button>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-[var(--gold-light)]">Start a new session</p>
                <div className="mt-3 grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setDurationHours(h)}
                      className={`rounded-xl py-3 text-base font-bold transition ${
                        durationHours === h
                          ? "bg-[var(--gold)] text-[var(--dark)] shadow-lg"
                          : "bg-[var(--surface)] text-[var(--foreground)] ring-1 ring-[var(--border-light)] hover:ring-[var(--gold)]/30"
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>

                <div className="mt-4 rounded-xl bg-[var(--surface)] px-4 py-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted)]">Rate</span>
                    <span className="text-[var(--foreground)]">{formatSrd(HOURLY_RATE_SRD)} / hr</span>
                  </div>
                  <div className="mt-2 flex justify-between text-lg font-black">
                    <span className="text-[var(--foreground)]">Total</span>
                    <span className="text-[var(--gold)]">{formatSrd(cost)}</span>
                  </div>
                </div>

                <button type="button" onClick={startSession} className="mt-4 w-full rounded-xl bg-[var(--gold)] py-3.5 text-base font-bold text-[var(--dark)] shadow-lg transition hover:bg-[var(--gold-light)] active:scale-[0.98]">
                  + Start Session
                </button>

                <div className="mt-6">
                  <p className="mb-2 text-sm font-semibold text-[var(--gold-light)]">Room status</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setStatus(s.value)}
                        className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                          room.status === s.value
                            ? "bg-[var(--gold)]/15 text-[var(--gold)] ring-1 ring-[var(--gold)]/30"
                            : "bg-[var(--surface)] text-[var(--muted)] ring-1 ring-[var(--border-light)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Orders sidebar */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h3 className="text-sm font-bold text-[var(--gold)]">Orders</h3>
            {roomOrders.length === 0 ? (
              <p className="mt-3 text-xs text-[var(--muted)]">No orders yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {roomOrders.slice(0, 6).map((order) => {
                  const total = order.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
                  return (
                    <li key={order.id} className="rounded-lg bg-[var(--card)] p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-[var(--muted)]">
                          {new Date(order.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                          order.status === "processing" ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"
                        }`}>{order.status}</span>
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
  const { rooms, panicAlerts } = useDemo();
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
          <h1 className="text-3xl font-black text-[var(--gold)]">Room Selection</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Manage all rooms and sessions</p>
        </div>

        <div className="mb-8 flex flex-wrap gap-4">
          {(Object.entries(counts) as [RoomStatus, number][]).map(([status, count]) => {
            const cfg = STATUS_CONFIG[status];
            return (
              <div key={status} className={`flex items-center gap-2 rounded-full ${cfg.bg} px-4 py-2`}>
                <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                <span className={`text-sm font-semibold ${cfg.text}`}>{cfg.label}: {count}</span>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {rooms.map((room) => {
            const cfg = STATUS_CONFIG[room.status];
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
                    <span className={`text-xs font-bold ${cfg.text}`}>{cfg.label}</span>
                  </span>
                </div>

                {room.status === "occupied" && room.sessionEndsAt && (
                  <div className="mt-5">
                    <p className="text-xs text-[var(--muted)]">Time remaining</p>
                    <div className="mt-1 text-[var(--gold)]">
                      <RoomTimer endsAt={room.sessionEndsAt} showWarning />
                    </div>
                  </div>
                )}

                {room.status === "available" && <p className="mt-5 text-sm text-[var(--muted)]">Ready for check-in</p>}
                {room.status === "cleaning" && <p className="mt-5 text-sm text-[var(--muted)]">Being cleaned…</p>}
                {room.status === "maintenance" && <p className="mt-5 text-sm text-[var(--muted)]">Under maintenance</p>}

                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[var(--gold)] opacity-0 transition group-hover:opacity-100">
                  Manage <span>→</span>
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
