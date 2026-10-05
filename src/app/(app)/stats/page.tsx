import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { formatFCFA } from "@/lib/format";

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

type Period = "aujourdhui" | "7j" | "30j";

const periodLabels: Record<Period, string> = {
  aujourdhui: "Aujourd'hui",
  "7j": "7 derniers jours",
  "30j": "30 derniers jours",
};

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayLabel(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(y, m - 1, d));
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) return null;
  if (!can(user, "stats")) redirect("/dashboard");

  const { period: periodParam } = await searchParams;
  const period: Period =
    periodParam === "aujourdhui" || periodParam === "30j"
      ? periodParam
      : "7j";

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (period === "7j") start.setDate(start.getDate() - 6);
  if (period === "30j") start.setDate(start.getDate() - 29);

  const orders = await prisma.order.findMany({
    where: {
      restaurantId: user.restaurantId,
      status: "PAYEE",
      paidAt: { gte: start },
    },
    orderBy: { paidAt: "asc" },
    include: { items: true },
  });

  const totalCA = orders.reduce((sum, o) => sum + o.total, 0);
  const ticketCount = orders.length;
  const panierMoyen = ticketCount ? Math.round(totalCA / ticketCount) : 0;

  // CA par jour (continu sur toute la période, 0 si pas de vente)
  const days: { key: string; total: number; count: number }[] = [];
  const cursor = new Date(start);
  while (cursor <= new Date()) {
    days.push({ key: dayKey(cursor), total: 0, count: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  const dayIndex = new Map(days.map((d) => [d.key, d]));
  for (const order of orders) {
    if (!order.paidAt) continue;
    const entry = dayIndex.get(dayKey(order.paidAt));
    if (entry) {
      entry.total += order.total;
      entry.count += 1;
    }
  }
  const maxDay = Math.max(1, ...days.map((d) => d.total));

  // Top plats
  const productMap = new Map<string, { qty: number; ca: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const entry = productMap.get(item.name) ?? { qty: 0, ca: 0 };
      entry.qty += item.qty;
      entry.ca += item.unitPrice * item.qty;
      productMap.set(item.name, entry);
    }
  }
  const topProducts = [...productMap.entries()]
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 8);
  const maxProductQty = Math.max(1, ...topProducts.map(([, v]) => v.qty));

  // Répartition par mode de paiement et par type
  function tally(
    keyfn: (o: (typeof orders)[number]) => string | null
  ): { label: string; total: number; count: number }[] {
    const map = new Map<string, { total: number; count: number }>();
    for (const order of orders) {
      const key = keyfn(order);
      if (!key) continue;
      const entry = map.get(key) ?? { total: 0, count: 0 };
      entry.total += order.total;
      entry.count += 1;
      map.set(key, entry);
    }
    return [...map.entries()].map(([label, v]) => ({ label, ...v }));
  }

  const byPayment = tally((o) => o.paymentMethod ?? null).sort(
    (a, b) => b.total - a.total
  );
  const byType = tally((o) => o.type).sort((a, b) => b.total - a.total);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Statistiques</h1>
          <p className="mt-1 text-sm text-stone-500">
            Performances de {user.restaurant.name}
          </p>
        </div>
        <a
          href={`/api/stats/export?period=${period}`}
          className="btn btn-primary"
        >
          ⬇ Export Excel
        </a>
      </div>

      {/* Sélecteur de période */}
      <div className="mt-4 flex gap-2">
        {(Object.keys(periodLabels) as Period[]).map((p) => (
          <a
            key={p}
            href={`/stats?period=${p}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              period === p
                ? "bg-orange-600 text-white"
                : "bg-white text-stone-700 ring-1 ring-stone-200"
            }`}
          >
            {periodLabels[p]}
          </a>
        ))}
      </div>

      {/* KPIs */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-stone-500">Chiffre d&apos;affaires</p>
          <p className="mt-2 text-2xl font-bold text-orange-600">
            {formatFCFA(totalCA)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-stone-500">Tickets encaissés</p>
          <p className="mt-2 text-2xl font-bold">{ticketCount}</p>
        </div>
        <div className="card">
          <p className="text-sm text-stone-500">Panier moyen</p>
          <p className="mt-2 text-2xl font-bold">{formatFCFA(panierMoyen)}</p>
        </div>
      </div>

      {/* CA par jour */}
      <div className="card mt-8">
        <h2 className="font-semibold">Chiffre d&apos;affaires par jour</h2>
        <div className="mt-4 space-y-2">
          {days.map((d) => (
            <div key={d.key} className="flex items-center gap-3 text-sm">
              <span className="w-24 shrink-0 capitalize text-stone-500">
                {dayLabel(d.key)}
              </span>
              <div className="h-6 flex-1 rounded-md bg-stone-100">
                <div
                  className="h-6 rounded-md bg-orange-500"
                  style={{ width: `${(d.total / maxDay) * 100}%` }}
                />
              </div>
              <span className="w-28 text-right font-semibold">
                {formatFCFA(d.total)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {/* Top plats */}
        <div className="card">
          <h2 className="font-semibold">Top plats</h2>
          {topProducts.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">Aucune vente.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {topProducts.map(([name, v]) => (
                <li key={name} className="text-sm">
                  <div className="flex justify-between">
                    <span className="truncate">{name}</span>
                    <span className="shrink-0 font-semibold">{v.qty}×</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-stone-100">
                    <div
                      className="h-1.5 rounded-full bg-orange-400"
                      style={{ width: `${(v.qty / maxProductQty) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Paiements */}
        <div className="card">
          <h2 className="font-semibold">Par mode de paiement</h2>
          {byPayment.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">Aucune vente.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {byPayment.map((p) => (
                <li key={p.label} className="flex justify-between">
                  <span>{paymentLabels[p.label] ?? p.label}</span>
                  <span className="font-semibold">
                    {formatFCFA(p.total)}{" "}
                    <span className="text-xs text-stone-500">
                      ({p.count})
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Types de commande */}
        <div className="card">
          <h2 className="font-semibold">Par type de commande</h2>
          {byType.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">Aucune vente.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {byType.map((t) => (
                <li key={t.label} className="flex justify-between">
                  <span>{typeLabels[t.label] ?? t.label}</span>
                  <span className="font-semibold">
                    {formatFCFA(t.total)}{" "}
                    <span className="text-xs text-stone-500">({t.count})</span>
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