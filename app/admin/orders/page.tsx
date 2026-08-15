"use client";

import { Suspense, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { formatGNF } from "@/lib/utils/currency";

interface Order {
  id: string;
  reference: string;
  status: string;
  paymentStatus: string;
  totalGNF: number;
  createdAt: string;
  buyer: { name: string; phone: string };
  _count: { items: number };
}

const STATUS_MAP: Record<string, string> = {
  PENDING: "En attente", CONFIRMED: "Confirmée", PROCESSING: "En cours",
  SHIPPED: "Expédiée", DELIVERED: "Livrée", CANCELLED: "Annulée", DISPUTED: "Litige",
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700", CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-purple-100 text-purple-700", SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-green-100 text-green-700", CANCELLED: "bg-gray-100 text-gray-600",
  DISPUTED: "bg-red-100 text-red-700",
};
const PAYMENT_COLOR: Record<string, string> = {
  PENDING: "text-yellow-600", PAID: "text-green-600", IN_ESCROW: "text-blue-600",
  RELEASED: "text-[#1D9E75]", REFUNDED: "text-red-600",
};

function AdminOrdersContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "");

  useEffect(() => {
    const roles = (session?.user?.roles as string[]) ?? [];
    if (status === "authenticated" && !roles.includes("ADMIN")) router.push("/");
  }, [session, status, router]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/admin/orders?${params}`)
      .then((r) => r.json())
      .then((d) => { setOrders(d ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [statusFilter]);

  async function updateStatus(orderId: string, newStatus: string) {
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
  }

  async function releaseEscrow(orderId: string) {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ releaseEscrow: true }),
    });
    if (res.ok) {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, paymentStatus: "RELEASED" } : o));
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/admin" className="text-gray-400 hover:text-gray-600">←</Link>
            <h1 className="text-xl font-bold text-gray-900">Commandes</h1>
          </div>

          <div className="flex gap-2 mb-4 flex-wrap">
            <button onClick={() => setStatusFilter("")} className={`px-3 py-1.5 text-sm rounded-xl font-medium transition-colors ${statusFilter === "" ? "bg-[#1D9E75] text-white" : "bg-white border border-[#E8E4DB] text-gray-600"}`}>Toutes</button>
            {["PENDING", "DISPUTED", "DELIVERED"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 text-sm rounded-xl font-medium transition-colors ${statusFilter === s ? "bg-[#1D9E75] text-white" : "bg-white border border-[#E8E4DB] text-gray-600"}`}>
                {STATUS_MAP[s]}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-[#F7F5F0] rounded-xl animate-pulse" />)}</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Aucune commande</div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E8E4DB] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#F7F5F0] border-b border-[#E8E4DB]">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Référence</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Acheteur</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Montant</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Statut</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E4DB]">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#F7F5F0]">
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs font-semibold text-gray-900">{order.reference}</p>
                        <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString("fr-FR")}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900">{order.buyer.name}</p>
                        <p className="text-xs text-gray-500">{order.buyer.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{formatGNF(order.totalGNF)}</p>
                        <p className={`text-xs font-medium ${PAYMENT_COLOR[order.paymentStatus] ?? "text-gray-400"}`}>{order.paymentStatus}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${STATUS_COLOR[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {STATUS_MAP[order.status] ?? order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5">
                          <select
                            value={order.status}
                            onChange={(e) => updateStatus(order.id, e.target.value)}
                            className="text-xs px-2 py-1 rounded-lg border border-[#E8E4DB] bg-white focus:outline-none focus:border-[#1D9E75]"
                          >
                            {Object.entries(STATUS_MAP).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                          {order.paymentStatus === "IN_ESCROW" && (
                            <button
                              onClick={() => releaseEscrow(order.id)}
                              className="text-[10px] bg-purple-600 text-white px-2 py-1 rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              Libérer escrow
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

export default function AdminOrdersPage() {
  return <Suspense><AdminOrdersContent /></Suspense>;
}
