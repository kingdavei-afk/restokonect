import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDateFr } from "@/lib/format";
import { formatFCFA } from "@/lib/format";
import { getPlanInfo } from "@/lib/plans";

export default async function AdminRestaurantsPage() {
  const [restaurants, caByResto] = await Promise.all([
    prisma.restaurant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { users: true, products: true, orders: true } },
      },
    }),
    prisma.order.groupBy({
      by: ["restaurantId"],
      where: { status: "PAYEE" },
      _sum: { total: true },
    }),
  ]);

  const caMap = new Map(caByResto.map((r) => [r.restaurantId, r._sum.total ?? 0]));

  return (
    <div>
      <h1 className="text-2xl font-bold">Restaurants ({restaurants.length})</h1>
      <p className="mt-1 text-sm text-stone-500">
        Tous les restaurants inscrits sur la plateforme. Cliquez sur un nom pour
        gérer ses détails.
      </p>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-xs text-stone-500 uppercase">
              <th className="py-2 pr-3">Restaurant</th>
              <th className="py-2 pr-3">Inscrit le</th>
              <th className="py-2 pr-3">Comptes</th>
              <th className="py-2 pr-3">Plats</th>
              <th className="py-2 pr-3">Commandes</th>
              <th className="py-2 pr-3">CA cumulé</th>
              <th className="py-2 pr-3">Statut</th>
              <th className="py-2 pr-3">Plan</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {restaurants.length === 0 && (
              <tr>
                <td colSpan={8} className="py-4 text-center text-stone-500">
                  Aucun restaurant inscrit pour le moment.
                </td>
              </tr>
            )}
            {restaurants.map((r) => (
              <tr key={r.id}>
                <td className="py-2.5 pr-3">
                  <Link
                    href={`/admin/restaurants/${r.id}`}
                    className="font-semibold hover:text-orange-600"
                  >
                    {r.name}
                  </Link>
                  {r.slug && (
                    <span className="block text-xs text-stone-500">/r/{r.slug}</span>
                  )}
                </td>
                <td className="py-2.5 pr-3 text-stone-600">
                  {formatDateFr(r.createdAt)}
                </td>
                <td className="py-2.5 pr-3">{r._count.users}</td>
                <td className="py-2.5 pr-3">{r._count.products}</td>
                <td className="py-2.5 pr-3">{r._count.orders}</td>
                <td className="py-2.5 pr-3 font-semibold">
                  {formatFCFA(caMap.get(r.id) ?? 0)}
                </td>
                <td className="py-2.5 pr-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      r.active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {r.active ? "Actif" : "Suspendu"}
                  </span>
                </td>
                <td className="py-2.5 pr-3">
                  <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-semibold text-stone-700">
                    {getPlanInfo(r).limits.label}
                  </span>
                </td>
                <td className="py-2.5">
                  <Link
                    href={`/admin/restaurants/${r.id}`}
                    className="font-semibold text-orange-600 hover:underline"
                  >
                    Gérer →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}