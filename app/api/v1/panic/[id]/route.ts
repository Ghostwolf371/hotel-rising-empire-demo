import { assertApiAuthorized } from "@/lib/server/api-auth";
import { jsonError } from "@/lib/server/http";
import { getPrisma } from "@/lib/server/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, ctx: Ctx) {
  const denied = assertApiAuthorized(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  const prisma = getPrisma();
  try {
    await prisma.panicAlert.delete({ where: { id } });
  } catch {
    return jsonError(404, "Panic alert not found.");
  }
  return new Response(null, { status: 204 });
}
