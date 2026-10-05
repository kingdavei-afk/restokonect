"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { can, isRole } from "@/lib/permissions";

export type EquipeState = { error?: string; success?: string };

export async function createUserAction(
  _prev: EquipeState,
  formData: FormData
): Promise<EquipeState> {
  const user = await getSessionUser();
  if (!user) return { error: "Session expirée, reconnectez-vous." };
  if (!can(user, "equipe")) return { error: "Non autorisé." };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "SERVEUR");

  if (!name || !email || !password) {
    return { error: "Veuillez remplir tous les champs." };
  }
  if (password.length < 6) {
    return { error: "Le mot de passe doit contenir au moins 6 caractères." };
  }
  if (!isRole(role)) return { error: "Rôle invalide." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Un compte existe déjà avec cet email." };

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role,
      restaurantId: user.restaurantId,
    },
  });

  revalidatePath("/equipe");
  return { success: `Compte ${email} créé (${role}).` };
}

export async function deleteUserAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Session expirée");
  if (!can(user, "equipe")) throw new Error("Non autorisé");

  const id = String(formData.get("id") ?? "");
  if (id === user.id) return; // on ne peut pas supprimer son propre compte

  await prisma.user.deleteMany({
    where: { id, restaurantId: user.restaurantId },
  });

  revalidatePath("/equipe");
}