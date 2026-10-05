"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { can, type Permission } from "@/lib/permissions";

async function requireUser(perm: Permission = "stock") {
  const user = await getSessionUser();
  if (!user) throw new Error("Session expirée");
  if (!can(user, perm)) throw new Error("Non autorisé");
  return user;
}

export async function addStockItemAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "unité").trim() || "unité";
  const qty = parseFloat(String(formData.get("qty") ?? "0"));
  const alertThreshold = parseFloat(String(formData.get("alertThreshold") ?? "0"));
  if (!name || Number.isNaN(qty)) return;

  await prisma.stockItem.upsert({
    where: { restaurantId_name: { restaurantId: user.restaurantId, name } },
    update: { unit, alertThreshold: Number.isNaN(alertThreshold) ? 0 : alertThreshold },
    create: {
      restaurantId: user.restaurantId,
      name,
      unit,
      qty: Math.max(0, qty),
      alertThreshold: Number.isNaN(alertThreshold) ? 0 : alertThreshold,
    },
  });

  revalidatePath("/stock");
}

export async function recordMovementAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const type = String(formData.get("type") ?? "ENTREE"); // ENTREE | SORTIE | AJUSTEMENT
  const qty = parseFloat(String(formData.get("qty") ?? ""));
  const reason = String(formData.get("reason") ?? "").trim() || null;
  if (Number.isNaN(qty)) return;

  const item = await prisma.stockItem.findFirst({
    where: { id, restaurantId: user.restaurantId },
  });
  if (!item) return;

  let newQty = item.qty;
  if (type === "ENTREE") newQty = item.qty + Math.abs(qty);
  else if (type === "SORTIE") newQty = Math.max(0, item.qty - Math.abs(qty));
  else newQty = Math.max(0, qty); // AJUSTEMENT = nouvelle quantité directe

  await prisma.$transaction([
    prisma.stockItem.update({ where: { id: item.id }, data: { qty: newQty } }),
    prisma.stockMovement.create({
      data: { stockItemId: item.id, type: type as never, qty: Math.abs(qty), reason },
    }),
  ]);

  revalidatePath("/stock");
}

export async function deleteStockItemAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.stockItem.deleteMany({
    where: { id, restaurantId: user.restaurantId },
  });
  revalidatePath("/stock");
}