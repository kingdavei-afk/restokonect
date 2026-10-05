import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import MenuClient, { type PublicCategory } from "./menu-client";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await prisma.restaurant.findUnique({ where: { slug } });
  return { title: restaurant ? `${restaurant.name} — Menu` : "Menu introuvable" };
}

export default async function PublicMenuPage({ params }: Props) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      categories: {
        orderBy: { position: "asc" },
        include: {
          products: { where: { available: true }, orderBy: { name: "asc" } },
        },
      },
    },
  });

  if (!restaurant?.slug) notFound();

  const categories: PublicCategory[] = restaurant.categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    products: cat.products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
    })),
  }));

  return (
    <main>
      <MenuClient
        slug={restaurant.slug}
        restaurantName={restaurant.name}
        whatsappNumber={restaurant.whatsappNumber}
        categories={categories}
      />
    </main>
  );
}