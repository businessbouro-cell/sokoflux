import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const suppliers = await prisma.supplierProfile.findMany({
    where: { isVerified: true },
    include: {
      user: { select: { id: true, name: true, createdAt: true } },
      _count: { select: { products: true } },
    },
    orderBy: { rating: "desc" },
  });

  return NextResponse.json(suppliers);
}
