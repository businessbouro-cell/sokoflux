import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendOTP } from "@/lib/notifications/sms";
import { sendWelcomeEmail } from "@/lib/notifications/email";

const RegisterSchema = z.object({
  phone: z.string().min(8).max(15),
  name: z.string().min(2).max(100),
  password: z.string().min(8).max(128),
  role: z.enum(["IMPORTER", "LOCAL_MERCHANT", "INDIVIDUAL", "SUPPLIER"]),
  email: z.string().email().optional(),
  // Supplier fields
  companyName: z.string().optional(),
  city: z.string().optional(),
  businessLicense: z.string().optional(),
  // Merchant/Importer fields
  region: z.string().optional(),
  address: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = RegisterSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (existing) {
      return NextResponse.json({ error: "Ce numéro est déjà utilisé." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        phone: data.phone,
        name: data.name,
        email: data.email,
        passwordHash: hashedPassword,
        isVerified: false,
        roles: { create: [{ role: data.role }] },
      },
    });

    // Create role-specific profile
    if (data.role === "SUPPLIER") {
      await prisma.supplierProfile.create({
        data: {
          userId: user.id,
          companyName: data.companyName ?? data.name,
          city: data.city ?? "Guangzhou",
          isVerified: false,
        },
      });
    } else if (data.role === "IMPORTER") {
      await prisma.importerProfile.create({
        data: {
          userId: user.id,
          businessName: data.companyName ?? data.name,
        },
      });
    } else if (data.role === "LOCAL_MERCHANT") {
      await prisma.merchantProfile.create({
        data: {
          userId: user.id,
          shopName: data.companyName ?? data.name,
          city: data.city ?? "Conakry",
          region: data.region ?? "Conakry",
          address: data.address,
        },
      });
    }

    // Create wallet for non-supplier users
    if (data.role !== "SUPPLIER") {
      await prisma.wallet.create({
        data: {
          userId: user.id,
          balanceGNF: 0,
        },
      });
    }

    // Send OTP for phone verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await sendOTP(data.phone, otp);

    if (data.email) {
      await sendWelcomeEmail(data.email, data.name);
    }

    return NextResponse.json(
      { id: user.id, phone: user.phone, name: user.name },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    console.error("[POST /api/users]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
