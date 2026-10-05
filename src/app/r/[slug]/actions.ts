"use server";

import { prisma } from "@/lib/db";

export type WhatsappOrderResult =
  | { ok: true; number: number; total: number }
  | { ok: false; error: string };

// Appelée depuis le menu public (client non connecté).
// Enregistre la commande dans le système (ouverte, à encaisser à la caisse)
// avant d'ouvrir WhatsApp côté client.
export async function createWhatsappOrderAction(input: {
  slug: string;
  items: { productId: string; qty: number }[];
  type: "SUR_PLACE" | "EMPORTER" | "LIVRAISON";
  name: string;
  table: string;
}): Promise<WhatsappOrderResult> {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: input.slug },
  });
  if (!restaurant) return { ok: false, error: "Restaurant introuvable." };
  if (!input.items.length) return { ok: false, error: "Le panier est vide." };

  const ids = input.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, restaurantId: restaurant.id, available: true },
  });
  if (products.length === 0) {
    return { ok: false, error: "Aucun plat disponible dans le panier." };
  }

  const priceById = new Map(products.map((p) => [p.id, p]));
  const lines = input.items
    .map((i) => {
      const product = priceById.get(i.productId);
      if (!product) return null;
      const qty = Math.max(1, Math.floor(i.qty));
      return { productId: product.id, name: product.name, unitPrice: product.price, qty };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);
  if (!lines.length) return { ok: false, error: "Aucun plat disponible dans le panier." };

  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);

  const noteParts = ["Commande WhatsApp"];
  if (input.name.trim()) noteParts.push(`Nom : ${input.name.trim()}`);
  if (input.table.trim()) noteParts.push(`Table : ${input.table.trim()}`);

  const last = await prisma.order.findFirst({ orderBy: { number: "desc" } });
  const number = (last?.number ?? 0) + 1;

  await prisma.order.create({
    data: {
      restaurantId: restaurant.id,
      number,
      type: input.type,
      status: "OUVERTE",
      note: noteParts.join(" — "),
      total,
      items: { create: lines },
    },
  });

  return { ok: true, number, total };
}