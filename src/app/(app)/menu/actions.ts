"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { can, type Permission } from "@/lib/permissions";
import { getPlanInfo } from "@/lib/plans";

async function requireUser(perm: Permission = "menu") {
  const user = await getSessionUser();
  if (!user) throw new Error("Session expirée");
  if (!can(user, perm)) throw new Error("Non autorisé");
  return user;
}

export async function addCategoryAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const count = await prisma.category.count({
    where: { restaurantId: user.restaurantId },
  });

  await prisma.category.upsert({
    where: {
      restaurantId_name: { restaurantId: user.restaurantId, name },
    },
    update: {},
    create: { restaurantId: user.restaurantId, name, position: count },
  });

  revalidatePath("/menu");
  revalidatePath("/caisse");
}

export async function deleteCategoryAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.category.deleteMany({
    where: { id, restaurantId: user.restaurantId },
  });
  revalidatePath("/menu");
  revalidatePath("/caisse");
}

export async function addProductAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const price = parseInt(String(formData.get("price") ?? ""), 10);
  const categoryId = String(formData.get("categoryId") ?? "");
  if (!name || Number.isNaN(price) || price <= 0) return;

  // Limite du plan : nombre maximum de plats
  const info = getPlanInfo(user.restaurant);
  const productsCount = await prisma.product.count({
    where: { restaurantId: user.restaurantId },
  });
  if (productsCount >= info.limits.products) {
    redirect("/menu?error=limite");
  }

  await prisma.product.create({
    data: {
      restaurantId: user.restaurantId,
      categoryId: categoryId || null,
      name,
      price,
    },
  });

  revalidatePath("/menu");
  revalidatePath("/caisse");
}

export async function toggleProductAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const product = await prisma.product.findFirst({
    where: { id, restaurantId: user.restaurantId },
  });
  if (!product) return;

  await prisma.product.update({
    where: { id: product.id },
    data: { available: !product.available },
  });
  revalidatePath("/menu");
  revalidatePath("/caisse");
}

export async function updatePriceAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const price = parseInt(String(formData.get("price") ?? ""), 10);
  if (Number.isNaN(price) || price <= 0) return;

  await prisma.product.updateMany({
    where: { id, restaurantId: user.restaurantId },
    data: { price },
  });
  revalidatePath("/menu");
  revalidatePath("/caisse");
}

export async function deleteProductAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.product.deleteMany({
    where: { id, restaurantId: user.restaurantId },
  });
  revalidatePath("/menu");
  revalidatePath("/caisse");
}