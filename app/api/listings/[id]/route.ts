import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      seller: { select: { id: true, name: true, createdAt: true } },
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  }

  // Incrémenter les vues
  await prisma.listing.update({ where: { id }, data: { viewCount: { increment: 1 } } });

  return NextResponse.json(listing);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const isOwner = listing.sellerId === session.user.id;
  const isAdmin = (session.user.roles as string[]).includes("ADMIN");
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const body = await req.json();
  const updated = await prisma.listing.update({
    where: { id },
    data: {
      ...(body.title && { title: body.title }),
      ...(body.description && { description: body.description }),
      ...(body.price !== undefined && { price: body.price }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.isSold !== undefined && { isSold: body.isSold }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const isOwner = listing.sellerId === session.user.id;
  const isAdmin = (session.user.roles as string[]).includes("ADMIN");
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  await prisma.listing.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
