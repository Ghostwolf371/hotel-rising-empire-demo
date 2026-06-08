import type { ReactNode } from "react";
import { requireManagementPageAccess } from "@/lib/server/management-page-guard";

export default async function InventoryLayout({ children }: { children: ReactNode }) {
  await requireManagementPageAccess("inventory");
  return children;
}
