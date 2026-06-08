import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { MANAGEMENT_AUTH_COOKIE, isManagementSessionCookie } from "@/lib/management-auth";
import { defaultManagementLandingPathForPages } from "@/lib/management-permissions";
import { resolveSessionAllowedPages } from "@/lib/server/management-auth-server";
import { ManagementLoginForm } from "@/app/management/login-form";

export default async function ManagementLoginPage() {
  const cookieStore = await cookies();
  const value = cookieStore.get(MANAGEMENT_AUTH_COOKIE)?.value;
  if (await isManagementSessionCookie(value)) {
    const pages = await resolveSessionAllowedPages(value);
    if (pages?.length) {
      redirect(defaultManagementLandingPathForPages(pages));
    }
  }
  return <ManagementLoginForm />;
}
