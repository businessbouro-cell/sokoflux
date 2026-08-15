import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      supplier: { include: { user: { select: { id: true, name: true, phone: true } } } },
    },
  });

  if (!product) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });

  await prisma.product.update({ where: { id }, data: { viewCount: { increment: 1 } } });

  return NextResponse.json(product);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { supplier: true },
  });
  if (!product) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const roles = session.user.roles as string[];
  const isOwner = product.supplier?.userId === session.user.id;
  const isAdmin = roles.includes("ADMIN");
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const body = await req.json();
  const updated = await prisma.product.update({
    where: { id },
    data: {
      ...(body.title && { title: body.title }),
      ...(body.priceUSD !== undefined && { priceUSD: body.priceUSD }),
      ...(body.stockQty !== undefined && { stockQty: body.stockQty }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(isAdmin && body.isVerified !== undefined && { isVerified: body.isVerified }),
      ...(isAdmin && body.isApproved !== undefined && { isVerified: body.isApproved }),
    },
  });

  return NextResponse.json(updated);
}
