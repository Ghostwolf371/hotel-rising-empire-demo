/**
 * Shared chrome for the in-app guest menu bar (`/guest` main column) and
 * full-bleed guest routes so height + horizontal inset match pixel-for-pixel.
 */

/** Inner sheet: borders, flex row — solid card fill (matches checkout summary card) */
export const GUEST_MENU_STICKY_SHEET =
  "flex w-full min-h-0 shrink-0 flex-nowrap items-center justify-between gap-2 border-b border-t border-[var(--border)] bg-[var(--card)] sm:gap-3";

/**
 * Duration / start / stay: same flex + gaps + insets as sticky sheet, no bar fill
 * (gradient shows through).
 */
export const GUEST_MENU_FLOW_HEADER_SHEET =
  "flex w-full min-h-0 shrink-0 flex-nowrap items-center justify-between gap-2 sm:gap-3";

/** Same as `/guest` sticky: `py-2.5` / `sm:py-3` with `px-4` / `sm:px-6` */
export const GUEST_MENU_STICKY_PAD_INSET = "px-4 py-2.5 sm:px-6 sm:py-3";

/**
 * Full-bleed pages (duration / start / stay): same horizontal inset as menu bar,
 * top padding respects safe-area but matches `py-2.5` / `sm:py-3` when inset is 0.
 */
export const GUEST_MENU_STICKY_PAD_SAFE_TOP =
  "px-4 pb-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] sm:px-6 sm:pb-3 sm:pt-[max(0.75rem,env(safe-area-inset-top))]";
