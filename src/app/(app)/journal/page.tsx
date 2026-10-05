import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { formatDateTime, formatFCFA } from "@/lib/format";

const paymentLabels: Record<string, string> = {
  ESPECES: "Espèces",
  MOBILE_MONEY: "Mobile Money",
  CARTE: "Carte",
  AUTRE: "Autre",
};

const typeLabels: Record<string, string> = {
  SUR_PLACE: "Sur place",
  EMPORTER: "À emporter",
  LIVRAISON: "Livraison",
};

export default async function JournalPage() {
  const user = await getSessionUser();
  if (!user) return null;
  if (!can(user, "journal")) redirect("/dashboard");

  const orders = await prisma.order.findMany({
    where: { restaurantId: user.restaurantId, status: "PAYEE" },
    orderBy: { paidAt: "desc" },
    take: 100,
    include: { items: true },
  });

  // Regrouper par jour
  const byDay = new Map<string, typeof orders>();
  for (const order of orders) {
    if (!order.paidAt) continue;
    const key = new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(order.paidAt);
    const list = byDay.get(key) ?? [];
    list.push(order);
    byDay.set(key, list);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Journal des ventes</h1>
      <p className="mt-1 text-sm text-stone-500">
        Les 100 derniers tickets encaissés, regroupés par jour.
      </p>

      {byDay.size === 0 && (
        <p className="card mt-6 text-sm text-stone-500">
          Aucune vente encaissée pour le moment.
        </p>
      )}

      {[...byDay.entries()].map(([day, dayOrders]) => {
        const dayTotal = dayOrders.reduce((sum, o) => sum + o.total, 0);
        return (
          <div key={day} className="card mt-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold capitalize">{day}</h2>
              <p className="font-bold text-orange-600">{formatFCFA(dayTotal)}</p>
            </div>
            <ul className="mt-3 divide-y divide-stone-100">
              {dayOrders.map((order) => (
                <li key={order.id} className="py-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <span className="font-semibold">#{order.number}</span>
                      <Link
                        href={`/ticket/${order.id}`}
                        target="_blank"
                        className="ml-1 text-orange-600"
                        title="Imprimer le ticket"
                      >
                        🖨
                      </Link>{" "}
                      <span className="text-stone-500">
                        {typeLabels[order.type] ?? order.type} ·{" "}
                        {paymentLabels[order.paymentMethod ?? ""] ?? "—"} ·{" "}
                        {order.paidAt ? formatDateTime(order.paidAt) : ""}
                      </span>
                    </span>
                    <span className="font-bold">{formatFCFA(order.total)}</span>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    {order.items
                      .map((i) => `${i.qty}× ${i.name}`)
                      .join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}