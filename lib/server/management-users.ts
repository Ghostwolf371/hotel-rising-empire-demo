import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { isEnvSuperAdminEmail } from "@/lib/management-auth";
import {
  type ManagementPageKey,
  type ManagementRole,
  ALL_MANAGEMENT_PAGE_KEYS,
  effectivePagesForUser,
  normalizeManagementRole,
  parseStoredAllowedPages,
  serializeAllowedPages,
} from "@/lib/management-permissions";
import { getPrisma } from "@/lib/server/prisma";

const scryptAsync = promisify(scrypt);

export type ManagementUserRow = {
  id: string;
  email: string;
  displayName: string | null;
  role: ManagementRole;
  allowedPages: ManagementPageKey[] | null;
  active: boolean;
  createdAt: number;
};

export async function hashManagementPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scryptAsync(password, salt, 32)) as Buffer;
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

export async function verifyManagementPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  if (expected.length !== 32) return false;
  const derived = (await scryptAsync(password, salt, 32)) as Buffer;
  return timingSafeEqual(derived, expected);
}

function toRow(u: {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  allowedPages: string | null;
  active: boolean;
  createdAt: bigint;
}): ManagementUserRow {
  const role = normalizeManagementRole(u.role);
  const storedPages = parseStoredAllowedPages(u.allowedPages);
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    role,
    allowedPages: storedPages,
    active: u.active,
    createdAt: Number(u.createdAt),
  };
}

export function resolveUserAllowedPages(user: {
  email?: string;
  role: string;
  allowedPages: string | null;
}): ManagementPageKey[] {
  if (user.email && isEnvSuperAdminEmail(user.email)) {
    return [...ALL_MANAGEMENT_PAGE_KEYS];
  }
  const role = normalizeManagementRole(user.role);
  const stored = parseStoredAllowedPages(user.allowedPages);
  return effectivePagesForUser(role, stored);
}

export async function countManagementUsers(): Promise<number> {
  const prisma = getPrisma();
  return prisma.managementUser.count();
}

export async function countActiveUsersWithPage(page: ManagementPageKey): Promise<number> {
  const prisma = getPrisma();
  const users = await prisma.managementUser.findMany({
    where: { active: true },
    select: { role: true, allowedPages: true },
  });
  return users.filter((u) => resolveUserAllowedPages(u).includes(page)).length;
}

export async function findManagementUserByEmail(email: string) {
  const prisma = getPrisma();
  const row = await prisma.managementUser.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  return row ? { ...row, passwordHash: row.passwordHash } : null;
}

export async function findActiveManagementUserById(id: string) {
  const prisma = getPrisma();
  const row = await prisma.managementUser.findUnique({ where: { id } });
  if (!row || !row.active) return null;
  return row;
}

export async function listManagementUsers(): Promise<ManagementUserRow[]> {
  const prisma = getPrisma();
  const rows = await prisma.managementUser.findMany({
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toRow);
}

export async function createManagementUser(input: {
  email: string;
  password: string;
  displayName?: string | null;
  role?: ManagementRole;
  allowedPages?: ManagementPageKey[];
}): Promise<ManagementUserRow> {
  const prisma = getPrisma();
  const email = input.email.trim().toLowerCase();
  const role = input.role ?? "staff";
  const pages = input.allowedPages ?? effectivePagesForUser(role, null);
  if (pages.length === 0) {
    throw new Error("User must have access to at least one page");
  }
  const passwordHash = await hashManagementPassword(input.password);
  const row = await prisma.managementUser.create({
    data: {
      email,
      passwordHash,
      displayName: input.displayName?.trim() || null,
      role,
      allowedPages: serializeAllowedPages(pages),
      active: true,
      createdAt: BigInt(Date.now()),
    },
  });
  return toRow(row);
}

export async function updateManagementUser(
  id: string,
  patch: {
    email?: string;
    displayName?: string | null;
    role?: ManagementRole;
    allowedPages?: ManagementPageKey[];
    active?: boolean;
    password?: string;
  },
): Promise<ManagementUserRow> {
  const prisma = getPrisma();
  const existing = await prisma.managementUser.findUnique({ where: { id } });
  if (!existing) throw new Error("User not found");

  if (isEnvSuperAdminEmail(existing.email)) {
    if (patch.active === false) {
      throw new Error("Cannot deactivate env super admin");
    }
    if (patch.email !== undefined && !isEnvSuperAdminEmail(patch.email)) {
      throw new Error("Cannot change env super admin email");
    }
    patch = {
      ...patch,
      role: "admin",
      allowedPages: [...ALL_MANAGEMENT_PAGE_KEYS],
      active: true,
    };
  }

  const data: {
    email?: string;
    displayName?: string | null;
    role?: string;
    allowedPages?: string;
    active?: boolean;
    passwordHash?: string;
  } = {};
  if (patch.email !== undefined) data.email = patch.email.trim().toLowerCase();
  if (patch.displayName !== undefined) data.displayName = patch.displayName?.trim() || null;
  if (patch.role !== undefined) data.role = patch.role;
  if (patch.allowedPages !== undefined) {
    if (patch.allowedPages.length === 0) {
      throw new Error("User must have access to at least one page");
    }
    data.allowedPages = serializeAllowedPages(patch.allowedPages);
  }
  if (patch.active !== undefined) data.active = patch.active;
  if (patch.password) data.passwordHash = await hashManagementPassword(patch.password);

  const row = await prisma.managementUser.update({ where: { id }, data });
  return toRow(row);
}

export async function deleteManagementUser(id: string): Promise<void> {
  const prisma = getPrisma();
  const existing = await prisma.managementUser.findUnique({ where: { id } });
  if (existing && isEnvSuperAdminEmail(existing.email)) {
    throw new Error("Cannot delete env super admin");
  }
  await prisma.managementUser.delete({ where: { id } });
}

export async function bootstrapManagementUserFromEnv(): Promise<void> {
  const email = process.env.MANAGEMENT_EMAIL?.trim();
  const password = process.env.MANAGEMENT_PASSWORD;
  if (!email || !password) return;

  const existing = await findManagementUserByEmail(email);
  if (existing) {
    await updateManagementUser(existing.id, {
      role: "admin",
      allowedPages: [...ALL_MANAGEMENT_PAGE_KEYS],
      active: true,
    });
    return;
  }

  await createManagementUser({
    email,
    password,
    displayName: "Admin",
    role: "admin",
    allowedPages: [...ALL_MANAGEMENT_PAGE_KEYS],
  });
}
