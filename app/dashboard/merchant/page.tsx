"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { formatGNF } from "@/lib/utils/currency";
import { Store, Package, ShoppingBag, TrendingUp, Plus, AlertTriangle } from "lucide-react";

export default function MerchantDashboard() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<{ id: string; totalGNF: number; status: string; reference: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => { setOrders(data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalRevenue = orders.reduce((s, o) => s + o.totalGNF, 0);
  const pendingOrders = orders.filter((o) => o.status === "PENDING").length;

  const stats = [
    { icon: ShoppingBag, label: "Commandes reçues", value: orders.length, color: "text-[#1D9E75]", bg: "bg-[#1D9E75]/10" },
    { icon: TrendingUp, label: "CA total", value: formatGNF(totalRevenue), color: "text-[#EF9F27]", bg: "bg-[#EF9F27]/10" },
    { icon: AlertTriangle, label: "En attente", value: pendingOrders, color: "text-red-500", bg: "bg-red-50" },
    { icon: Store, label: "Statut", value: "Actif", color: "text-blue-500", bg: "bg-blue-50" },
  ];

  const STATUS_MAP: Record<string, string> = { PENDING: "En attente", CONFIRMED: "Confirmée", DELIVERED: "Livrée", CANCELLED: "Annulée" };
  const STATUS_COLOR: Record<string, string> = { PENDING: "bg-yellow-100 text-yellow-700", CONFIRMED: "bg-blue-100 text-blue-700", DELIVERED: "bg-green-100 text-green-700", CANCELLED: "bg-red-100 text-red-700" };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Dashboard Commerçant</h1>
              <p className="text-sm text-gray-500">Bonjour, {session?.user.name}</p>
            </div>
            <Button asChild size="sm"><Link href="/products"><Plus size={15} className="mr-1" /> Commander</Link></Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {stats.map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="bg-white rounded-xl border border-[#E8E4DB] p-4">
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-2`}>
                  <Icon size={18} className={color} />
                </div>
                <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-[#E8E4DB] p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Commandes récentes</h2>
            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-[#F7F5F0] rounded-lg animate-pulse" />)}</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">Aucune commande</div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 8).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-xl border border-[#E8E4DB]">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.reference}</p>
                      <p className="text-xs text-gray-400">{formatGNF(order.totalGNF)}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {STATUS_MAP[order.status] ?? order.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
