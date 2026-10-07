"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { TRIAL_DAYS } from "@/lib/plans";
import { uniqueSlug } from "@/lib/slug";

export type RegisterState = { error?: string };

export async function registerAction(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const name = String(formData.get("name") ?? "").trim();
  const restaurantName = String(formData.get("restaurantName") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !restaurantName || !email || !password) {
    return { error: "Veuillez remplir tous les champs." };
  }
  if (password.length < 6) {
    return { error: "Le mot de passe doit contenir au moins 6 caractères." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Un compte existe déjà avec cet email." };
  }

  const restaurant = await prisma.restaurant.create({
    data: {
      name: restaurantName,
      slug: await uniqueSlug(restaurantName),
      plan: "TRIAL",
      trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role: "GERANT",
      restaurantId: restaurant.id,
    },
  });

  await createSession(user.id);
  redirect("/dashboard");
}