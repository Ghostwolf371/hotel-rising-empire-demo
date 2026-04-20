import type { Category, Order, OrderLine, Product, Room } from "@/lib/types";

type OrderWithLines = {
  id: string;
  roomNumber: string;
  createdAt: number;
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
    createdAt: row.createdAt,
    status: row.status as Order["status"],
    items,
    notes: row.notes ?? undefined,
  };
}

export function toDomainRoom(row: {
  id: string;
  number: string;
  status: string;
  sessionStartedAt: number | null;
  sessionEndsAt: number | null;
  durationHours: number | null;
}): Room {
  return {
    id: row.id,
    number: row.number,
    status: row.status as Room["status"],
    sessionStartedAt: row.sessionStartedAt ?? undefined,
    sessionEndsAt: row.sessionEndsAt ?? undefined,
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
