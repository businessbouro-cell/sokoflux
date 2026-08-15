"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Bell, Package, ShoppingBag, MessageCircle, AlertCircle, CheckCircle } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data: string | null;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  ORDER_PLACED: ShoppingBag,
  ORDER_CONFIRMED: CheckCircle,
  ORDER_DELIVERED: Package,
  PAYMENT_RECEIVED: CheckCircle,
  NEW_MESSAGE: MessageCircle,
  PRODUCT_APPROVED: Package,
  SHIPMENT_UPDATE: Package,
  SYSTEM: Bell,
};

const TYPE_COLOR: Record<string, string> = {
  ORDER_PLACED: "text-blue-500 bg-blue-50",
  ORDER_CONFIRMED: "text-green-500 bg-green-50",
  ORDER_DELIVERED: "text-[#1D9E75] bg-[#1D9E75]/10",
  PAYMENT_RECEIVED: "text-[#EF9F27] bg-[#EF9F27]/10",
  NEW_MESSAGE: "text-purple-500 bg-purple-50",
  PRODUCT_APPROVED: "text-[#1D9E75] bg-[#1D9E75]/10",
  SHIPMENT_UPDATE: "text-blue-500 bg-blue-50",
  SYSTEM: "text-gray-500 bg-gray-100",
};

export default function NotificationsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/notifications")
        .then((r) => r.json())
        .then((data) => { setNotifications(data ?? []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status]);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    import("@/stores/useNotificationStore").then(({ useNotificationStore }) => {
      useNotificationStore.getState().markRead(id);
    });
  }

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    // sync store
    import("@/stores/useNotificationStore").then(({ useNotificationStore }) => {
      useNotificationStore.getState().markAllRead();
    });
  }

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
              {unread > 0 && <p className="text-sm text-gray-500">{unread} non lue{unread > 1 ? "s" : ""}</p>}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-sm text-[#1D9E75] font-medium">
                Tout marquer lu
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-[#F7F5F0] rounded-xl animate-pulse" />)}</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell size={48} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">Aucune notification</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif) => {
                const Icon = TYPE_ICON[notif.type] ?? AlertCircle;
                const colorClass = TYPE_COLOR[notif.type] ?? "text-gray-500 bg-gray-100";
                const [textColor, bgColor] = colorClass.split(" ");
                return (
                  <button
                    key={notif.id}
                    onClick={() => { markRead(notif.id); if (notif.data) router.push(notif.data); }}
                    className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-colors ${notif.isRead ? "bg-white border-[#E8E4DB]" : "bg-[#F7F5F0] border-[#1D9E75]/20"}`}
                  >
                    <div className={`w-9 h-9 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={16} className={textColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${notif.isRead ? "text-gray-700" : "text-gray-900"}`}>{notif.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{notif.body}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    {!notif.isRead && <div className="w-2 h-2 rounded-full bg-[#1D9E75] flex-shrink-0 mt-1" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
