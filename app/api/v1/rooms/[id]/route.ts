import { assertApiAuthorized } from "@/lib/server/api-auth";
import { jsonError, jsonOk, readJson } from "@/lib/server/http";
import { toDomainRoom } from "@/lib/server/mappers";
import { getPrisma } from "@/lib/server/prisma";
import { patchRoomZ } from "@/lib/server/schemas";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const denied = assertApiAuthorized(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  const prisma = getPrisma();
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) return jsonError(404, "Room not found.");
  return jsonOk({ room: toDomainRoom(room) });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const denied = assertApiAuthorized(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  const body = await readJson<unknown>(request);
  const parsed = patchRoomZ.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Invalid body", { details: parsed.error.flatten() });
  }

  const prisma = getPrisma();
  const existing = await prisma.room.findUnique({ where: { id } });
  if (!existing) return jsonError(404, "Room not found.");

  const p = parsed.data;
  const room = await prisma.room.update({
    where: { id },
    data: {
      ...(p.status !== undefined && { status: p.status }),
      ...(p.sessionStartedAt !== undefined && {
        sessionStartedAt: p.sessionStartedAt,
      }),
      ...(p.sessionEndsAt !== undefined && { sessionEndsAt: p.sessionEndsAt }),
      ...(p.durationHours !== undefined && { durationHours: p.durationHours }),
    },
  });
  return jsonOk({ room: toDomainRoom(room) });
}

export async function DELETE(request: Request, ctx: Ctx) {
  const denied = assertApiAuthorized(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  const prisma = getPrisma();
  try {
    await prisma.room.delete({ where: { id } });
  } catch {
    return jsonError(404, "Room not found.");
  }
  return new Response(null, { status: 204 });
}
