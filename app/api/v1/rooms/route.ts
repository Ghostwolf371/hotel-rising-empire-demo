import { assertApiAuthorized } from "@/lib/server/api-auth";
import { jsonError, jsonOk, readJson } from "@/lib/server/http";
import { toDomainRoom } from "@/lib/server/mappers";
import { getPrisma } from "@/lib/server/prisma";
import { roomWriteZ } from "@/lib/server/schemas";

export async function GET(request: Request) {
  const denied = assertApiAuthorized(request);
  if (denied) return denied;

  const prisma = getPrisma();
  const rooms = await prisma.room.findMany({ orderBy: { number: "asc" } });
  return jsonOk({ rooms: rooms.map(toDomainRoom) });
}

export async function POST(request: Request) {
  const denied = assertApiAuthorized(request);
  if (denied) return denied;

  const body = await readJson<unknown>(request);
  const parsed = roomWriteZ.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Invalid body", { details: parsed.error.flatten() });
  }

  const prisma = getPrisma();
  const d = parsed.data;
  try {
    const room = await prisma.room.create({
      data: {
        id: d.id,
        number: d.number,
        status: d.status,
        sessionStartedAt: d.sessionStartedAt ?? null,
        sessionEndsAt: d.sessionEndsAt ?? null,
        durationHours: d.durationHours ?? null,
      },
    });
    return jsonOk({ room: toDomainRoom(room) }, { status: 201 });
  } catch {
    return jsonError(409, "Room id or number already exists.");
  }
}
