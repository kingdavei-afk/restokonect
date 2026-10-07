"use client";

import { useState, useTransition } from "react";
import { deleteRestaurantAction } from "../../../actions";

// Bouton de suppression avec confirmation obligatoire
export default function ConfirmDelete({ restaurantId }: { restaurantId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
      >
        🗑 Supprimer ce restaurant
      </button>
    );
  }

  return (
    <div className="rounded-lg border-2 border-red-300 bg-red-50 p-3">
      <p className="text-sm font-semibold text-red-800">
        ⚠️ Attention : suppression définitive du restaurant, de ses comptes,
        plats, commandes, stock et employés. Cette action est irréversible.
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const fd = new FormData();
              fd.set("id", restaurantId);
              await deleteRestaurantAction(fd);
            })
          }
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {pending ? "Suppression..." : "Oui, supprimer définitivement"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-stone-700 ring-1 ring-stone-300"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}