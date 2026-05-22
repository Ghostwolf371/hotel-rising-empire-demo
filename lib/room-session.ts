import type { Room } from "./types";

export function resolveGuestDurationHours(durationHours: number): number {
  const h = Math.round(durationHours);
  if (h === 2) return 2;
  return Math.max(4, h);
}

export function normalizeExpiredOccupiedRooms(
  rooms: Room[],
  now = Date.now(),
): Room[] {
  return rooms.map((r) => {
    if (r.status !== "occupied" || !r.sessionEndsAt || r.sessionEndsAt > now) {
      return r;
    }
    return {
      ...r,
      status: "just_checked_out" as const,
      sessionStartedAt: undefined,
      sessionEndsAt: undefined,
      durationHours: undefined,
    };
  });
}
