import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDateFr, formatDateTime, formatFCFA } from "@/lib/format";
import {
  toggleRestaurantActiveAction,
} from "../../../actions";
import ConfirmDelete from "./confirm-delete";

export default async function AdminRestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      users: { orderBy: { createdAt: "asc" } },
      _count: {
        select: { products: true, categories: true, orders: true, employees: true, stockItems: true },
      },
    },
  });
  if (!restaurant) notFound();

  const [paidAgg, recentOrders, topItems] = await Promise.all([
    prisma.order.aggregate({
      where: { restaurantId: restaurant.id, status: "PAYEE" },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { items: true },
    }),
    prisma.orderItem.groupBy({
      by: ["name"],
      where: { order: { restaurantId: restaurant.id, status: "PAYEE" } },
      _sum: { qty: true },
      orderBy: { _sum: { qty: "desc" } },
      take: 5,
    }),
  ]);

  const ca = paidAgg._sum.total ?? 0;
  const tickets = paidAgg._count;

  return (
    <div>
      <Link
        href="/admin/restaurants"
        className="text-sm font-semibold text-stone-500 hover:text-orange-600"
      >
        ← Tous les restaurants
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{restaurant.name}</h1>
          <p className="mt-1 text-sm text-stone-500">
            Inscrit le {formatDateFr(restaurant.createdAt)}
            {restaurant.slug && (
              <>
                {" · menu public : "}
                <a
                  href={`/r/${restaurant.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-orange-600 hover:underline"
                >
                  /r/{restaurant.slug}
                </a>
              </>
            )}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            restaurant.active
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {restaurant.active ? "Actif" : "Suspendu"}
        </span>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <p className="text-sm text-stone-500">CA cumulé</p>
          <p className="mt-2 text-2xl font-bold text-orange-600">{formatFCFA(ca)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-stone-500">Tickets encaissés</p>
          <p className="mt-2 text-2xl font-bold">{tickets}</p>
        </div>
        <div className="card">
          <p className="text-sm text-stone-500">Panier moyen</p>
          <p className="mt-2 text-2xl font-bold">
            {formatFCFA(tickets ? Math.round(ca / tickets) : 0)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-stone-500">Catalogue</p>
          <p className="mt-2 text-2xl font-bold">
            {restaurant._count.products}
            <span className="text-sm font-normal text-stone-500">
              {" "}
              plats · {restaurant._count.categories} catégories
            </span>
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Utilisateurs */}
        <div className="card">
          <h2 className="font-semibold">
            Comptes ({restaurant.users.length})
          </h2>
          <ul className="mt-3 divide-y divide-stone-100">
            {restaurant.users.map((u) => (
              <li key={u.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  <span className="font-semibold">{u.name}</span>{" "}
                  <span className="text-stone-500">· {u.email}</span>
                </span>
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-700">
                  {u.role}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Top plats */}
        <div className="card">
          <h2 className="font-semibold">Top plats (encaissés)</h2>
          {topItems.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">Aucune vente.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {topItems.map((t) => (
                <li key={t.name} className="flex justify-between">
                  <span>{t.name}</span>
                  <span className="font-semibold">{t._sum.qty ?? 0} vendu(s)</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 border-t border-stone-100 pt-3 text-xs text-stone-500">
            {restaurant._count.employees} employé(s) ·{" "}
            {restaurant._count.stockItems} article(s) en stock ·{" "}
            {restaurant._count.orders} commande(s) au total
          </p>
        </div>
      </div>

      {/* Dernières commandes */}
      <div className="card mt-6">
        <h2 className="font-semibold">Dernières commandes</h2>
        {recentOrders.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">Aucune commande.</p>
        ) : (
          <ul className="mt-3 divide-y divide-stone-100">
            {recentOrders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>
                  <span className="font-semibold">#{o.number}</span>{" "}
                  <span className="text-stone-500">
                    · {o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
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

      {/* Actions de gestion */}
      <div className="card mt-6">
        <h2 className="font-semibold">Actions de gestion</h2>
        <p className="mt-1 text-sm text-stone-500">
          Un restaurant suspendu ne peut plus se connecter ; ses données sont
          conservées. La suppression est définitive.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <form action={toggleRestaurantActiveAction}>
            <input type="hidden" name="id" value={restaurant.id} />
            <button
              type="submit"
              className={
                restaurant.active
                  ? "rounded-lg border border-orange-400 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
                  : "rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              }
            >
              {restaurant.active ? "⏸ Suspendre l'accès" : "▶ Réactiver l'accès"}
            </button>
          </form>
          <ConfirmDelete restaurantId={restaurant.id} />
        </div>
      </div>
    </div>
  );
}