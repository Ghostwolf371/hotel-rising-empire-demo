import type { ReactNode } from "react";
import { requireManagementPageAccess } from "@/lib/server/management-page-guard";

export default async function ReportsLayout({ children }: { children: ReactNode }) {
  await requireManagementPageAccess("reports");
  return children;
}
