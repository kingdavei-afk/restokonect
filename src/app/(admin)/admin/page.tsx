import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDateTime, formatFCFA } from "@/lib/format";

export default async function AdminOverviewPage() {
  const [restaurants, usersCount, ordersAgg, caByResto, recentOrders, todayStart] =
    await Promise.all([
      prisma.restaurant.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { users: true, products: true, orders: true } },
        },
      }),
      prisma.user.count(),
      prisma.order.aggregate({
        where: { status: "PAYEE" },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.groupBy({
        by: ["restaurantId"],
        where: { status: "PAYEE" },
        _sum: { total: true },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { restaurant: true, items: true },
      }),
      (async () => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
      })(),
    ]);

  const todayAgg = await prisma.order.aggregate({
    where: { status: "PAYEE", paidAt: { gte: todayStart } },
    _sum: { total: true },
  });

  const caMap = new Map(caByResto.map((r) => [r.restaurantId, r._sum.total ?? 0]));
  const totalCA = ordersAgg._sum.total ?? 0;
  const activeCount = restaurants.filter((r) => r.active).length;

  const kpis = [
    { label: "Restaurants", value: String(restaurants.length), sub: `${activeCount} actif(s) · ${restaurants.length - activeCount} suspendu(s)` },
    { label: "Comptes utilisateurs", value: String(usersCount), sub: "Tous rôles confondus" },
    { label: "Commandes encaissées", value: String(ordersAgg._count), sub: "Depuis le lancement" },
    { label: "CA total plateforme", value: formatFCFA(totalCA), sub: `Aujourd'hui : ${formatFCFA(todayAgg._sum.total ?? 0)}` },
  ];

  const sorted = [...restaurants].sort(
    (a, b) => (caMap.get(b.id) ?? 0) - (caMap.get(a.id) ?? 0)
  );

  return (
    <div>
      <h1 className="text-2xl font-bold">Vue d&apos;ensemble</h1>
      <p className="mt-1 text-sm text-stone-500">
        Activité de toute la plateforme RestoKonect
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="card">
            <p className="text-sm text-stone-500">{kpi.label}</p>
            <p className="mt-2 text-2xl font-bold text-orange-600">{kpi.value}</p>
            <p className="mt-1 text-xs text-stone-500">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Restaurants par CA */}
      <div className="card mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Restaurants (par CA cumulé)</h2>
          <Link
            href="/admin/restaurants"
            className="text-sm font-semibold text-orange-600 hover:underline"
          >
            Tout gérer →
          </Link>
        </div>
        {sorted.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">Aucun restaurant inscrit.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-xs text-stone-500 uppercase">
                  <th className="py-2 pr-3">Restaurant</th>
                  <th className="py-2 pr-3">Comptes</th>
                  <th className="py-2 pr-3">Plats</th>
                  <th className="py-2 pr-3">Commandes</th>
                  <th className="py-2 pr-3">CA cumulé</th>
                  <th className="py-2 pr-3">Statut</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {sorted.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2.5 pr-3 font-semibold">{r.name}</td>
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
        )}
      </div>

      {/* Dernières commandes toutes restos */}
      <div className="card mt-8">
        <h2 className="font-semibold">Dernières commandes (tous restaurants)</h2>
        {recentOrders.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">Aucune commande.</p>
        ) : (
          <ul className="mt-3 divide-y divide-stone-100">
            {recentOrders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>
                  <span className="font-semibold">{o.restaurant.name}</span>{" "}
                  <span className="text-stone-500">
                    · ticket #{o.number} · {o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                  </span>
                </span>
                <span>
                  <span className="font-semibold">{formatFCFA(o.total)}</span>{" "}
                  <span
                    className={`ml-1 rounded px-1.5 py-0.5 text-xs font-semibold ${
                      o.status === "PAYEE"
                        ? "bg-green-100 text-green-800"
                        : o.status === "OUVERTE"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {o.status}
                  </span>{" "}
                  <span className="text-xs text-stone-500">
                    {formatDateTime(o.createdAt)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}