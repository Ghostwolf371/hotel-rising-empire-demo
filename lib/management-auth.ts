/** Management session helpers — Edge-safe (no Prisma). */

export const MANAGEMENT_AUTH_COOKIE = "hre-mgmt-auth";

export type ManagementCredentials = {
  email: string;
  password: string;
};

export function getManagementCredentials(): ManagementCredentials | null {
  const email = process.env.MANAGEMENT_EMAIL?.trim();
  const password = process.env.MANAGEMENT_PASSWORD;
  if (!email || !password) return null;
  return { email, password };
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function getSessionSecret(): string {
  return (
    process.env.MANAGEMENT_SESSION_SECRET?.trim() ||
    process.env.MANAGEMENT_PASSWORD ||
    "hre-mgmt-demo-secret"
  );
}

async function hmacHex(message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Legacy env-only session token (used when no DB users exist). */
export async function getLegacyManagementSessionToken(): Promise<string | null> {
  const creds = getManagementCredentials();
  if (!creds) return null;
  return hmacHex(`mgmt:${creds.email}`);
}

export async function createManagementSessionToken(userId: string): Promise<string> {
  const sig = await hmacHex(`mgmt:user:${userId}`);
  return `${userId}.${sig}`;
}

export function validateEnvManagementLogin(email: string, password: string): boolean {
  const creds = getManagementCredentials();
  if (!creds) return false;
  return (
    constantTimeEqual(email.trim().toLowerCase(), creds.email.toLowerCase()) &&
    constantTimeEqual(password, creds.password)
  );
}

/** Verifies cookie signature only (middleware-safe). */
export async function isManagementSessionCookie(
  value: string | undefined,
): Promise<boolean> {
  if (!value) return false;

  const dot = value.indexOf(".");
  if (dot > 0) {
    const userId = value.slice(0, dot);
    const sig = value.slice(dot + 1);
    if (!userId || !sig) return false;
    const expected = await hmacHex(`mgmt:user:${userId}`);
    return constantTimeEqual(sig, expected);
  }

  const legacy = await getLegacyManagementSessionToken();
  if (!legacy) return false;
  return constantTimeEqual(value, legacy);
}

export function getManagementUserIdFromSessionCookie(
  value: string | undefined,
): string | null {
  if (!value) return null;
  const dot = value.indexOf(".");
  if (dot <= 0) return null;
  return value.slice(0, dot);
}
