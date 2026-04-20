import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/lib/generated/prisma/client";

/**
 * Resolves `DATABASE_URL` for the SQLite driver adapter.
 * For PostgreSQL in production, swap to `@prisma/adapter-pg` (or similar) and update this module.
 */
function sqliteFilePathFromDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  if (!raw.startsWith("file:")) {
    throw new Error(
      "DATABASE_URL must be a SQLite `file:` URL for the current Prisma adapter. Configure PostgreSQL with a matching driver adapter for production if needed.",
    );
  }
  const afterScheme = raw.slice("file:".length);
  if (path.isAbsolute(afterScheme)) {
    return afterScheme;
  }
  return path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    afterScheme.replace(/^\.\//, ""),
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  sqliteAdapter?: PrismaBetterSqlite3;
};

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const url = sqliteFilePathFromDatabaseUrl();
    const adapter = new PrismaBetterSqlite3({ url });
    globalForPrisma.sqliteAdapter = adapter;
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.prisma;
}
