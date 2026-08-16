import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const shipments = await prisma.shipment.findMany({
    where,
    include: {
      importer: { include: { user: { select: { name: true } } } },
      trackingEvents: { orderBy: { timestamp: "desc" }, take: 1 },
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(shipments);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const roles = session.user.roles as string[];
  if (!roles.includes("IMPORTER") && !roles.includes("ADMIN")) {
    return NextResponse.json({ error: "Réservé aux importateurs" }, { status: 403 });
  }

  const body = await req.json();
  const importerProfile = await prisma.importerProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!importerProfile) return NextResponse.json({ error: "Profil importateur manquant" }, { status: 400 });

  const randomPart = require("crypto").randomBytes(3).toString("hex").toUpperCase();
  const ref = `SF-${new Date().getFullYear()}-${randomPart}`;

  const shipment = await prisma.shipment.create({
    data: {
      importerId: importerProfile.id,
      reference: ref,
      type: body.type ?? "FCL_20",
      origin: body.origin ?? "Guangzhou",
      destination: body.destination ?? "Conakry",
      status: "BOOKING",
      capacityM3: body.capacityM3 ?? 28,
      usedM3: 0,
      departureDate: body.departureDate ? new Date(body.departureDate) : new Date(Date.now() + 30 * 86400000),
      estimatedArrival: body.estimatedArrival ? new Date(body.estimatedArrival) : new Date(Date.now() + 75 * 86400000),
    },
  });

  return NextResponse.json(shipment, { status: 201 });
}
