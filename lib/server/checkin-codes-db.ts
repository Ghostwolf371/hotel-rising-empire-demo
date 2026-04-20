import { randomInt } from "node:crypto";
import { getPrisma } from "@/lib/server/prisma";

const TTL_MS = 15 * 60 * 1000;

function sixDigits(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export type CheckInCodeRow = {
  id: string;
  roomNumber: string;
  code: string;
  createdAt: number;
  expiresAt: number;
};

export async function requestCheckInCodeDb(roomNumber: string): Promise<CheckInCodeRow> {
  const prisma = getPrisma();
  const now = Date.now();
  const expiresAt = now + TTL_MS;

  await prisma.roomCheckInCode.deleteMany({
    where: {
      roomNumber,
      consumedAt: null,
      expiresAt: { gt: now },
    },
  });

  const code = sixDigits();
  const row = await prisma.roomCheckInCode.create({
    data: {
      roomNumber,
      code,
      createdAt: now,
      expiresAt,
    },
  });
  return {
    id: row.id,
    roomNumber: row.roomNumber,
    code: row.code,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
  };
}

export async function listActiveCheckInCodesDb(): Promise<CheckInCodeRow[]> {
  const prisma = getPrisma();
  const now = Date.now();
  const rows = await prisma.roomCheckInCode.findMany({
    where: {
      consumedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    roomNumber: r.roomNumber,
    code: r.code,
    createdAt: r.createdAt,
    expiresAt: r.expiresAt,
  }));
}

export async function verifyCheckInCodeDb(
  roomNumber: string,
  code: string,
): Promise<boolean> {
  const prisma = getPrisma();
  const now = Date.now();
  const row = await prisma.roomCheckInCode.findFirst({
    where: {
      roomNumber,
      code,
      consumedAt: null,
      expiresAt: { gt: now },
    },
  });
  if (!row) return false;
  await prisma.roomCheckInCode.update({
    where: { id: row.id },
    data: { consumedAt: now },
  });
  return true;
}
