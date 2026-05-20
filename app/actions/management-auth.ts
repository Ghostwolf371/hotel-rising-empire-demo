"use server";

import { cookies } from "next/headers";
import {
  MANAGEMENT_AUTH_COOKIE,
  getManagementSessionToken,
  validateManagementLogin,
} from "@/lib/management-auth";

export type ManagementSignInResult =
  | { ok: true }
  | { ok: false; error: "invalid" | "not_configured" };

export async function signInManagement(
  email: string,
  password: string,
): Promise<ManagementSignInResult> {
  const token = await getManagementSessionToken();
  if (!token) {
    return { ok: false, error: "not_configured" };
  }

  if (!validateManagementLogin(email, password)) {
    return { ok: false, error: "invalid" };
  }

  const cookieStore = await cookies();
  cookieStore.set(MANAGEMENT_AUTH_COOKIE, token, {
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
