import {
  createManagementSessionToken,
  getLegacyManagementSessionToken,
  isManagementSessionCookie,
  parseManagementSessionCookie,
  validateEnvManagementLogin,
} from "@/lib/management-auth";
import {
  type ManagementPageKey,
  type ManagementRole,
  ALL_MANAGEMENT_PAGE_KEYS,
  canAccessManagementPathWithPages,
  canManageUsers,
  normalizeManagementRole,
} from "@/lib/management-permissions";
import {
  findActiveManagementUserById,
  findManagementUserByEmail,
  resolveUserAllowedPages,
  verifyManagementPassword,
} from "@/lib/server/management-users";

export async function validateManagementLogin(
  email: string,
  password: string,
): Promise<{ ok: true; token: string; allowedPages: ManagementPageKey[] } | { ok: false }> {
  const normalized = email.trim().toLowerCase();

  // Env credentials always grant super-admin access (full pages), even when a DB user exists.
  if (validateEnvManagementLogin(email, password)) {
    const legacy = await getLegacyManagementSessionToken();
    if (legacy) {
      return { ok: true, token: legacy, allowedPages: [...ALL_MANAGEMENT_PAGE_KEYS] };
    }
  }

  const user = await findManagementUserByEmail(normalized);

  if (user?.active && (await verifyManagementPassword(password, user.passwordHash))) {
    const allowedPages = resolveUserAllowedPages(user);
    return {
      ok: true,
      token: await createManagementSessionToken(user.id, allowedPages),
      allowedPages,
    };
  }

  return { ok: false };
}

export async function resolveSessionAllowedPages(
  cookieValue: string | undefined,
): Promise<ManagementPageKey[] | null> {
  if (!(await isManagementSessionCookie(cookieValue))) return null;

  const parsed = parseManagementSessionCookie(cookieValue);
  if (parsed.legacy) return [...ALL_MANAGEMENT_PAGE_KEYS];

  const userId = parsed.userId;
  if (!userId) return null;
  const user = await findActiveManagementUserById(userId);
  if (!user) return null;
  const { isEnvSuperAdminEmail } = await import("@/lib/management-auth");
  if (isEnvSuperAdminEmail(user.email)) return [...ALL_MANAGEMENT_PAGE_KEYS];
  return resolveUserAllowedPages(user);
}

export async function resolveSessionRole(
  cookieValue: string | undefined,
): Promise<ManagementRole | null> {
  if (!(await isManagementSessionCookie(cookieValue))) return null;

  const parsed = parseManagementSessionCookie(cookieValue);
  if (parsed.legacy) return "admin";
  if (parsed.role) return parsed.role;

  const userId = parsed.userId;
  if (!userId) return null;
  const user = await findActiveManagementUserById(userId);
  if (!user) return null;
  return normalizeManagementRole(user.role);
}

/** Full session check for server actions (signature + active user when applicable). */
export async function assertManagementSessionCookie(
  value: string | undefined,
): Promise<void> {
  if (!(await isManagementSessionCookie(value))) {
    throw new Error("Unauthorized");
  }
  const parsed = parseManagementSessionCookie(value);
  if (parsed.legacy) return;
  if (!parsed.userId) return;
  const user = await findActiveManagementUserById(parsed.userId);
  if (!user) throw new Error("Unauthorized");
}

export async function assertManagementAdmin(
  value: string | undefined,
): Promise<void> {
  await assertManagementSessionCookie(value);
  const pages = await resolveSessionAllowedPages(value);
  if (!pages || !canManageUsers(pages)) throw new Error("Forbidden");
}

export async function assertManagementPathAccess(
  value: string | undefined,
  pathname: string,
): Promise<ManagementPageKey[]> {
  await assertManagementSessionCookie(value);
  const pages = await resolveSessionAllowedPages(value);
  if (!pages) throw new Error("Unauthorized");
  if (!canAccessManagementPathWithPages(pages, pathname)) throw new Error("Forbidden");
  return pages;
}
