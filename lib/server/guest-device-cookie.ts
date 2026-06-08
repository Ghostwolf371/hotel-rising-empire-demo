import { cookies } from "next/headers";
import {
  createGuestDeviceToken,
  GUEST_DEVICE_COOKIE,
  verifyGuestDeviceToken,
} from "@/lib/guest-device-auth";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

/** Internal — only call after successful check-in verification. */
export async function setGuestDeviceCookie(roomNumber: string): Promise<void> {
  const token = await createGuestDeviceToken(roomNumber);
  const cookieStore = await cookies();
  cookieStore.set(GUEST_DEVICE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function fetchGuestDeviceRoom(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(GUEST_DEVICE_COOKIE)?.value;
  return verifyGuestDeviceToken(value);
}

export async function clearGuestDevice(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(GUEST_DEVICE_COOKIE);
}
