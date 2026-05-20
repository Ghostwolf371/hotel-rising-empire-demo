import type { ReactNode } from "react";
import { GuestDeviceGuard } from "@/components/guest-device-guard";
import { GuestSessionExpiredModal } from "@/components/guest-session-expired-modal";
import { GuestSessionExpiryBridge } from "@/components/guest-session-expiry-bridge";
import { OfflineBanner } from "@/components/offline-banner";
import { GuestSessionExpiryUiProvider } from "@/contexts/guest-session-expiry-ui";

export default function GuestLayout({ children }: { children: ReactNode }) {
  return (
    <GuestSessionExpiryUiProvider>
      <div className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
        <GuestSessionExpiryBridge />
        <GuestSessionExpiredModal />
        <OfflineBanner />
        <GuestDeviceGuard>{children}</GuestDeviceGuard>
      </div>
    </GuestSessionExpiryUiProvider>
  );
}
