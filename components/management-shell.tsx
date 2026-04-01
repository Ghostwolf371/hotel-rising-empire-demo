"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { LanguageToggle } from "@/components/language-toggle";
import { useTimeLeft } from "@/components/room-timer";
import { useDemo } from "@/contexts/demo-context";
import { bcp47ForLocale } from "@/lib/locale-intl";
import { t, type TKey } from "@/lib/i18n";

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

export function ManagementShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { panicAlerts, orders, rooms, locale, theme, toggleTheme } = useDemo();
  const [notifOpen, setNotifOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

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

  const notifCount = notifications.length;

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
                <div className="border-b border-[var(--border)] px-4 py-3">
                  <p className="text-sm font-bold text-[var(--gold)]">{t(locale, "mgmtNotifications")}</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-[var(--muted)]">{t(locale, "mgmtNoNotifications")}</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="flex gap-3 border-b border-[var(--border)] px-4 py-3 last:border-0">
                        <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                          n.type === "panic" ? "bg-red-600" : n.type === "order" ? "bg-[var(--gold)]/15" : "bg-amber-500/15"
                        }`}>
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
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[var(--foreground)]">{n.title}</p>
                          <p className="mt-0.5 truncate text-[11px] text-[var(--muted)]">{n.body}</p>
                          <p className="mt-1 text-[10px] text-[var(--muted)]">
                            {new Date(n.time).toLocaleTimeString(bcp47ForLocale(locale), { hour: "numeric", minute: "2-digit" })}
                          </p>
                        </div>
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
    </div>
  );
}
