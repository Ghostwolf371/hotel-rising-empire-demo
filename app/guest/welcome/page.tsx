"use client";

import { useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useDemo } from "@/contexts/demo-context";
import { guestPath } from "@/lib/guest-routes";

function RedirectContent() {
  const router = useRouter();
  const { registeredGuestRoom } = useDemo();

  useEffect(() => {
    router.replace(guestPath("/guest/duration", registeredGuestRoom));
  }, [registeredGuestRoom, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--background)]">
      <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--gold)]/30" />
    </div>
  );
}

export default function GuestWelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[var(--background)]">
          <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--gold)]/30" />
        </div>
      }
    >
      <RedirectContent />
    </Suspense>
  );
}
