import { getRegisteredGuestRoom } from "@/lib/guest-device";

/** Build a guest route path, always tagging the registered kiosk room. */
export function guestPath(path: string, room?: string | null): string {
  const r = (room ?? getRegisteredGuestRoom())?.trim();
  if (!r) return path;
  const base = path.split("?")[0]!;
  return `${base}?room=${encodeURIComponent(r)}`;
}
