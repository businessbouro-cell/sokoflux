import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(notifications);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const { userId, type, title, message, link } = body;

  const roles = (session.user.roles as string[]) ?? [];
  if (!roles.includes("ADMIN") && userId !== session.user.id) {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }

  const notif = await prisma.notification.create({
    data: {
      userId: userId ?? session.user.id,
      type,
      title,
      body: message ?? "",
      data: link ?? null,
    },
  });

  return NextResponse.json(notif, { status: 201 });
}
