import {
  createManagementSessionToken,
  getLegacyManagementSessionToken,
  getManagementUserIdFromSessionCookie,
  isManagementSessionCookie,
  validateEnvManagementLogin,
} from "@/lib/management-auth";
import {
  countManagementUsers,
  findActiveManagementUserById,
  findManagementUserByEmail,
  verifyManagementPassword,
} from "@/lib/server/management-users";

export async function validateManagementLogin(
  email: string,
  password: string,
): Promise<{ ok: true; token: string } | { ok: false }> {
  const normalized = email.trim().toLowerCase();
  const user = await findManagementUserByEmail(normalized);

  if (user?.active && (await verifyManagementPassword(password, user.passwordHash))) {
    return {
      ok: true,
      token: await createManagementSessionToken(user.id),
    };
  }

  const userCount = await countManagementUsers();
  if (userCount === 0 && validateEnvManagementLogin(email, password)) {
    const legacy = await getLegacyManagementSessionToken();
    if (legacy) return { ok: true, token: legacy };
  }

  return { ok: false };
}

/** Full session check for server actions (signature + active user when applicable). */
export async function assertManagementSessionCookie(
  value: string | undefined,
): Promise<void> {
  if (!(await isManagementSessionCookie(value))) {
    throw new Error("Unauthorized");
  }
  const userId = getManagementUserIdFromSessionCookie(value);
  if (!userId) return;
  const user = await findActiveManagementUserById(userId);
  if (!user) throw new Error("Unauthorized");
}
