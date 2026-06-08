import type { ReactNode } from "react";
import { requireManagementPageAccess } from "@/lib/server/management-page-guard";

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  await requireManagementPageAccess("settings");
  return children;
}
