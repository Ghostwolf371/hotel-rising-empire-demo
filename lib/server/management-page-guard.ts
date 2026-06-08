import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { MANAGEMENT_AUTH_COOKIE, isManagementSessionCookie } from "@/lib/management-auth";
import {
  type ManagementPageKey,
  MANAGEMENT_PAGES,
  canAccessManagementPathWithPages,
  defaultManagementLandingPathForPages,
} from "@/lib/management-permissions";
import { resolveSessionAllowedPages } from "@/lib/server/management-auth-server";

export async function requireManagementPageAccess(page: ManagementPageKey): Promise<void> {
  const cookieStore = await cookies();
  const value = cookieStore.get(MANAGEMENT_AUTH_COOKIE)?.value;

  if (!(await isManagementSessionCookie(value))) {
    redirect("/management");
  }

  const pages = await resolveSessionAllowedPages(value);
  if (!pages || pages.length === 0) {
    redirect("/management");
  }

  const href = MANAGEMENT_PAGES[page];
  if (!canAccessManagementPathWithPages(pages, href)) {
    redirect(defaultManagementLandingPathForPages(pages));
  }
}
