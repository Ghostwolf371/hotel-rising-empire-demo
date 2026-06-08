"use server";

import { cookies } from "next/headers";
import { MANAGEMENT_AUTH_COOKIE } from "@/lib/management-auth";
import { verifyGuestDeviceToken, GUEST_DEVICE_COOKIE } from "@/lib/guest-device-auth";
import {
  requireGuestDeviceRoom,
  requireManagementPage,
  requireManagementSession,
} from "@/lib/server/action-auth";
import { resolveOrderLinesFromCatalog } from "@/lib/server/order-pricing";
import * as hotel from "@/lib/server/hotel-service";
import type { DomainSnapshot } from "@/lib/server/hotel-service";
import type {
  Category,
  Order,
  PanicAlert,
  Product,
  Room,
  RoomStatus,
} from "@/lib/types";

export type { DomainSnapshot } from "@/lib/server/hotel-service";

function guestPublicSnapshot(full: DomainSnapshot): DomainSnapshot {
  return {
    rooms: full.rooms,
    orders: [],
    panicAlerts: [],
    catalog: full.catalog,
    categories: full.categories,
    hourlyRate: full.hourlyRate,
  };
}

function guestScopedSnapshot(
  full: DomainSnapshot,
  roomNumber: string,
): DomainSnapshot {
  return {
    rooms: full.rooms.filter((r) => r.number === roomNumber),
    orders: full.orders.filter((o) => o.roomNumber === roomNumber),
    panicAlerts: [],
    catalog: full.catalog,
    categories: full.categories,
    hourlyRate: full.hourlyRate,
  };
}

export async function loadManagementDomainSnapshot(): Promise<DomainSnapshot> {
  await requireManagementSession();
  return hotel.getDomainSnapshot();
}

/** @deprecated Prefer loadManagementDomainSnapshot or loadGuestDomainSnapshot. */
export async function loadDomainSnapshot(): Promise<DomainSnapshot> {
  return loadManagementDomainSnapshot();
}

export async function loadGuestDomainSnapshot(
  roomNumber?: string | null,
): Promise<DomainSnapshot> {
  const cookieStore = await cookies();
  const cookieRoom = await verifyGuestDeviceToken(
    cookieStore.get(GUEST_DEVICE_COOKIE)?.value,
  );

  const full = await hotel.getDomainSnapshot();

  if (!cookieRoom) {
    return guestPublicSnapshot(full);
  }

  const scopedRoom = roomNumber?.trim() || cookieRoom;
  if (scopedRoom !== cookieRoom) {
    return guestScopedSnapshot(full, cookieRoom);
  }

  return guestScopedSnapshot(full, cookieRoom);
}

export async function syncSetHourlyRate(rate: number) {
  await requireManagementPage("settings");
  if (!Number.isFinite(rate) || rate < 0 || rate > 1_000_000) {
    throw new Error("Invalid hourly rate");
  }
  await hotel.setHourlyRate(rate);
}

export async function syncSetOrderStatus(
  orderId: string,
  status: Order["status"],
) {
  await requireManagementPage("orders");
  await hotel.setOrderStatus(orderId, status);
}

export async function syncCreateOrder(order: Order) {
  const roomNumber = await requireGuestDeviceRoom(order.roomNumber);
  const items = await resolveOrderLinesFromCatalog(
    order.items.map((it) => ({ productId: it.productId, qty: it.qty })),
  );
  await hotel.createOrder({
    id: order.id,
    roomNumber,
    createdAt: order.createdAt,
    status: order.status,
    notes: order.notes ?? null,
    items,
  });
}

export async function syncUpdateRoomStatus(roomId: string, status: RoomStatus) {
  await requireManagementPage("rooms");
  await hotel.updateRoomById(roomId, { status });
}

export async function syncManagementRoomSessionStart(
  roomId: string,
  durationHours: number,
) {
  await requireManagementPage("rooms");
  await hotel.applyManagementRoomSessionStart(roomId, durationHours);
}

export async function syncManagementRoomSessionEnd(roomId: string) {
  await requireManagementPage("rooms");
  await hotel.applyManagementRoomSessionEnd(roomId);
}

export async function syncGuestSessionStart(
  roomNumber: string,
  durationHours: number,
  sessionLengthMs?: number,
) {
  await requireGuestDeviceRoom(roomNumber);
  await hotel.applyGuestSessionStart(
    roomNumber,
    durationHours,
    sessionLengthMs,
  );
}

export async function syncGuestSessionExtend(
  roomNumber: string,
  sessionEndsAt: number,
) {
  await requireGuestDeviceRoom(roomNumber);
  await hotel.applyGuestSessionExtend(roomNumber, sessionEndsAt);
}

export async function syncGuestSessionEnd(roomNumber: string) {
  const cookieStore = await cookies();
  const mgmtCookie = cookieStore.get(MANAGEMENT_AUTH_COOKIE)?.value;
  let allowed = false;
  try {
    await requireManagementPage("rooms");
    allowed = true;
  } catch {
    /* not management */
  }
  if (!allowed) {
    await requireGuestDeviceRoom(roomNumber);
  }
  await hotel.applyGuestSessionEnd(roomNumber);
}

export async function syncPanic(alert: PanicAlert) {
  await requireGuestDeviceRoom(alert.roomNumber);
  await hotel.createPanicAlert(alert);
}

export async function syncClearPanics() {
  await requireManagementSession();
  await hotel.clearAllPanics();
}

export async function syncClearPanicAlert(id: string) {
  await requireManagementSession();
  await hotel.deletePanicAlert(id);
}

export async function syncAddCategory(category: Category) {
  await requireManagementPage("inventory");
  await hotel.createCategory(category);
}

export async function syncUpdateCategory(category: Category) {
  await requireManagementPage("inventory");
  await hotel.updateCategory(category);
}

export async function syncDeleteCategory(categoryId: string) {
  await requireManagementPage("inventory");
  await hotel.deleteCategory(categoryId);
}

export async function syncAddProduct(product: Product) {
  await requireManagementPage("inventory");
  await hotel.createProduct(product);
}

export async function syncUpdateProduct(product: Product) {
  await requireManagementPage("inventory");
  await hotel.updateProduct(product);
}

export async function syncDeleteProduct(productId: string) {
  await requireManagementPage("inventory");
  await hotel.deleteProduct(productId);
}

export async function syncSetProductAvailability(
  productId: string,
  available: boolean,
) {
  await requireManagementPage("inventory");
  await hotel.setProductAvailability(productId, available);
}

export async function syncAddRoom(room: Room) {
  await requireManagementPage("settings");
  await hotel.createRoom(room);
}

export async function syncDeleteRoom(roomId: string) {
  await requireManagementPage("settings");
  await hotel.deleteRoom(roomId);
}
