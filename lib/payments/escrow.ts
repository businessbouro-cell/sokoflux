import { prisma } from "@/lib/prisma";
import { PLATFORM_COMMISSION_RATE } from "@/constants/currencies";

export async function initiateEscrow(orderId: string): Promise<void> {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });

  const buyer = await prisma.user.findUniqueOrThrow({
    where: { id: order.buyerId },
    include: { wallet: true },
  });

  if (!buyer.wallet) throw new Error("Portefeuille acheteur introuvable");
  if (buyer.wallet.balanceGNF < order.totalGNF) {
    throw new Error("Solde insuffisant");
  }

  await prisma.$transaction([
    prisma.wallet.update({
      where: { userId: order.buyerId },
      data: { balanceGNF: { decrement: order.totalGNF } },
    }),
    prisma.transaction.create({
      data: {
        walletId: buyer.wallet.id,
        orderId,
        type: "ESCROW_LOCK",
        amount: order.totalGNF,
        currency: "GNF",
        status: "COMPLETED",
        description: `Escrow verrouillé - Commande ${order.reference}`,
      },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "IN_ESCROW" },
    }),
  ]);
}

export async function releaseEscrow(orderId: string): Promise<void> {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  if (order.escrowReleased) return;

  const seller = await prisma.user.findUniqueOrThrow({
    where: { id: order.sellerId },
    include: { wallet: true },
  });

  const commission = Math.round(order.totalGNF * PLATFORM_COMMISSION_RATE);
  const sellerAmount = order.totalGNF - commission;

  if (!seller.wallet) throw new Error("Portefeuille vendeur introuvable");

  await prisma.$transaction([
    prisma.wallet.update({
      where: { userId: order.sellerId },
      data: { balanceGNF: { increment: sellerAmount } },
    }),
    prisma.transaction.create({
      data: {
        walletId: seller.wallet.id,
        orderId,
        type: "ESCROW_RELEASE",
        amount: sellerAmount,
        currency: "GNF",
        status: "COMPLETED",
        description: `Paiement reçu - Commande ${order.reference}`,
      },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "RELEASED", escrowReleased: true, status: "COMPLETED" },
    }),
  ]);
}

export async function refundEscrow(orderId: string): Promise<void> {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });

  const buyer = await prisma.user.findUniqueOrThrow({
    where: { id: order.buyerId },
    include: { wallet: true },
  });

  if (!buyer.wallet) throw new Error("Portefeuille acheteur introuvable");

  await prisma.$transaction([
    prisma.wallet.update({
      where: { userId: order.buyerId },
      data: { balanceGNF: { increment: order.totalGNF } },
    }),
    prisma.transaction.create({
      data: {
        walletId: buyer.wallet.id,
        orderId,
        type: "REFUND",
        amount: order.totalGNF,
        currency: "GNF",
        status: "COMPLETED",
        description: `Remboursement - Commande ${order.reference}`,
      },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "REFUNDED", status: "CANCELLED" },
    }),
  ]);
}
