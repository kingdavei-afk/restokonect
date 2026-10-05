import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Endpoint léger interrogé par la caisse toutes les ~12 s pour détecter
// les nouvelles commandes (WhatsApp ou comptoir).
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ orders: [] }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { restaurantId: user.restaurantId, status: "OUVERTE" },
    orderBy: { createdAt: "asc" },
    include: { items: true },
  });

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      number: o.number,
      total: o.total,
      note: o.note,
      items: o.items.map((i) => ({ name: i.name, qty: i.qty })),
    })),
  });
}