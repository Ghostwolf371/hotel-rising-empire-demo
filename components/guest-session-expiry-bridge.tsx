"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useTimeLeft } from "@/components/room-timer";
import { useDemo } from "@/contexts/demo-context";
import { useGuestSessionExpiryUi } from "@/contexts/guest-session-expiry-ui";

/**
 * When the guest session timer hits zero, open the extend/end modal (not feedback).
 * Lives in the guest layout so it still runs on /guest/cart where useGuestSessionUi is not mounted.
 */
export function GuestSessionExpiryBridge() {
  const { guestSession } = useDemo();
  const { openSessionExpiredModal, sessionExpiredOpen } = useGuestSessionExpiryUi();
  const pathname = usePathname();
  const endsAt = guestSession?.sessionEndsAt ?? 0;
  const leftMs = useTimeLeft(endsAt);
  const firedForKeyRef = useRef<string | null>(null);

  const sessionKey = guestSession ? `${guestSession.roomNumber}-${endsAt}` : null;

  useEffect(() => {
    firedForKeyRef.current = null;
  }, [sessionKey]);

  useEffect(() => {
    if (!guestSession || endsAt === 0) return;
    if (
      pathname === "/guest/language" ||
      pathname === "/guest/duration" ||
      pathname === "/guest/welcome"
    ) {
      return;
    }
    if (leftMs > 0) return;
    if (sessionExpiredOpen) return;
    if (firedForKeyRef.current === sessionKey) return;
    firedForKeyRef.current = sessionKey;
    openSessionExpiredModal();
  }, [
    guestSession,
    endsAt,
    leftMs,
    pathname,
    sessionKey,
    sessionExpiredOpen,
    openSessionExpiredModal,
  ]);

  return null;
}
