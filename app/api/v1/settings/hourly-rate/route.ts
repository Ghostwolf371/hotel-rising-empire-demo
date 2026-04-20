import { assertApiAuthorized } from "@/lib/server/api-auth";
import { jsonError, jsonOk, readJson } from "@/lib/server/http";
import { getPrisma } from "@/lib/server/prisma";
import { patchHourlyRateZ } from "@/lib/server/schemas";

export async function GET(request: Request) {
  const denied = assertApiAuthorized(request);
  if (denied) return denied;

  const prisma = getPrisma();
  const site = await prisma.siteConfig.findUnique({ where: { id: 1 } });
  return jsonOk({ hourlyRate: site?.hourlyRate ?? 75 });
}

export async function PATCH(request: Request) {
  const denied = assertApiAuthorized(request);
  if (denied) return denied;

  const body = await readJson<unknown>(request);
  const parsed = patchHourlyRateZ.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Invalid body", { details: parsed.error.flatten() });
  }

  const prisma = getPrisma();
  const site = await prisma.siteConfig.upsert({
    where: { id: 1 },
    create: { id: 1, hourlyRate: parsed.data.hourlyRate },
    update: { hourlyRate: parsed.data.hourlyRate },
  });
  return jsonOk({ hourlyRate: site.hourlyRate });
}
