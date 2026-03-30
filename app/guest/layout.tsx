import type { ReactNode } from "react";

export default function GuestLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
      {children}
    </div>
  );
}
