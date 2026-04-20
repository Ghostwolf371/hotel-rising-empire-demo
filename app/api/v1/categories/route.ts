import { assertApiAuthorized } from "@/lib/server/api-auth";
import { jsonError, jsonOk, readJson } from "@/lib/server/http";
import { toDomainCategory } from "@/lib/server/mappers";
import { getPrisma } from "@/lib/server/prisma";
import { categoryWriteZ } from "@/lib/server/schemas";

export async function GET(request: Request) {
  const denied = assertApiAuthorized(request);
  if (denied) return denied;

  const prisma = getPrisma();
  const categories = await prisma.category.findMany({ orderBy: { id: "asc" } });
  return jsonOk({ categories: categories.map(toDomainCategory) });
}

export async function POST(request: Request) {
  const denied = assertApiAuthorized(request);
  if (denied) return denied;

  const body = await readJson<unknown>(request);
  const parsed = categoryWriteZ.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Invalid body", { details: parsed.error.flatten() });
  }

  const prisma = getPrisma();
  try {
    const row = await prisma.category.create({ data: parsed.data });
    return jsonOk({ category: toDomainCategory(row) }, { status: 201 });
  } catch {
    return jsonError(409, "Category id already exists.");
  }
}
