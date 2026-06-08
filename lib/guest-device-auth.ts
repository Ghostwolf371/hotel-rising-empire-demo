/** Guest kiosk device binding — Edge-safe (no Prisma). */

import { getGuestDeviceSecret as resolveGuestDeviceSecret } from "@/lib/server/session-secrets";

export const GUEST_DEVICE_COOKIE = "hre-guest-device";

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function getGuestDeviceSecret(): string {
  return resolveGuestDeviceSecret();
}

async function hmacHex(message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getGuestDeviceSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createGuestDeviceToken(
  roomNumber: string,
): Promise<string> {
  const n = roomNumber.trim();
  if (!n || n.length > 20) {
    throw new Error("Invalid room number");
  }
  const sig = await hmacHex(`guest-device:${n}`);
  return `${encodeURIComponent(n)}:${sig}`;
}

export async function verifyGuestDeviceToken(
  token: string | undefined,
): Promise<string | null> {
  if (!token) return null;
  const sep = token.lastIndexOf(":");
  if (sep <= 0) return null;
  const roomPart = token.slice(0, sep);
  const sig = token.slice(sep + 1);
  let roomNumber: string;
  try {
    roomNumber = decodeURIComponent(roomPart).trim();
  } catch {
    return null;
  }
  if (!roomNumber || roomNumber.length > 20) return null;
  const expected = await hmacHex(`guest-device:${roomNumber}`);
  if (!constantTimeEqual(sig, expected)) return null;
  return roomNumber;
}
