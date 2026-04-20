"use client";

import { DemoProvider } from "@/contexts/demo-context";

export function Providers({
  children,
  useDatabase = false,
}: {
  children: React.ReactNode;
  /** Mirrors `HRE_USE_DATABASE` from the server layout. */
  useDatabase?: boolean;
}) {
  return (
    <DemoProvider useDatabase={useDatabase}>{children}</DemoProvider>
  );
}
