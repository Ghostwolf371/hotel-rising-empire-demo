import { z } from "zod";

export const orderStatusZ = z.enum(["processing", "completed"]);
export const roomStatusZ = z.enum([
  "available",
  "occupied",
  "cleaning",
  "maintenance",
]);

export const orderLineZ = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  qty: z.number().int().positive(),
  unitPrice: z.number(),
});

export const createOrderZ = z.object({
  roomNumber: z.string().min(1),
  items: z.array(orderLineZ).min(1),
  notes: z.string().optional(),
  status: orderStatusZ.optional().default("processing"),
});

export const patchOrderZ = z.object({
  status: orderStatusZ,
});

export const categoryWriteZ = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color: z.string().min(1),
});

export const productWriteZ = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  priceSrd: z.number().int().nonnegative(),
  category: z.string().min(1),
  image: z.string(),
  available: z.boolean().optional().default(true),
});

export const patchHourlyRateZ = z.object({
  hourlyRate: z.number().int().positive().max(1_000_000),
});

export const roomWriteZ = z.object({
  id: z.string().min(1),
  number: z.string().min(1),
  status: roomStatusZ,
  sessionStartedAt: z.number().optional(),
  sessionEndsAt: z.number().optional(),
  durationHours: z.number().optional(),
});

export const patchRoomZ = z
  .object({
    status: roomStatusZ.optional(),
    sessionStartedAt: z.number().nullable().optional(),
    sessionEndsAt: z.number().nullable().optional(),
    durationHours: z.number().nullable().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "empty patch" });

export const guestRatingZ = z.object({
  id: z.string().min(1).optional(),
  roomNumber: z.string().min(1),
  cleanliness: z.number().int().min(1).max(5),
  comfort: z.number().int().min(1).max(5),
  service: z.number().int().min(1).max(5),
});

export const panicCreateZ = z.object({
  id: z.string().min(1).optional(),
  roomNumber: z.string().min(1),
  at: z.number().optional(),
});
