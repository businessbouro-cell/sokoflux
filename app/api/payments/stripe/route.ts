import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const IS_MOCK = process.env.NODE_ENV !== "production";
const GNF_TO_USD = 8600;

async function mockStripeCheckout(orderId: string, amountUSD: number): Promise<{ sessionId: string; url: string }> {
  await new Promise((r) => setTimeout(r, 500));
  console.log(`[STRIPE MOCK] Checkout session créée — orderId:${orderId} amount:${amountUSD.toFixed(2)} USD`);
  return {
    sessionId: `cs_mock_${Date.now()}`,
    url: `http://localhost:3000/orders?payment=success&orderId=${orderId}`,
  };
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { orderId } = await req.json();

  const order = await prisma.order.findFirst({
    where: { id: orderId, buyerId: session.user.id },
    select: { id: true, totalGNF: true, paymentStatus: true },
  });

  if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  if (order.paymentStatus === "PAID") return NextResponse.json({ error: "Déjà payée" }, { status: 400 });

  const amountUSD = order.totalGNF / GNF_TO_USD;

  if (IS_MOCK) {
    const result = await mockStripeCheckout(orderId, amountUSD);
    return NextResponse.json(result);
  }

  const stripe = (await import("stripe")).default;
  const client = new stripe(process.env.STRIPE_SECRET_KEY!);
  const checkoutSession = await client.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: `Commande SokoFlux #${orderId.slice(-8)}` },
        unit_amount: Math.round(amountUSD * 100),
      },
      quantity: 1,
    }],
    mode: "payment",
    success_url: `${process.env.NEXTAUTH_URL}/orders?payment=success&orderId=${orderId}`,
    cancel_url: `${process.env.NEXTAUTH_URL}/orders`,
    metadata: { orderId },
  });

  return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url });
}
