"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { useDemo } from "@/contexts/demo-context";
import { guestPath } from "@/lib/guest-routes";

function GuestDeviceGuardInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { registeredGuestRoom, guestDeviceHydrated } = useDemo();

  const urlRoom = searchParams.get("room")?.trim() ?? "";

  useEffect(() => {
    if (!guestDeviceHydrated) return;

    if (!registeredGuestRoom) {
      router.replace("/");
      return;
    }

    if (urlRoom && urlRoom !== registeredGuestRoom) {
      router.replace(guestPath(pathname, registeredGuestRoom));
    }
  }, [
    guestDeviceHydrated,
    registeredGuestRoom,
    urlRoom,
    pathname,
    router,
  ]);

  if (!guestDeviceHydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--background)]">
        <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--gold)]/30" />
      </div>
    );
  }

  if (!registeredGuestRoom) {
    return null;
  }

  return <>{children}</>;
}

export function GuestDeviceGuard({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[var(--background)]">
          <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--gold)]/30" />
        </div>
      }
    >
      <GuestDeviceGuardInner>{children}</GuestDeviceGuardInner>
    </Suspense>
  );
}
