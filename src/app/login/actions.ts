"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Veuillez remplir tous les champs." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { restaurant: true },
  });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Email ou mot de passe incorrect." };
  }

  // Super-admin : espace de supervision dédié
  if (user.role === "SUPERADMIN") {
    await createSession(user.id);
    redirect("/admin");
  }

  // Restaurant suspendu par le super-admin : connexion bloquée
  if (user.restaurant && !user.restaurant.active) {
    return {
      error: "Ce restaurant est actuellement suspendu. Contactez le support RestoKonect.",
    };
  }

  await createSession(user.id);
  redirect("/dashboard");
}