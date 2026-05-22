"use server";

import { cookies } from "next/headers";
import { MANAGEMENT_AUTH_COOKIE, getLegacyManagementSessionToken } from "@/lib/management-auth";
import { validateManagementLogin } from "@/lib/server/management-auth-server";

export type ManagementSignInResult =
  | { ok: true }
  | { ok: false; error: "invalid" | "not_configured" };

export async function signInManagement(
  email: string,
  password: string,
): Promise<ManagementSignInResult> {
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
    maxAge: 60 * 60 * 24 * 7,
  });

  return { ok: true };
}

export async function signOutManagement(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(MANAGEMENT_AUTH_COOKIE);
}
