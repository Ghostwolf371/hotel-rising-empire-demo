"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTimeLeft } from "@/components/room-timer";
import { useDemo } from "@/contexts/demo-context";
import { clearGuestLanguageChosen } from "@/lib/guest-language-chosen";

export type GuestModal = "extend" | "confirm-end" | "panic-sent" | null;

export function useGuestSessionUi() {
  const router = useRouter();
  const { guestSession, dispatch, hourlyRate, armGuestNavToRatingAfterSessionEnd } = useDemo();
  const [modal, setModal] = useState<GuestModal>(null);
  const [extendHours, setExtendHours] = useState(2);

  const endsAt = guestSession?.sessionEndsAt ?? 0;
  const leftMs = useTimeLeft(endsAt);

  // Pre-warm the rating route as soon as we have a session. Without this
  // the first End-tap pays the dev-server compile cost (or a cold network
  // fetch in prod) for /guest/rate, which is exactly the window where the
  // current page renders its "no session" empty state and the user sees a
  // black screen.
  const room = guestSession?.roomNumber;
  useEffect(() => {
    if (!room) return;
    router.prefetch(`/guest/rate?room=${encodeURIComponent(room)}`);
  }, [room, router]);

  function confirmExtend() {
    if (!guestSession) return;
    dispatch({ type: "EXTEND_GUEST_SESSION", extraHours: extendHours });
    setModal(null);
  }

  function endSession() {
    if (!guestSession) return;
    const room = guestSession.roomNumber;
    clearGuestLanguageChosen();
    armGuestNavToRatingAfterSessionEnd();
    dispatch({ type: "END_GUEST_SESSION" });
    setModal(null);
    router.replace(`/guest/rate?room=${encodeURIComponent(room)}`);
  }

  function panic() {
    if (!guestSession) return;
    dispatch({ type: "PANIC", roomNumber: guestSession.roomNumber });
    setModal("panic-sent");
  }

  return {
    guestSession,
    hourlyRate,
    modal,
    setModal,
    extendHours,
    setExtendHours,
    leftMs,
    confirmExtend,
    endSession,
    panic,
  };
}
