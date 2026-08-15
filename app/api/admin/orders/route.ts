import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const roles = (session?.user?.roles as string[]) ?? [];
  if (!session?.user?.id || !roles.includes("ADMIN")) {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const orders = await prisma.order.findMany({
    where: status ? { status: status as never } : {},
    select: {
      id: true, reference: true, status: true, paymentStatus: true,
      totalGNF: true, createdAt: true,
      buyer: { select: { name: true, phone: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(orders);
}
