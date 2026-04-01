"use client";

import { useEffect, useRef, useState } from "react";
import { useDemo } from "@/contexts/demo-context";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { LOCALES } from "@/lib/types";

const CODE_LABEL: Record<Locale, string> = {
  en: "EN",
  nl: "NL",
  es: "ES",
  pt: "PT",
};

const SETTINGS_LABEL: Record<Locale, string> = {
  en: "English",
  nl: "Nederlands",
  es: "Español",
  pt: "Português",
};

type Variant = "shell" | "guest" | "landing" | "duration" | "inline" | "settings";

/** Trigger shows short code in tight layouts, full name elsewhere */
function triggerLabelsFor(variant: Variant): Record<Locale, string> {
  return variant === "shell" || variant === "inline" ? CODE_LABEL : SETTINGS_LABEL;
}

const VARIANT_STYLES: Record<
  Variant,
  {
    row: string;
    label: string;
    root: string;
    trigger: string;
    triggerOpen: string;
    panel: string;
    option: string;
    optionActive: string;
    optionIdle: string;
  }
> = {
  shell: {
    row: "flex items-center gap-2",
    label:
      "shrink-0 text-xs font-bold uppercase tracking-wider text-[var(--muted)]",
    root: "relative",
    trigger:
      "flex min-h-10 min-w-[5.5rem] items-center justify-between gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-bold text-[var(--foreground)] transition hover:border-[var(--gold)]/40",
    triggerOpen: "border-[var(--gold)]/50 ring-1 ring-[var(--gold)]/20",
    panel:
      "absolute right-0 top-full z-50 mt-1 min-w-[9.5rem] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] py-1 shadow-xl shadow-black/30",
    option: "flex w-full items-center px-3 py-2 text-left text-sm font-semibold transition",
    optionActive: "bg-[var(--gold)]/15 text-[var(--gold)]",
    optionIdle: "text-[var(--foreground)] hover:bg-[var(--surface)]",
  },
  guest: {
    row: "flex items-center gap-3",
    label: "shrink-0 text-sm font-semibold text-[var(--muted)]",
    root: "relative",
    trigger:
      "flex min-w-[8.5rem] items-center justify-between gap-2 rounded-full border border-[var(--border-light)] bg-[var(--surface)] px-4 py-2 text-base font-medium text-[var(--foreground)] transition hover:border-[var(--gold)]/40",
    triggerOpen: "border-[var(--gold)]/50 ring-1 ring-[var(--gold)]/20",
    panel:
      "absolute right-0 top-full z-50 mt-1.5 min-w-[11rem] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] py-1 shadow-xl shadow-black/25",
    option: "flex w-full items-center px-4 py-2.5 text-left text-base font-medium transition",
    optionActive: "bg-[var(--gold)]/15 text-[var(--gold)]",
    optionIdle: "text-[var(--foreground)] hover:bg-[var(--card-hover)]",
  },
  landing: {
    row: "flex items-center gap-3",
    label: "shrink-0 text-sm font-semibold text-[var(--muted)]",
    root: "relative",
    trigger:
      "flex min-w-[8.5rem] items-center justify-between gap-2 rounded-full border border-[var(--border-light)] bg-[var(--surface)] px-5 py-2.5 text-base font-medium text-[var(--foreground)] transition hover:border-[var(--gold)]/40",
    triggerOpen: "border-[var(--gold)]/50 ring-1 ring-[var(--gold)]/20",
    panel:
      "absolute right-0 top-full z-50 mt-1.5 min-w-[11rem] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] py-1 shadow-xl shadow-black/25",
    option: "flex w-full items-center px-4 py-2.5 text-left text-base font-medium transition",
    optionActive: "bg-[var(--gold)]/15 text-[var(--gold)]",
    optionIdle: "text-[var(--foreground)] hover:bg-[var(--card-hover)]",
  },
  duration: {
    row: "flex items-center gap-2",
    label: "shrink-0 text-xs font-bold uppercase tracking-wider text-white/70",
    root: "relative",
    trigger:
      "flex min-w-[7.5rem] items-center justify-between gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm transition hover:border-white/35",
    triggerOpen: "border-[var(--gold)]/60 ring-1 ring-[var(--gold)]/30",
    panel:
      "absolute right-0 top-full z-50 mt-1 min-w-[10.5rem] overflow-hidden rounded-xl border border-white/15 bg-black/90 py-1 shadow-2xl shadow-black/50 backdrop-blur-md",
    option: "flex w-full items-center px-3 py-2 text-left text-sm font-semibold transition",
    optionActive: "bg-[var(--gold)]/20 text-[var(--gold)]",
    optionIdle: "text-white/90 hover:bg-white/10",
  },
  inline: {
    row: "flex items-center gap-2",
    label:
      "shrink-0 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]",
    root: "relative",
    trigger:
      "flex min-w-[4.25rem] items-center justify-between gap-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-bold text-[var(--foreground)] transition hover:border-[var(--gold)]/40",
    triggerOpen: "border-[var(--gold)]/50 ring-1 ring-[var(--gold)]/20",
    panel:
      "absolute bottom-full left-0 z-50 mb-1 min-w-[9.5rem] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] py-1 shadow-xl shadow-black/30",
    option: "flex w-full items-center px-3 py-2 text-left text-sm font-semibold transition",
    optionActive: "bg-[var(--gold)]/15 text-[var(--gold)]",
    optionIdle: "text-[var(--foreground)] hover:bg-[var(--surface)]",
  },
  settings: {
    row: "",
    label: "",
    root: "relative",
    trigger:
      "flex min-w-[10rem] items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--gold)]/40",
    triggerOpen: "border-[var(--gold)]/50 ring-1 ring-[var(--gold)]/20",
    panel:
      "absolute right-0 top-full z-50 mt-1 min-w-[11rem] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] py-1 shadow-xl shadow-black/30",
    option: "flex w-full items-center px-4 py-2 text-left text-sm font-bold transition",
    optionActive: "bg-[var(--gold)]/15 text-[var(--gold)]",
    optionIdle: "text-[var(--foreground)] hover:bg-[var(--surface)]",
  },
};

