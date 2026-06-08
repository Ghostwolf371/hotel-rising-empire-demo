"use server";

import { cookies } from "next/headers";
import { setGuestDeviceCookie } from "@/lib/server/guest-device-cookie";
import { MANAGEMENT_AUTH_COOKIE } from "@/lib/management-auth";
import {
  getClientIp,
  requireManagementPage,
  requireGuestDeviceRoom,
} from "@/lib/server/action-auth";
import { assertRateLimit, checkRateLimit } from "@/lib/server/rate-limit";
import { assertManagementSessionCookie } from "@/lib/server/management-auth-server";
import {
  listActiveCheckInCodesDb,
  requestCheckInCodeDb,
  verifyCheckInCodeDb,
} from "@/lib/server/checkin-codes-db";

export type VerifyRoomCheckInCodeResult =
  | { ok: true; roomNumber: string }
  | { ok: false; reason?: "invalid" | "rate_limited" };

export async function requestRoomCheckInCode(roomNumber: string) {
  const n = roomNumber.trim();
  if (!n || n.length > 20) {
    throw new Error("Invalid room number");
  }
  const ip = await getClientIp();
  assertRateLimit(`checkin-request:${ip}:${n}`, 6, 60_000);
  return requestCheckInCodeDb(n);
}

export async function listRoomCheckInCodes() {
  const cookieStore = await cookies();
  const value = cookieStore.get(MANAGEMENT_AUTH_COOKIE)?.value;
  await assertManagementSessionCookie(value);
  await requireManagementPage("rooms");
  return listActiveCheckInCodesDb();
}

export async function verifyRoomCheckInCode(
  roomNumber: string,
  code: string,
): Promise<VerifyRoomCheckInCodeResult> {
  const n = roomNumber.trim();
  const c = code.replace(/\D/g, "").slice(0, 6);
  if (!n || c.length !== 6) return { ok: false, reason: "invalid" };

  const ip = await getClientIp();
  const limited = checkRateLimit(`checkin-verify:${ip}:${n}`, 8, 60_000);
  if (!limited.ok) {
    return { ok: false, reason: "rate_limited" };
  }

  const verified = await verifyCheckInCodeDb(n, c);
  if (!verified) return { ok: false, reason: "invalid" };
  await setGuestDeviceCookie(n);
  return { ok: true, roomNumber: n };
}
