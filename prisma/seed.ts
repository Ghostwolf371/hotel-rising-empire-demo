import { getPrisma } from "../lib/server/prisma";
import {
  defaultCatalog,
  defaultCategories,
  HOURLY_RATE_SRD,
  initialOrders,
  initialRooms,
} from "../lib/mock-data";

const prisma = getPrisma();

async function main() {
  await prisma.orderLine.deleteMany();
  await prisma.order.deleteMany();
  await prisma.panicAlert.deleteMany();
  await prisma.guestRating.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.room.deleteMany();

  await prisma.siteConfig.upsert({
    where: { id: 1 },
    create: { id: 1, hourlyRate: HOURLY_RATE_SRD },
    update: { hourlyRate: HOURLY_RATE_SRD },
  });

  for (const c of defaultCategories) {
    await prisma.category.create({
      data: { id: c.id, name: c.name, color: c.color },
    });
  }

  for (const p of defaultCatalog) {
    await prisma.product.create({
      data: {
        id: p.id,
        name: p.name,
        priceSrd: p.priceSrd,
        categoryId: p.category,
        image: p.image,
        available: p.available,
      },
    });
  }

  for (const r of initialRooms()) {
    await prisma.room.create({
      data: {
        id: r.id,
        number: r.number,
        status: r.status,
        sessionStartedAt: r.sessionStartedAt ?? null,
        sessionEndsAt: r.sessionEndsAt ?? null,
        durationHours: r.durationHours ?? null,
      },
    });
  }

  for (const o of initialOrders()) {
    await prisma.order.create({
      data: {
        id: o.id,
        roomNumber: o.roomNumber,
        createdAt: o.createdAt,
        status: o.status,
        notes: o.notes ?? null,
        lines: {
          create: o.items.map((it) => ({
            productId: it.productId,
            name: it.name,
            qty: it.qty,
            unitPrice: it.unitPrice,
          })),
        },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
