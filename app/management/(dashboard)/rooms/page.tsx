"use client";

import { useState } from "react";
import { RoomTimer } from "@/components/room-timer";
import { useDemo } from "@/contexts/demo-context";
import { t, type TKey } from "@/lib/i18n";
import type { Locale, Room, RoomStatus } from "@/lib/types";

const STATUS_STYLE: Record<RoomStatus, { key: TKey; dot: string; bg: string; text: string }> = {
  available: { key: "mgmtStatusAvailable", dot: "bg-emerald-400", bg: "bg-emerald-400/10", text: "text-emerald-400" },
  occupied: { key: "mgmtStatusOccupied", dot: "bg-[var(--gold)]", bg: "bg-[var(--gold)]/10", text: "text-[var(--gold)]" },
  just_checked_out: {
    key: "mgmtStatusJustCheckedOut",
    dot: "bg-amber-400",
    bg: "bg-amber-400/10",
    text: "text-amber-400",
  },
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

function RoomModal({ room, onClose }: { room: Room; onClose: () => void }) {
  const { dispatch, locale } = useDemo();
  const isJustCheckedOut = room.status === "just_checked_out";

  function setStatus(status: RoomStatus) {
    dispatch({ type: "UPDATE_ROOM_STATUS", roomId: room.id, status });
  }

  const cfg = STATUS_STYLE[room.status];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-6 pt-[max(4rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] backdrop-blur-sm" onClick={onClose}>
      <div className="animate-fade-in-scale w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
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

        <div className="p-6">
          <p className="text-sm font-semibold text-[var(--gold-light)]">{t(locale, "mgmtRoomStatus")}</p>
          {isJustCheckedOut && (
            <p className="mt-2 text-sm text-amber-400/90">{t(locale, "mgmtJustCheckedOutHint")}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
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
    just_checked_out: rooms.filter((r) => r.status === "just_checked_out").length,
    cleaning: rooms.filter((r) => r.status === "cleaning").length,
    maintenance: rooms.filter((r) => r.status === "maintenance").length,
  };

  return (
    <>
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
                {room.status === "just_checked_out" && (
                  <p className="mt-5 text-sm text-amber-400/90">{t(locale, "mgmtJustCheckedOutHint")}</p>
                )}
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
    </>
  );
}
