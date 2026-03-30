"use client";

import { useState } from "react";
import { ManagementShell } from "@/components/management-shell";
import { useDemo } from "@/contexts/demo-context";
import { formatSrd } from "@/lib/format";
import { HOURLY_RATE_SRD } from "@/lib/mock-data";

export default function ManagementSettingsPage() {
  const { locale, setLocale, rooms, orders } = useDemo();
  const [notifSound, setNotifSound] = useState(true);
  const [autoEndSessions, setAutoEndSessions] = useState(false);

  const occupiedCount = rooms.filter((r) => r.status === "occupied").length;

  function resetDemo() {
    if (window.confirm("Reset all demo data? This will clear rooms, orders, and sessions.")) {
      localStorage.removeItem("hre-demo-v2");
      window.location.reload();
    }
  }

  return (
    <ManagementShell>
      <div className="px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-[var(--gold)]">Settings</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Configuration and preferences</p>
        </div>

        <div className="max-w-2xl space-y-6">
          {/* General */}
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
            <h2 className="text-lg font-bold text-[var(--gold)]">General</h2>
            <div className="mt-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">Language</p>
                  <p className="text-xs text-[var(--muted)]">Set the interface language</p>
                </div>
                <div className="flex rounded-lg bg-[var(--surface)] p-0.5">
                  <button type="button" onClick={() => setLocale("en")} className={`rounded-md px-4 py-2 text-sm font-bold transition ${locale === "en" ? "bg-[var(--gold)] text-[var(--dark)]" : "text-[var(--muted)]"}`}>English</button>
                  <button type="button" onClick={() => setLocale("nl")} className={`rounded-md px-4 py-2 text-sm font-bold transition ${locale === "nl" ? "bg-[var(--gold)] text-[var(--dark)]" : "text-[var(--muted)]"}`}>Nederlands</button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">Notification Sounds</p>
                  <p className="text-xs text-[var(--muted)]">Play sounds for new alerts</p>
                </div>
                <button type="button" onClick={() => setNotifSound((v) => !v)} className={`relative h-7 w-12 rounded-full transition ${notifSound ? "bg-[var(--gold)]" : "bg-[var(--surface)]"}`}>
                  <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${notifSound ? "left-[calc(100%-1.625rem)]" : "left-0.5"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">Auto-end Expired Sessions</p>
                  <p className="text-xs text-[var(--muted)]">Automatically end sessions when timer reaches 0</p>
                </div>
                <button type="button" onClick={() => setAutoEndSessions((v) => !v)} className={`relative h-7 w-12 rounded-full transition ${autoEndSessions ? "bg-[var(--gold)]" : "bg-[var(--surface)]"}`}>
                  <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${autoEndSessions ? "left-[calc(100%-1.625rem)]" : "left-0.5"}`} />
                </button>
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
            <h2 className="text-lg font-bold text-[var(--gold)]">Pricing</h2>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-[var(--surface)] px-4 py-3">
                <span className="text-sm text-[var(--muted)]">Hourly Rate</span>
                <span className="text-lg font-bold text-[var(--gold)]">{formatSrd(HOURLY_RATE_SRD)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[var(--surface)] px-4 py-3">
                <span className="text-sm text-[var(--muted)]">2-Hour Stay</span>
                <span className="text-sm font-semibold text-[var(--foreground)]">{formatSrd(HOURLY_RATE_SRD * 2)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[var(--surface)] px-4 py-3">
                <span className="text-sm text-[var(--muted)]">3-Hour Stay</span>
                <span className="text-sm font-semibold text-[var(--foreground)]">{formatSrd(HOURLY_RATE_SRD * 3)}</span>
              </div>
              <p className="text-xs text-[var(--muted)]">Pricing is demo-only and cannot be changed in this version.</p>
            </div>
          </section>

          {/* System Info */}
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
            <h2 className="text-lg font-bold text-[var(--gold)]">System</h2>
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">Total Rooms</span>
                <span className="font-semibold text-[var(--foreground)]">{rooms.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">Currently Occupied</span>
                <span className="font-semibold text-[var(--gold)]">{occupiedCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">Total Orders</span>
                <span className="font-semibold text-[var(--foreground)]">{orders.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">Version</span>
                <span className="font-mono text-xs text-[var(--muted)]">Demo v1.0</span>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="rounded-2xl border border-red-500/20 bg-[var(--card)] p-6 shadow-lg">
            <h2 className="text-lg font-bold text-red-400">Danger Zone</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Reset all demo data to its original state. This cannot be undone.</p>
            <button type="button" onClick={resetDemo} className="mt-4 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow transition hover:bg-red-700 active:scale-[0.98]">
              Reset Demo Data
            </button>
          </section>
        </div>
      </div>
    </ManagementShell>
  );
}
