import { getManagementSessionSecret } from "@/lib/server/session-secrets";
import {
  type ManagementPageKey,
  type ManagementRole,
  ALL_MANAGEMENT_PAGE_KEYS,
  isManagementPageKey,
  isManagementRole,
  managementPagesForRole,
} from "@/lib/management-permissions";

export const MANAGEMENT_AUTH_COOKIE = "hre-mgmt-auth";

/** Legacy env bootstrap sessions are treated as full admin access. */
export const LEGACY_MANAGEMENT_ROLE: ManagementRole = "admin";

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

/** Normalized env super-admin email (MANAGEMENT_EMAIL), if configured. */
export function getEnvManagementEmail(): string | null {
  return process.env.MANAGEMENT_EMAIL?.trim().toLowerCase() ?? null;
}

export function isEnvSuperAdminEmail(email: string): boolean {
  const envEmail = getEnvManagementEmail();
  if (!envEmail) return false;
  return email.trim().toLowerCase() === envEmail;
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
  return getManagementSessionSecret();
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

function parsePagesTokenPart(part: string): ManagementPageKey[] | null {
  if (isManagementRole(part)) return null;
  const keys = part.split(",").filter(Boolean);
  if (keys.length === 0) return null;
  if (!keys.every((k) => isManagementPageKey(k))) return null;
  return keys as ManagementPageKey[];
}

export function serializePagesForToken(pages: ManagementPageKey[]): string {
  return [...new Set(pages)].sort().join(",");
}

/** Legacy env-only session token (used when no DB users exist). */
export async function getLegacyManagementSessionToken(): Promise<string | null> {
  const creds = getManagementCredentials();
  if (!creds) return null;
  return hmacHex(`mgmt:${creds.email}`);
}

export async function createManagementSessionToken(
  userId: string,
  _allowedPages?: ManagementPageKey[],
): Promise<string> {
  const sig = await hmacHex(`mgmt:user:v4:${userId}`);
  return `${userId}.${sig}`;
}

export type ParsedManagementSession = {
  userId: string | null;
  role: ManagementRole | null;
  allowedPages: ManagementPageKey[] | null;
  legacy: boolean;
};

/** Parse session cookie — v3 embeds pages, v2 embeds role, v1 legacy userId only. */
export function parseManagementSessionCookie(value: string | undefined): ParsedManagementSession {
  if (!value) return { userId: null, role: null, allowedPages: null, legacy: false };

  const parts = value.split(".");
  if (parts.length === 3) {
    const [userId, middle] = [parts[0], parts[1]];
    if (!userId) return { userId: null, role: null, allowedPages: null, legacy: false };

    if (isManagementRole(middle)) {
      return { userId, role: middle, allowedPages: null, legacy: false };
    }

    const pages = parsePagesTokenPart(middle);
    if (pages) {
      return { userId, role: null, allowedPages: pages, legacy: false };
    }
  }

  const dot = value.indexOf(".");
  if (dot > 0) {
    return { userId: value.slice(0, dot), role: null, allowedPages: null, legacy: false };
  }

  return { userId: null, role: null, allowedPages: null, legacy: true };
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

  const parts = value.split(".");
  if (parts.length === 3) {
    const [userId, middle, sig] = parts;
    if (!userId || !sig || !middle) return false;

    if (isManagementRole(middle)) {
      const expected = await hmacHex(`mgmt:user:${userId}:${middle}`);
      return constantTimeEqual(sig, expected);
    }

    const pages = parsePagesTokenPart(middle);
    if (pages) {
      const expected = await hmacHex(`mgmt:user:${userId}:${middle}`);
      return constantTimeEqual(sig, expected);
    }
    return false;
  }

  if (parts.length === 2) {
    const [userId, sig] = parts;
    if (!userId || !sig) return false;
    const v4Expected = await hmacHex(`mgmt:user:v4:${userId}`);
    if (constantTimeEqual(sig, v4Expected)) return true;
    const v1Expected = await hmacHex(`mgmt:user:${userId}`);
    return constantTimeEqual(sig, v1Expected);
  }

  const legacy = await getLegacyManagementSessionToken();
  if (!legacy) return false;
  return constantTimeEqual(value, legacy);
}

export function getManagementUserIdFromSessionCookie(
  value: string | undefined,
): string | null {
  return parseManagementSessionCookie(value).userId;
}

/** Role from cookie when present (v2); legacy env sessions return admin. */
export function getManagementRoleFromSessionCookie(
  value: string | undefined,
): ManagementRole | null {
  const parsed = parseManagementSessionCookie(value);
  if (parsed.legacy) return LEGACY_MANAGEMENT_ROLE;
  if (parsed.role) return parsed.role;
  return null;
}

/** Allowed pages from cookie (v3) or derived from role (v2); legacy = all pages. */
export function getManagementPagesFromSessionCookie(
  value: string | undefined,
): ManagementPageKey[] | null {
  const parsed = parseManagementSessionCookie(value);
  if (parsed.legacy) return [...ALL_MANAGEMENT_PAGE_KEYS];
  if (parsed.allowedPages) return parsed.allowedPages;
  if (parsed.role) return managementPagesForRole(parsed.role);
  return null;
}
