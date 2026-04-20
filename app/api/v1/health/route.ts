import { NextResponse } from "next/server";

/** Liveness probe; does not touch the database or require auth. */
export async function GET() {
  return NextResponse.json({ ok: true, service: "hotel-rising-empire" });
}
