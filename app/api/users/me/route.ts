import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, phone: true, email: true, avatar: true,
      city: true, region: true, isVerified: true, createdAt: true,
      roles: { select: { role: true } },
      wallet: { select: { balanceGNF: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ ...user, roles: user.roles.map((r) => r.role) });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { name: name.trim() },
    select: { id: true, name: true, phone: true },
  });

  return NextResponse.json(user);
}
