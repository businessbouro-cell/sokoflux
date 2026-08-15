import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const roles = (session.user.roles as string[]) ?? [];
  if (!roles.includes("ADMIN")) return null;
  return session;
}

export async function GET(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");
  const search = searchParams.get("search");

  const users = await prisma.user.findMany({
    where: {
      ...(role ? { roles: { some: { role: role as never } } } : {}),
      ...(search ? { OR: [{ name: { contains: search } }, { phone: { contains: search } }] } : {}),
    },
    select: {
      id: true, name: true, phone: true, isVerified: true, createdAt: true,
      roles: { select: { role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(users);
}
