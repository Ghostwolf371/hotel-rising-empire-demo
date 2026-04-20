"use server";

import {
  listActiveCheckInCodesDb,
  requestCheckInCodeDb,
  verifyCheckInCodeDb,
} from "@/lib/server/checkin-codes-db";

export async function requestRoomCheckInCode(roomNumber: string) {
  const n = roomNumber.trim();
  if (!n || n.length > 20) {
    throw new Error("Invalid room number");
  }
  return requestCheckInCodeDb(n);
}

export async function listRoomCheckInCodes() {
  return listActiveCheckInCodesDb();
}

export async function verifyRoomCheckInCode(roomNumber: string, code: string) {
  const n = roomNumber.trim();
  const c = code.replace(/\D/g, "").slice(0, 6);
  if (!n || c.length !== 6) return false;
  return verifyCheckInCodeDb(n, c);
}