function Chevron({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 opacity-70 transition-transform ${open ? "rotate-180" : ""} ${className ?? ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export function LanguageToggle({ variant }: { variant: Variant }) {
  const { locale, setLocale } = useDemo();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerLabel = triggerLabelsFor(variant);
  const s = VARIANT_STYLES[variant];
  const showSideLabel = variant !== "settings";

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function select(code: Locale) {
    setLocale(code);
    setOpen(false);
  }

  const chevronClass = variant === "duration" ? "text-white/70" : "";

  const listLabel = t(locale, "mgmtLanguage");
  const triggerAriaLabel = `${listLabel}, ${SETTINGS_LABEL[locale]}`;

  const dropdown = (
    <div ref={rootRef} className={s.root}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={triggerAriaLabel}
        onClick={() => setOpen((v) => !v)}
        className={`${s.trigger} ${open ? s.triggerOpen : ""} touch-manipulation`}
      >
        <span className="truncate">{triggerLabel[locale]}</span>
        <Chevron open={open} className={chevronClass} />
      </button>

      {open && (
        <ul role="listbox" aria-label={listLabel} className={s.panel}>
          {LOCALES.map((code) => (
            <li key={code} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={locale === code}
                onClick={() => select(code)}
                className={`${s.option} touch-manipulation ${locale === code ? s.optionActive : s.optionIdle}`}
              >
                {SETTINGS_LABEL[code]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  if (!showSideLabel) {
    return dropdown;
  }

  return (
    <div className={s.row}>
      <span className={s.label}>{listLabel}</span>
      {dropdown}
    </div>
  );
}
