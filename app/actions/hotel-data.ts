"use server";

import * as hotel from "@/lib/server/hotel-service";
import type {
  Category,
  GuestRating,
  Order,
  PanicAlert,
  Product,
  Room,
  RoomStatus,
} from "@/lib/types";

export type { DomainSnapshot } from "@/lib/server/hotel-service";

export async function loadDomainSnapshot() {
  return hotel.getDomainSnapshot();
}

export async function syncSetHourlyRate(rate: number) {
  await hotel.setHourlyRate(rate);
}

export async function syncSetOrderStatus(
  orderId: string,
  status: Order["status"],
) {
  await hotel.setOrderStatus(orderId, status);
}

export async function syncCreateOrder(order: Order) {
  await hotel.createOrder({
    id: order.id,
    roomNumber: order.roomNumber,
    createdAt: order.createdAt,
    status: order.status,
    notes: order.notes ?? null,
    items: order.items,
  });
}

export async function syncUpdateRoomStatus(roomId: string, status: RoomStatus) {
  await hotel.updateRoomById(roomId, { status });
}

export async function syncManagementRoomSessionStart(
  roomId: string,
  durationHours: number,
) {
  await hotel.applyManagementRoomSessionStart(roomId, durationHours);
}

export async function syncManagementRoomSessionEnd(roomId: string) {
  await hotel.applyManagementRoomSessionEnd(roomId);
}

export async function syncGuestSessionStart(
  roomNumber: string,
  durationHours: number,
) {
  await hotel.applyGuestSessionStart(roomNumber, durationHours);
}

export async function syncGuestSessionExtend(
  roomNumber: string,
  sessionEndsAt: number,
) {
  await hotel.applyGuestSessionExtend(roomNumber, sessionEndsAt);
}

export async function syncGuestSessionEnd(roomNumber: string) {
  await hotel.applyGuestSessionEnd(roomNumber);
}

export async function syncPanic(alert: PanicAlert) {
  await hotel.createPanicAlert(alert);
}

export async function syncClearPanics() {
  await hotel.clearAllPanics();
}

export async function syncClearPanicAlert(id: string) {
  await hotel.deletePanicAlert(id);
}

export async function syncAddCategory(category: Category) {
  await hotel.createCategory(category);
}

export async function syncUpdateCategory(category: Category) {
  await hotel.updateCategory(category);
}

export async function syncDeleteCategory(categoryId: string) {
  await hotel.deleteCategory(categoryId);
}

export async function syncAddProduct(product: Product) {
  await hotel.createProduct(product);
}

export async function syncUpdateProduct(product: Product) {
  await hotel.updateProduct(product);
}

export async function syncDeleteProduct(productId: string) {
  await hotel.deleteProduct(productId);
}

export async function syncSetProductAvailability(
  productId: string,
  available: boolean,
) {
  await hotel.setProductAvailability(productId, available);
}

export async function syncAddRoom(room: Room) {
  await hotel.createRoom(room);
}

export async function syncDeleteRoom(roomId: string) {
  await hotel.deleteRoom(roomId);
}

export async function syncSubmitGuestRating(rating: GuestRating) {
  await hotel.createGuestRating(rating);
}
