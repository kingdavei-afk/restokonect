import ExcelJS from "exceljs";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

// GET /api/stats/export?period=aujourdhui|7j|30j → fichier .xlsx
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return new Response("Non autorisé", { status: 401 });

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "7j";

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (period === "aujourdhui") {
    // rien à déduire
  } else if (period === "30j") {
    start.setDate(start.getDate() - 29);
  } else {
    start.setDate(start.getDate() - 6);
  }

  const orders = await prisma.order.findMany({
    where: {
      restaurantId: user.restaurantId,
      status: "PAYEE",
      paidAt: { gte: start },
    },
    orderBy: { paidAt: "asc" },
    include: { items: true },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "RestoKonect";
  workbook.created = new Date();

  // Feuille 1 : ventes détaillées
  const wsSales = workbook.addWorksheet("Ventes");
  wsSales.columns = [
    { header: "N° ticket", key: "number", width: 10 },
    { header: "Date", key: "date", width: 18 },
    { header: "Type", key: "type", width: 14 },
    { header: "Paiement", key: "payment", width: 16 },
    { header: "Plats", key: "items", width: 50 },
    { header: "Total (FCFA)", key: "total", width: 14 },
  ];
  wsSales.getRow(1).font = { bold: true };
  for (const order of orders) {
    wsSales.addRow({
      number: order.number,
      date: order.paidAt
        ? new Intl.DateTimeFormat("fr-FR", {
            dateStyle: "short",
            timeStyle: "short",
          }).format(order.paidAt)
        : "",
      type: typeLabels[order.type] ?? order.type,
      payment: paymentLabels[order.paymentMethod ?? ""] ?? "—",
      items: order.items.map((i) => `${i.qty}× ${i.name}`).join(", "),
      total: order.total,
    });
  }
  wsSales.getColumn("total").numFmt = "#,##0";

  // Feuille 2 : par plat
  const wsProducts = workbook.addWorksheet("Par plat");
  wsProducts.columns = [
    { header: "Plat", key: "name", width: 32 },
    { header: "Quantité vendue", key: "qty", width: 16 },
    { header: "CA (FCFA)", key: "ca", width: 14 },
  ];
  wsProducts.getRow(1).font = { bold: true };
  const productMap = new Map<string, { qty: number; ca: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const entry = productMap.get(item.name) ?? { qty: 0, ca: 0 };
      entry.qty += item.qty;
      entry.ca += item.unitPrice * item.qty;
      productMap.set(item.name, entry);
    }
  }
  for (const [name, v] of [...productMap.entries()].sort((a, b) => b[1].ca - a[1].ca)) {
    wsProducts.addRow({ name, qty: v.qty, ca: v.ca });
  }
  wsProducts.getColumn("ca").numFmt = "#,##0";

  // Feuille 3 : par jour
  const wsDays = workbook.addWorksheet("Par jour");
  wsDays.columns = [
    { header: "Date", key: "date", width: 14 },
    { header: "Tickets", key: "count", width: 10 },
    { header: "CA (FCFA)", key: "total", width: 14 },
  ];
  wsDays.getRow(1).font = { bold: true };
  const dayMap = new Map<string, { count: number; total: number }>();
  for (const order of orders) {
    if (!order.paidAt) continue;
    const key = order.paidAt.toISOString().slice(0, 10);
    const entry = dayMap.get(key) ?? { count: 0, total: 0 };
    entry.count += 1;
    entry.total += order.total;
    dayMap.set(key, entry);
  }
  for (const [date, v] of dayMap) {
    wsDays.addRow({ date, count: v.count, total: v.total });
  }
  wsDays.getColumn("total").numFmt = "#,##0";

  // Total général
  const totalCA = orders.reduce((sum, o) => sum + o.total, 0);
  const wsSummary = workbook.addWorksheet("Synthèse");
  wsSummary.columns = [
    { header: "Indicateur", key: "label", width: 24 },
    { header: "Valeur", key: "value", width: 18 },
  ];
  wsSummary.getRow(1).font = { bold: true };
  wsSummary.addRow({ label: "Restaurant", value: user.restaurant.name });
  wsSummary.addRow({ label: "Période", value: period });
  wsSummary.addRow({ label: "Tickets encaissés", value: orders.length });
  wsSummary.addRow({ label: "Chiffre d'affaires (FCFA)", value: totalCA });
  wsSummary.addRow({
    label: "Panier moyen (FCFA)",
    value: orders.length ? Math.round(totalCA / orders.length) : 0,
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `restokonect-ventes-${period}-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}