import { jsonError } from "@/lib/server/http";

/**
 * Validates `Authorization: Bearer <HRE_API_SECRET>` when `HRE_API_SECRET` is set.
 * In production, a missing secret returns 503 so misconfiguration is obvious.
 * In development, a missing secret skips auth for local iteration.
 */
export function assertApiAuthorized(request: Request): Response | null {
  const secret = process.env.HRE_API_SECRET?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return jsonError(
        503,
        "HRE_API_SECRET is not set; refusing API access in production.",
      );
    }
    return null;
  }
  const header = request.headers.get("authorization");
  const token = header?.match(/^Bearer\s+(\S+)\s*$/i)?.[1];
  if (!token || token !== secret) {
    return jsonError(401, "Invalid or missing Bearer token.");
  }
  return null;
}
