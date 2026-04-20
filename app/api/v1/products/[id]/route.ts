import { assertApiAuthorized } from "@/lib/server/api-auth";
import { jsonError, jsonOk, readJson } from "@/lib/server/http";
import { toDomainProduct } from "@/lib/server/mappers";
import { getPrisma } from "@/lib/server/prisma";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const patchProductZ = z
  .object({
    name: z.string().min(1).optional(),
    priceSrd: z.number().int().nonnegative().optional(),
    category: z.string().min(1).optional(),
    image: z.string().optional(),
    available: z.boolean().optional(),
  })
  .refine(
    (o) =>
      o.name !== undefined ||
      o.priceSrd !== undefined ||
      o.category !== undefined ||
      o.image !== undefined ||
      o.available !== undefined,
    { message: "empty patch" },
  );

export async function GET(request: Request, ctx: Ctx) {
  const denied = assertApiAuthorized(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  const prisma = getPrisma();
  const row = await prisma.product.findUnique({ where: { id } });
  if (!row) return jsonError(404, "Product not found.");
  return jsonOk({ product: toDomainProduct(row) });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const denied = assertApiAuthorized(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  const body = await readJson<unknown>(request);
  const parsed = patchProductZ.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Invalid body", { details: parsed.error.flatten() });
  }

  const prisma = getPrisma();
  const p = parsed.data;
  if (p.category !== undefined) {
    const cat = await prisma.category.findUnique({ where: { id: p.category } });
    if (!cat) return jsonError(400, "Unknown category id.");
  }

  try {
    const row = await prisma.product.update({
      where: { id },
      data: {
        ...(p.name !== undefined && { name: p.name }),
        ...(p.priceSrd !== undefined && { priceSrd: p.priceSrd }),
        ...(p.category !== undefined && { categoryId: p.category }),
        ...(p.image !== undefined && { image: p.image }),
        ...(p.available !== undefined && { available: p.available }),
      },
    });
    return jsonOk({ product: toDomainProduct(row) });
  } catch {
    return jsonError(404, "Product not found.");
  }
}

export async function DELETE(request: Request, ctx: Ctx) {
  const denied = assertApiAuthorized(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  const prisma = getPrisma();
  try {
    await prisma.product.delete({ where: { id } });
  } catch {
    return jsonError(404, "Product not found.");
  }
  return new Response(null, { status: 204 });
}
