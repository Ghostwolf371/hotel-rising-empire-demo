import { assertApiAuthorized } from "@/lib/server/api-auth";
import { jsonOk } from "@/lib/server/http";
import {
  toDomainCategory,
  toDomainProduct,
} from "@/lib/server/mappers";
import { getPrisma } from "@/lib/server/prisma";

export async function GET(request: Request) {
  const denied = assertApiAuthorized(request);
  if (denied) return denied;

  const prisma = getPrisma();
  const [categories, products, site] = await Promise.all([
    prisma.category.findMany({ orderBy: { id: "asc" } }),
    prisma.product.findMany({ orderBy: { id: "asc" } }),
    prisma.siteConfig.findUnique({ where: { id: 1 } }),
  ]);

  return jsonOk({
    categories: categories.map(toDomainCategory),
    products: products.map(toDomainProduct),
    hourlyRate: site?.hourlyRate ?? 75,
  });
}
