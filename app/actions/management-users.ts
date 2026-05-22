"use server";

import { cookies } from "next/headers";
import { MANAGEMENT_AUTH_COOKIE } from "@/lib/management-auth";
import { assertManagementSessionCookie } from "@/lib/server/management-auth-server";
import {
  createManagementUser,
  listManagementUsers,
  updateManagementUser,
  type ManagementUserRow,
} from "@/lib/server/management-users";

async function assertManagementSession(): Promise<void> {
  const cookieStore = await cookies();
  const value = cookieStore.get(MANAGEMENT_AUTH_COOKIE)?.value;
  await assertManagementSessionCookie(value);
}

export type ManagementUserPublic = ManagementUserRow;

export async function fetchManagementUsers(): Promise<ManagementUserPublic[]> {
  await assertManagementSession();
  return listManagementUsers();
}

export async function addManagementUser(input: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<{ ok: true; user: ManagementUserPublic } | { ok: false; error: string }> {
  try {
    await assertManagementSession();
    const email = input.email.trim();
    const password = input.password;
    if (!email || password.length < 8) {
      return { ok: false, error: "invalid" };
    }
    const user = await createManagementUser({
      email,
      password,
      displayName: input.displayName,
    });
    return { ok: true, user };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg.includes("Unique constraint")) {
      return { ok: false, error: "duplicate_email" };
    }
    return { ok: false, error: msg };
  }
}

export async function saveManagementUser(input: {
  id: string;
  email?: string;
  displayName?: string;
  active?: boolean;
  password?: string;
}): Promise<{ ok: true; user: ManagementUserPublic } | { ok: false; error: string }> {
  try {
    await assertManagementSession();
    if (input.password !== undefined && input.password.length > 0 && input.password.length < 8) {
      return { ok: false, error: "invalid" };
    }
    const user = await updateManagementUser(input.id, {
      email: input.email,
      displayName: input.displayName,
      active: input.active,
      password: input.password?.length ? input.password : undefined,
    });
    return { ok: true, user };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg.includes("Unique constraint")) {
      return { ok: false, error: "duplicate_email" };
    }
    return { ok: false, error: msg };
  }
}
