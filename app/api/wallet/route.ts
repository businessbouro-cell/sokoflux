import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const walletQuery = {
    where: { userId: session.user.id },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" } as const,
        take: 30,
      },
    },
  };

  const existing = await prisma.wallet.findUnique(walletQuery);

  const wallet = existing ?? await prisma.wallet.create({
    data: { userId: session.user.id, balanceGNF: 0 },
    include: { transactions: true },
  });

  return NextResponse.json(wallet);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { amount, description } = body;
  const type = "DEPOSIT"; // only DEPOSIT allowed from user-facing API

  if (!amount || typeof amount !== "number" || amount <= 0 || amount > 100_000_000) {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
  }

  const wallet = await prisma.wallet.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, balanceGNF: 0 },
    update: {},
  });

  // type is always DEPOSIT here — delta is always positive
  const delta = amount;

  const [updatedWallet, transaction] = await prisma.$transaction([
    prisma.wallet.update({
      where: { id: wallet.id },
      data: { balanceGNF: { increment: delta } },
    }),
    prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type,
        amount,
        currency: "GNF",
        status: "COMPLETED",
        description: description ?? (type === "DEPOSIT" ? "Rechargement portefeuille" : "Transaction"),
      },
    }),
  ]);

  return NextResponse.json({ wallet: updatedWallet, transaction }, { status: 201 });
}
