"use client";

import { useState } from "react";
import { ManagementShell } from "@/components/management-shell";
import { useDemo } from "@/contexts/demo-context";
import { formatSrd } from "@/lib/format";
import { t } from "@/lib/i18n";
import { HOURLY_RATE_SRD } from "@/lib/mock-data";

export default function ManagementSettingsPage() {
  const { locale, setLocale, rooms, orders } = useDemo();
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

        <div className="max-w-2xl space-y-6">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
            <h2 className="text-lg font-bold text-[var(--gold)]">{t(locale, "mgmtGeneral")}</h2>
            <div className="mt-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{t(locale, "mgmtLanguage")}</p>
                  <p className="text-xs text-[var(--muted)]">{t(locale, "mgmtLanguageSub")}</p>
                </div>
                <div className="flex rounded-lg bg-[var(--surface)] p-0.5">
                  <button type="button" onClick={() => setLocale("en")} className={`rounded-md px-4 py-2 text-sm font-bold transition ${locale === "en" ? "bg-[var(--gold)] text-[var(--dark)]" : "text-[var(--muted)]"}`}>English</button>
                  <button type="button" onClick={() => setLocale("nl")} className={`rounded-md px-4 py-2 text-sm font-bold transition ${locale === "nl" ? "bg-[var(--gold)] text-[var(--dark)]" : "text-[var(--muted)]"}`}>Nederlands</button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{t(locale, "mgmtNotifSounds")}</p>
                  <p className="text-xs text-[var(--muted)]">{t(locale, "mgmtNotifSoundsSub")}</p>
                </div>
                <button type="button" onClick={() => setNotifSound((v) => !v)} className={`relative h-7 w-12 rounded-full transition ${notifSound ? "bg-[var(--gold)]" : "bg-[var(--surface)]"}`}>
                  <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${notifSound ? "left-[calc(100%-1.625rem)]" : "left-0.5"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{t(locale, "mgmtAutoEnd")}</p>
                  <p className="text-xs text-[var(--muted)]">{t(locale, "mgmtAutoEndSub")}</p>
                </div>
                <button type="button" onClick={() => setAutoEndSessions((v) => !v)} className={`relative h-7 w-12 rounded-full transition ${autoEndSessions ? "bg-[var(--gold)]" : "bg-[var(--surface)]"}`}>
                  <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${autoEndSessions ? "left-[calc(100%-1.625rem)]" : "left-0.5"}`} />
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
            <h2 className="text-lg font-bold text-[var(--gold)]">{t(locale, "mgmtPricing")}</h2>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-[var(--surface)] px-4 py-3">
                <span className="text-sm text-[var(--muted)]">{t(locale, "mgmtHourlyRate")}</span>
                <span className="text-lg font-bold text-[var(--gold)]">{formatSrd(HOURLY_RATE_SRD)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[var(--surface)] px-4 py-3">
                <span className="text-sm text-[var(--muted)]">{t(locale, "mgmt2HourStay")}</span>
                <span className="text-sm font-semibold text-[var(--foreground)]">{formatSrd(HOURLY_RATE_SRD * 2)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[var(--surface)] px-4 py-3">
                <span className="text-sm text-[var(--muted)]">{t(locale, "mgmt3HourStay")}</span>
                <span className="text-sm font-semibold text-[var(--foreground)]">{formatSrd(HOURLY_RATE_SRD * 3)}</span>
              </div>
              <p className="text-xs text-[var(--muted)]">{t(locale, "mgmtPricingNote")}</p>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
            <h2 className="text-lg font-bold text-[var(--gold)]">{t(locale, "mgmtSystem")}</h2>
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">{t(locale, "mgmtTotalRooms")}</span>
                <span className="font-semibold text-[var(--foreground)]">{rooms.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">{t(locale, "mgmtCurrentlyOccupied")}</span>
                <span className="font-semibold text-[var(--gold)]">{occupiedCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">{t(locale, "mgmtTotalOrders")}</span>
                <span className="font-semibold text-[var(--foreground)]">{orders.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">{t(locale, "mgmtVersion")}</span>
                <span className="font-mono text-xs text-[var(--muted)]">Demo v1.0</span>
              </div>
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
      </div>
    </ManagementShell>
  );
}
