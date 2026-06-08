import type { ReactNode } from "react";
import { requireManagementPageAccess } from "@/lib/server/management-page-guard";

export default async function RoomsLayout({ children }: { children: ReactNode }) {
  await requireManagementPageAccess("rooms");
  return children;
}
