"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTimeLeft } from "@/components/room-timer";
import { useDemo } from "@/contexts/demo-context";
import { clearGuestLanguageChosen } from "@/lib/guest-language-chosen";
import { guestPath } from "@/lib/guest-routes";

export type GuestModal = "extend" | "confirm-end" | "panic-sent" | null;

export function useGuestSessionUi() {
  const router = useRouter();
  const { guestSession, dispatch, hourlyRate, guestPostSessionEndNavRef } = useDemo();
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
    clearGuestLanguageChosen();
    guestPostSessionEndNavRef.current.skipDurationRedirectOnce = true;
    dispatch({ type: "END_GUEST_SESSION" });
    setModal(null);
    router.replace(guestPath("/guest/language", room));
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
