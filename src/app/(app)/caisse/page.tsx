import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import Pos, { type PosCategory, type PosOpenOrder } from "./pos";

export default async function CaissePage() {
  const user = await getSessionUser();
  if (!user) return null;

  const [categories, openOrdersRaw] = await Promise.all([
    prisma.category.findMany({
      where: { restaurantId: user.restaurantId },
      orderBy: { position: "asc" },
      include: { products: { orderBy: { name: "asc" } } },
    }),
    prisma.order.findMany({
      where: { restaurantId: user.restaurantId, status: "OUVERTE" },
      orderBy: { createdAt: "asc" },
      include: { items: true },
    }),
  ]);

  const categoriesData: PosCategory[] = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    products: cat.products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      available: p.available,
    })),
  }));

  const openOrders: PosOpenOrder[] = openOrdersRaw.map((o) => ({
    id: o.id,
    number: o.number,
    total: o.total,
    items: o.items.map((i) => ({ name: i.name, qty: i.qty })),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold">Caisse</h1>
      <p className="mt-1 mb-6 text-sm text-stone-500">
        Prenez les commandes et encaissez (espèces ou Mobile Money).
      </p>
      <Pos
        categories={categoriesData}
        openOrders={openOrders}
        canPay={can(user, "caisse.pay")}
      />
    </div>
  );
}