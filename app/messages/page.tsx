"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import type PusherJs from "pusher-js";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageCircle } from "lucide-react";
import { formatRelative } from "@/lib/utils/formatters";

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  createdAt: string;
  sender: { id: string; name: string };
}

interface Conversation {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string };
  receiver: { id: string; name: string };
}

function MessagesContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const withUserId = searchParams.get("with");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [activeConvUserId, setActiveConvUserId] = useState<string | null>(withUserId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pusherRef = useRef<PusherJs | null>(null);
  const channelRef = useRef<ReturnType<PusherJs["subscribe"]> | null>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/messages")
        .then((r) => r.json())
        .then(setConversations);
    }
  }, [status]);

  useEffect(() => {
    if (activeConvUserId && status === "authenticated") {
      fetch(`/api/messages?with=${activeConvUserId}`)
        .then((r) => r.json())
        .then((data) => { setMessages(data); scrollToBottom(); });
    }
  }, [activeConvUserId, status, scrollToBottom]);

  // Pusher — écoute temps réel de la conversation active
  useEffect(() => {
    if (!activeConvUserId || !session?.user?.id) return;

    import("pusher-js").then(({ default: PusherClient }) => {
      const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
      const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "eu";
      if (!key || key === "mock") return;

      const client = new PusherClient(key, { cluster });
      pusherRef.current = client;

      const channelId = [session.user.id, activeConvUserId].sort().join("-");
      const channel = client.subscribe(`private-chat-${channelId}`);
      channelRef.current = channel;

      channel.bind("new-message", (msg: Message) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        scrollToBottom();
      });
    }).catch(() => {/* Pusher non configuré */});

    return () => {
      channelRef.current?.unbind_all();
      pusherRef.current?.disconnect();
      pusherRef.current = null;
    };
  }, [activeConvUserId, session?.user?.id, scrollToBottom]);

  async function sendMessage() {
    if (!newMessage.trim() || !activeConvUserId) return;
    setSending(true);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: activeConvUserId, content: newMessage }),
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
      setNewMessage("");
      scrollToBottom();
    }
    setSending(false);
  }

  if (status === "unauthenticated") return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <MessageCircle size={40} className="text-gray-200" />
        <p className="text-gray-500">Connectez-vous pour accéder à vos messages</p>
        <Button asChild><Link href="/login">Se connecter</Link></Button>
      </div>
      <BottomNav />
    </div>
  );

  const getOtherUser = (conv: Conversation) =>
    conv.senderId === session?.user.id ? conv.receiver : conv.sender;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0 overflow-hidden">
        <div className="mx-auto max-w-4xl h-full flex" style={{ height: "calc(100vh - 64px - 80px)" }}>
          {/* Sidebar conversations */}
          <div className={`${activeConvUserId ? "hidden md:flex" : "flex"} flex-col w-full md:w-72 border-r border-[#E8E4DB]`}>
            <div className="p-4 border-b border-[#E8E4DB]">
              <h2 className="font-bold text-gray-900">Messages</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">Aucune conversation</div>
              ) : conversations.map((conv) => {
                const other = getOtherUser(conv);
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConvUserId(other.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F7F5F0] transition-colors text-left ${activeConvUserId === other.id ? "bg-[#F7F5F0]" : ""}`}
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="bg-[#1D9E75]/20 text-[#1D9E75] text-sm">
                        {other.name?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{other.name}</p>
                      <p className="text-xs text-gray-400 truncate">{conv.content}</p>
                    </div>
                    <span className="text-[10px] text-gray-300 flex-shrink-0">{formatRelative(conv.createdAt)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zone de chat */}
          {activeConvUserId ? (
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E8E4DB] bg-white">
                <button onClick={() => setActiveConvUserId(null)} className="md:hidden text-gray-400 mr-1">←</button>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#1D9E75]/20 text-[#1D9E75] text-xs">?</AvatarFallback>
                </Avatar>
                <p className="font-medium text-sm text-gray-900">Conversation</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.map((msg) => {
                  const isMe = msg.senderId === session?.user.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${isMe ? "bg-[#1D9E75] text-white rounded-br-sm" : "bg-[#F7F5F0] text-gray-900 rounded-bl-sm"}`}>
                        <p>{msg.content}</p>
                        <p className={`text-[10px] mt-0.5 ${isMe ? "text-white/70" : "text-gray-400"}`}>{formatRelative(msg.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-[#E8E4DB] flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Écrire un message..."
                  className="flex-1 rounded-xl border border-[#E8E4DB] px-4 py-2 text-sm focus:outline-none focus:border-[#1D9E75]"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="w-10 h-10 rounded-xl bg-[#1D9E75] text-white flex items-center justify-center disabled:opacity-40"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center">
              <div className="text-center text-gray-400">
                <MessageCircle size={40} className="mx-auto mb-2 text-gray-200" />
                <p className="text-sm">Sélectionnez une conversation</p>
              </div>
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

export default function MessagesPage() {
  return <Suspense><MessagesContent /></Suspense>;
}
