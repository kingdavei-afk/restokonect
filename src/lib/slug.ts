import { prisma } from "./db";

// "Maquis Chez Tantie" -> "maquis-chez-tantie"
export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

// Génère un slug unique, avec suffixe -2, -3... si besoin
export async function uniqueSlug(name: string) {
  const base = slugify(name) || "restaurant";
  let candidate = base;
  let i = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.restaurant.findUnique({
      where: { slug: candidate },
    });
    if (!existing) return candidate;
    i += 1;
    candidate = `${base}-${i}`;
  }
}