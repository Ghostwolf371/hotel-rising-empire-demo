"use client";

import { DemoProvider } from "@/contexts/demo-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return <DemoProvider>{children}</DemoProvider>;
}
