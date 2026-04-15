import type { ReactNode } from "react";
import { GuestSessionExpiryBridge } from "@/components/guest-session-expiry-bridge";

export default function GuestLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
      <GuestSessionExpiryBridge />
      {children}
    </div>
  );
}
