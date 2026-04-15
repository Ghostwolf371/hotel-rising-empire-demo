"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LanguageToggle } from "@/components/language-toggle";
import { useTimeLeft } from "@/components/room-timer";
import { useDemo } from "@/contexts/demo-context";
import { formatSrd } from "@/lib/format";
import { bcp47ForLocale } from "@/lib/locale-intl";
import { t, type TKey } from "@/lib/i18n";
import type { Order } from "@/lib/types";

const NAV: { key: TKey; href: string; icon: React.ReactNode }[] = [
  {
    key: "mgmtNavRooms",
    href: "/management/rooms",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    key: "mgmtNavOrders",
    href: "/management/orders",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    key: "mgmtNavReports",
    href: "/management/reports",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    key: "mgmtNavInventory",
    href: "/management/inventory",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    key: "mgmtNavSettings",
    href: "/management/settings",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

interface Notification {
  id: string;
  type: "panic" | "order" | "expiry";
  title: string;
  body: string;
  time: number;
}

function ExpiryWatcher({ endsAt, roomNumber, onExpiry }: { endsAt: number; roomNumber: string; onExpiry: (roomNumber: string) => void }) {
  const left = useTimeLeft(endsAt);
  const firedRef = useRef(false);
  useEffect(() => {
    if (left > 0 && left < 15 * 60 * 1000 && !firedRef.current) {
      firedRef.current = true;
      onExpiry(roomNumber);
    }
  }, [left, roomNumber, onExpiry]);
  return null;
}

type LivePopup =
  | { kind: "session"; roomNumber: string; durationHours?: number }
  | { kind: "order"; order: Order };

export function ManagementShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { panicAlerts, orders, rooms, locale, theme, toggleTheme, dispatch } = useDemo();
  const [notifOpen, setNotifOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  /** Hide in-room order rows without changing order status (until status changes). */
  const [dismissedOrderNotifs, setDismissedOrderNotifs] = useState<Set<string>>(() => new Set());

  const [livePopup, setLivePopup] = useState<LivePopup | null>(null);
  const liveQueue = useRef<LivePopup[]>([]);
  const snapTick = useRef(0);
  const snap = useRef<{ orders: Set<string>; sessions: Set<string> } | null>(null);

  const enqueueLive = useCallback((ev: LivePopup) => {
    setLivePopup((cur) => {
      if (!cur) return ev;
      liveQueue.current.push(ev);
      return cur;
    });
  }, []);

  const dismissLive = useCallback(() => {
    setLivePopup(null);
    const next = liveQueue.current.shift();
    if (next) {
      requestAnimationFrame(() => setLivePopup(next));
    }
  }, []);

  useEffect(() => {
    snapTick.current += 1;
    const orderIds = new Set(orders.filter((o) => o.status === "processing").map((o) => o.id));
    const sessionKeys = new Set(
      rooms
        .filter((r) => r.status === "occupied" && r.sessionStartedAt)
        .map((r) => `${r.number}-${r.sessionStartedAt}`)
    );

    if (snapTick.current <= 2) {
      snap.current = { orders: orderIds, sessions: sessionKeys };
      return;
    }

    if (!snap.current) snap.current = { orders: new Set(), sessions: new Set() };

    for (const id of orderIds) {
      if (!snap.current.orders.has(id)) {
        const order = orders.find((o) => o.id === id);
        if (order) enqueueLive({ kind: "order", order });
      }
    }
    for (const key of sessionKeys) {
      if (!snap.current.sessions.has(key)) {
        const room = rooms.find(
          (r) => r.status === "occupied" && r.sessionStartedAt && `${r.number}-${r.sessionStartedAt}` === key
        );
        if (room) {
          enqueueLive({
            kind: "session",
            roomNumber: room.number,
            durationHours: room.durationHours,
          });
        }
      }
    }

    snap.current = { orders: orderIds, sessions: sessionKeys };
  }, [orders, rooms, enqueueLive]);

  useEffect(() => {
    setDismissedOrderNotifs((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const key of prev) {
        const id = key.startsWith("order:") ? key.slice(6) : null;
        if (!id) continue;
        const o = orders.find((x) => x.id === id);
        if (!o || o.status !== "processing") {
          next.delete(key);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [orders]);

  const notifications = useMemo<Notification[]>(() => {
    const items: Notification[] = [];
    for (const a of panicAlerts) {
      items.push({ id: a.id, type: "panic", title: `${t(locale, "mgmtPanicRoom")} ${a.roomNumber}`, body: t(locale, "mgmtPanicBody"), time: a.at });
    }
    for (const o of orders.slice(0, 5)) {
      if (o.status === "processing") {
        items.push({ id: o.id, type: "order", title: `${t(locale, "mgmtNewOrderRoom")} ${o.roomNumber}`, body: o.items.map((i) => `${i.qty}× ${i.name}`).join(", "), time: o.createdAt });
      }
    }
    return items.sort((a, b) => b.time - a.time).slice(0, 10);
  }, [panicAlerts, orders, locale]);

  const visibleNotifications = useMemo(
    () => notifications.filter((n) => !(n.type === "order" && dismissedOrderNotifs.has(`order:${n.id}`))),
    [notifications, dismissedOrderNotifs]
  );

  const clearAllNotifications = useCallback(() => {
    dispatch({ type: "CLEAR_PANICS" });
    setDismissedOrderNotifs((prev) => {
      const next = new Set(prev);
      for (const o of orders) {
        if (o.status === "processing") next.add(`order:${o.id}`);
      }
      return next;
    });
  }, [dispatch, orders]);

  const dismissNotification = useCallback(
    (n: Notification) => {
      if (n.type === "panic") {
        dispatch({ type: "CLEAR_PANIC_ALERT", id: n.id });
      } else if (n.type === "order") {
        setDismissedOrderNotifs((prev) => new Set(prev).add(`order:${n.id}`));
      }
    },
    [dispatch]
  );

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function logout() {
    sessionStorage.removeItem("mgmt-demo");
    router.push("/management");
  }

  const notifCount = visibleNotifications.length;

  return (
    <div className="flex min-h-dvh bg-[var(--background)]">
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-dvh w-56 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-5">
          <Image src="/logo.png" alt="Empire Apartments" width={36} height={36} className="rounded-lg" />
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-[var(--gold)]">Empire</p>
            <p className="text-[10px] text-[var(--muted)]">{t(locale, "mgmtConcierge")}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-2 py-4">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-[var(--gold)]/10 text-[var(--gold)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                }`}
              >
                {item.icon}
                {t(locale, item.key)}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-2 border-t border-[var(--border)] px-3 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {t(locale, "mgmtGuestTablet")}
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {t(locale, "mgmtLogout")}
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex items-center justify-end gap-3 border-b border-[var(--border)] bg-[var(--card)]/95 px-6 py-3 backdrop-blur">
          <LanguageToggle variant="shell" />

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--gold)]"
            title={theme === "dark" ? t(locale, "lightMode") : t(locale, "darkMode")}
          >
            {theme === "dark" ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Notification bell */}
          <div ref={bellRef} className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--gold)]"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notifCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white">
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-80 animate-fade-in-scale rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl shadow-black/40">
                <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-3">
                  <p className="text-sm font-bold text-[var(--gold)]">{t(locale, "mgmtNotifications")}</p>
                  {visibleNotifications.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearAllNotifications();
                      }}
                      className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--gold)]"
                    >
                      {t(locale, "mgmtClearAllNotifications")}
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {visibleNotifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-[var(--muted)]">{t(locale, "mgmtNoNotifications")}</p>
                  ) : (
                    visibleNotifications.map((n) => (
                      <div key={`${n.type}-${n.id}`} className="flex items-start gap-2 border-b border-[var(--border)] px-3 py-3 last:border-0 sm:gap-3 sm:px-4">
                        <div
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                            n.type === "panic" ? "bg-red-600" : n.type === "order" ? "bg-[var(--gold)]/15" : "bg-amber-500/15"
                          }`}
                        >
                          {n.type === "panic" && (
                            <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2L1 21h22L12 2zm-1 9v4h2v-4h-2zm0 6v2h2v-2h-2z" />
                            </svg>
                          )}
                          {n.type === "order" && (
                            <svg className="h-3.5 w-3.5 text-[var(--gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                            </svg>
                          )}
                          {n.type === "expiry" && (
                            <svg className="h-3.5 w-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 pr-1">
                          <p className="text-xs font-bold text-[var(--foreground)]">{n.title}</p>
                          <p className="mt-0.5 truncate text-[11px] text-[var(--muted)]">{n.body}</p>
                          <p className="mt-1 text-[10px] text-[var(--muted)]">
                            {new Date(n.time).toLocaleTimeString(bcp47ForLocale(locale), { hour: "numeric", minute: "2-digit" })}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissNotification(n);
                          }}
                          className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                          aria-label={t(locale, "mgmtLiveDismiss")}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Expiry watchers — hidden hooks for notification generation */}
        {rooms.filter((r) => r.status === "occupied" && r.sessionEndsAt).map((r) => (
          <ExpiryWatcher key={r.id} endsAt={r.sessionEndsAt!} roomNumber={r.number} onExpiry={() => {}} />
        ))}

        {/* Main content */}
        <main className="flex-1">{children}</main>
      </div>

      {livePopup && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="live-popup-title"
        >
          <div className="animate-fade-in-scale relative w-full max-w-lg rounded-3xl border-2 border-[var(--gold)]/40 bg-[var(--card)] p-8 shadow-2xl shadow-[var(--gold)]/20 sm:p-10">
            {livePopup.kind === "session" ? (
              <>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--gold)]/15 text-[var(--gold)]">
                  <svg className="h-11 w-11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <h2 id="live-popup-title" className="mt-6 text-center text-2xl font-black tracking-tight text-[var(--gold)] sm:text-3xl">
                  {t(locale, "mgmtLiveGuestSessionTitle")}
                </h2>
                <p className="mt-3 text-center text-lg text-[var(--foreground)]">{t(locale, "mgmtLiveGuestSessionLead")}</p>
                <p className="mt-4 text-center text-5xl font-black tabular-nums text-[var(--gold)] sm:text-6xl">{livePopup.roomNumber}</p>
                {livePopup.durationHours != null && livePopup.durationHours > 0 && (
                  <p className="mt-3 text-center text-sm text-[var(--muted)]">
                    {livePopup.durationHours} {t(locale, "mgmtHours")} · {t(locale, "mgmtLiveGuestSessionHint")}
                  </p>
                )}
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link
                    href="/management/rooms"
                    onClick={dismissLive}
                    className="flex min-h-[52px] flex-1 items-center justify-center rounded-2xl border-2 border-[var(--gold)]/50 bg-[var(--gold)]/10 px-6 py-4 text-center text-base font-bold text-[var(--gold)] transition hover:bg-[var(--gold)]/20"
                  >
                    {t(locale, "mgmtLiveViewRooms")}
                  </Link>
                  <button
                    type="button"
                    onClick={dismissLive}
                    className="min-h-[52px] flex-1 rounded-2xl bg-[var(--gold)] px-6 py-4 text-base font-bold text-[var(--dark)] shadow-lg transition hover:bg-[var(--gold-light)] active:scale-[0.99]"
                  >
                    {t(locale, "mgmtLiveDismiss")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500">
                  <svg className="h-11 w-11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 id="live-popup-title" className="mt-6 text-center text-2xl font-black tracking-tight text-[var(--gold)] sm:text-3xl">
                  {t(locale, "mgmtLiveNewOrderTitle")}
                </h2>
                <p className="mt-2 text-center text-lg font-bold text-[var(--foreground)]">
                  {t(locale, "mgmtRoom")} {livePopup.order.roomNumber}
                </p>
                <ul className="mt-6 max-h-48 space-y-2 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  {livePopup.order.items.map((item) => (
                    <li key={item.productId} className="flex justify-between text-sm">
                      <span className="text-[var(--foreground)]">
                        {item.qty}× {item.name}
                      </span>
                      <span className="font-semibold text-[var(--muted)]">{formatSrd(item.qty * item.unitPrice)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-right text-lg font-black text-[var(--gold)]">
                  {formatSrd(livePopup.order.items.reduce((s, i) => s + i.qty * i.unitPrice, 0))}
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link
                    href="/management/orders"
                    onClick={dismissLive}
                    className="flex min-h-[52px] flex-1 items-center justify-center rounded-2xl border-2 border-[var(--gold)]/50 bg-[var(--gold)]/10 px-6 py-4 text-center text-base font-bold text-[var(--gold)] transition hover:bg-[var(--gold)]/20"
                  >
                    {t(locale, "mgmtLiveViewOrders")}
                  </Link>
                  <button
                    type="button"
                    onClick={dismissLive}
                    className="min-h-[52px] flex-1 rounded-2xl bg-[var(--gold)] px-6 py-4 text-base font-bold text-[var(--dark)] shadow-lg transition hover:bg-[var(--gold-light)] active:scale-[0.99]"
                  >
                    {t(locale, "mgmtLiveDismiss")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
