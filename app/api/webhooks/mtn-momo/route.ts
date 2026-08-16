import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { initiateEscrow } from "@/lib/payments/escrow";
import { sendSMSNotification } from "@/lib/notifications/sms";

function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.MTN_MOMO_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-mtn-signature") ?? "";

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const { status, externalId: orderId, amount, financialTransactionId } = event as {
    status: string; externalId: string; amount: number; financialTransactionId: string;
  };

  if (status === "SUCCESSFUL" && orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { buyer: { select: { phone: true } } },
    });

    if (order && order.paymentStatus === "PENDING") {
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: "PAID", status: "CONFIRMED" },
      });

      try {
        await initiateEscrow(orderId);
      } catch {
        console.log("[Webhook MTN] Escrow skipped for order:", orderId);
      }

      if (order.buyer.phone) {
        await sendSMSNotification(
          order.buyer.phone,
          `SokoFlux: Paiement MTN MoMo confirmé (${amount} GNF). Commande #${order.reference} confirmée.`
        );
      }

      await prisma.notification.create({
        data: {
          userId: order.buyerId,
          type: "PAYMENT_CONFIRMED",
          title: "Paiement MTN confirmé",
          body: `Paiement de ${amount} GNF reçu. Commande #${order.reference} en cours.`,
          data: `/orders`,
        },
      });
    }
  }

  if (status === "FAILED" && orderId) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (order) {
      await prisma.notification.create({
        data: {
          userId: order.buyerId,
          type: "PAYMENT_FAILED",
          title: "Paiement MTN échoué",
          body: `Le paiement MTN MoMo pour la commande #${order.reference} a échoué.`,
          data: `/orders`,
        },
      });
    }
  }

  console.log(`[Webhook MTN] ${status} — txn:${financialTransactionId} order:${orderId}`);
  return NextResponse.json({ received: true });
}
