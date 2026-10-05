// Script one-off : attribue un slug public aux restaurants qui n'en ont pas.
// Usage : npx tsx scripts/backfill-slugs.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function main() {
  const restaurants = await prisma.restaurant.findMany({ where: { slug: null } });
  for (const restaurant of restaurants) {
    let candidate = slugify(restaurant.name) || "restaurant";
    let i = 1;
    while (await prisma.restaurant.findUnique({ where: { slug: candidate } })) {
      i += 1;
      candidate = `${slugify(restaurant.name)}-${i}`;
    }
    await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: { slug: candidate },
    });
    console.log(`✓ ${restaurant.name} -> /r/${candidate}`);
  }
  if (restaurants.length === 0) console.log("Aucun restaurant à mettre à jour.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());