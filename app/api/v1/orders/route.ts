import { assertApiAuthorized } from "@/lib/server/api-auth";
import { jsonError, jsonOk, readJson } from "@/lib/server/http";
import { toDomainOrder } from "@/lib/server/mappers";
import { getPrisma } from "@/lib/server/prisma";
import { createOrderZ } from "@/lib/server/schemas";

export async function GET(request: Request) {
  const denied = assertApiAuthorized(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const limitRaw = url.searchParams.get("limit");
  const limit = Math.min(500, Math.max(1, Number(limitRaw ?? "100") || 100));

  const prisma = getPrisma();
  const orders = await prisma.order.findMany({
    include: { lines: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return jsonOk({ orders: orders.map(toDomainOrder) });
}

export async function POST(request: Request) {
  const denied = assertApiAuthorized(request);
  if (denied) return denied;

  const body = await readJson<unknown>(request);
  const parsed = createOrderZ.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Invalid body", { details: parsed.error.flatten() });
  }

  const id = `order-${crypto.randomUUID()}`;
  const now = Date.now();
  const prisma = getPrisma();
  const d = parsed.data;

  const order = await prisma.order.create({
    data: {
      id,
      roomNumber: d.roomNumber,
      createdAt: now,
      status: d.status,
      notes: d.notes ?? null,
      lines: {
        create: d.items.map((it) => ({
          productId: it.productId,
          name: it.name,
          qty: it.qty,
          unitPrice: it.unitPrice,
        })),
      },
    },
    include: { lines: true },
  });

  return jsonOk({ order: toDomainOrder(order) }, { status: 201 });
}
