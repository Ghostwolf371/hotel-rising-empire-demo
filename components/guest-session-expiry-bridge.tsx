"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useTimeLeft } from "@/components/room-timer";
import { useDemo } from "@/contexts/demo-context";

/**
 * When the guest session timer hits zero on any guest route, end the session
 * (room → cleaning) and send the guest to the rating screen. Lives in the
 * guest layout so it still runs on /guest/cart where useGuestSessionUi is not mounted.
 */
export function GuestSessionExpiryBridge() {
  const { guestSession, dispatch, armGuestNavToRatingAfterSessionEnd } = useDemo();
  const router = useRouter();
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
    if (pathname === "/guest/rate") return;
    if (leftMs > 0) return;
    if (firedForKeyRef.current === sessionKey) return;
    firedForKeyRef.current = sessionKey;
    const room = guestSession.roomNumber;
    armGuestNavToRatingAfterSessionEnd();
    dispatch({ type: "END_GUEST_SESSION" });
    router.replace(`/guest/rate?room=${encodeURIComponent(room)}`);
  }, [guestSession, endsAt, leftMs, pathname, sessionKey, dispatch, router, armGuestNavToRatingAfterSessionEnd]);

  return null;
}
