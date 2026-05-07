"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

const DEMO_ROOM = "104";

function RedirectContent() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const room = params.get("room")?.trim();
    router.replace(`/guest/duration?room=${encodeURIComponent(room || DEMO_ROOM)}`);
  }, [params, router]);

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
