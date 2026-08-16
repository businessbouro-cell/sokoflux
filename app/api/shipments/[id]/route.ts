import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const roles = (session.user.roles as string[]) ?? [];
  const isAdmin = roles.includes("ADMIN");

  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      importer: { include: { user: { select: { name: true } } } },
      trackingEvents: { orderBy: { timestamp: "desc" } },
      orders: {
        include: { buyer: { select: { name: true } } },
        take: 10,
      },
    },
  });

  if (!shipment) return NextResponse.json({ error: "Conteneur introuvable" }, { status: 404 });

  const isOwner = shipment.importer?.userId === session.user.id;
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  return NextResponse.json(shipment);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const roles = session.user.roles as string[];
  if (!roles.includes("ADMIN") && !roles.includes("IMPORTER")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const updated = await prisma.shipment.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.usedM3 !== undefined && { usedM3: body.usedM3 }),
      ...(body.actualArrival && { actualArrival: new Date(body.actualArrival) }),
    },
  });

  if (body.location || body.description || body.status) {
    await prisma.trackingEvent.create({
      data: {
        shipmentId: id,
        status: body.status ?? updated.status,
        location: body.location ?? "En route",
        description: body.description ?? `Statut mis à jour: ${body.status ?? updated.status}`,
      },
    });
  }

  return NextResponse.json(updated);
}
