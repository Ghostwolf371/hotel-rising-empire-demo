import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { getPrisma } from "@/lib/server/prisma";

const scryptAsync = promisify(scrypt);

export type ManagementUserRow = {
  id: string;
  email: string;
  displayName: string | null;
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
  active: boolean;
  createdAt: bigint;
}): ManagementUserRow {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    active: u.active,
    createdAt: Number(u.createdAt),
  };
}

export async function countManagementUsers(): Promise<number> {
  const prisma = getPrisma();
  return prisma.managementUser.count();
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
}): Promise<ManagementUserRow> {
  const prisma = getPrisma();
  const email = input.email.trim().toLowerCase();
  const passwordHash = await hashManagementPassword(input.password);
  const row = await prisma.managementUser.create({
    data: {
      email,
      passwordHash,
      displayName: input.displayName?.trim() || null,
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
    active?: boolean;
    password?: string;
  },
): Promise<ManagementUserRow> {
  const prisma = getPrisma();
  const data: {
    email?: string;
    displayName?: string | null;
    active?: boolean;
    passwordHash?: string;
  } = {};
  if (patch.email !== undefined) data.email = patch.email.trim().toLowerCase();
  if (patch.displayName !== undefined) data.displayName = patch.displayName?.trim() || null;
  if (patch.active !== undefined) data.active = patch.active;
  if (patch.password) data.passwordHash = await hashManagementPassword(patch.password);

  const row = await prisma.managementUser.update({ where: { id }, data });
  return toRow(row);
}

export async function bootstrapManagementUserFromEnv(): Promise<void> {
  const email = process.env.MANAGEMENT_EMAIL?.trim();
  const password = process.env.MANAGEMENT_PASSWORD;
  if (!email || !password) return;

  const count = await countManagementUsers();
  if (count > 0) return;

  await createManagementUser({
    email,
    password,
    displayName: "Admin",
  });
}
