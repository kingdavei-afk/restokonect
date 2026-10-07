"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { closeDayAction } from "../actions";

export type ClosureItem = {
  id: string;
  name: string;
  unit: string;
  qty: number;
  packName: string | null;
  packSize: number | null;
};

export default function ClosureForm({ items }: { items: ClosureItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  // Quantités comptées ce soir (initialement = stock théorique)
  const [counted, setCounted] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      items.map((i) => [i.id, String(i.qty).replace(".", ",")])
    )
  );

  const diffs = useMemo(() => {
    const map: Record<string, number | null> = {};
    for (const item of items) {
      const raw = (counted[item.id] ?? "").replace(",", ".").trim();
      const value = raw === "" ? null : parseFloat(raw);
      map[item.id] =
        value === null || Number.isNaN(value)
          ? null
          : value - item.qty;
    }
    return map;
  }, [counted, items]);

  const changedCount = Object.values(diffs).filter(
    (d) => d !== null && Math.abs(d) >= 0.001
  ).length;

  function submit() {
    const payload = items
      .map((item) => {
        const raw = (counted[item.id] ?? "").replace(",", ".").trim();
        const value = raw === "" ? null : parseFloat(raw);
        return { item, value };
      })
      .filter((e): e is { item: ClosureItem; value: number } =>
        e.value !== null && !Number.isNaN(e.value)
      )
      .map((e) => ({ id: e.item.id, counted: e.value }));

    if (payload.length === 0) {
      setError("Saisissez au moins une quantité comptée.");
      return;
    }

    startTransition(async () => {
      const result = await closeDayAction({ items: payload, note });
      if (result.ok) {
        setMessage(
          result.adjusted === 0
            ? "✅ Clôture enregistrée : stock conforme, aucun écart !"
            : `✅ Clôture enregistrée : ${result.adjusted} article(s) corrigé(s).`
        );
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="card text-sm text-stone-500">
        Aucun article en stock à clôturer. Ajoutez d&apos;abord vos articles
        dans <Link href="/stock" className="font-semibold text-orange-600">Stock</Link>.
      </div>
    );
  }

  return (
    <div className="card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-left text-xs text-stone-500 uppercase">
            <th className="py-2 pr-3">Article</th>
            <th className="py-2 pr-3">Théorique</th>
            <th className="py-2 pr-3">Compté ce soir</th>
            <th className="py-2">Écart</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {items.map((item) => {
            const diff = diffs[item.id];
            const show = diff !== null && Math.abs(diff) >= 0.001;
            return (
              <tr key={item.id}>
                <td className="py-2 pr-3">
                  <span className="font-semibold">{item.name}</span>
                  {item.packSize && item.packName && (
                    <span className="block text-xs text-stone-500">
                      1 {item.packName} = {item.packSize} {item.unit}(s)
                    </span>
                  )}
                </td>
                <td className="py-2 pr-3 text-stone-600">
                  {item.qty} {item.unit}
                </td>
                <td className="py-2 pr-3">
                  <input
                    value={counted[item.id] ?? ""}
                    onChange={(e) =>
                      setCounted((prev) => ({
                        ...prev,
                        [item.id]: e.target.value,
                      }))
                    }
                    inputMode="decimal"
                    className="input w-28"
                  />
                  {item.packSize && item.packName && (
                    <span className="block text-xs text-stone-400">
                      ≈{" "}
                      {(
                        (parseFloat(
                          (counted[item.id] ?? "0").replace(",", ".")
                        ) || 0) / item.packSize
                      ).toFixed(1)}{" "}
                      {item.packName}(s)
                    </span>
                  )}
                </td>
                <td className="py-2">
                  {diff === null ? (
                    <span className="text-stone-400">—</span>
                  ) : show ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        diff > 0
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {diff > 0 ? "+" : ""}
                      {diff.toFixed(2).replace(/\.?0+$/, "")} {item.unit}
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      ✓ conforme
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-4">
        <label htmlFor="note" className="mb-1 block text-sm font-medium">
          Motif de l&apos;écart (optionnel)
        </label>
        <input
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="input"
          placeholder="ex : consommation cuisine non enregistrée, casse…"
        />
      </div>

      {error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          {message}
        </p>
      )}

      <button
        onClick={submit}
        disabled={pending}
        className="btn btn-primary mt-4 w-full py-3 text-base"
      >
        {pending
          ? "Enregistrement..."
          : `✅ Valider la clôture${changedCount > 0 ? ` (${changedCount} écart(s))` : ""}`}
      </button>
      <p className="mt-2 text-center text-xs text-stone-500">
        Les écarts seront enregistrés comme ajustements signés à votre nom,
        avec le motif indiqué.
      </p>
    </div>
  );
}