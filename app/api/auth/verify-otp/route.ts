import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// In production, OTPs would be stored in Redis with TTL.
// In dev, we accept the code "123456" as a universal mock OTP.
export async function POST(req: NextRequest) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: "Numéro et code requis." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    // Dev: accept "123456" as universal OTP
    const isValid = process.env.NODE_ENV !== "production" ? otp === "123456" : false;

    if (!isValid) {
      return NextResponse.json({ error: "Code incorrect ou expiré." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/auth/verify-otp]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
