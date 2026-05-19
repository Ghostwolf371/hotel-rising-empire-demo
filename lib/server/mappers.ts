import type { Category, Order, OrderLine, Product, Room } from "@/lib/types";

/**
 * Schema stores ms-timestamps as `BigInt` to avoid Postgres `INTEGER` overflow.
 * pg's type parser is configured to return them as `number` at runtime
 * (see `lib/server/prisma.ts`), so converting via `Number(...)` is a no-op
 * at runtime but keeps TypeScript happy — Prisma's generated types still
 * declare these columns as `bigint`.
 */
const numberFromBig = (v: bigint | number | null | undefined): number | undefined => {
  if (v === null || v === undefined) return undefined;
  return typeof v === "bigint" ? Number(v) : v;
};

type OrderWithLines = {
  id: string;
  roomNumber: string;
  createdAt: bigint | number;
  status: string;
  notes: string | null;
  lines: { productId: string; name: string; qty: number; unitPrice: number }[];
};

export function toDomainOrder(row: OrderWithLines): Order {
  const items: OrderLine[] = row.lines.map((l) => ({
    productId: l.productId,
    name: l.name,
    qty: l.qty,
    unitPrice: l.unitPrice,
  }));
  return {
    id: row.id,
    roomNumber: row.roomNumber,
    createdAt: numberFromBig(row.createdAt) ?? 0,
    status: row.status as Order["status"],
    items,
    notes: row.notes ?? undefined,
  };
}

export function toDomainRoom(row: {
  id: string;
  number: string;
  status: string;
  sessionStartedAt: bigint | number | null;
  sessionEndsAt: bigint | number | null;
  durationHours: number | null;
}): Room {
  return {
    id: row.id,
    number: row.number,
    status: row.status as Room["status"],
    sessionStartedAt: numberFromBig(row.sessionStartedAt),
    sessionEndsAt: numberFromBig(row.sessionEndsAt),
    durationHours: row.durationHours ?? undefined,
  };
}

export function toDomainProduct(row: {
  id: string;
  name: string;
  priceSrd: number;
  categoryId: string;
  image: string;
  available: boolean;
}): Product {
  return {
    id: row.id,
    name: row.name,
    priceSrd: row.priceSrd,
    category: row.categoryId,
    image: row.image,
    available: row.available,
  };
}

export function toDomainCategory(row: {
  id: string;
  name: string;
  color: string;
}): Category {
  return { id: row.id, name: row.name, color: row.color };
}
