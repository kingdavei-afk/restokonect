// Créer (ou mettre à jour) le super-admin de la plateforme.
// Usage : npx tsx scripts/create-superadmin.ts <email> <motdepasse> <nom>
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const [email, password, name] = process.argv.slice(2);

if (!email || !password || !name) {
  console.error(
    "Usage : npx tsx scripts/create-superadmin.ts <email> <motdepasse> <nom>"
  );
  process.exit(1);
}

async function main() {
  const existing = await prisma.user.findUnique({ where: { email } });
  const passwordHash = await bcrypt.hash(password, 10);

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { role: "SUPERADMIN", passwordHash, restaurantId: null },
    });
    console.log(`✓ Compte existant promu SUPERADMIN : ${email}`);
    return;
  }

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: "SUPERADMIN",
      restaurantId: null,
    },
  });
  console.log(`✓ Super-admin créé : ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());