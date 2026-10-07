import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import ClosureForm, { type ClosureItem } from "./closure-form";

export default async function CloturePage() {
  const user = await getSessionUser();
  if (!user) return null;
  if (!can(user, "stock")) redirect("/dashboard");

  const items = await prisma.stockItem.findMany({
    where: { restaurantId: user.restaurantId },
    orderBy: { name: "asc" },
  });

  const closureItems: ClosureItem[] = items.map((item) => ({
    id: item.id,
    name: item.name,
    unit: item.unit,
    qty: item.qty,
    packName: item.packName,
    packSize: item.packSize,
  }));

  return (
    <div>
      <Link
        href="/stock"
        className="text-sm font-semibold text-stone-500 hover:text-orange-600"
      >
        ← Retour au stock
      </Link>
      <h1 className="mt-2 text-2xl font-bold">Clôture du jour</h1>
      <p className="mt-1 mb-6 max-w-2xl text-sm text-stone-500">
        Comptez physiquement chaque article et saisissez la quantité réelle.
        Les écarts sont calculés automatiquement, puis enregistrés comme
        ajustements signés à votre nom en un seul clic.
      </p>
      <ClosureForm items={closureItems} />
    </div>
  );
}