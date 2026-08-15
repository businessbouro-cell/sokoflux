import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  const roles = (session?.user?.roles as string[]) ?? [];
  if (!session?.user?.id || !roles.includes("ADMIN")) {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }

  const [users, products, orders, shipments, pendingProducts, pendingOrders, totalGNF] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.shipment.count(),
    prisma.product.count({ where: { isVerified: false } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.aggregate({ _sum: { totalGNF: true }, where: { paymentStatus: { in: ["PAID", "IN_ESCROW", "RELEASED"] } } }),
  ]);

  return NextResponse.json({
    users,
    products,
    orders,
    shipments,
    pendingProducts,
    pendingOrders,
    totalRevenueGNF: totalGNF._sum.totalGNF ?? 0,
  });
}
