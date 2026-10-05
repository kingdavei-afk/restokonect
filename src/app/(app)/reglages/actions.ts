"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { uniqueSlug } from "@/lib/slug";

// Nettoie le numéro : garde uniquement les chiffres (format international sans +)
function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

export async function updateSettingsAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Session expirée");
  if (!can(user, "settings")) throw new Error("Non autorisé");

  const name = String(formData.get("name") ?? "").trim();
  const rawPhone = String(formData.get("whatsappNumber") ?? "").trim();
  const whatsappNumber = rawPhone ? normalizePhone(rawPhone) : null;

  if (!name) return;
  if (rawPhone && !whatsappNumber) return; // numéro invalide : on ignore

  const data: { name: string; whatsappNumber: string | null; slug?: string } = {
    name,
    whatsappNumber,
  };

  // S'assure que le restaurant a un slug public (ne régénère pas un slug existant :
  // les QR codes imprimés doivent rester valides)
  if (!user.restaurant.slug) {
    data.slug = await uniqueSlug(name);
  }

  await prisma.restaurant.update({
    where: { id: user.restaurantId },
    data,
  });

  revalidatePath("/reglages");
  revalidatePath("/dashboard");
}