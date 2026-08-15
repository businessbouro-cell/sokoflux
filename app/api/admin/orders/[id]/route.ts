import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { releaseEscrow } from "@/lib/payments/escrow";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const roles = (session?.user?.roles as string[]) ?? [];
  if (!session?.user?.id || !roles.includes("ADMIN")) {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status, releaseEscrow: shouldRelease } = body;

  if (shouldRelease) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    if (order.paymentStatus !== "IN_ESCROW") {
      return NextResponse.json({ error: "Commande non en escrow" }, { status: 400 });
    }
    try {
      await releaseEscrow(id);
    } catch (e) {
      console.error("[Admin] releaseEscrow error:", e);
      return NextResponse.json({ error: "Erreur libération escrow" }, { status: 500 });
    }
    return NextResponse.json({ id, paymentStatus: "RELEASED" });
  }

  const order = await prisma.order.update({
    where: { id },
    data: { ...(status && { status }) },
    select: { id: true, status: true, paymentStatus: true },
  });

  return NextResponse.json(order);
}
