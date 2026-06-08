import type { ReactNode } from "react";
import { ManagementShell } from "@/components/management-shell";

export default function ManagementDashboardLayout({ children }: { children: ReactNode }) {
  return <ManagementShell>{children}</ManagementShell>;
}
