/** Management staff login — credentials from env; session cookie verified in middleware. */

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

export function validateManagementLogin(email: string, password: string): boolean {
  const creds = getManagementCredentials();
  if (!creds) return false;
  return (
    constantTimeEqual(email.trim(), creds.email) &&
    constantTimeEqual(password, creds.password)
  );
}

/** HMAC session token (Edge + Node via Web Crypto). */
export async function getManagementSessionToken(): Promise<string | null> {
  const creds = getManagementCredentials();
  if (!creds) return null;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(creds.password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`mgmt:${creds.email}`));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function isManagementSessionCookie(
  value: string | undefined,
): Promise<boolean> {
  if (!value) return false;
  const expected = await getManagementSessionToken();
  if (!expected) return false;
  return constantTimeEqual(value, expected);
}
