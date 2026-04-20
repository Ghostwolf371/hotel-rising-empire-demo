import { assertApiAuthorized } from "@/lib/server/api-auth";
import { jsonError, jsonOk, readJson } from "@/lib/server/http";
import { getPrisma } from "@/lib/server/prisma";
import { panicCreateZ } from "@/lib/server/schemas";
import type { PanicAlert } from "@/lib/types";

export async function GET(request: Request) {
  const denied = assertApiAuthorized(request);
  if (denied) return denied;

  const prisma = getPrisma();
  const rows = await prisma.panicAlert.findMany({ orderBy: { at: "desc" } });
  const alerts: PanicAlert[] = rows.map((r) => ({
    id: r.id,
    roomNumber: r.roomNumber,
    at: r.at,
  }));
  return jsonOk({ panicAlerts: alerts });
}

export async function POST(request: Request) {
  const denied = assertApiAuthorized(request);
  if (denied) return denied;

  const body = await readJson<unknown>(request);
  const parsed = panicCreateZ.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Invalid body", { details: parsed.error.flatten() });
  }

  const id = parsed.data.id ?? `panic-${crypto.randomUUID()}`;
  const at = parsed.data.at ?? Date.now();
  const prisma = getPrisma();
  try {
    const row = await prisma.panicAlert.create({
      data: {
        id,
        roomNumber: parsed.data.roomNumber,
        at,
      },
    });
    const alert: PanicAlert = {
      id: row.id,
      roomNumber: row.roomNumber,
      at: row.at,
    };
    return jsonOk({ panicAlert: alert }, { status: 201 });
  } catch {
    return jsonError(409, "Panic alert id already exists.");
  }
}

export async function DELETE(request: Request) {
  const denied = assertApiAuthorized(request);
  if (denied) return denied;

  const prisma = getPrisma();
  await prisma.panicAlert.deleteMany();
  return new Response(null, { status: 204 });
}
