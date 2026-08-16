import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ListingSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  price: z.number().positive(),
  category: z.string(),
  condition: z.string(),
  city: z.string(),
  region: z.string(),
  images: z.array(z.string()).min(1).max(8),
  phone: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const condition = searchParams.get("condition");
  const region = searchParams.get("region");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const where: Record<string, unknown> = { isActive: true };
  if (category) where.category = category;
  if (condition) where.condition = condition;
  if (region) where.region = region;
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) (where.price as Record<string, number>).gte = parseFloat(minPrice);
    if (maxPrice) (where.price as Record<string, number>).lte = parseFloat(maxPrice);
  }
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: { seller: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.listing.count({ where }),
  ]);

  return NextResponse.json({ listings, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = ListingSchema.parse(body);

    const listing = await prisma.listing.create({
      data: {
        sellerId: session.user.id,
        title: data.title,
        description: data.description,
        price: data.price,
        category: data.category,
        condition: data.condition,
        city: data.city,
        region: data.region,
        images: JSON.stringify(data.images),
        isActive: true,
        isSold: false,
      },
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    console.error("[POST /api/listings]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
