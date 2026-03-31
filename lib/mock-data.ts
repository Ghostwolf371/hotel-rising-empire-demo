import type { Category, Order, Product, Room } from "./types";

export const HOURLY_RATE_SRD = 75;

export const initialRooms = (): Room[] =>
  Array.from({ length: 12 }, (_, i) => {
    const n = 101 + i;
    const id = `room-${n}`;
    if (n === 101) {
      const now = Date.now();
      const end = now + 90 * 60 * 1000;
      return {
        id,
        number: String(n),
        status: "occupied" as const,
        sessionStartedAt: now - 30 * 60 * 1000,
        sessionEndsAt: end,
        durationHours: 2,
      };
    }
    if (n === 102) {
      return { id, number: String(n), status: "cleaning" as const };
    }
    if (n === 103) {
      return { id, number: String(n), status: "maintenance" as const };
    }
    return { id, number: String(n), status: "available" as const };
  });

export const defaultCategories: Category[] = [
  { id: "drink", name: "Drinks", nameNl: "Dranken", color: "sky" },
  { id: "snack", name: "Snacks", nameNl: "Snacks", color: "amber" },
  { id: "other", name: "Other", nameNl: "Overig", color: "purple" },
];

export const defaultCatalog: Product[] = [
  {
    id: "p1",
    name: "Coca Cola",
    nameNl: "Coca Cola",
    priceSrd: 21,
    category: "drink",
    image: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=300&fit=crop",
    available: true,
  },
  {
    id: "p2",
    name: "Orange Juice",
    nameNl: "Sinaasappelsap",
    priceSrd: 18,
    category: "drink",
    image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=300&fit=crop",
    available: true,
  },
  {
    id: "p3",
    name: "Sparkling Water",
    nameNl: "Bruisend water",
    priceSrd: 12,
    category: "drink",
    image: "https://images.unsplash.com/photo-1559839914-17aae19cec71?w=400&h=300&fit=crop",
    available: true,
  },
  {
    id: "p4",
    name: "Chocolate",
    nameNl: "Chocolade",
    priceSrd: 13,
    category: "snack",
    image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&h=300&fit=crop",
    available: true,
  },
  {
    id: "p5",
    name: "Mixed Nuts",
    nameNl: "Notenmix",
    priceSrd: 22,
    category: "snack",
    image: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&h=300&fit=crop",
    available: true,
  },
  {
    id: "p6",
    name: "Energy Bar",
    nameNl: "Energy reep",
    priceSrd: 15,
    category: "snack",
    image: "https://images.unsplash.com/photo-1622484212850-eb596d769edc?w=400&h=300&fit=crop",
    available: true,
  },
];

function d(daysAgo: number, hour: number, min = 0): number {
  const t = new Date();
  t.setDate(t.getDate() - daysAgo);
  t.setHours(hour, min, 0, 0);
  return t.getTime();
}

