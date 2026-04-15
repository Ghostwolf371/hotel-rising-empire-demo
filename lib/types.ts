export type RoomStatus = "available" | "occupied" | "cleaning" | "maintenance";

export type OrderStatus = "processing" | "completed";

export type ProductCategory = string;

export interface Category {
  id: string;
  name: string;
  nameNl: string;
  color: string;
}

export interface Product {
  id: string;
  name: string;
  nameNl: string;
  priceSrd: number;
  category: ProductCategory;
  image: string;
  available: boolean;
}

export interface OrderLine {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  roomNumber: string;
  createdAt: number;
  status: OrderStatus;
  items: OrderLine[];
  notes?: string;
}

export interface Room {
  id: string;
  number: string;
  status: RoomStatus;
  sessionEndsAt?: number;
  sessionStartedAt?: number;
  durationHours?: number;
}

export interface PanicAlert {
  id: string;
  roomNumber: string;
  at: number;
}

/** Guest post-stay star ratings (1–5); persisted for management reporting */
export interface GuestRating {
  id: string;
  roomNumber: string;
  submittedAt: number;
  cleanliness: number;
  comfort: number;
  service: number;
}

export const LOCALES = ["en", "nl", "es", "pt"] as const;
export type Locale = (typeof LOCALES)[number];

export function isLocale(value: unknown): value is Locale {
  return (LOCALES as readonly string[]).includes(value as string);
}

export type Theme = "dark" | "light";
