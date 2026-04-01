import type { Locale } from "./types";
import { bcp47ForLocale } from "./locale-intl";

export function formatSrd(n: number): string {
  return `SRD ${n.toFixed(2)}`;
}

export function formatTimeRange(
  start: Date,
  end: Date,
  locale: Locale
): string {
  const opts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  const loc = bcp47ForLocale(locale);
  const a = start.toLocaleTimeString(loc, opts);
  const b = end.toLocaleTimeString(loc, opts);
  return `${a} – ${b}`;
}

export function formatDateTime(ts: number, locale: Locale): string {
  const d = new Date(ts);
  return d.toLocaleString(bcp47ForLocale(locale), {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

export function formatCountdownShort(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${pad2(m)}:${pad2(s)}`;
}
