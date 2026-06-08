import type { Order, Room } from "@/lib/types";

export function orderTotals(order: Order, rooms: Room[], hourlyRate: number) {
  const room = rooms.find((r) => r.number === order.roomNumber);
  const durationHours = room?.durationHours ?? 0;
  const roomCostSrd = durationHours * hourlyRate;
  const orderSubtotal = order.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  return {
    durationHours,
    roomCostSrd,
    orderSubtotal,
    grandTotal: roomCostSrd + orderSubtotal,
  };
}
