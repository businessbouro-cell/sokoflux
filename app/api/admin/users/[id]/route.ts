import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const roles = (session?.user?.roles as string[]) ?? [];
  if (!session?.user?.id || !roles.includes("ADMIN")) {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  if (typeof body.isVerified !== "boolean") {
    return NextResponse.json({ error: "isVerified doit être un booléen" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { isVerified: body.isVerified },
    select: { id: true, name: true, isVerified: true },
  });

  return NextResponse.json(user);
}
