import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requestToPayMTN, getMTNPaymentStatus } from "@/lib/payments/mtn-momo";
import { initiateEscrow } from "@/lib/payments/escrow";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { phone, amount, orderId } = await req.json();
  if (!phone || !amount || !orderId) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const reference = `MTN-${orderId}-${Date.now()}`;
  const result = await requestToPayMTN(phone, amount, reference);

  return NextResponse.json(result);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const referenceId = searchParams.get("referenceId");
  const orderId = searchParams.get("orderId");

  if (!referenceId) return NextResponse.json({ error: "referenceId requis" }, { status: 400 });

  const session = await getServerSession(authOptions);
  const status = await getMTNPaymentStatus(referenceId);

  if (status.status === "SUCCESSFUL" && orderId && session) {
    await initiateEscrow(orderId);
  }

  return NextResponse.json(status);
}
