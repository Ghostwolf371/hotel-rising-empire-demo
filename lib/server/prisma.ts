import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

/**
 * Tell node-postgres to return `int8` (BigInt) columns as plain JavaScript
 * `number`s instead of `BigInt` primitives. Every BigInt column in this
 * schema stores millisecond timestamps, which fit comfortably inside
 * `Number.MAX_SAFE_INTEGER` until ~year 285616. This keeps the rest of the
 * codebase able to use plain `number` arithmetic on returned values.
 *
 * OID 20 = bigint (int8). Must be set before any pg.Client is constructed,
 * which is why this runs at module top-level.
 */
pg.types.setTypeParser(20, (v: string) => Number(v));

/**
 * Single Prisma client backed by a `pg` Pool via the Neon Postgres adapter.
 * Cached on `globalThis` so dev server HMR (Turbopack / webpack) doesn't open
 * a new connection pool on every reload.
 */

function resolveDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and paste your Neon connection string.",
    );
  }
  if (!raw.startsWith("postgres://") && !raw.startsWith("postgresql://")) {
    throw new Error(
      `DATABASE_URL must be a PostgreSQL URL (got '${raw.slice(0, 20)}…'). Update .env to a Neon connection string.`,
    );
  }
  return raw;
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgAdapter?: PrismaPg;
};

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaPg({ connectionString: resolveDatabaseUrl() });
    globalForPrisma.pgAdapter = adapter;
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.prisma;
}
