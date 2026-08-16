import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const withUserId = searchParams.get("with");

  if (withUserId) {
    // Messages d'une conversation spécifique
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: withUserId },
          { senderId: withUserId, receiverId: session.user.id },
        ],
      },
      include: {
        sender: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    // Marquer comme lus
    await prisma.message.updateMany({
      where: { senderId: withUserId, receiverId: session.user.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json(messages);
  }

  // Liste des conversations (dernier message par interlocuteur)
  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: session.user.id }, { receiverId: session.user.id }],
    },
    include: {
      sender: { select: { id: true, name: true } },
      receiver: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Grouper par interlocuteur (premier message de chaque conversation)
  const conversations = new Map<string, typeof messages[0]>();
  for (const msg of messages) {
    const otherId = msg.senderId === session.user.id ? msg.receiverId : msg.senderId;
    if (!conversations.has(otherId)) {
      conversations.set(otherId, msg);
    }
  }

  return NextResponse.json(Array.from(conversations.values()));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { receiverId, content } = await req.json();
  if (!receiverId || !content?.trim()) {
    return NextResponse.json({ error: "Destinataire et contenu requis" }, { status: 400 });
  }
  if (typeof content !== "string" || content.trim().length > 2000) {
    return NextResponse.json({ error: "Message trop long (max 2000 caractères)" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      senderId: session.user.id,
      receiverId,
      content: content.trim(),
      isRead: false,
    },
    include: {
      sender: { select: { id: true, name: true } },
    },
  });

  // Trigger Pusher
  try {
    const channelId = [session.user.id, receiverId].sort().join("-");
    await pusherServer.trigger(`private-chat-${channelId}`, "new-message", message);
    await pusherServer.trigger(`private-user-${receiverId}`, "notification", {
      type: "NEW_MESSAGE",
      from: session.user.name,
    });
  } catch (e) {
    // Pusher non configuré en dev — ignoré
    console.log("[Pusher] Message envoyé (mock):", message.id);
  }

  return NextResponse.json(message, { status: 201 });
}
