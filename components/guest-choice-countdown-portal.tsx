"use client";

import { type ReactNode, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

export const GUEST_PORTAL_ROOT_ID = "guest-portal-root";

function subscribeToNothing(): () => void {
  return () => {};
}

function getClientSnap(): boolean {
  return true;
}

function getServerSnap(): boolean {
  return false;
}

function getPortalHost(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.getElementById(GUEST_PORTAL_ROOT_ID) ?? document.body;
}

/** Renders into `#guest-portal-root` (root layout) so `fixed` is viewport-true and above guest overflow/backdrop layers. */
export function GuestChoiceCountdownPortal({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(subscribeToNothing, getClientSnap, getServerSnap);

  if (!mounted) return null;
  const host = getPortalHost();
  if (!host) return null;
  return createPortal(children, host);
}
