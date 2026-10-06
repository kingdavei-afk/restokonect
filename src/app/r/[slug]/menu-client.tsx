"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { formatFCFA } from "@/lib/format";
import { createWhatsappOrderAction } from "./actions";

export type PublicProduct = { id: string; name: string; price: number };
export type PublicCategory = { id: string; name: string; products: PublicProduct[] };

const typeLabels = {
  SUR_PLACE: "Sur place",
  EMPORTER: "À emporter",
  LIVRAISON: "Livraison",
} as const;
type OrderType = keyof typeof typeLabels;

export default function MenuClient({
  slug,
  restaurantName,
  whatsappNumber,
  categories,
}: {
  slug: string;
  restaurantName: string;
  whatsappNumber: string | null;
  categories: PublicCategory[];
}) {
  const [activeCat, setActiveCat] = useState<string>("all");
  const [cart, setCart] = useState<Record<string, { product: PublicProduct; qty: number }>>({});
  const [name, setName] = useState("");
  const [table, setTable] = useState("");
  const [orderType, setOrderType] = useState<OrderType>("EMPORTER");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const products = useMemo(
    () => categories.flatMap((c) => c.products),
    [categories]
  );
  const visible =
    activeCat === "all"
      ? products
      : (categories.find((c) => c.id === activeCat)?.products ?? []);

  const items = Object.values(cart);
  const total = items.reduce((sum, i) => sum + i.product.price * i.qty, 0);

  function add(product: PublicProduct) {
    setCart((prev) => ({
      ...prev,
      [product.id]: { product, qty: (prev[product.id]?.qty ?? 0) + 1 },
    }));
  }

  function changeQty(productId: string, delta: number) {
    setCart((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      const qty = existing.qty + delta;
      if (qty <= 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return { ...prev, [productId]: { ...existing, qty } };
    });
  }

  function orderOnWhatsApp() {
    if (!whatsappNumber || !items.length) return;
    startTransition(async () => {
      // 1. Enregistrer la commande dans le système (visible à la caisse)
      const result = await createWhatsappOrderAction({
        slug,
        items: items.map((i) => ({ productId: i.product.id, qty: i.qty })),
        type: orderType,
        name,
        table,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }

      // 2. Ouvrir WhatsApp avec le récapitulatif
      const lines = items.map(
        ({ product, qty }) =>
          `• ${qty}× ${product.name} — ${formatFCFA(product.price * qty)}`
      );
      const extras = [
        name.trim() ? `Nom : ${name.trim()}` : null,
        table.trim() ? `Table : ${table.trim()}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      const message = [
        `Bonjour ${restaurantName} ! Commande #${result.number} (${typeLabels[orderType]}) :`,
        "",
        ...lines,
        "",
        `Total : ${formatFCFA(result.total)}`,
        extras ? extras : null,
      ]
        .filter((l) => l !== null)
        .join("\n");

      setCart({});
      window.open(
        `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
        "_blank"
      );
    });
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-40 pt-6">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-orange-600">
          Menu digital
        </p>
        <h1 className="mt-1 text-2xl font-bold">{restaurantName}</h1>
      </header>

      {/* Catégories */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button
          onClick={() => setActiveCat("all")}
          className={`rounded-full px-3 py-1.5 text-sm font-medium ${
            activeCat === "all"
              ? "bg-orange-600 text-white"
              : "bg-white text-stone-700 ring-1 ring-stone-200"
          }`}
        >
          Tout
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(cat.id)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              activeCat === cat.id
                ? "bg-orange-600 text-white"
                : "bg-white text-stone-700 ring-1 ring-stone-200"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Plats */}
      <div className="mt-4 space-y-2">
        {visible.length === 0 && (
          <p className="card text-center text-sm text-stone-500">
            Le menu n&apos;est pas encore disponible.
          </p>
        )}
        {visible.map((product) => (
          <button
            key={product.id}
            onClick={() => add(product)}
            className="card flex w-full items-center justify-between text-left transition hover:border-orange-400"
          >
            <span className="font-semibold">{product.name}</span>
            <span className="font-bold text-orange-600">
              {formatFCFA(product.price)}
            </span>
          </button>
        ))}
      </div>

      <footer className="mt-10 flex items-center justify-center gap-1.5 text-xs text-stone-400">
        Propulsé par
        <Link
          href="/"
          className="inline-flex items-center font-semibold text-stone-500 hover:text-orange-600"
        >
          <Image
            src="/logo.png"
            alt="Logo RestoKonect"
            width={40}
            height={40}
            className="rounded"
          />
        </Link>
      </footer>

      {/* Panier flottant */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200 bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="mx-auto max-w-lg">
          {items.length === 0 ? (
            <p className="text-center text-sm text-stone-500">
              Ajoutez des plats pour commander
            </p>
          ) : (
            <div className="space-y-2">
              <div className="max-h-32 space-y-1 overflow-y-auto">
                {items.map(({ product, qty }) => (
                  <div key={product.id} className="flex items-center gap-2 text-sm">
                    <span className="min-w-0 flex-1 truncate">
                      {qty}× {product.name}
                    </span>
                    <button
                      onClick={() => changeQty(product.id, -1)}
                      className="btn btn-secondary h-6 w-6 p-0 text-xs"
                    >
                      −
                    </button>
                    <button
                      onClick={() => changeQty(product.id, 1)}
                      className="btn btn-secondary h-6 w-6 p-0 text-xs"
                    >
                      +
                    </button>
                    <span className="w-24 text-right font-semibold">
                      {formatFCFA(product.price * qty)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="Votre nom"
                />
                <input
                  value={table}
                  onChange={(e) => setTable(e.target.value)}
                  className="input w-24"
                  placeholder="Table"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold text-orange-600">
                  {formatFCFA(total)}
                </span>
              </div>

              {whatsappNumber ? (
                <>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value as OrderType)}
                    className="input"
                  >
                    {(Object.keys(typeLabels) as OrderType[]).map((t) => (
                      <option key={t} value={t}>
                        {typeLabels[t]}
                      </option>
                    ))}
                  </select>
                  {error && (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
                      {error}
                    </p>
                  )}
                  <button
                    onClick={orderOnWhatsApp}
                    disabled={pending}
                    className="btn w-full bg-[#25D366] py-3 text-base text-white hover:brightness-95"
                  >
                    {pending ? "Envoi..." : "Commander sur WhatsApp"}
                  </button>
                </>
              ) : (
                <p className="rounded-md bg-stone-100 px-3 py-2 text-center text-xs text-stone-600">
                  Ce restaurant n&apos;a pas encore configuré WhatsApp.
                  Commandez au comptoir.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}