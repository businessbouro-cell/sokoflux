"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { formatGNF } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/formatters";
import { ShoppingBag } from "lucide-react";
import Image from "next/image";

interface OrderItem {
  id: string;
  quantity: number;
  priceGNF: number;
  title: string;
  image: string | null;
}

interface Order {
  id: string;
  reference: string;
  status: string;
  totalGNF: number;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
  shipment?: { reference: string; status: string };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  DISPUTED: "bg-red-100 text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente", CONFIRMED: "Confirmée", PROCESSING: "En cours",
  SHIPPED: "Expédiée", DELIVERED: "Livrée", CANCELLED: "Annulée", DISPUTED: "Litige",
};

export default function OrdersPage() {
  const { status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/orders")
        .then((r) => r.json())
        .then((data) => { setOrders(data ?? []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <h1 className="text-xl font-bold text-gray-900 mb-5">Mes commandes</h1>

          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-28 bg-[#F7F5F0] rounded-xl animate-pulse" />)}</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="font-semibold text-gray-500">Aucune commande</p>
              <Button asChild className="mt-4"><Link href="/products">Explorer les produits</Link></Button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const firstItem = order.items[0];
                return (
                  <Link key={order.id} href={`/orders/${order.id}`} className="block bg-white rounded-xl border border-[#E8E4DB] p-4 hover:border-[#1D9E75] transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{order.reference}</p>
                        <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {firstItem?.image && (
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#F7F5F0] flex-shrink-0">
                          <Image src={firstItem.image} alt="" width={56} height={56} className="object-cover w-full h-full" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {firstItem && <p className="text-sm text-gray-700 truncate">{firstItem.title}</p>}
                        {order.items.length > 1 && <p className="text-xs text-gray-400">+{order.items.length - 1} autre(s) article(s)</p>}
                        <p className="font-bold text-[#1D9E75] mt-1">{formatGNF(order.totalGNF)}</p>
                      </div>
                    </div>

                    {order.shipment && (
                      <div className="mt-3 pt-3 border-t border-[#F7F5F0] flex items-center gap-2 text-xs text-gray-500">
                        <span>🚢 Conteneur : {order.shipment.reference}</span>
                      </div>
                    )}
                  </Link>
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
