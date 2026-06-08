import { cookies, headers } from "next/headers";
import { MANAGEMENT_AUTH_COOKIE } from "@/lib/management-auth";
import {
  type ManagementPageKey,
  canAccessManagementPathWithPages,
  MANAGEMENT_PAGES,
} from "@/lib/management-permissions";
import {
  assertManagementSessionCookie,
  resolveSessionAllowedPages,
} from "@/lib/server/management-auth-server";
import { verifyGuestDeviceToken, GUEST_DEVICE_COOKIE } from "@/lib/guest-device-auth";

async function getManagementCookieValue(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(MANAGEMENT_AUTH_COOKIE)?.value;
}

export async function requireManagementSession(): Promise<ManagementPageKey[]> {
  const value = await getManagementCookieValue();
  await assertManagementSessionCookie(value);
  const pages = await resolveSessionAllowedPages(value);
  if (!pages || pages.length === 0) throw new Error("Unauthorized");
  return pages;
}

export async function requireManagementPage(page: ManagementPageKey): Promise<void> {
  const pages = await requireManagementSession();
  if (!canAccessManagementPathWithPages(pages, MANAGEMENT_PAGES[page])) {
    throw new Error("Forbidden");
  }
}

export async function requireGuestDeviceRoom(expectedRoom?: string): Promise<string> {
  const cookieStore = await cookies();
  const room = await verifyGuestDeviceToken(
    cookieStore.get(GUEST_DEVICE_COOKIE)?.value,
  );
  if (!room) throw new Error("Unauthorized");
  if (expectedRoom && expectedRoom.trim() !== room) {
    throw new Error("Forbidden");
  }
  return room;
}

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return h.get("x-real-ip")?.trim() || "unknown";
}
