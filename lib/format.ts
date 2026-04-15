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
  const loc = bcp47ForLocale(locale);

  const sameCalendarDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  const timeOnly: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  if (sameCalendarDay) {
    return `${start.toLocaleTimeString(loc, timeOnly)} – ${end.toLocaleTimeString(loc, timeOnly)}`;
  }

  const crossYear = start.getFullYear() !== end.getFullYear();
  const withDate: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...(crossYear ? { year: "numeric" as const } : {}),
  };

  return `${start.toLocaleString(loc, withDate)} – ${end.toLocaleString(loc, withDate)}`;
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
