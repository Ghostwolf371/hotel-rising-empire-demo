"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { ManagementShell } from "@/components/management-shell";
import { useDemo, type Action } from "@/contexts/demo-context";
import { formatSrd } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { Product, ProductCategory } from "@/lib/types";

type Dispatch = React.Dispatch<Action>;

type Tab = "general" | "pricing" | "inventory" | "rooms" | "system";

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
    id: "inventory",
    key: "mgmtTabInventory",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
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

/* ─── Toggle Switch ────────────────────────────────── */
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className={`relative h-7 w-12 rounded-full transition ${on ? "bg-[var(--gold)]" : "bg-[var(--surface)]"}`}>
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? "left-[calc(100%-1.625rem)]" : "left-0.5"}`} />
    </button>
  );
}

/* ─── Setting Row ──────────────────────────────────── */
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

/* ═══════════════════════════════════════════════════ */
export default function ManagementSettingsPage() {
  const { locale, setLocale, theme, setTheme, rooms, orders, catalog, hourlyRate, dispatch } = useDemo();
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-[var(--gold)]">{t(locale, "mgmtSettings")}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{t(locale, "mgmtSettingsSub")}</p>
        </div>

        {/* Tab bar */}
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

        {/* Tab content */}
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
          {tab === "inventory" && <InventoryTab locale={locale} catalog={catalog} dispatch={dispatch} />}
          {tab === "rooms" && <RoomsTab locale={locale} rooms={rooms} dispatch={dispatch} />}
          {tab === "system" && (
            <SystemTab locale={locale} rooms={rooms} orders={orders} occupiedCount={occupiedCount} resetDemo={resetDemo} />
          )}
        </div>
      </div>
    </ManagementShell>
  );
}

/* ═══ GENERAL TAB ══════════════════════════════════ */
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

/* ═══ PRICING TAB ══════════════════════════════════ */
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
      {/* Hourly rate editor */}
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

      {/* Stay pricing summary */}
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

      {/* Extension rate info */}
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

/* ═══ INVENTORY TAB ════════════════════════════════ */
function InventoryTab({
  locale, catalog, dispatch,
}: {
  locale: "en" | "nl";
  catalog: Product[];
  dispatch: Dispatch;
}) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<ProductCategory | "all">("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(false);

  const filtered = useMemo(() => {
    let list = catalog;
    if (catFilter !== "all") list = list.filter((p) => p.category === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.nameNl.toLowerCase().includes(q));
    }
    return list;
  }, [catalog, catFilter, search]);

  function openNew() {
    setEditingProduct({
      id: `p${Date.now()}`,
      name: "",
      nameNl: "",
      priceSrd: 0,
      category: "drink",
      image: "",
      available: true,
    });
    setIsNew(true);
  }

  function openEdit(p: Product) {
    setEditingProduct({ ...p });
    setIsNew(false);
  }

  function saveProduct() {
    if (!editingProduct) return;
    if (isNew) {
      dispatch({ type: "ADD_PRODUCT", product: editingProduct });
    } else {
      dispatch({ type: "UPDATE_PRODUCT", product: editingProduct });
    }
    setEditingProduct(null);
  }

  function deleteProduct(id: string) {
    if (window.confirm(t(locale, "mgmtDeleteProductConfirm"))) {
      dispatch({ type: "DELETE_PRODUCT", productId: id });
      setEditingProduct(null);
    }
  }

  const toggleAvailability = useCallback((id: string) => {
    dispatch({ type: "TOGGLE_PRODUCT_AVAILABILITY", productId: id });
  }, [dispatch]);

  const catCounts = useMemo(() => {
    const map: Record<string, number> = { all: catalog.length, drink: 0, snack: 0, other: 0 };
    catalog.forEach((p) => { map[p.category] = (map[p.category] ?? 0) + 1; });
    return map;
  }, [catalog]);

  const categories: { id: ProductCategory | "all"; label: string }[] = [
    { id: "all", label: t(locale, "mgmtAllCategories") },
    { id: "drink", label: t(locale, "mgmtCatDrink") },
    { id: "snack", label: t(locale, "mgmtCatSnack") },
    { id: "other", label: t(locale, "mgmtCatOther") },
  ];

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-0 flex-1">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(locale, "mgmtSearchProducts")}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20"
          />
        </div>
        {/* Category filter pills */}
        <div className="flex gap-1 rounded-lg bg-[var(--surface)] p-0.5">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCatFilter(c.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                catFilter === c.id
                  ? "bg-[var(--gold)] text-[var(--dark)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {c.label} ({catCounts[c.id] ?? 0})
            </button>
          ))}
        </div>
        {/* Add button */}
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-2 rounded-xl bg-[var(--gold)] px-4 py-2.5 text-sm font-bold text-[var(--dark)] transition hover:bg-[var(--gold-light)] active:scale-[0.98]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t(locale, "mgmtAddProduct")}
        </button>
      </div>

      {/* Product list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-6 py-12 text-center">
          <p className="text-sm text-[var(--muted)]">{t(locale, "mgmtNoProducts")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div
              key={p.id}
              className={`group flex items-center gap-4 rounded-2xl border bg-[var(--card)] px-4 py-3 shadow-sm transition hover:shadow-md ${
                p.available ? "border-[var(--border)]" : "border-red-500/20 opacity-60"
              }`}
            >
              {/* Image */}
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[var(--surface)]">
                {p.image ? (
                  <Image src={p.image} alt={p.name} fill className="object-cover" sizes="56px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[var(--muted)]">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-bold text-[var(--foreground)]">
                    {locale === "nl" ? p.nameNl : p.name}
                  </p>
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                    p.category === "drink" ? "bg-sky-500/10 text-sky-400" :
                    p.category === "snack" ? "bg-amber-500/10 text-amber-400" :
                    "bg-purple-500/10 text-purple-400"
                  }`}>
                    {p.category === "drink" ? t(locale, "mgmtCatDrink") : p.category === "snack" ? t(locale, "mgmtCatSnack") : t(locale, "mgmtCatOther")}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[var(--muted)]">{locale === "nl" ? p.name : p.nameNl}</p>
              </div>

              {/* Price */}
              <p className="text-base font-black text-[var(--gold)]">{formatSrd(p.priceSrd)}</p>

              {/* Availability toggle */}
              <Toggle on={p.available} onToggle={() => toggleAvailability(p.id)} />

              {/* Edit button */}
              <button
                type="button"
                onClick={() => openEdit(p)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--gold)]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Product edit modal */}
      {editingProduct && (
        <ProductModal
          product={editingProduct}
          setProduct={setEditingProduct}
          isNew={isNew}
          locale={locale}
          onSave={saveProduct}
          onDelete={() => deleteProduct(editingProduct.id)}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </div>
  );
}

