"use server";

import {
  clearGuestDevice as clearGuestDeviceCookie,
  fetchGuestDeviceRoom as fetchGuestDeviceRoomCookie,
} from "@/lib/server/guest-device-cookie";

export async function fetchGuestDeviceRoom(): Promise<string | null> {
  return fetchGuestDeviceRoomCookie();
}

export async function clearGuestDevice(): Promise<void> {
  return clearGuestDeviceCookie();
}
