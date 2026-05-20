/** Kiosk tablet room binding — separate from active guest session (`hre-demo-v2`). */

export const GUEST_DEVICE_STORAGE_KEY = "hre-guest-device-v1";

export type RegisteredGuestDevice = {
  roomNumber: string;
  verifiedAt: number;
};

export function getRegisteredGuestRoom(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(GUEST_DEVICE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RegisteredGuestDevice;
    const n = parsed?.roomNumber?.trim();
    return n || null;
  } catch {
    return null;
  }
}

export function setRegisteredGuestRoom(roomNumber: string): void {
  const n = roomNumber.trim();
  if (!n) return;
  const payload: RegisteredGuestDevice = {
    roomNumber: n,
    verifiedAt: Date.now(),
  };
  localStorage.setItem(GUEST_DEVICE_STORAGE_KEY, JSON.stringify(payload));
}

export function clearRegisteredGuestRoom(): void {
  localStorage.removeItem(GUEST_DEVICE_STORAGE_KEY);
}
