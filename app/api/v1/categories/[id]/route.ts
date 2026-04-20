import { assertApiAuthorized } from "@/lib/server/api-auth";
import { jsonError, jsonOk, readJson } from "@/lib/server/http";
import { toDomainCategory } from "@/lib/server/mappers";
import { getPrisma } from "@/lib/server/prisma";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const patchCategoryZ = z
  .object({
    name: z.string().min(1).optional(),
    color: z.string().min(1).optional(),
  })
  .refine((o) => o.name !== undefined || o.color !== undefined, {
    message: "Provide at least one field",
  });

export async function PATCH(request: Request, ctx: Ctx) {
  const denied = assertApiAuthorized(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  const body = await readJson<unknown>(request);
  const parsed = patchCategoryZ.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Invalid body", { details: parsed.error.flatten() });
  }

  const prisma = getPrisma();
  try {
    const row = await prisma.category.update({
      where: { id },
      data: parsed.data,
    });
    return jsonOk({ category: toDomainCategory(row) });
  } catch {
    return jsonError(404, "Category not found.");
  }
}

export async function DELETE(request: Request, ctx: Ctx) {
  const denied = assertApiAuthorized(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  const prisma = getPrisma();
  const inUse = await prisma.product.count({ where: { categoryId: id } });
  if (inUse > 0) {
    return jsonError(409, "Category is still used by products.");
  }
  try {
    await prisma.category.delete({ where: { id } });
  } catch {
    return jsonError(404, "Category not found.");
  }
  return new Response(null, { status: 204 });
}
