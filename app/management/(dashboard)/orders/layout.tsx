import type { ReactNode } from "react";
import { requireManagementPageAccess } from "@/lib/server/management-page-guard";

export default async function OrdersLayout({ children }: { children: ReactNode }) {
  await requireManagementPageAccess("orders");
  return children;
}
