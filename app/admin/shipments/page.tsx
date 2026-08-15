"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { formatDate } from "@/lib/utils/formatters";
import { Ship } from "lucide-react";

interface Shipment {
  id: string;
  reference: string;
  origin: string;
  destination: string;
  status: string;
  capacityM3: number;
  usedM3: number;
  estimatedArrival: string;
  _count: { orders: number };
}

const STATUS_STEPS = ["BOOKING", "LOADING", "IN_TRANSIT", "CUSTOMS", "DELIVERED"];
const STATUS_LABEL: Record<string, string> = {
  BOOKING: "Réservation", LOADING: "Chargement", IN_TRANSIT: "Transit",
  CUSTOMS: "Douane", DELIVERED: "Livré",
};
const STATUS_COLOR: Record<string, string> = {
  BOOKING: "bg-blue-100 text-blue-700", LOADING: "bg-yellow-100 text-yellow-700",
  IN_TRANSIT: "bg-purple-100 text-purple-700", CUSTOMS: "bg-orange-100 text-orange-700",
  DELIVERED: "bg-green-100 text-green-700",
};

export default function AdminShipmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const roles = (session?.user?.roles as string[]) ?? [];
    if (status === "authenticated" && !roles.includes("ADMIN")) router.push("/");
  }, [session, status, router]);

  useEffect(() => {
    fetch("/api/shipments?all=true")
      .then((r) => r.json())
      .then((d) => { setShipments(d ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function advanceStatus(shipmentId: string, currentStatus: string) {
    const idx = STATUS_STEPS.indexOf(currentStatus);
    if (idx === -1 || idx === STATUS_STEPS.length - 1) return;
    const newStatus = STATUS_STEPS[idx + 1];
    await fetch(`/api/shipments/${shipmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, location: "En route", description: `Passage à ${STATUS_LABEL[newStatus]}` }),
    });
    setShipments((prev) => prev.map((s) => s.id === shipmentId ? { ...s, status: newStatus } : s));
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/admin" className="text-gray-400 hover:text-gray-600">←</Link>
            <h1 className="text-xl font-bold text-gray-900">Conteneurs</h1>
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-[#F7F5F0] rounded-xl animate-pulse" />)}</div>
          ) : shipments.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Aucun conteneur</div>
          ) : (
            <div className="space-y-3">
              {shipments.map((s) => {
                const fillPct = s.capacityM3 > 0 ? Math.round((s.usedM3 / s.capacityM3) * 100) : 0;
                const canAdvance = s.status !== "DELIVERED";
                return (
                  <div key={s.id} className="bg-white rounded-xl border border-[#E8E4DB] p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Ship size={20} className="text-blue-400" />
                        <div>
                          <p className="font-semibold text-gray-900">{s.reference}</p>
                          <p className="text-xs text-gray-500">{s.origin} → {s.destination}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${STATUS_COLOR[s.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {STATUS_LABEL[s.status] ?? s.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Remplissage</span>
                          <span>{fillPct}% ({s.usedM3}/{s.capacityM3} m³)</span>
                        </div>
                        <div className="h-1.5 bg-[#F7F5F0] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${fillPct > 90 ? "bg-red-400" : fillPct > 70 ? "bg-[#EF9F27]" : "bg-[#1D9E75]"}`} style={{ width: `${fillPct}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        <span>Arrivée estimée: {formatDate(s.estimatedArrival)}</span>
                        <span className="ml-3">{s._count.orders} commandes</span>
                      </div>
                      {canAdvance && (
                        <button
                          onClick={() => advanceStatus(s.id, s.status)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-[#1D9E75]/10 text-[#1D9E75] font-medium hover:bg-[#1D9E75]/20"
                        >
                          Avancer → {STATUS_LABEL[STATUS_STEPS[STATUS_STEPS.indexOf(s.status) + 1]] ?? ""}
                        </button>
                      )}
                    </div>
                  </div>
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
