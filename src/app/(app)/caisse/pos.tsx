"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatFCFA } from "@/lib/format";
import {
  createOrderAction,
  payOrderAction,
  cancelOrderAction,
  type OrderTypeStr,
  type PaymentMethodStr,
} from "./actions";

export type PosProduct = {
  id: string;
  name: string;
  price: number;
  available: boolean;
};
export type PosCategory = { id: string; name: string; products: PosProduct[] };
export type PosOpenOrder = {
  id: string;
  number: number;
  total: number;
  note?: string | null;
  items: { name: string; qty: number }[];
};

type Toast = { id: string; number: number; total: number; whatsapp: boolean };

const paymentLabels: Record<PaymentMethodStr, string> = {
  ESPECES: "Espèces",
  MOBILE_MONEY: "Mobile Money (Wave / MoMo / OM)",
  CARTE: "Carte bancaire",
  AUTRE: "Autre",
};

const typeLabels: Record<OrderTypeStr, string> = {
  SUR_PLACE: "Sur place",
  EMPORTER: "À emporter",
  LIVRAISON: "Livraison",
};

export default function Pos({
  categories,
  openOrders,
  canPay,
}: {
  categories: PosCategory[];
  openOrders: PosOpenOrder[];
  canPay: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [activeCat, setActiveCat] = useState<string>("all");
  const [cart, setCart] = useState<Record<string, { product: PosProduct; qty: number }>>({});
  const [orderType, setOrderType] = useState<OrderTypeStr>("SUR_PLACE");
  const [payment, setPayment] = useState<PaymentMethodStr>("ESPECES");
  const [message, setMessage] = useState<string | null>(null);
  const [lastTicket, setLastTicket] = useState<string | null>(null);

  // Liste des commandes ouvertes, synchronisée par polling temps réel
  const [orders, setOrders] = useState<PosOpenOrder[]>(openOrders);
  const knownIds = useRef<Set<string>>(new Set(openOrders.map((o) => o.id)));
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/orders/open");
        if (!res.ok) return;
        const data: { orders: PosOpenOrder[] } = await res.json();
        if (cancelled) return;

        const newOnes = data.orders.filter((o) => !knownIds.current.has(o.id));
        if (newOnes.length > 0) {
          for (const o of newOnes) {
            knownIds.current.add(o.id);
            setToasts((prev) => [
              ...prev,
              {
                id: o.id,
                number: o.number,
                total: o.total,
                whatsapp: !!o.note?.includes("WhatsApp"),
              },
            ]);
          }
          beep();
        }
        setOrders(data.orders);
      } catch {
        // réseau indisponible : on réessaiera au prochain cycle
      }
    }

    void poll();
    const timer = setInterval(poll, 12000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allProducts = useMemo(
    () => categories.flatMap((c) => c.products),
    [categories]
  );
  const visibleProducts =
    activeCat === "all"
      ? allProducts
      : (categories.find((c) => c.id === activeCat)?.products ?? []);

  const cartItems = Object.values(cart);
  const total = cartItems.reduce((sum, i) => sum + i.product.price * i.qty, 0);

  function add(product: PosProduct) {
    setCart((prev) => {
      const existing = prev[product.id];
      return {
        ...prev,
        [product.id]: { product, qty: (existing?.qty ?? 0) + 1 },
      };
    });
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

  function submit(payNow: boolean) {
    if (!cartItems.length) {
      setMessage("Ajoutez au moins un plat au ticket.");
      return;
    }
    startTransition(async () => {
      const result = await createOrderAction({
        items: cartItems.map((i) => ({ productId: i.product.id, qty: i.qty })),
        type: orderType,
        payNow,
        paymentMethod: payNow ? payment : undefined,
      });
      if (result.ok) {
        setCart({});
        setLastTicket(result.id);
        setMessage(
          payNow
            ? `Ticket #${result.number} encaissé : ${formatFCFA(result.total)} ✅`
            : `Commande #${result.number} mise en attente.`
        );
        router.refresh();
      } else {
        setMessage(result.error);
      }
    });
  }

  function payOpen(orderId: string, method: PaymentMethodStr) {
    startTransition(async () => {
      const result = await payOrderAction(orderId, method);
      if (result.ok) {
        setLastTicket(orderId);
        setMessage("Commande encaissée ✅");
        router.refresh();
      } else {
        setMessage(result.error ?? "Erreur");
      }
    });
  }

  function cancelOpen(orderId: string) {
    startTransition(async () => {
      const result = await cancelOrderAction(orderId);
      if (result.ok) {
        setMessage("Commande annulée.");
        router.refresh();
      } else {
        setMessage(result.error ?? "Erreur");
      }
    });
  }

  return (
    <div className="relative grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* Notifications temps réel */}
      <div className="fixed right-4 top-4 z-50 flex w-72 flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() =>
              setToasts((prev) => prev.filter((t) => t.id !== toast.id))
            }
          />
        ))}
      </div>
      <div>
        {/* Filtres par catégorie */}
        <div className="flex flex-wrap gap-2">
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

        {/* Grille de plats */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {visibleProducts.length === 0 && (
            <p className="col-span-full text-sm text-stone-500">
              Aucun plat. Ajoutez d&apos;abord vos plats dans « Menu & plats ».
            </p>
          )}
          {visibleProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => add(product)}
              disabled={!product.available}
              className="card text-left transition hover:border-orange-400 disabled:opacity-40"
            >
              <p className="font-semibold">{product.name}</p>
              <p className="mt-1 text-sm text-orange-600">
                {formatFCFA(product.price)}
              </p>
              {!product.available && (
                <p className="mt-1 text-xs text-red-600">Épuisé</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket en cours */}
      <div className="flex flex-col gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Ticket en cours</h2>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as OrderTypeStr)}
              className="input w-auto text-xs"
            >
              {(Object.keys(typeLabels) as OrderTypeStr[]).map((t) => (
                <option key={t} value={t}>
                  {typeLabels[t]}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 divide-y divide-stone-100">
            {cartItems.length === 0 && (
              <p className="py-4 text-center text-sm text-stone-500">
                Cliquez sur un plat pour l&apos;ajouter
              </p>
            )}
            {cartItems.map(({ product, qty }) => (
              <div key={product.id} className="flex items-center gap-2 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-stone-500">
                    {formatFCFA(product.price)} × {qty}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => changeQty(product.id, -1)}
                    className="btn btn-secondary h-7 w-7 p-0"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">
                    {qty}
                  </span>
                  <button
                    onClick={() => changeQty(product.id, 1)}
                    className="btn btn-secondary h-7 w-7 p-0"
                  >
                    +
                  </button>
                </div>
                <p className="w-20 text-right text-sm font-semibold">
                  {formatFCFA(product.price * qty)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-stone-200 pt-3">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold text-orange-600">
              {formatFCFA(total)}
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {canPay && (
              <select
                value={payment}
                onChange={(e) => setPayment(e.target.value as PaymentMethodStr)}
                className="input"
              >
                {(Object.keys(paymentLabels) as PaymentMethodStr[]).map((m) => (
                  <option key={m} value={m}>
                    {paymentLabels[m]}
                  </option>
                ))}
              </select>
            )}
            {canPay && (
              <button
                onClick={() => submit(true)}
                disabled={pending}
                className="btn btn-primary w-full py-2.5"
              >
                {pending ? "..." : `Encaisser ${formatFCFA(total)}`}
              </button>
            )}
            <button
              onClick={() => submit(false)}
              disabled={pending}
              className="btn btn-secondary w-full"
            >
              Mettre en attente
            </button>
          </div>

          {message && (
            <p className="mt-3 rounded-md bg-stone-100 px-3 py-2 text-xs">
              {message}
            </p>
          )}
          {lastTicket && (
            <a
              href={`/ticket/${lastTicket}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary mt-2 w-full"
            >
              🖨 Imprimer le ticket
            </a>
          )}
        </div>

        {/* Commandes en attente */}
        <div className="card">
          <h2 className="font-semibold">
            En attente d&apos;encaissement ({orders.length})
          </h2>
          {orders.length === 0 ? (
            <p className="mt-2 text-sm text-stone-500">Rien en attente.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className="rounded-lg border border-stone-200 p-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      #{order.number}{" "}
                      {order.note?.includes("WhatsApp") && (
                        <span className="mr-1 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-800">
                          📱 WhatsApp
                        </span>
                      )}
                      <span className="font-normal text-stone-500">
                        {order.items
                          .map((i) => `${i.qty}× ${i.name}`)
                          .join(", ")}
                      </span>
                    </p>
                    <p className="text-sm font-bold">
                      {formatFCFA(order.total)}
                    </p>
                  </div>
                  {canPay ? (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => payOpen(order.id, payment)}
                        disabled={pending}
                        className="btn btn-primary flex-1 py-1 text-xs"
                      >
                        Encaisser
                      </button>
                      <button
                        onClick={() => cancelOpen(order.id)}
                        disabled={pending}
                        className="btn btn-secondary py-1 text-xs"
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-stone-500">
                      En attente du caissier…
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function beep() {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.start();
    setTimeout(() => {
      osc.stop();
      void ctx.close();
    }, 250);
  } catch {
    // audio indisponible : pas grave
  }
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 30000);
    return () => clearTimeout(timer);
  }, [onDismiss, toast.id]);

  return (
    <div className="rounded-lg border-2 border-orange-500 bg-white p-3 shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold">
            🔔 Nouvelle commande #{toast.number}
          </p>
          <p className="mt-0.5 text-xs text-stone-600">
            {toast.whatsapp ? "📱 Reçue via WhatsApp · " : ""}
            {formatFCFA(toast.total)}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-stone-400 hover:text-stone-600"
          aria-label="Fermer"
        >
          ✕
        </button>
      </div>
      <p className="mt-1 text-xs text-stone-500">
        Visible dans « En attente d&apos;encaissement » ci-dessous.
      </p>
    </div>
  );
}