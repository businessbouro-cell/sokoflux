"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Badge } from "@/components/ui/badge";
import { Ship, MapPin, Calendar, Package } from "lucide-react";
import { formatDate } from "@/lib/utils/formatters";

interface Shipment {
  id: string;
  reference: string;
  origin: string;
  destination: string;
  status: string;
  capacityM3: number;
  usedM3: number;
  departureDate: string | null;
  estimatedArrival: string | null;
  importer: { user: { name: string } };
  trackingEvents: { status: string; location: string; description: string }[];
  _count: { orders: number };
}

const STATUS_COLORS: Record<string, string> = {
  BOOKING: "bg-blue-100 text-blue-700",
  LOADING: "bg-yellow-100 text-yellow-700",
  IN_TRANSIT: "bg-purple-100 text-purple-700",
  CUSTOMS: "bg-orange-100 text-orange-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  BOOKING: "Réservation",
  LOADING: "Chargement",
  IN_TRANSIT: "En transit",
  CUSTOMS: "En douane",
  DELIVERED: "Livré",
  CANCELLED: "Annulé",
};

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/shipments")
      .then((r) => r.json())
      .then((data) => { setShipments(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <Ship className="text-blue-500" size={24} />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Conteneurs</h1>
              <p className="text-sm text-gray-500">Suivi des imports Chine → Guinée</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-36 bg-[#F7F5F0] rounded-xl animate-pulse" />)}
            </div>
          ) : shipments.length === 0 ? (
            <div className="text-center py-16">
              <Ship size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="font-semibold text-gray-500">Aucun conteneur disponible</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shipments.map((s) => {
                const fillPct = s.capacityM3 > 0 ? Math.round((s.usedM3 / s.capacityM3) * 100) : 0;
                const lastEvent = s.trackingEvents[0];
                return (
                  <Link key={s.id} href={`/shipments/${s.id}`} className="block bg-white rounded-xl border border-[#E8E4DB] p-5 hover:border-[#1D9E75] hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-gray-900">{s.reference}</p>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                          <MapPin size={13} /> {s.origin} → {s.destination}
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[s.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {STATUS_LABELS[s.status] ?? s.status}
                      </span>
                    </div>

                    {/* Jauge de remplissage */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Remplissage : {s.usedM3}/{s.capacityM3} m³</span>
                        <span className="font-semibold text-gray-700">{fillPct}%</span>
                      </div>
                      <div className="h-2 bg-[#F7F5F0] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${fillPct > 90 ? "bg-red-400" : fillPct > 70 ? "bg-[#EF9F27]" : "bg-[#1D9E75]"}`}
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Calendar size={11} /> Arrivée prévue : {s.estimatedArrival ? formatDate(s.estimatedArrival) : "—"}</span>
                      <span className="flex items-center gap-1"><Package size={11} /> {s._count.orders} commandes</span>
                    </div>

                    {lastEvent && (
                      <div className="mt-2 pt-2 border-t border-[#F7F5F0] text-xs text-gray-500">
                        📍 {lastEvent.location} — {lastEvent.description}
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
