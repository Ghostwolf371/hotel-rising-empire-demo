import type { ManagementPageKey } from "@/lib/management-permissions";

export type AllowedPagesSet = ReadonlySet<ManagementPageKey> | null;

/** Order notifications and live order popups require the orders page. */
export function canReceiveOrderNotifications(allowedPages: AllowedPagesSet): boolean {
  return allowedPages?.has("orders") ?? false;
}

/** Panic alerts, session popups, check-in code popups, and room expiry require the rooms page. */
export function canReceiveRoomNotifications(allowedPages: AllowedPagesSet): boolean {
  return allowedPages?.has("rooms") ?? false;
}

/** Whether the notification bell should be shown at all. */
export function hasNotificationRelevantPages(allowedPages: AllowedPagesSet): boolean {
  return canReceiveOrderNotifications(allowedPages) || canReceiveRoomNotifications(allowedPages);
}
