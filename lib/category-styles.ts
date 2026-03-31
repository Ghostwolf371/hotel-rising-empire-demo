import type { Category } from "./types";

const COLOR_BADGE: Record<string, string> = {
  sky: "bg-sky-500/10 text-sky-400",
  amber: "bg-amber-500/10 text-amber-400",
  purple: "bg-purple-500/10 text-purple-400",
  emerald: "bg-emerald-500/10 text-emerald-400",
  rose: "bg-rose-500/10 text-rose-400",
  slate: "bg-slate-500/10 text-slate-400",
  gold: "bg-[var(--gold)]/15 text-[var(--gold)]",
  orange: "bg-orange-500/10 text-orange-400",
  cyan: "bg-cyan-500/10 text-cyan-400",
};

export const CATEGORY_COLOR_OPTIONS = [
  { value: "sky", label: "Sky" },
  { value: "amber", label: "Amber" },
  { value: "purple", label: "Purple" },
  { value: "emerald", label: "Emerald" },
  { value: "rose", label: "Rose" },
  { value: "slate", label: "Slate" },
  { value: "gold", label: "Gold" },
  { value: "orange", label: "Orange" },
  { value: "cyan", label: "Cyan" },
] as const;

export function categoryBadgeClass(color: string): string {
  return COLOR_BADGE[color] ?? "bg-purple-500/10 text-purple-400";
}

export function categoryLabel(
  categories: Category[],
  categoryId: string,
  locale: "en" | "nl"
): string {
  const c = categories.find((x) => x.id === categoryId);
  if (c) return locale === "nl" ? c.nameNl : c.name;
  return categoryId;
}
