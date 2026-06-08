"use server";

import { cookies } from "next/headers";
import {
  getManagementUserIdFromSessionCookie,
  MANAGEMENT_AUTH_COOKIE,
} from "@/lib/management-auth";
import {
  effectivePagesForUser,
  type ManagementPageKey,
  type ManagementRole,
} from "@/lib/management-permissions";
import {
  assertManagementAdmin,
  assertManagementSessionCookie,
} from "@/lib/server/management-auth-server";
import {
  createManagementUser,
  deleteManagementUser,
  listManagementUsers,
  updateManagementUser,
  type ManagementUserRow,
} from "@/lib/server/management-users";

async function assertManagementAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const value = cookieStore.get(MANAGEMENT_AUTH_COOKIE)?.value;
  await assertManagementAdmin(value);
}

export type ManagementUserPublic = ManagementUserRow;

export async function fetchManagementUsers(): Promise<ManagementUserPublic[]> {
  await assertManagementAdminSession();
  return listManagementUsers();
}

export async function addManagementUser(input: {
  email: string;
  password: string;
  displayName?: string;
  role?: ManagementRole;
  allowedPages?: ManagementPageKey[];
}): Promise<{ ok: true; user: ManagementUserPublic } | { ok: false; error: string }> {
  try {
    await assertManagementAdminSession();
    const email = input.email.trim();
    const password = input.password;
    if (!email || password.length < 8) {
      return { ok: false, error: "invalid" };
    }
    const user = await createManagementUser({
      email,
      password,
      displayName: input.displayName,
      role: input.role,
      allowedPages: input.allowedPages,
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
  role?: ManagementRole;
  allowedPages?: ManagementPageKey[];
  active?: boolean;
  password?: string;
}): Promise<{ ok: true; user: ManagementUserPublic } | { ok: false; error: string }> {
  try {
    await assertManagementAdminSession();
    if (input.password !== undefined && input.password.length > 0 && input.password.length < 8) {
      return { ok: false, error: "invalid" };
    }
    const user = await updateManagementUser(input.id, {
      email: input.email,
      displayName: input.displayName,
      role: input.role,
      allowedPages: input.allowedPages,
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

export async function removeManagementUser(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assertManagementAdminSession();
    const cookieStore = await cookies();
    const value = cookieStore.get(MANAGEMENT_AUTH_COOKIE)?.value;
    await assertManagementSessionCookie(value);

    const currentUserId = getManagementUserIdFromSessionCookie(value);
    if (currentUserId === id) {
      return { ok: false, error: "cannot_delete_self" };
    }

    const users = await listManagementUsers();
    const target = users.find((u) => u.id === id);
    if (!target) {
      return { ok: false, error: "not_found" };
    }

    const targetPages = effectivePagesForUser(target.role, target.allowedPages);
    if (targetPages.includes("users")) {
      const othersWithUsersAccess = users.filter(
        (u) =>
          u.id !== id &&
          u.active &&
          effectivePagesForUser(u.role, u.allowedPages).includes("users"),
      );
      if (othersWithUsersAccess.length === 0) {
        return { ok: false, error: "last_user_manager" };
      }
    }

    await deleteManagementUser(id);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return { ok: false, error: msg };
  }
}
