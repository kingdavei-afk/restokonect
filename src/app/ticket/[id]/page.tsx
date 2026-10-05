import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime, formatFCFA } from "@/lib/format";
import AutoPrint from "./auto-print";

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

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, restaurantId: user.restaurantId },
    include: { items: true },
  });
  if (!order) notFound();

  return (
    <main className="min-h-screen bg-stone-100 py-8">
      <AutoPrint />

      {/* Reçu */}
      <div className="receipt mx-auto w-72 rounded-lg border border-stone-200 bg-white p-4 font-mono text-[13px] leading-5 shadow">
        <p className="text-center text-sm font-bold uppercase">
          {user.restaurant.name}
        </p>
        <p className="mt-1 text-center text-xs">Ticket #{order.number}</p>
        <p className="text-center text-xs">
          {formatDateTime(order.paidAt ?? order.createdAt)}
        </p>
        <p className="text-center text-xs">
          {typeLabels[order.type] ?? order.type}
        </p>

        <div className="my-2 border-t border-dashed border-stone-400" />

        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between gap-2">
            <span className="min-w-0 flex-1 truncate">
              {item.qty} × {item.name}
            </span>
            <span>{formatFCFA(item.unitPrice * item.qty)}</span>
          </div>
        ))}

        <div className="my-2 border-t border-dashed border-stone-400" />

        <div className="flex justify-between font-bold">
          <span>TOTAL</span>
          <span>{formatFCFA(order.total)}</span>
        </div>
        {order.paymentMethod && (
          <div className="mt-1 flex justify-between text-xs">
            <span>Paiement</span>
            <span>{paymentLabels[order.paymentMethod]}</span>
          </div>
        )}
        {order.note && <p className="mt-1 text-xs">Note : {order.note}</p>}

        <div className="my-2 border-t border-dashed border-stone-400" />
        <p className="text-center text-xs">Merci de votre visite !</p>
      </div>

      {/* Barre d'actions (masquée à l'impression) */}
      <div className="no-print mt-4 flex justify-center gap-2">
        <button
          onClick={() => window.print()}
          className="btn btn-primary px-6"
        >
          🖨 Imprimer
        </button>
        <Link href="/caisse" className="btn btn-secondary px-6">
          Retour à la caisse
        </Link>
      </div>
    </main>
  );
}