import { getPrisma } from "@/lib/server/prisma";
import type { OrderLine } from "@/lib/types";

export type OrderLineInput = {
  productId: string;
  qty: number;
};

export async function resolveOrderLinesFromCatalog(
  items: OrderLineInput[],
): Promise<OrderLine[]> {
  if (items.length === 0) throw new Error("Order must include at least one item");

  const prisma = getPrisma();
  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  return items.map((item) => {
    if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > 99) {
      throw new Error("Invalid quantity");
    }
    const product = byId.get(item.productId);
    if (!product) throw new Error(`Unknown product: ${item.productId}`);
    if (product.available === false) {
      throw new Error(`Product unavailable: ${product.name}`);
    }
    return {
      productId: product.id,
      name: product.name,
      qty: item.qty,
      unitPrice: product.priceSrd,
    };
  });
}
