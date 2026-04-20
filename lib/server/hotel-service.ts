import { getPrisma } from "@/lib/server/prisma";
import {
  toDomainCategory,
  toDomainOrder,
  toDomainProduct,
  toDomainRoom,
} from "@/lib/server/mappers";
import type {
  Category,
  GuestRating,
  Order,
  OrderLine,
  PanicAlert,
  Product,
  Room,
  RoomStatus,
} from "@/lib/types";

const ORDERS_LIMIT = 250;
const RATINGS_LIMIT = 300;

export type DomainSnapshot = {
  rooms: Room[];
  orders: Order[];
  panicAlerts: PanicAlert[];
  guestRatings: GuestRating[];
  catalog: Product[];
  categories: Category[];
  hourlyRate: number;
};

export async function getDomainSnapshot(): Promise<DomainSnapshot> {
  const prisma = getPrisma();
  const [rooms, orders, panicAlerts, guestRatings, products, categories, site] =
    await Promise.all([
      prisma.room.findMany({ orderBy: { number: "asc" } }),
      prisma.order.findMany({
        include: { lines: true },
        orderBy: { createdAt: "desc" },
        take: ORDERS_LIMIT,
      }),
      prisma.panicAlert.findMany({ orderBy: { at: "desc" } }),
      prisma.guestRating.findMany({
        orderBy: { submittedAt: "desc" },
        take: RATINGS_LIMIT,
      }),
      prisma.product.findMany({ orderBy: { id: "asc" } }),
      prisma.category.findMany({ orderBy: { id: "asc" } }),
      prisma.siteConfig.findUnique({ where: { id: 1 } }),
    ]);

  return {
    rooms: rooms.map(toDomainRoom),
    orders: orders.map(toDomainOrder),
    panicAlerts: panicAlerts.map((r) => ({
      id: r.id,
      roomNumber: r.roomNumber,
      at: r.at,
    })),
    guestRatings: guestRatings.map((r) => ({
      id: r.id,
      roomNumber: r.roomNumber,
      submittedAt: r.submittedAt,
      cleanliness: r.cleanliness,
      comfort: r.comfort,
      service: r.service,
    })),
    catalog: products.map(toDomainProduct),
    categories: categories.map(toDomainCategory),
    hourlyRate: site?.hourlyRate ?? 75,
  };
}

export async function setHourlyRate(hourlyRate: number) {
  const prisma = getPrisma();
  await prisma.siteConfig.upsert({
    where: { id: 1 },
    create: { id: 1, hourlyRate },
    update: { hourlyRate },
  });
}

export async function setOrderStatus(orderId: string, status: Order["status"]) {
  const prisma = getPrisma();
  await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
}

export async function createOrder(input: {
  id: string;
  roomNumber: string;
  createdAt: number;
  status: Order["status"];
  notes?: string | null;
  items: OrderLine[];
}) {
  const prisma = getPrisma();
  await prisma.order.create({
    data: {
      id: input.id,
      roomNumber: input.roomNumber,
      createdAt: input.createdAt,
      status: input.status,
      notes: input.notes ?? null,
      lines: {
        create: input.items.map((it) => ({
          productId: it.productId,
          name: it.name,
          qty: it.qty,
          unitPrice: it.unitPrice,
        })),
      },
    },
  });
}

export async function updateRoomById(
  roomId: string,
  data: {
    status?: RoomStatus;
    sessionStartedAt?: number | null;
    sessionEndsAt?: number | null;
    durationHours?: number | null;
  },
) {
  const prisma = getPrisma();
  await prisma.room.update({
    where: { id: roomId },
    data,
  });
}

export async function updateRoomByNumber(
  roomNumber: string,
  data: {
    status?: RoomStatus;
    sessionStartedAt?: number | null;
    sessionEndsAt?: number | null;
    durationHours?: number | null;
  },
) {
  const prisma = getPrisma();
  await prisma.room.update({
    where: { number: roomNumber },
    data,
  });
}

