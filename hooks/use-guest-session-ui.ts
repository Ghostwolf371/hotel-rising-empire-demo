"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTimeLeft } from "@/components/room-timer";
import { useDemo } from "@/contexts/demo-context";

export type GuestModal = "extend" | "confirm-end" | "panic-sent" | null;

export function useGuestSessionUi() {
  const router = useRouter();
  const { guestSession, dispatch, hourlyRate, armGuestNavToRatingAfterSessionEnd } = useDemo();
  const [modal, setModal] = useState<GuestModal>(null);
  const [extendHours, setExtendHours] = useState(2);

  const endsAt = guestSession?.sessionEndsAt ?? 0;
  const leftMs = useTimeLeft(endsAt);

  function confirmExtend() {
    if (!guestSession) return;
    dispatch({ type: "EXTEND_GUEST_SESSION", extraHours: extendHours });
    setModal(null);
  }

  function endSession() {
    if (!guestSession) return;
    const room = guestSession.roomNumber;
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
