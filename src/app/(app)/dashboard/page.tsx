import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatFCFA, formatDateTime } from "@/lib/format";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [paidOrders, openOrders, topItems] = await Promise.all([
    prisma.order.findMany({
      where: {
        restaurantId: user.restaurantId,
        status: "PAYEE",
        paidAt: { gte: startOfDay },
      },
      orderBy: { paidAt: "desc" },
      take: 10,
    }),
    prisma.order.count({
      where: { restaurantId: user.restaurantId, status: "OUVERTE" },
    }),
    prisma.orderItem.groupBy({
      by: ["name"],
      where: {
        order: {
          restaurantId: user.restaurantId,
          status: "PAYEE",
          paidAt: { gte: startOfDay },
        },
      },
      _sum: { qty: true },
      orderBy: { _sum: { qty: "desc" } },
      take: 5,
    }),
  ]);

  const caJour = paidOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold">Tableau de bord</h1>
      <p className="mt-1 text-sm text-stone-500">
        Activité du jour — {user.restaurant.name}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-stone-500">Encaissé aujourd&apos;hui</p>
          <p className="mt-2 text-2xl font-bold text-orange-600">
            {formatFCFA(caJour)}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {paidOrders.length} ticket(s) encaissé(s)
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-stone-500">Commandes ouvertes</p>
          <p className="mt-2 text-2xl font-bold">{openOrders}</p>
          <p className="mt-1 text-xs text-stone-500">À encaisser à la caisse</p>
          {openOrders > 0 && (
            <Link
              href="/caisse"
              className="mt-2 inline-block text-xs font-semibold text-orange-600 hover:underline"
            >
              Ouvrir la caisse →
            </Link>
          )}
        </div>
        <div className="card">
          <p className="text-sm text-stone-500">Panier moyen</p>
          <p className="mt-2 text-2xl font-bold">
            {formatFCFA(
              paidOrders.length ? Math.round(caJour / paidOrders.length) : 0
            )}
          </p>
          <p className="mt-1 text-xs text-stone-500">Sur les tickets du jour</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold">Top plats du jour</h2>
          {topItems.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">
              Aucune vente enregistrée aujourd&apos;hui.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {topItems.map((item) => (
                <li
                  key={item.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{item.name}</span>
                  <span className="font-semibold">
                    {item._sum.qty ?? 0} vendu(s)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold">Derniers tickets encaissés</h2>
          {paidOrders.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">
              Aucun ticket encaissé aujourd&apos;hui.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {paidOrders.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>
                    Ticket #{order.number}{" "}
                    <span className="text-stone-500">
                      · {order.paidAt ? formatDateTime(order.paidAt) : ""}
                    </span>
                  </span>
                  <span className="font-semibold">
                    {formatFCFA(order.total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}