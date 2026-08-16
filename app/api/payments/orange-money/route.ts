import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { initiateOrangeMoneyPayment, checkOrangeMoneyStatus } from "@/lib/payments/orange-money";
import { initiateEscrow } from "@/lib/payments/escrow";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { phone, amount, orderId } = await req.json();

  if (!phone || !amount || !orderId) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const reference = `OM-${orderId}-${Date.now()}`;
  const result = await initiateOrangeMoneyPayment(phone, amount, reference);

  if (result.status === "SUCCESS") {
    await initiateEscrow(orderId);
  }

  return NextResponse.json(result);
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const txnId = searchParams.get("txnId");
  if (!txnId) return NextResponse.json({ error: "txnId requis" }, { status: 400 });

  const status = await checkOrangeMoneyStatus(txnId);
  return NextResponse.json(status);
}
