"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { formatGNF } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/formatters";
import { Ship, Package, TrendingUp, Calendar } from "lucide-react";

interface Shipment {
  id: string;
  reference: string;
  origin: string;
  destination: string;
  status: string;
  capacityM3: number;
  usedM3: number;
  estimatedArrival: string | null;
}

export default function ImporterDashboard() {
  const { data: session } = useSession();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [orders, setOrders] = useState<{ id: string; totalGNF: number; status: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/shipments").then((r) => r.json()),
      fetch("/api/orders").then((r) => r.json()),
    ]).then(([s, o]) => {
      setShipments(s ?? []);
      setOrders(o ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalRevenue = orders.reduce((s: number, o: { totalGNF: number }) => s + o.totalGNF, 0);
  const activeShipments = shipments.filter((s) => s.status === "IN_TRANSIT").length;
  const m3Reserved = shipments.reduce((s, ship) => s + ship.usedM3, 0);

  const stats = [
    { icon: Ship, label: "Conteneurs actifs", value: activeShipments, color: "text-blue-500", bg: "bg-blue-50" },
    { icon: Package, label: "m³ réservés", value: `${m3Reserved} m³`, color: "text-[#1D9E75]", bg: "bg-[#1D9E75]/10" },
    { icon: TrendingUp, label: "CA total", value: formatGNF(totalRevenue), color: "text-[#EF9F27]", bg: "bg-[#EF9F27]/10" },
    { icon: Calendar, label: "Commandes", value: orders.length, color: "text-purple-500", bg: "bg-purple-50" },
  ];

  const STATUS_MAP: Record<string, string> = { BOOKING: "Réservation", LOADING: "Chargement", IN_TRANSIT: "En transit", CUSTOMS: "Douane", DELIVERED: "Livré" };
  const STATUS_COLOR: Record<string, string> = { BOOKING: "bg-blue-100 text-blue-700", LOADING: "bg-yellow-100 text-yellow-700", IN_TRANSIT: "bg-purple-100 text-purple-700", CUSTOMS: "bg-orange-100 text-orange-700", DELIVERED: "bg-green-100 text-green-700" };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Dashboard Importateur</h1>
              <p className="text-sm text-gray-500">Bonjour, {session?.user.name}</p>
            </div>
            <Button asChild size="sm"><Link href="/shipments">Voir les conteneurs</Link></Button>
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

          {/* Conteneurs */}
          <div className="bg-white rounded-xl border border-[#E8E4DB] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Mes conteneurs</h2>
              <Link href="/shipments" className="text-sm text-[#1D9E75]">Tout voir →</Link>
            </div>
            {loading ? (
              <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-20 bg-[#F7F5F0] rounded-lg animate-pulse" />)}</div>
            ) : shipments.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">Aucun conteneur</div>
            ) : (
              <div className="space-y-3">
                {shipments.slice(0, 5).map((s) => {
                  const fillPct = s.capacityM3 > 0 ? Math.round((s.usedM3 / s.capacityM3) * 100) : 0;
                  return (
                    <Link key={s.id} href={`/shipments/${s.id}`} className="flex items-center gap-4 p-3 rounded-xl border border-[#E8E4DB] hover:border-[#1D9E75] transition-colors">
                      <Ship size={20} className="text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900">{s.reference}</p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[s.status] ?? "bg-gray-100 text-gray-600"}`}>{STATUS_MAP[s.status] ?? s.status}</span>
                        </div>
                        <div className="h-1.5 bg-[#F7F5F0] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${fillPct > 90 ? "bg-red-400" : "bg-[#1D9E75]"}`} style={{ width: `${fillPct}%` }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Arrivée : {s.estimatedArrival ? formatDate(s.estimatedArrival) : "—"}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
