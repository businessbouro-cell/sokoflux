import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { initiateEscrow } from "@/lib/payments/escrow";
import { sendSMSNotification } from "@/lib/notifications/sms";

function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.ORANGE_MONEY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-om-signature") ?? "";

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const { status, orderId, txnId, amount } = event as {
    status: string; orderId: string; txnId: string; amount: number;
  };

  if (status === "SUCCESS" && orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { buyer: { select: { phone: true, name: true } } },
    });

    if (order && order.paymentStatus === "PENDING") {
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: "PAID", status: "CONFIRMED" },
      });

      try {
        await initiateEscrow(orderId);
      } catch {
        // Escrow via wallet — peut échouer si solde insuffisant dans ce flux
        console.log("[Webhook OM] Escrow skipped for order:", orderId);
      }

      if (order.buyer.phone) {
        await sendSMSNotification(
          order.buyer.phone,
          `SokoFlux: Paiement Orange Money confirmé (${amount} GNF). Commande #${order.reference} en cours de traitement.`
        );
      }

      await prisma.notification.create({
        data: {
          userId: order.buyerId,
          type: "PAYMENT_CONFIRMED",
          title: "Paiement confirmé",
          body: `Votre paiement Orange Money de ${amount} GNF a été reçu. Réf: ${order.reference}`,
          data: `/orders`,
        },
      });
    }
  }

  if (status === "FAILED" && orderId) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (order) {
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: "PENDING" },
      });
      await prisma.notification.create({
        data: {
          userId: order.buyerId,
          type: "PAYMENT_FAILED",
          title: "Paiement échoué",
          body: `Le paiement Orange Money pour la commande #${order.reference} a échoué. Veuillez réessayer.`,
          data: `/orders`,
        },
      });
    }
  }

  console.log(`[Webhook OM] ${status} — txn:${txnId} order:${orderId}`);
  return NextResponse.json({ received: true });
}
