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
  const packName = String(formData.get("packName") ?? "").trim() || null;
  const packSizeRaw = String(formData.get("packSize") ?? "").trim();
  const packSize = packSizeRaw ? parseFloat(packSizeRaw) : null;
  if (!name || Number.isNaN(qty)) return;
  const validPackSize = packSize && !Number.isNaN(packSize) && packSize > 0 ? packSize : null;

  await prisma.stockItem.upsert({
    where: { restaurantId_name: { restaurantId: user.restaurantId, name } },
    update: {
      unit,
      alertThreshold: Number.isNaN(alertThreshold) ? 0 : alertThreshold,
      packName,
      packSize: validPackSize,
    },
    create: {
      restaurantId: user.restaurantId,
      name,
      unit,
      qty: Math.max(0, qty),
      alertThreshold: Number.isNaN(alertThreshold) ? 0 : alertThreshold,
      packName,
      packSize: validPackSize,
    },
  });

  revalidatePath("/stock");
}

export async function recordMovementAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const type = String(formData.get("type") ?? "ENTREE"); // ENTREE | SORTIE | AJUSTEMENT
  const unitType = String(formData.get("unitType") ?? "unite"); // unite | pack
  const rawQty = parseFloat(String(formData.get("qty") ?? ""));
  const reason = String(formData.get("reason") ?? "").trim() || null;
  if (Number.isNaN(rawQty)) return;

  const item = await prisma.stockItem.findFirst({
    where: { id, restaurantId: user.restaurantId },
  });
  if (!item) return;

  // Saisie en packs (casier, carton...) : conversion en unités de base
  const qty =
    unitType === "pack" && item.packSize && item.packSize > 0
      ? rawQty * item.packSize
      : rawQty;

  let newQty = item.qty;
  if (type === "ENTREE") newQty = item.qty + Math.abs(qty);
  else if (type === "SORTIE") newQty = Math.max(0, item.qty - Math.abs(qty));
  else newQty = Math.max(0, qty); // AJUSTEMENT = nouvelle quantité directe

  // Motif enrichi quand la saisie est faite en packs (ex: "2 casiers" = 24)
  const finalReason =
    unitType === "pack" && item.packName
      ? `${reason ? reason + " — " : ""}${rawQty} ${item.packName}(s) = ${qty} ${item.unit}(s)`
      : reason;

  await prisma.$transaction([
    prisma.stockItem.update({ where: { id: item.id }, data: { qty: newQty } }),
    prisma.stockMovement.create({
      data: {
        stockItemId: item.id,
        type: type as never,
        qty: Math.abs(qty),
        reason: finalReason,
        userId: user.id, // traçabilité : qui a fait le mouvement
      },
    }),
  ]);

  revalidatePath("/stock");
}

// Clôture du jour : inventaire manuel de tous les articles validé en 1 clic.
// Pour chaque article dont la quantité comptée diffère du stock théorique,
// on crée un mouvement d'ajustement signé, puis on enregistre la clôture.
export async function closeDayAction(
  input: { items: { id: string; counted: number }[]; note: string }
): Promise<{ ok: true; adjusted: number } | { ok: false; error: string }> {
  const user = await requireUser();
  if (!input.items.length) {
    return { ok: false, error: "Aucun article à clôturer." };
  }

  const ids = input.items.map((i) => i.id);
  const items = await prisma.stockItem.findMany({
    where: { id: { in: ids }, restaurantId: user.restaurantId },
  });
  const itemById = new Map(items.map((i) => [i.id, i]));

  const dateLabel = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(new Date());
  const baseReason = `Clôture du ${dateLabel}${input.note.trim() ? ` — ${input.note.trim()}` : ""}`;

  let adjusted = 0;
  const operations: { id: string; qty: number }[] = [];
  const movements: {
    stockItemId: string;
    type: never;
    qty: number;
    reason: string;
    userId: string;
  }[] = [];

  for (const line of input.items) {
    const item = itemById.get(line.id);
    if (!item) continue;
    if (Math.abs(line.counted - item.qty) < 0.001) continue; // pas d'écart

    operations.push({ id: item.id, qty: Math.max(0, line.counted) });
    movements.push({
      stockItemId: item.id,
      type: "AJUSTEMENT" as never,
      qty: Math.abs(line.counted - item.qty),
      reason: baseReason,
      userId: user.id,
    });
    adjusted += 1;
  }

  await prisma.$transaction([
    ...operations.map((op) =>
      prisma.stockItem.update({ where: { id: op.id }, data: { qty: op.qty } })
    ),
    ...movements.map((m) => prisma.stockMovement.create({ data: m })),
    prisma.stockClosure.create({
      data: {
        restaurantId: user.restaurantId,
        userId: user.id,
        itemsAdjusted: adjusted,
        note: input.note.trim() || null,
      },
    }),
  ]);

  revalidatePath("/stock");
  revalidatePath("/stock/cloture");
  return { ok: true, adjusted };
}

export async function deleteStockItemAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.stockItem.deleteMany({
    where: { id, restaurantId: user.restaurantId },
  });
  revalidatePath("/stock");
}