export async function createRoom(room: Room) {
  const prisma = getPrisma();
  await prisma.room.create({
    data: {
      id: room.id,
      number: room.number,
      status: room.status,
      sessionStartedAt: room.sessionStartedAt ?? null,
      sessionEndsAt: room.sessionEndsAt ?? null,
      durationHours: room.durationHours ?? null,
    },
  });
}

export async function deleteRoom(roomId: string) {
  const prisma = getPrisma();
  await prisma.room.delete({ where: { id: roomId } });
}

export async function applyGuestSessionStart(
  roomNumber: string,
  durationHours: number,
) {
  const h = Math.min(168, Math.max(1, Math.round(durationHours)));
  const now = Date.now();
  const ms = h * 60 * 60 * 1000;
  await updateRoomByNumber(roomNumber, {
    status: "occupied",
    sessionStartedAt: now,
    sessionEndsAt: now + ms,
    durationHours: h,
  });
}

export async function applyGuestSessionExtend(
  roomNumber: string,
  sessionEndsAt: number,
) {
  await updateRoomByNumber(roomNumber, {
    sessionEndsAt,
  });
}

export async function applyGuestSessionEnd(roomNumber: string) {
  await updateRoomByNumber(roomNumber, {
    status: "cleaning",
    sessionStartedAt: null,
    sessionEndsAt: null,
    durationHours: null,
  });
}

export async function applyManagementRoomSessionStart(
  roomId: string,
  durationHours: number,
) {
  const h = Math.min(168, Math.max(1, Math.round(durationHours)));
  const now = Date.now();
  const ms = h * 60 * 60 * 1000;
  await updateRoomById(roomId, {
    status: "occupied",
    sessionStartedAt: now,
    sessionEndsAt: now + ms,
    durationHours: h,
  });
}

export async function applyManagementRoomSessionEnd(roomId: string) {
  await updateRoomById(roomId, {
    status: "available",
    sessionStartedAt: null,
    sessionEndsAt: null,
    durationHours: null,
  });
}

export async function createCategory(category: Category) {
  const prisma = getPrisma();
  await prisma.category.create({
    data: { id: category.id, name: category.name, color: category.color },
  });
}

export async function updateCategory(category: Category) {
  const prisma = getPrisma();
  await prisma.category.update({
    where: { id: category.id },
    data: { name: category.name, color: category.color },
  });
}

export async function deleteCategory(categoryId: string) {
  const prisma = getPrisma();
  await prisma.category.delete({ where: { id: categoryId } });
}

export async function createProduct(product: Product) {
  const prisma = getPrisma();
  await prisma.product.create({
    data: {
      id: product.id,
      name: product.name,
      priceSrd: product.priceSrd,
      categoryId: product.category,
      image: product.image,
      available: product.available,
    },
  });
}

export async function updateProduct(product: Product) {
  const prisma = getPrisma();
  await prisma.product.update({
    where: { id: product.id },
    data: {
      name: product.name,
      priceSrd: product.priceSrd,
      categoryId: product.category,
      image: product.image,
      available: product.available,
    },
  });
}

export async function deleteProduct(productId: string) {
  const prisma = getPrisma();
  await prisma.product.delete({ where: { id: productId } });
}

export async function setProductAvailability(productId: string, available: boolean) {
  const prisma = getPrisma();
  await prisma.product.update({
    where: { id: productId },
    data: { available },
  });
}

export async function createPanicAlert(alert: PanicAlert) {
  const prisma = getPrisma();
  await prisma.panicAlert.create({
    data: {
      id: alert.id,
      roomNumber: alert.roomNumber,
      at: alert.at,
    },
  });
}

export async function clearAllPanics() {
  const prisma = getPrisma();
  await prisma.panicAlert.deleteMany();
}

export async function deletePanicAlert(id: string) {
  const prisma = getPrisma();
  await prisma.panicAlert.delete({ where: { id } });
}

export async function createGuestRating(rating: GuestRating) {
  const prisma = getPrisma();
  await prisma.guestRating.create({
    data: {
      id: rating.id,
      roomNumber: rating.roomNumber,
      submittedAt: rating.submittedAt,
      cleanliness: rating.cleanliness,
      comfort: rating.comfort,
      service: rating.service,
    },
  });
}
