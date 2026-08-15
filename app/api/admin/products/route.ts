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
  const approved = searchParams.get("approved");

  const products = await prisma.product.findMany({
    where: {
      ...(approved === "false" ? { isVerified: false } : {}),
      ...(approved === "true" ? { isVerified: true } : {}),
    },
    select: {
      id: true, title: true, priceUSD: true, images: true,
      isVerified: true, category: true, createdAt: true,
      supplier: {
        select: {
          companyName: true, city: true,
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ products });
}
