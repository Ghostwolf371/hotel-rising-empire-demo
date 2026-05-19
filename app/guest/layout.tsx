import type { ReactNode } from "react";
import { GuestSessionExpiryBridge } from "@/components/guest-session-expiry-bridge";
import { OfflineBanner } from "@/components/offline-banner";

export default function GuestLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
      <GuestSessionExpiryBridge />
      <OfflineBanner />
      {children}
    </div>
  );
}