export const initialOrders = (): Order[] => [
  // Today
  { id: "o01", roomNumber: "101", createdAt: d(0, 10, 15), status: "processing",
    items: [{ productId: "p1", name: "Coca Cola", qty: 2, unitPrice: 21 }, { productId: "p4", name: "Chocolate", qty: 1, unitPrice: 13 }] },
  { id: "o02", roomNumber: "104", createdAt: d(0, 12, 30), status: "processing",
    items: [{ productId: "p2", name: "Orange Juice", qty: 1, unitPrice: 18 }, { productId: "p5", name: "Mixed Nuts", qty: 2, unitPrice: 22 }] },
  { id: "o03", roomNumber: "108", createdAt: d(0, 14, 0), status: "completed",
    items: [{ productId: "p3", name: "Sparkling Water", qty: 3, unitPrice: 12 }] },
  { id: "o04", roomNumber: "101", createdAt: d(0, 18, 20), status: "processing",
    items: [{ productId: "p6", name: "Energy Bar", qty: 2, unitPrice: 15 }, { productId: "p1", name: "Coca Cola", qty: 1, unitPrice: 21 }] },
  // Yesterday
  { id: "o05", roomNumber: "105", createdAt: d(1, 9, 0), status: "completed",
    items: [{ productId: "p1", name: "Coca Cola", qty: 3, unitPrice: 21 }] },
  { id: "o06", roomNumber: "102", createdAt: d(1, 11, 45), status: "completed",
    items: [{ productId: "p4", name: "Chocolate", qty: 2, unitPrice: 13 }, { productId: "p2", name: "Orange Juice", qty: 1, unitPrice: 18 }] },
  { id: "o07", roomNumber: "106", createdAt: d(1, 14, 30), status: "completed",
    items: [{ productId: "p5", name: "Mixed Nuts", qty: 1, unitPrice: 22 }, { productId: "p3", name: "Sparkling Water", qty: 2, unitPrice: 12 }] },
  { id: "o08", roomNumber: "101", createdAt: d(1, 20, 0), status: "completed",
    items: [{ productId: "p1", name: "Coca Cola", qty: 2, unitPrice: 21 }, { productId: "p6", name: "Energy Bar", qty: 1, unitPrice: 15 }] },
  // 2 days ago
  { id: "o09", roomNumber: "103", createdAt: d(2, 10, 0), status: "completed",
    items: [{ productId: "p2", name: "Orange Juice", qty: 2, unitPrice: 18 }] },
  { id: "o10", roomNumber: "107", createdAt: d(2, 13, 0), status: "completed",
    items: [{ productId: "p1", name: "Coca Cola", qty: 1, unitPrice: 21 }, { productId: "p4", name: "Chocolate", qty: 3, unitPrice: 13 }] },
  { id: "o11", roomNumber: "104", createdAt: d(2, 18, 15), status: "completed",
    items: [{ productId: "p5", name: "Mixed Nuts", qty: 2, unitPrice: 22 }, { productId: "p6", name: "Energy Bar", qty: 1, unitPrice: 15 }] },
  // 3 days ago
  { id: "o12", roomNumber: "108", createdAt: d(3, 12, 0), status: "completed",
    items: [{ productId: "p3", name: "Sparkling Water", qty: 4, unitPrice: 12 }] },
  { id: "o13", roomNumber: "105", createdAt: d(3, 15, 30), status: "completed",
    items: [{ productId: "p1", name: "Coca Cola", qty: 2, unitPrice: 21 }, { productId: "p2", name: "Orange Juice", qty: 1, unitPrice: 18 }] },
  // 5 days ago
  { id: "o14", roomNumber: "101", createdAt: d(5, 11, 0), status: "completed",
    items: [{ productId: "p4", name: "Chocolate", qty: 2, unitPrice: 13 }] },
  { id: "o15", roomNumber: "106", createdAt: d(5, 20, 0), status: "completed",
    items: [{ productId: "p1", name: "Coca Cola", qty: 3, unitPrice: 21 }, { productId: "p5", name: "Mixed Nuts", qty: 1, unitPrice: 22 }] },
  // 8 days ago
  { id: "o16", roomNumber: "102", createdAt: d(8, 14, 0), status: "completed",
    items: [{ productId: "p2", name: "Orange Juice", qty: 2, unitPrice: 18 }, { productId: "p6", name: "Energy Bar", qty: 2, unitPrice: 15 }] },
  { id: "o17", roomNumber: "109", createdAt: d(8, 18, 0), status: "completed",
    items: [{ productId: "p1", name: "Coca Cola", qty: 1, unitPrice: 21 }] },
  // 15 days ago
  { id: "o18", roomNumber: "110", createdAt: d(15, 10, 0), status: "completed",
    items: [{ productId: "p3", name: "Sparkling Water", qty: 2, unitPrice: 12 }, { productId: "p4", name: "Chocolate", qty: 1, unitPrice: 13 }] },
  { id: "o19", roomNumber: "101", createdAt: d(15, 19, 30), status: "completed",
    items: [{ productId: "p1", name: "Coca Cola", qty: 4, unitPrice: 21 }] },
  // 25 days ago
  { id: "o20", roomNumber: "104", createdAt: d(25, 12, 0), status: "completed",
    items: [{ productId: "p5", name: "Mixed Nuts", qty: 3, unitPrice: 22 }, { productId: "p1", name: "Coca Cola", qty: 2, unitPrice: 21 }] },
  { id: "o21", roomNumber: "107", createdAt: d(25, 22, 0), status: "completed",
    items: [{ productId: "p2", name: "Orange Juice", qty: 1, unitPrice: 18 }, { productId: "p6", name: "Energy Bar", qty: 3, unitPrice: 15 }] },
];
