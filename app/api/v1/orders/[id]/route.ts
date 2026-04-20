import { assertApiAuthorized } from "@/lib/server/api-auth";
import { jsonError, jsonOk, readJson } from "@/lib/server/http";
import { toDomainOrder } from "@/lib/server/mappers";
import { getPrisma } from "@/lib/server/prisma";
import { patchOrderZ } from "@/lib/server/schemas";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const denied = assertApiAuthorized(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  const prisma = getPrisma();
  const order = await prisma.order.findUnique({
    where: { id },
    include: { lines: true },
  });
  if (!order) return jsonError(404, "Order not found.");
  return jsonOk({ order: toDomainOrder(order) });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const denied = assertApiAuthorized(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  const body = await readJson<unknown>(request);
  const parsed = patchOrderZ.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Invalid body", { details: parsed.error.flatten() });
  }

  const prisma = getPrisma();
  try {
    const order = await prisma.order.update({
      where: { id },
      data: { status: parsed.data.status },
      include: { lines: true },
    });
    return jsonOk({ order: toDomainOrder(order) });
  } catch {
    return jsonError(404, "Order not found.");
  }
}
