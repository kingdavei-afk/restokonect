"use server";

import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

export type CartInput = { productId: string; qty: number };
export type OrderTypeStr = "SUR_PLACE" | "EMPORTER" | "LIVRAISON";
export type PaymentMethodStr = "ESPECES" | "MOBILE_MONEY" | "CARTE" | "AUTRE";

export type CreateOrderResult =
  | { ok: true; id: string; number: number; total: number }
  | { ok: false; error: string };

// Créer une commande : soit payée immédiatement, soit mise en attente (ouverte)
export async function createOrderAction(input: {
  items: CartInput[];
  type: OrderTypeStr;
  payNow: boolean;
  paymentMethod?: PaymentMethodStr;
}): Promise<CreateOrderResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Session expirée, reconnectez-vous." };
  if (!can(user, "caisse")) return { ok: false, error: "Non autorisé." };

  if (!input.items.length) return { ok: false, error: "Le ticket est vide." };
  if (input.payNow && !input.paymentMethod) {
    return { ok: false, error: "Choisissez un mode de paiement." };
  }
  if (input.payNow && !can(user, "caisse.pay")) {
    return { ok: false, error: "Vous n'avez pas le droit d'encaisser." };
  }

  const ids = input.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, restaurantId: user.restaurantId },
  });
  if (products.length === 0) {
    return { ok: false, error: "Aucun plat valide dans le ticket." };
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

  if (!lines.length) return { ok: false, error: "Aucun plat valide dans le ticket." };

  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);

  const last = await prisma.order.findFirst({ orderBy: { number: "desc" } });
  const number = (last?.number ?? 0) + 1;

  const order = await prisma.order.create({
    data: {
      restaurantId: user.restaurantId,
      number,
      type: input.type,
      status: input.payNow ? "PAYEE" : "OUVERTE",
      paymentMethod: input.payNow ? (input.paymentMethod as never) : null,
      total,
      paidAt: input.payNow ? new Date() : null,
      items: { create: lines },
    },
  });

  return { ok: true, id: order.id, number: order.number, total };
}

// Encaisser une commande mise en attente
export async function payOrderAction(
  orderId: string,
  paymentMethod: PaymentMethodStr
): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Session expirée, reconnectez-vous." };
  if (!can(user, "caisse.pay")) {
    return { ok: false, error: "Vous n'avez pas le droit d'encaisser." };
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId: user.restaurantId, status: "OUVERTE" },
  });
  if (!order) return { ok: false, error: "Commande introuvable ou déjà traitée." };

  await prisma.order.update({
    where: { id: order.id },
    data: { status: "PAYEE", paymentMethod, paidAt: new Date() },
  });
  return { ok: true };
}

// Annuler une commande ouverte
export async function cancelOrderAction(
  orderId: string
): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Session expirée, reconnectez-vous." };
  if (!can(user, "caisse.pay")) {
    return { ok: false, error: "Vous n'avez pas le droit d'annuler une commande." };
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId: user.restaurantId, status: "OUVERTE" },
  });
  if (!order) return { ok: false, error: "Commande introuvable ou déjà traitée." };

  await prisma.order.update({
    where: { id: order.id },
    data: { status: "ANNULEE" },
  });
  return { ok: true };
}