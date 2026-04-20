import { assertApiAuthorized } from "@/lib/server/api-auth";
import { jsonError, jsonOk, readJson } from "@/lib/server/http";
import { getPrisma } from "@/lib/server/prisma";
import { guestRatingZ } from "@/lib/server/schemas";
import type { GuestRating } from "@/lib/types";

export async function GET(request: Request) {
  const denied = assertApiAuthorized(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const limitRaw = url.searchParams.get("limit");
  const limit = Math.min(500, Math.max(1, Number(limitRaw ?? "200") || 200));

  const prisma = getPrisma();
  const rows = await prisma.guestRating.findMany({
    orderBy: { submittedAt: "desc" },
    take: limit,
  });
  const guestRatings: GuestRating[] = rows.map((r) => ({
    id: r.id,
    roomNumber: r.roomNumber,
    submittedAt: r.submittedAt,
    cleanliness: r.cleanliness,
    comfort: r.comfort,
    service: r.service,
  }));
  return jsonOk({ guestRatings });
}

export async function POST(request: Request) {
  const denied = assertApiAuthorized(request);
  if (denied) return denied;

  const body = await readJson<unknown>(request);
  const parsed = guestRatingZ.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Invalid body", { details: parsed.error.flatten() });
  }

  const id =
    parsed.data.id ??
    `rate-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const prisma = getPrisma();
  const now = Date.now();
  try {
    const row = await prisma.guestRating.create({
      data: {
        id,
        roomNumber: parsed.data.roomNumber,
        submittedAt: now,
        cleanliness: parsed.data.cleanliness,
        comfort: parsed.data.comfort,
        service: parsed.data.service,
      },
    });
    const rating: GuestRating = {
      id: row.id,
      roomNumber: row.roomNumber,
      submittedAt: row.submittedAt,
      cleanliness: row.cleanliness,
      comfort: row.comfort,
      service: row.service,
    };
    return jsonOk({ guestRating: rating }, { status: 201 });
  } catch {
    return jsonError(409, "Rating id already exists.");
  }
}
