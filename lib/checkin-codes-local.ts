/** Shared guest ↔ concierge when `HRE_USE_DATABASE` is off (same machine; `storage` sync across tabs). */

const LS_KEY = "hre-checkin-codes-v1";

export type StoredCheckInCode = {
  id: string;
  roomNumber: string;
  code: string;
  createdAt: number;
  expiresAt: number;
  consumedAt: number | null;
};

function sixDigits(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const n = buf[0]! % 1_000_000;
  return String(n).padStart(6, "0");
}

function readAll(): StoredCheckInCode[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as StoredCheckInCode[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeAll(rows: StoredCheckInCode[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(rows));
}

/** Issue a new code for the room; invalidates any previous unconsumed codes for that room. */
export function requestCheckInCodeLocal(roomNumber: string): {
  code: string;
  expiresAt: number;
} {
  const now = Date.now();
  const ttl = 15 * 60 * 1000;
  const code = sixDigits();

  const rows = readAll().filter((r) => {
    if (r.consumedAt != null) return true;
    return r.expiresAt > now;
  });
  const next = rows.filter(
    (r) =>
      !(r.roomNumber === roomNumber && r.consumedAt == null && r.expiresAt > now),
  );
  next.push({
    id: crypto.randomUUID(),
    roomNumber,
    code,
    createdAt: now,
    expiresAt: now + ttl,
    consumedAt: null,
  });
  writeAll(next);
  return { code, expiresAt: now + ttl };
}

export function listActiveCheckInCodesLocal(): StoredCheckInCode[] {
  const now = Date.now();
  return readAll().filter(
    (r) => r.consumedAt == null && r.expiresAt > now,
  );
}

export function verifyCheckInCodeLocal(
  roomNumber: string,
  code: string,
): boolean {
  const now = Date.now();
  const rows = readAll();
  const idx = rows.findIndex(
    (r) =>
      r.roomNumber === roomNumber &&
      r.code === code &&
      r.consumedAt == null &&
      r.expiresAt > now,
  );
  if (idx === -1) return false;
  rows[idx] = { ...rows[idx]!, consumedAt: now };
  writeAll(rows);
  return true;
}
