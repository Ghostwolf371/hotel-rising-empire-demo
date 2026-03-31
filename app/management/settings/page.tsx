"use client";

import { useState } from "react";
import { ManagementShell } from "@/components/management-shell";
import { useDemo, type Action } from "@/contexts/demo-context";
import { formatSrd } from "@/lib/format";
import { t } from "@/lib/i18n";

type Dispatch = React.Dispatch<Action>;

type Tab = "general" | "pricing" | "rooms" | "system";

const TABS: { id: Tab; icon: React.ReactNode; key: Parameters<typeof t>[1] }[] = [
  {
    id: "general",
    key: "mgmtTabGeneral",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: "pricing",
    key: "mgmtTabPricing",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "rooms",
    key: "mgmtTabRooms",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: "system",
    key: "mgmtTabSystem",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    ),
  },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className={`relative h-7 w-12 rounded-full transition ${on ? "bg-[var(--gold)]" : "bg-[var(--surface)]"}`}>
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? "left-[calc(100%-1.625rem)]" : "left-0.5"}`} />
    </button>
  );
}

function SettingRow({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--foreground)]">{label}</p>
        {sub && <p className="text-xs text-[var(--muted)]">{sub}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function ManagementSettingsPage() {
  const { locale, setLocale, theme, setTheme, rooms, orders, hourlyRate, dispatch } = useDemo();
  const [tab, setTab] = useState<Tab>("general");
  const [notifSound, setNotifSound] = useState(true);
  const [autoEndSessions, setAutoEndSessions] = useState(false);

  const occupiedCount = rooms.filter((r) => r.status === "occupied").length;

  function resetDemo() {
    if (window.confirm(t(locale, "mgmtResetConfirm"))) {
      localStorage.removeItem("hre-demo-v2");
      window.location.reload();
    }
  }

  return (
    <ManagementShell>
      <div className="px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-[var(--gold)]">{t(locale, "mgmtSettings")}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{t(locale, "mgmtSettingsSub")}</p>
        </div>

        <div className="mb-8 flex gap-1 rounded-xl bg-[var(--surface)] p-1">
          {TABS.map((tb) => (
            <button
              key={tb.id}
              type="button"
              onClick={() => setTab(tb.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                tab === tb.id
                  ? "bg-[var(--gold)] text-[var(--dark)] shadow"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {tb.icon}
              <span className="hidden sm:inline">{t(locale, tb.key)}</span>
            </button>
          ))}
        </div>

        <div>
          {tab === "general" && (
            <GeneralTab
              locale={locale} setLocale={setLocale}
              theme={theme} setTheme={setTheme}
              notifSound={notifSound} setNotifSound={setNotifSound}
              autoEndSessions={autoEndSessions} setAutoEndSessions={setAutoEndSessions}
            />
          )}
          {tab === "pricing" && <PricingTab locale={locale} hourlyRate={hourlyRate} dispatch={dispatch} />}
          {tab === "rooms" && <RoomsTab locale={locale} rooms={rooms} dispatch={dispatch} />}
          {tab === "system" && (
            <SystemTab locale={locale} rooms={rooms} orders={orders} occupiedCount={occupiedCount} resetDemo={resetDemo} />
          )}
        </div>
      </div>
    </ManagementShell>
  );
}

function GeneralTab({
  locale, setLocale, theme, setTheme, notifSound, setNotifSound, autoEndSessions, setAutoEndSessions,
}: {
  locale: "en" | "nl"; setLocale: (l: "en" | "nl") => void;
  theme: "dark" | "light"; setTheme: (t: "dark" | "light") => void;
  notifSound: boolean; setNotifSound: (v: boolean | ((p: boolean) => boolean)) => void;
  autoEndSessions: boolean; setAutoEndSessions: (v: boolean | ((p: boolean) => boolean)) => void;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <section className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
        <h2 className="text-lg font-bold text-[var(--gold)]">{t(locale, "mgmtGeneral")}</h2>

        <SettingRow label={t(locale, "mgmtLanguage")} sub={t(locale, "mgmtLanguageSub")}>
          <div className="flex rounded-lg bg-[var(--surface)] p-0.5">
            <button type="button" onClick={() => setLocale("en")} className={`rounded-md px-4 py-2 text-sm font-bold transition ${locale === "en" ? "bg-[var(--gold)] text-[var(--dark)]" : "text-[var(--muted)]"}`}>English</button>
            <button type="button" onClick={() => setLocale("nl")} className={`rounded-md px-4 py-2 text-sm font-bold transition ${locale === "nl" ? "bg-[var(--gold)] text-[var(--dark)]" : "text-[var(--muted)]"}`}>Nederlands</button>
          </div>
        </SettingRow>

        <SettingRow label={t(locale, "mgmtTheme")} sub={t(locale, "mgmtThemeSub")}>
          <div className="flex rounded-lg bg-[var(--surface)] p-0.5">
            <button type="button" onClick={() => setTheme("dark")} className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-bold transition ${theme === "dark" ? "bg-[var(--gold)] text-[var(--dark)]" : "text-[var(--muted)]"}`}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              {t(locale, "darkMode")}
            </button>
            <button type="button" onClick={() => setTheme("light")} className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-bold transition ${theme === "light" ? "bg-[var(--gold)] text-[var(--dark)]" : "text-[var(--muted)]"}`}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              {t(locale, "lightMode")}
            </button>
          </div>
        </SettingRow>

        <SettingRow label={t(locale, "mgmtNotifSounds")} sub={t(locale, "mgmtNotifSoundsSub")}>
          <Toggle on={notifSound} onToggle={() => setNotifSound((v) => !v)} />
        </SettingRow>

        <SettingRow label={t(locale, "mgmtAutoEnd")} sub={t(locale, "mgmtAutoEndSub")}>
          <Toggle on={autoEndSessions} onToggle={() => setAutoEndSessions((v) => !v)} />
        </SettingRow>
      </section>
    </div>
  );
}

function PricingTab({
  locale, hourlyRate, dispatch,
}: {
  locale: "en" | "nl"; hourlyRate: number; dispatch: Dispatch;
}) {
  const [rate, setRate] = useState(hourlyRate);
  const [saved, setSaved] = useState(false);

  function save() {
    dispatch({ type: "SET_HOURLY_RATE", rate });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
        <h2 className="text-lg font-bold text-[var(--gold)]">{t(locale, "mgmtHourlyRate")}</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">{t(locale, "mgmtHourlyRateSub")}</p>
        <div className="mt-5 flex items-end gap-4">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">SRD</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--muted)]">SRD</span>
              <input
                type="number"
                min={1}
                step={1}
                value={rate}
                onChange={(e) => { setRate(Number(e.target.value)); setSaved(false); }}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-3 pl-14 pr-4 text-xl font-black text-[var(--foreground)] outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={rate === hourlyRate || rate <= 0}
            className={`rounded-xl px-6 py-3 text-sm font-bold transition ${
              saved
                ? "bg-emerald-500 text-white"
                : rate === hourlyRate || rate <= 0
                  ? "cursor-not-allowed bg-[var(--surface)] text-[var(--muted)]"
                  : "bg-[var(--gold)] text-[var(--dark)] hover:bg-[var(--gold-light)] active:scale-[0.98]"
            }`}
          >
            {saved ? t(locale, "mgmtSaved") : t(locale, "mgmtSave")}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
        <h2 className="text-lg font-bold text-[var(--gold)]">{t(locale, "mgmtStayPricing")}</h2>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: t(locale, "mgmtHourlyRate"), value: hourlyRate, accent: true },
            { label: t(locale, "mgmt2HourStay"), value: hourlyRate * 2, accent: false },
            { label: t(locale, "mgmt3HourStay"), value: hourlyRate * 3, accent: false },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-[var(--surface)] px-4 py-4 text-center">
              <p className="text-xs font-bold text-[var(--muted)]">{item.label}</p>
              <p className={`mt-1 text-xl font-black ${item.accent ? "text-[var(--gold)]" : "text-[var(--foreground)]"}`}>
                {formatSrd(item.value)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--gold)]/10 text-[var(--gold)]">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)]">{t(locale, "mgmtExtensionRate")}</h3>
            <p className="mt-0.5 text-xs text-[var(--muted)]">{t(locale, "mgmtExtensionRateSub")}</p>
            <p className="mt-2 text-lg font-black text-[var(--gold)]">{formatSrd(hourlyRate)} / {t(locale, "mgmtPerHour")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function RoomsTab({
  locale, rooms, dispatch,
}: {
  locale: "en" | "nl";
  rooms: { id: string; number: string; status: string }[];
  dispatch: Dispatch;
}) {
  const [newRoomNumber, setNewRoomNumber] = useState("");

  function addRoom() {
    const num = newRoomNumber.trim();
    if (!num) return;
    if (rooms.some((r) => r.number === num)) return;
    dispatch({
      type: "ADD_ROOM",
      room: { id: `room-${num}`, number: num, status: "available" as const },
    });
    setNewRoomNumber("");
  }

  function removeRoom(roomId: string, status: string) {
    if (status === "occupied") {
      window.alert(t(locale, "mgmtCannotDeleteOccupied"));
      return;
    }
    if (window.confirm(t(locale, "mgmtDeleteRoomConfirm"))) {
      dispatch({ type: "DELETE_ROOM", roomId });
    }
  }

  const statusColor: Record<string, string> = {
    available: "bg-emerald-400",
    occupied: "bg-[var(--gold)]",
    cleaning: "bg-sky-400",
    maintenance: "bg-orange-400",
  };

  const statusLabel: Record<string, Parameters<typeof t>[1]> = {
    available: "mgmtStatusAvailable",
    occupied: "mgmtStatusOccupied",
    cleaning: "mgmtStatusCleaning",
    maintenance: "mgmtStatusMaintenance",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
        <h2 className="text-lg font-bold text-[var(--gold)]">{t(locale, "mgmtRoomManagement")}</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">{t(locale, "mgmtRoomManagementSub")}</p>
        <div className="mt-4 flex gap-3">
          <input
            type="text"
            value={newRoomNumber}
            onChange={(e) => setNewRoomNumber(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addRoom()}
            placeholder={t(locale, "mgmtRoomNumberLabel")}
            className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20"
          />
          <button
            type="button"
            onClick={addRoom}
            disabled={!newRoomNumber.trim() || rooms.some((r) => r.number === newRoomNumber.trim())}
            className="flex items-center gap-2 rounded-xl bg-[var(--gold)] px-5 py-2.5 text-sm font-bold text-[var(--dark)] transition hover:bg-[var(--gold-light)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t(locale, "mgmtAddRoom")}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg">
        <div className="border-b border-[var(--border)] px-6 py-4">
          <p className="text-sm font-bold text-[var(--foreground)]">{rooms.length} {t(locale, "mgmtNavRooms")}</p>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {rooms.map((room) => (
            <div key={room.id} className="flex items-center gap-4 px-6 py-3 transition hover:bg-[var(--surface)]/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--foreground)]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[var(--foreground)]">{t(locale, "mgmtRoom")} {room.number}</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${statusColor[room.status] ?? "bg-gray-400"}`} />
                  <span className="text-xs text-[var(--muted)]">{t(locale, statusLabel[room.status] ?? "mgmtStatusAvailable")}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeRoom(room.id, room.status)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  room.status === "occupied"
                    ? "cursor-not-allowed text-[var(--muted)]"
                    : "text-red-400 hover:bg-red-500/10 hover:text-red-300"
                }`}
              >
                {t(locale, "mgmtDeleteRoom")}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SystemTab({
  locale, rooms, orders, occupiedCount, resetDemo,
}: {
  locale: "en" | "nl";
  rooms: { length: number };
  orders: { length: number };
  occupiedCount: number;
  resetDemo: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
        <h2 className="text-lg font-bold text-[var(--gold)]">{t(locale, "mgmtSystem")}</h2>
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: t(locale, "mgmtTotalRooms"), value: rooms.length, color: "text-[var(--foreground)]" },
            { label: t(locale, "mgmtCurrentlyOccupied"), value: occupiedCount, color: "text-[var(--gold)]" },
            { label: t(locale, "mgmtTotalOrders"), value: orders.length, color: "text-[var(--foreground)]" },
            { label: t(locale, "mgmtVersion"), value: "v1.0", color: "text-[var(--muted)] font-mono text-sm" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-[var(--surface)] px-4 py-4 text-center">
              <p className="text-xs font-bold text-[var(--muted)]">{item.label}</p>
              <p className={`mt-1 text-xl font-black ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-red-500/20 bg-[var(--card)] p-6 shadow-lg">
        <h2 className="text-lg font-bold text-red-400">{t(locale, "mgmtDangerZone")}</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">{t(locale, "mgmtDangerText")}</p>
        <button type="button" onClick={resetDemo} className="mt-4 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow transition hover:bg-red-700 active:scale-[0.98]">
          {t(locale, "mgmtResetDemo")}
        </button>
      </section>
    </div>
  );
}
