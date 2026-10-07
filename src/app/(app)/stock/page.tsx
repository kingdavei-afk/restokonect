import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { formatDateFr, formatDateTime } from "@/lib/format";
import {
  addStockItemAction,
  recordMovementAction,
  deleteStockItemAction,
} from "./actions";

export default async function StockPage() {
  const user = await getSessionUser();
  if (!user) return null;
  if (!can(user, "stock")) redirect("/dashboard");

  const [items, movements, closures] = await Promise.all([
    prisma.stockItem.findMany({
      where: { restaurantId: user.restaurantId },
      orderBy: { name: "asc" },
    }),
    prisma.stockMovement.findMany({
      where: { stockItem: { restaurantId: user.restaurantId } },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { stockItem: true, user: true },
    }),
    prisma.stockClosure.findMany({
      where: { restaurantId: user.restaurantId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: true },
    }),
  ]);

  const lowStock = items.filter((i) => i.qty <= i.alertThreshold);

  return (
    <div>
      <h1 className="text-2xl font-bold">Stock</h1>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-500">
          Suivez vos ingrédients et marchandises. Les articles sous le seuil
          d&apos;alerte sont surlignés en rouge.
        </p>
        <Link href="/stock/cloture" className="btn btn-primary">
          🌙 Clôture du jour
        </Link>
      </div>

      {lowStock.length > 0 && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          ⚠️ Stock bas :{" "}
          <span className="font-semibold">
            {lowStock.map((i) => i.name).join(", ")}
          </span>
        </div>
      )}

      {/* Ajouter un article */}
      <form
        action={addStockItemAction}
        className="card mt-6 flex flex-wrap gap-2"
      >
        <input
          name="name"
          required
          className="input flex-1 min-w-40"
          placeholder="Article (ex: Riz, Huile, Poulet)"
        />
        <input
          name="unit"
          className="input w-24"
          placeholder="Unité (kg, L...)"
        />
        <input
          name="qty"
          type="number"
          step="any"
          min={0}
          required
          className="input w-28"
          placeholder="Quantité"
        />
        <input
          name="alertThreshold"
          type="number"
          step="any"
          min={0}
          className="input w-32"
          placeholder="Seuil d'alerte"
        />
        <input
          name="packSize"
          type="number"
          step="any"
          min={1}
          className="input w-28"
          placeholder="Contenu pack"
        />
        <input
          name="packName"
          className="input w-28"
          placeholder="Nom pack"
        />
        <button type="submit" className="btn btn-primary">
          Ajouter
        </button>
        <p className="w-full text-xs text-stone-400">
          Pack (optionnel, boissons) : ex. contenu 12, nom « casier » — vous
          pourrez alors saisir vos mouvements directement en casiers.
        </p>
      </form>

      {/* Liste du stock */}
      <div className="mt-6 space-y-3">
        {items.length === 0 && (
          <p className="card text-sm text-stone-500">
            Aucun article en stock. Ajoutez vos ingrédients de base (riz, huile,
            poisson, charbon...).
          </p>
        )}
        {items.map((item) => {
          const low = item.qty <= item.alertThreshold;
          return (
            <div
              key={item.id}
              className={`card ${low ? "border-red-300 bg-red-50/50" : ""}`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {item.name}{" "}
                    {low && <span className="text-xs text-red-700">⚠ Stock bas</span>}
                  </p>
                  <p className="text-sm text-stone-500">
                    {item.qty} {item.unit} · seuil d&apos;alerte :{" "}
                    {item.alertThreshold} {item.unit}
                    {item.packSize && item.packName && (
                      <>
                        {" "}· ≈ {(item.qty / item.packSize).toFixed(1)}{" "}
                        {item.packName}(s) de {item.packSize}
                      </>
                    )}
                  </p>
                </div>

                {/* Mouvement de stock */}
                <form
                  action={recordMovementAction}
                  className="flex flex-wrap items-center gap-1"
                >
                  <input type="hidden" name="id" value={item.id} />
                  <select name="type" className="input w-auto py-1 text-xs">
                    <option value="ENTREE">Entrée</option>
                    <option value="SORTIE">Sortie</option>
                    <option value="AJUSTEMENT">Ajustement</option>
                  </select>
                  <input
                    name="qty"
                    type="number"
                    step="any"
                    required
                    className="input w-20 py-1 text-xs"
                    placeholder="Qté"
                  />
                  {item.packSize && item.packName && (
                    <select name="unitType" className="input w-auto py-1 text-xs">
                      <option value="unite">{item.unit}(s)</option>
                      <option value="pack">{item.packName}(s)</option>
                    </select>
                  )}
                  <input
                    name="reason"
                    className="input w-36 py-1 text-xs"
                    placeholder="Motif (optionnel)"
                  />
                  <button type="submit" className="btn btn-primary px-2 py-1 text-xs">
                    Valider
                  </button>
                </form>

                <form action={deleteStockItemAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Supprimer
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dernières clôtures */}
      {closures.length > 0 && (
        <div className="card mt-8">
          <h2 className="font-semibold">Dernières clôtures</h2>
          <ul className="mt-2 divide-y divide-stone-100">
            {closures.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  🌙 Clôture du {formatDateFr(c.createdAt)}
                  {c.note && <span className="text-stone-500"> — {c.note}</span>}
                </span>
                <span className="text-stone-500">
                  {c.itemsAdjusted} article(s) corrigé(s)
                  {c.user && ` · par ${c.user.name}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Derniers mouvements */}
      <div className="card mt-8">
        <h2 className="font-semibold">Derniers mouvements</h2>
        {movements.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">Aucun mouvement.</p>
        ) : (
          <ul className="mt-2 divide-y divide-stone-100">
            {movements.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  <span
                    className={`mr-2 rounded px-1.5 py-0.5 text-xs font-semibold ${
                      m.type === "ENTREE"
                        ? "bg-green-100 text-green-800"
                        : m.type === "SORTIE"
                          ? "bg-red-100 text-red-800"
                          : "bg-stone-100 text-stone-700"
                    }`}
                  >
                    {m.type}
                  </span>
                  {m.stockItem.name} · {m.qty} {m.stockItem.unit}
                  {m.reason && (
                    <span className="text-stone-500"> — {m.reason}</span>
                  )}
                  {m.user && (
                    <span className="ml-2 rounded bg-stone-200 px-1.5 py-0.5 text-xs font-medium text-stone-600">
                      par {m.user.name}
                    </span>
                  )}
                </span>
                <span className="text-stone-500">{formatDateTime(m.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}