/* ─── Product Edit Modal ───────────────────────── */
function ProductModal({
  product, setProduct, isNew, locale, onSave, onDelete, onClose,
}: {
  product: Product;
  setProduct: (p: Product | null) => void;
  isNew: boolean;
  locale: "en" | "nl";
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const set = (patch: Partial<Product>) => setProduct({ ...product, ...patch });
  const canSave = product.name.trim() && product.nameNl.trim() && product.priceSrd > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-md">
      <div className="animate-fade-in-scale w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <h3 className="text-lg font-bold text-[var(--gold)]">
            {isNew ? t(locale, "mgmtAddProduct") : t(locale, "mgmtEditProduct")}
          </h3>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          {/* Image preview */}
          {product.image && (
            <div className="relative h-32 w-full overflow-hidden rounded-xl bg-[var(--surface)]">
              <Image src={product.image} alt={product.name || "Preview"} fill className="object-cover" sizes="500px" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{t(locale, "mgmtProductName")}</label>
              <input type="text" value={product.name} onChange={(e) => set({ name: e.target.value })} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{t(locale, "mgmtProductNameNl")}</label>
              <input type="text" value={product.nameNl} onChange={(e) => set({ nameNl: e.target.value })} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{t(locale, "mgmtProductPrice")}</label>
              <input type="number" min={0} step={0.5} value={product.priceSrd} onChange={(e) => set({ priceSrd: Number(e.target.value) })} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{t(locale, "mgmtProductCategory")}</label>
              <select value={product.category} onChange={(e) => set({ category: e.target.value as ProductCategory })} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20">
                <option value="drink">{t(locale, "mgmtCatDrink")}</option>
                <option value="snack">{t(locale, "mgmtCatSnack")}</option>
                <option value="other">{t(locale, "mgmtCatOther")}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{t(locale, "mgmtProductImage")}</label>
            <input type="text" value={product.image} onChange={(e) => set({ image: e.target.value })} placeholder="https://images.unsplash.com/…" className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--border)] px-6 py-4">
          <div>
            {!isNew && (
              <button type="button" onClick={onDelete} className="text-sm font-bold text-red-400 transition hover:text-red-300">
                {t(locale, "mgmtDeleteProduct")}
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm font-bold text-[var(--foreground)] transition hover:bg-[var(--surface)]">
              {t(locale, "mgmtCancel")}
            </button>
            <button type="button" onClick={onSave} disabled={!canSave} className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${canSave ? "bg-[var(--gold)] text-[var(--dark)] hover:bg-[var(--gold-light)] active:scale-[0.98]" : "cursor-not-allowed bg-[var(--surface)] text-[var(--muted)]"}`}>
              {t(locale, "mgmtSave")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ ROOMS TAB ════════════════════════════════════ */
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
      {/* Add room */}
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

      {/* Room list */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg">
        <div className="border-b border-[var(--border)] px-6 py-4">
          <p className="text-sm font-bold text-[var(--foreground)]">{rooms.length} {t(locale, "mgmtNavRooms")}</p>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {rooms.map((room) => (
            <div key={room.id} className="flex items-center gap-4 px-6 py-3 transition hover:bg-[var(--surface)]/50">
              {/* Room icon */}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--foreground)]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>

              {/* Number + status */}
              <div className="flex-1">
                <p className="text-sm font-bold text-[var(--foreground)]">{t(locale, "mgmtRoom")} {room.number}</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${statusColor[room.status] ?? "bg-gray-400"}`} />
                  <span className="text-xs text-[var(--muted)]">{t(locale, statusLabel[room.status] ?? "mgmtStatusAvailable")}</span>
                </div>
              </div>

              {/* Delete */}
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

/* ═══ SYSTEM TAB ═══════════════════════════════════ */
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
