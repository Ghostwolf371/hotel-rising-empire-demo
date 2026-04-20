import { NextResponse } from "next/server";

export function jsonOk<T>(body: T, init?: ResponseInit) {
  return NextResponse.json(body, { status: 200, ...init });
}

export function jsonError(
  status: number,
  message: string,
  extras?: Record<string, unknown>,
) {
  return NextResponse.json({ error: message, ...extras }, { status });
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
