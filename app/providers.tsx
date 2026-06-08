"use client";

import { DemoProvider, type DomainMode } from "@/contexts/demo-context";

export function Providers({
  children,
  useDatabase = false,
  domainMode,
}: {
  children: React.ReactNode;
  /** Mirrors `HRE_USE_DATABASE` from the server layout. */
  useDatabase?: boolean;
  domainMode?: DomainMode;
}) {
  return (
    <DemoProvider useDatabase={useDatabase} domainMode={domainMode}>
      {children}
    </DemoProvider>
  );
}
