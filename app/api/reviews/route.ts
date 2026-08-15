import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ReviewSchema = z.object({
  targetId: z.string(),
  orderId: z.string().optional(),
  productId: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { targetId, orderId, productId, rating, comment } = parsed.data;

  if (session.user.id === targetId) {
    return NextResponse.json({ error: "Vous ne pouvez pas vous noter vous-même" }, { status: 400 });
  }

  // If linked to an order, verify the requester is the buyer
  if (orderId) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.buyerId !== session.user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
    // Prevent duplicate review for the same order
    const existing = await prisma.review.findFirst({ where: { orderId, authorId: session.user.id } });
    if (existing) return NextResponse.json({ error: "Avis déjà soumis pour cette commande" }, { status: 409 });
  }

  const review = await prisma.review.create({
    data: {
      authorId: session.user.id,
      targetId,
      orderId,
      productId,
      rating,
      comment,
    },
  });

  // Recalculate average rating for the target user's supplier profile
  const avg = await prisma.review.aggregate({
    where: { targetId },
    _avg: { rating: true },
  });

  await prisma.supplierProfile.updateMany({
    where: { userId: targetId },
    data: { rating: avg._avg.rating ?? 0 },
  });

  return NextResponse.json(review, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get("targetId");
  const productId = searchParams.get("productId");

  const reviews = await prisma.review.findMany({
    where: {
      ...(targetId && { targetId }),
      ...(productId && { productId }),
    },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(reviews);
}
