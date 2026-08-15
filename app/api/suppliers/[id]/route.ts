import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const profile = await prisma.supplierProfile.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, createdAt: true } },
      products: {
        where: { isVerified: true, isActive: true },
        orderBy: { viewCount: "desc" },
        take: 20,
        select: {
          id: true, title: true, priceUSD: true, images: true,
          minOrderQty: true, viewCount: true, category: true,
        },
      },
    },
  });

  if (!profile) return NextResponse.json({ error: "Fournisseur introuvable" }, { status: 404 });

  const reviews = await prisma.review.findMany({
    where: { targetId: profile.userId },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : profile.rating;

  return NextResponse.json({ ...profile, reviews, avgRating });
}
