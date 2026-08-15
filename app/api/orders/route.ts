import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const OrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().optional(),
    listingId: z.string().optional(),
    title: z.string(),
    image: z.string().optional(),
    quantity: z.number().int().positive(),
    priceGNF: z.number().positive(),
  })),
  type: z.enum(["IMPORT_CHINA", "LOCAL_WHOLESALE", "C2C"]).default("IMPORT_CHINA"),
  paymentMethod: z.enum(["ORANGE_MONEY", "MTN_MOMO", "STRIPE", "CASH"]).default("ORANGE_MONEY"),
  shipmentId: z.string().optional(),
  deliveryAddress: z.string().optional(),
  deliveryCity: z.string().optional(),
  deliveryRegion: z.string().optional(),
  notes: z.string().optional(),
  sellerId: z.string(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") ?? "buyer";

  const where = role === "seller"
    ? { sellerId: session.user.id }
    : { buyerId: session.user.id };

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: true,
      buyer: { select: { name: true, phone: true } },
      shipment: { select: { reference: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });

  try {
    const body = await req.json();
    const data = OrderSchema.parse(body);

    const totalGNF = data.items.reduce((sum, item) => sum + item.quantity * item.priceGNF, 0);
    const ref = `ORD-${Date.now().toString(36).toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        buyerId: session.user.id,
        sellerId: data.sellerId,
        reference: ref,
        type: data.type,
        status: "PENDING",
        totalGNF,
        paymentMethod: data.paymentMethod,
        paymentStatus: "PENDING",
        shipmentId: data.shipmentId,
        deliveryAddress: data.deliveryAddress,
        deliveryCity: data.deliveryCity,
        deliveryRegion: data.deliveryRegion,
        notes: data.notes,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            listingId: item.listingId,
            title: item.title,
            image: item.image,
            quantity: item.quantity,
            priceGNF: item.priceGNF,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
