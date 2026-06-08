"use server";

import { cookies } from "next/headers";
import { MANAGEMENT_AUTH_COOKIE, getLegacyManagementSessionToken } from "@/lib/management-auth";
import {
  defaultManagementLandingPathForPages,
  normalizeManagementRole,
  type ManagementPageKey,
} from "@/lib/management-permissions";
import {
  resolveSessionAllowedPages,
  resolveSessionRole,
  validateManagementLogin,
} from "@/lib/server/management-auth-server";
import { resolveUserAllowedPages } from "@/lib/server/management-users";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientIp } from "@/lib/server/action-auth";

const SESSION_MAX_AGE = 60 * 60 * 12;

export type ManagementSignInResult =
  | { ok: true; landingPath: string }
  | { ok: false; error: "invalid" | "not_configured" };

export type ManagementSessionInfo = {
  email: string;
  displayName: string | null;
  role: import("@/lib/management-permissions").ManagementRole;
  allowedPages: ManagementPageKey[];
};

export async function signInManagement(
  email: string,
  password: string,
): Promise<ManagementSignInResult> {
  const ip = await getClientIp();
  const limited = checkRateLimit(`mgmt-login:${ip}:${email.trim().toLowerCase()}`, 8, 15 * 60_000);
  if (!limited.ok) {
    return { ok: false, error: "invalid" };
  }

  const legacy = await getLegacyManagementSessionToken();
  const hasBootstrap = legacy != null;

  const result = await validateManagementLogin(email, password);
  if (!result.ok) {
    if (!hasBootstrap) {
      return { ok: false, error: "not_configured" };
    }
    return { ok: false, error: "invalid" };
  }

  const cookieStore = await cookies();
  cookieStore.set(MANAGEMENT_AUTH_COOKIE, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return {
    ok: true,
    landingPath: defaultManagementLandingPathForPages(result.allowedPages),
  };
}

export async function signOutManagement(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(MANAGEMENT_AUTH_COOKIE);
}

export async function fetchManagementSession(): Promise<ManagementSessionInfo | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(MANAGEMENT_AUTH_COOKIE)?.value;
  const role = await resolveSessionRole(value);
  const allowedPages = await resolveSessionAllowedPages(value);
  if (!role || !allowedPages) return null;

  const { getManagementUserIdFromSessionCookie } = await import("@/lib/management-auth");
  const userId = getManagementUserIdFromSessionCookie(value);
  if (!userId) {
    const email = process.env.MANAGEMENT_EMAIL?.trim() ?? "admin";
    return { email, displayName: "Admin", role, allowedPages };
  }

  const { findActiveManagementUserById } = await import("@/lib/server/management-users");
  const user = await findActiveManagementUserById(userId);
  if (!user) return null;
  return {
    email: user.email,
    displayName: user.displayName,
    role: normalizeManagementRole(user.role),
    allowedPages: resolveUserAllowedPages(user),
  };
}
