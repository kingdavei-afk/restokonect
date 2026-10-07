"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser, destroySession } from "@/lib/auth";

async function requireSuperAdmin() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "SUPERADMIN") redirect("/dashboard");
  return user;
}

export async function adminLogoutAction() {
  await destroySession();
  redirect("/login");
}

// Suspendre / réactiver un restaurant
export async function toggleRestaurantActiveAction(formData: FormData) {
  await requireSuperAdmin();
  const id = String(formData.get("id") ?? "");
  const restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant) return;

  await prisma.restaurant.update({
    where: { id: restaurant.id },
    data: { active: !restaurant.active },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/restaurants");
  revalidatePath(`/admin/restaurants/${id}`);
}

// Supprimer définitivement un restaurant et toutes ses données
export async function deleteRestaurantAction(formData: FormData) {
  await requireSuperAdmin();
  const id = String(formData.get("id") ?? "");
  await prisma.restaurant.deleteMany({ where: { id } });

  revalidatePath("/admin");
  revalidatePath("/admin/restaurants");
  redirect("/admin/restaurants");
}