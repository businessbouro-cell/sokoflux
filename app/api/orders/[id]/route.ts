import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      shipment: {
        select: { reference: true, status: true, estimatedArrival: true },
      },
      seller: { select: { id: true, name: true } },
    },
  });

  if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  if (order.buyerId !== session.user.id && order.sellerId !== session.user.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  return NextResponse.json(order);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { status, deliveryAddress, deliveryCity, deliveryRegion } = body;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

  const isOwner = order.buyerId === session.user.id || order.sellerId === session.user.id;
  const isAdmin = (session.user as { roles?: string[] }).roles?.includes("ADMIN");
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const allowedBuyerStatuses = ["CANCELLED"];
  const allowedSellerStatuses = ["CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
  const allowedAdminStatuses = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED", "DISPUTED", "REFUNDED"];

  if (status) {
    const allowed = isAdmin ? allowedAdminStatuses : order.buyerId === session.user.id ? allowedBuyerStatuses : allowedSellerStatuses;
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: "Statut non autorisé" }, { status: 403 });
    }
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(deliveryAddress && { deliveryAddress }),
      ...(deliveryCity && { deliveryCity }),
      ...(deliveryRegion && { deliveryRegion }),
    },
  });

  return NextResponse.json(updated);
}
