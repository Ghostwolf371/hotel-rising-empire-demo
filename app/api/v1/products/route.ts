import { assertApiAuthorized } from "@/lib/server/api-auth";
import { jsonError, jsonOk, readJson } from "@/lib/server/http";
import { toDomainProduct } from "@/lib/server/mappers";
import { getPrisma } from "@/lib/server/prisma";
import { productWriteZ } from "@/lib/server/schemas";

export async function POST(request: Request) {
  const denied = assertApiAuthorized(request);
  if (denied) return denied;

  const body = await readJson<unknown>(request);
  const parsed = productWriteZ.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Invalid body", { details: parsed.error.flatten() });
  }

  const prisma = getPrisma();
  const d = parsed.data;
  const cat = await prisma.category.findUnique({ where: { id: d.category } });
  if (!cat) {
    return jsonError(400, "Unknown category id.");
  }

  try {
    const row = await prisma.product.create({
      data: {
        id: d.id,
        name: d.name,
        priceSrd: d.priceSrd,
        categoryId: d.category,
        image: d.image,
        available: d.available,
      },
    });
    return jsonOk({ product: toDomainProduct(row) }, { status: 201 });
  } catch {
    return jsonError(409, "Product id already exists.");
  }
}
