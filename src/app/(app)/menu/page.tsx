import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { formatFCFA } from "@/lib/format";
import {
  addCategoryAction,
  deleteCategoryAction,
  addProductAction,
  toggleProductAction,
  updatePriceAction,
  deleteProductAction,
} from "./actions";

export default async function MenuPage() {
  const user = await getSessionUser();
  if (!user) return null;
  if (!can(user, "menu")) redirect("/dashboard");

  const categories = await prisma.category.findMany({
    where: { restaurantId: user.restaurantId },
    orderBy: { position: "asc" },
    include: { products: { orderBy: { name: "asc" } } },
  });
  const orphans = await prisma.product.findMany({
    where: { restaurantId: user.restaurantId, categoryId: null },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Menu & plats</h1>
      <p className="mt-1 text-sm text-stone-500">
        Gérez vos catégories, vos plats et leurs prix.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Ajouter une catégorie */}
        <form action={addCategoryAction} className="card flex gap-2">
          <input
            name="name"
            required
            className="input"
            placeholder="Nouvelle catégorie (ex: Grillades)"
          />
          <button type="submit" className="btn btn-primary shrink-0">
            Ajouter
          </button>
        </form>

        {/* Ajouter un plat */}
        <form action={addProductAction} className="card flex flex-wrap gap-2">
          <input
            name="name"
            required
            className="input flex-1 min-w-40"
            placeholder="Nom du plat (ex: Attiéké poisson)"
          />
          <input
            name="price"
            type="number"
            min={1}
            required
            className="input w-32"
            placeholder="Prix (FCFA)"
          />
          <select name="categoryId" className="input w-44">
            <option value="">Sans catégorie</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary">
            Ajouter
          </button>
        </form>
      </div>

      {/* Plats sans catégorie */}
      {orphans.length > 0 && (
        <div className="card mt-6">
          <h2 className="font-semibold">Sans catégorie</h2>
          <ul className="mt-2 divide-y divide-stone-100">
            {orphans.map((p) => (
              <ProductRow key={p.id} product={p} />
            ))}
          </ul>
        </div>
      )}

      {/* Catégories */}
      <div className="mt-6 space-y-4">
        {categories.length === 0 && orphans.length === 0 && (
          <p className="card text-sm text-stone-500">
            Commencez par créer une catégorie (ex: Plats, Boissons, Grillades),
            puis ajoutez vos plats.
          </p>
        )}
        {categories.map((cat) => (
          <div key={cat.id} className="card">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{cat.name}</h2>
              <form action={deleteCategoryAction}>
                <input type="hidden" name="id" value={cat.id} />
                <button
                  type="submit"
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Supprimer la catégorie
                </button>
              </form>
            </div>
            {cat.products.length === 0 ? (
              <p className="mt-2 text-sm text-stone-500">Aucun plat.</p>
            ) : (
              <ul className="mt-2 divide-y divide-stone-100">
                {cat.products.map((p) => (
                  <ProductRow key={p.id} product={p} />
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

type Product = {
  id: string;
  name: string;
  price: number;
  available: boolean;
};

function ProductRow({ product }: { product: Product }) {
  return (
    <li className="flex flex-wrap items-center gap-3 py-2">
      <span
        className={`min-w-0 flex-1 truncate text-sm font-medium ${
          product.available ? "" : "text-stone-400 line-through"
        }`}
      >
        {product.name}
      </span>
      <span className="text-sm text-stone-500">{formatFCFA(product.price)}</span>

      {/* Modifier le prix */}
      <form action={updatePriceAction} className="flex items-center gap-1">
        <input type="hidden" name="id" value={product.id} />
        <input
          name="price"
          type="number"
          min={1}
          defaultValue={product.price}
          className="input w-28 py-1 text-xs"
        />
        <button
          type="submit"
          className="btn btn-secondary px-2 py-1 text-xs"
          title="Enregistrer le prix"
        >
          ✓
        </button>
      </form>

      {/* Disponible / épuisé */}
      <form action={toggleProductAction}>
        <input type="hidden" name="id" value={product.id} />
        <button
          type="submit"
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            product.available
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {product.available ? "Disponible" : "Épuisé"}
        </button>
      </form>

      {/* Supprimer */}
      <form action={deleteProductAction}>
        <input type="hidden" name="id" value={product.id} />
        <button
          type="submit"
          className="text-xs font-medium text-red-600 hover:underline"
        >
          Supprimer
        </button>
      </form>
    </li>
  );
}