"use client";

import { useSyncExternalStore } from "react";

/**
 * Surfaces network status to the user. When offline, Server Action POSTs are
 * captured by the workbox background-sync queue (`hre-actions-queue`) and
 * replayed automatically when connectivity returns. On reconnect, the banner
 * simply disappears — the replay happens silently in the background.
 *
 * Mount near other status banners. Renders nothing while online.
 */
function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}
const getSnapshot = () => navigator.onLine;
const getServerSnapshot = () => true;

export function OfflineBanner({
  offlineLabel = "Offline — changes will sync automatically when you reconnect.",
}: {
  offlineLabel?: string;
}) {
  const online = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (online) return null;

  return (
    <div
      className="border-b border-amber-500/40 bg-amber-500/15 px-4 py-2 text-center text-xs font-semibold text-amber-950 dark:text-amber-100"
      role="status"
      aria-live="polite"
    >
      {offlineLabel}
    </div>
  );
}
