"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Ship, MapPin, Calendar, ChevronLeft, Check, Clock, Package } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils/formatters";

interface TrackingEvent {
  id: string;
  status: string;
  location: string;
  description: string;
  timestamp: string;
}

interface ShipmentDetail {
  id: string;
  reference: string;
  origin: string;
  destination: string;
  status: string;
  capacityM3: number;
  usedM3: number;
  departureDate: string | null;
  estimatedArrival: string | null;
  actualArrival?: string | null;
  trackingEvents: TrackingEvent[];
  importer: { user: { name: string; phone: string } };
}

const SHIPMENT_STEPS = ["BOOKING", "LOADING", "IN_TRANSIT", "CUSTOMS", "DELIVERED"];
const STEP_LABELS = ["Réservation", "Chargement", "En mer", "Douane", "Livraison"];

export default function ShipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [shipment, setShipment] = useState<ShipmentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/shipments/${id}`)
      .then((r) => r.json())
      .then((data) => { setShipment(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex min-h-screen flex-col"><Navbar />
      <div className="flex-1 flex items-center justify-center"><div className="animate-pulse text-gray-400">Chargement...</div></div>
    <BottomNav /></div>
  );

  if (!shipment) return (
    <div className="flex min-h-screen flex-col"><Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <p className="font-semibold">Conteneur introuvable</p>
        <Button asChild variant="outline"><Link href="/shipments">← Retour</Link></Button>
      </div>
    <BottomNav /></div>
  );

  const currentStepIdx = SHIPMENT_STEPS.indexOf(shipment.status);
  const fillPct = shipment.capacityM3 > 0 ? Math.round((shipment.usedM3 / shipment.capacityM3) * 100) : 0;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <Link href="/shipments" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4">
            <ChevronLeft size={14} /> Retour
          </Link>

          {/* Header */}
          <div className="bg-white rounded-2xl border border-[#E8E4DB] p-5 mb-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-lg font-bold text-gray-900">{shipment.reference}</p>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                  <MapPin size={13} /> {shipment.origin} → {shipment.destination}
                </div>
              </div>
              <Ship size={28} className="text-blue-400" />
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Capacité utilisée</span>
                <span className="font-bold text-gray-700">{shipment.usedM3}/{shipment.capacityM3} m³ ({fillPct}%)</span>
              </div>
              <div className="h-3 bg-[#F7F5F0] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${fillPct > 90 ? "bg-red-400" : fillPct > 70 ? "bg-[#EF9F27]" : "bg-[#1D9E75]"}`}
                  style={{ width: `${fillPct}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gray-400" />
                <div>
                  <p className="text-[10px] text-gray-400">Départ estimé</p>
                  <p className="font-medium">{shipment.departureDate ? formatDate(shipment.departureDate) : "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gray-400" />
                <div>
                  <p className="text-[10px] text-gray-400">Arrivée estimée</p>
                  <p className="font-medium">{shipment.estimatedArrival ? formatDate(shipment.estimatedArrival) : "—"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Progression */}
          <div className="bg-white rounded-2xl border border-[#E8E4DB] p-5 mb-4">
            <h2 className="font-semibold text-gray-900 mb-5">Progression</h2>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#E8E4DB]" />
              <div className="space-y-6">
                {SHIPMENT_STEPS.map((step, i) => {
                  const done = i < currentStepIdx;
                  const active = i === currentStepIdx;
                  return (
                    <div key={step} className="flex items-center gap-4 relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 flex-shrink-0 ${done ? "bg-[#1D9E75] text-white" : active ? "bg-[#1D9E75] text-white ring-4 ring-[#1D9E75]/20" : "bg-[#F7F5F0] text-gray-400 border border-[#E8E4DB]"}`}>
                        {done ? <Check size={14} /> : active ? <Package size={14} /> : <Clock size={14} />}
                      </div>
                      <p className={`text-sm font-medium ${active ? "text-[#1D9E75]" : done ? "text-gray-700" : "text-gray-400"}`}>
                        {STEP_LABELS[i]}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {shipment.trackingEvents.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E8E4DB] p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Historique de suivi</h2>
              <div className="space-y-4">
                {shipment.trackingEvents.map((event, i) => (
                  <div key={event.id} className={`flex gap-3 ${i === 0 ? "text-gray-900" : "text-gray-400"}`}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${i === 0 ? "bg-[#1D9E75]" : "bg-[#E8E4DB]"}`} />
                    <div>
                      <p className={`text-sm font-medium ${i === 0 ? "text-gray-900" : "text-gray-500"}`}>{event.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">📍 {event.location} · {formatDateTime(event.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
