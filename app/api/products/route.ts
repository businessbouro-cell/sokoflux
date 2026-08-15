import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ProductSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(10).max(5000),
  priceUSD: z.number().positive(),
  category: z.string(),
  images: z.array(z.string()).min(1).max(8),
  minOrderQty: z.number().int().positive().default(1),
  stockQty: z.number().int().nonnegative().default(0),
  weight: z.number().optional(),
  dimensions: z.string().optional(),
  shippingType: z.string().default("LCL"),
  shippingPort: z.string().optional(),
  leadTimeDays: z.number().int().positive().default(30),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const supplierId = searchParams.get("supplierId");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const isMyProducts = supplierId === "me";

  const session = isMyProducts ? await getServerSession(authOptions) : null;

  let supplierProfileId: string | undefined;
  if (isMyProducts && session) {
    const profile = await prisma.supplierProfile.findUnique({ where: { userId: session.user.id } });
    supplierProfileId = profile?.id;
  }

  const where: Record<string, unknown> = isMyProducts
    ? { supplierId: supplierProfileId }
    : { isVerified: true, isActive: true };

  if (category) where.category = category;
  if (!isMyProducts && supplierId) where.supplierId = supplierId;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        supplier: { include: { user: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ products, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const roles = session.user.roles as string[];
  if (!roles.includes("SUPPLIER") && !roles.includes("ADMIN")) {
    return NextResponse.json({ error: "Réservé aux fournisseurs" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = ProductSchema.parse(body);

    const supplierProfile = await prisma.supplierProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!supplierProfile) return NextResponse.json({ error: "Profil fournisseur manquant" }, { status: 400 });

    const product = await prisma.product.create({
      data: {
        supplierId: supplierProfile.id,
        title: data.title,
        description: data.description,
        priceUSD: data.priceUSD,
        category: data.category,
        images: JSON.stringify(data.images),
        minOrderQty: data.minOrderQty,
        stockQty: data.stockQty,
        weight: data.weight,
        dimensions: data.dimensions,
        shippingType: data.shippingType,
        shippingPort: data.shippingPort,
        leadTimeDays: data.leadTimeDays,
        isVerified: roles.includes("ADMIN"),
        isActive: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    console.error("[POST /api/products]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
