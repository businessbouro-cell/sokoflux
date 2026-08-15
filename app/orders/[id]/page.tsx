"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { formatGNF } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/formatters";
import { ChevronLeft, Package, MapPin, CreditCard, Ship, Star } from "lucide-react";

interface OrderDetail {
  id: string;
  reference: string;
  status: string;
  totalGNF: number;
  paymentStatus: string;
  paymentMethod: string;
  type: string;
  createdAt: string;
  deliveryAddress: string | null;
  deliveryCity: string | null;
  deliveryRegion: string | null;
  notes: string | null;
  escrowReleased: boolean;
  items: {
    id: string;
    title: string;
    image: string | null;
    quantity: number;
    priceGNF: number;
  }[];
  shipment: { reference: string; status: string; estimatedArrival: string | null } | null;
  seller: { id: string; name: string };
}

const STATUS_STEPS = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente", CONFIRMED: "Confirmée", PROCESSING: "En cours",
  SHIPPED: "Expédiée", DELIVERED: "Livrée", CANCELLED: "Annulée", DISPUTED: "Litige",
};

const PAYMENT_LABELS: Record<string, string> = {
  PENDING: "En attente", PAID: "Payé", IN_ESCROW: "En escrow", RELEASED: "Libéré", REFUNDED: "Remboursé", FAILED: "Échoué",
};

const METHOD_LABELS: Record<string, string> = {
  ORANGE_MONEY: "Orange Money", MTN_MOMO: "MTN MoMo", STRIPE: "Carte bancaire", CASH: "Espèces",
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { status } = useSession();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      fetch(`/api/orders/${id}`)
        .then((r) => r.json())
        .then((data) => { setOrder(data); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [id, status, router]);

  async function submitReview() {
    if (!order || reviewRating === 0) return;
    setSubmittingReview(true);
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetId: order.seller.id,
        orderId: order.id,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      }),
    });
    setSubmittingReview(false);
    setReviewDone(true);
  }

  if (loading) return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Chargement...</div>
      </div>
      <BottomNav />
    </div>
  );

  if (!order) return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <p className="text-2xl">🔍</p>
        <p className="font-semibold text-gray-700">Commande introuvable</p>
        <Button asChild variant="outline"><Link href="/orders">← Retour aux commandes</Link></Button>
      </div>
      <BottomNav />
    </div>
  );

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <Link href="/orders" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4">
            <ChevronLeft size={14} /> Mes commandes
          </Link>

          {/* Header */}
          <div className="bg-white rounded-2xl border border-[#E8E4DB] p-5 mb-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Commande</p>
                <p className="font-bold text-gray-900 font-mono">#{order.reference}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-[#1D9E75]">{formatGNF(order.totalGNF)}</p>
                <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                order.status === "DELIVERED" ? "bg-green-100 text-green-700" :
                order.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                order.status === "SHIPPED" ? "bg-indigo-100 text-indigo-700" :
                "bg-blue-100 text-blue-700"
              }`}>
                {STATUS_LABELS[order.status] ?? order.status}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                order.paymentStatus === "PAID" || order.paymentStatus === "RELEASED" ? "bg-green-100 text-green-700" :
                order.paymentStatus === "IN_ESCROW" ? "bg-purple-100 text-purple-700" :
                order.paymentStatus === "FAILED" ? "bg-red-100 text-red-700" :
                "bg-yellow-100 text-yellow-700"
              }`}>
                {PAYMENT_LABELS[order.paymentStatus] ?? order.paymentStatus}
              </span>
            </div>
          </div>

          {/* Barre de progression */}
          {!["CANCELLED", "DISPUTED"].includes(order.status) && (
            <div className="bg-white rounded-2xl border border-[#E8E4DB] p-5 mb-4">
              <h2 className="font-semibold text-gray-900 mb-4 text-sm">Suivi de commande</h2>
              <div className="flex items-center gap-0">
                {STATUS_STEPS.map((step, i) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      i <= currentStepIndex ? "bg-[#1D9E75] text-white" : "bg-[#F7F5F0] text-gray-400"
                    }`}>
                      {i < currentStepIndex ? "✓" : i + 1}
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 ${i < currentStepIndex ? "bg-[#1D9E75]" : "bg-[#E8E4DB]"}`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                {STATUS_STEPS.map((step, i) => (
                  <p key={step} className={`text-[9px] text-center flex-1 ${i <= currentStepIndex ? "text-[#1D9E75] font-semibold" : "text-gray-400"}`}>
                    {STATUS_LABELS[step]}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Produits */}
          <div className="bg-white rounded-2xl border border-[#E8E4DB] p-5 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Package size={15} className="text-[#1D9E75]" />
              <h2 className="font-semibold text-gray-900 text-sm">Articles ({order.items.length})</h2>
            </div>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#F7F5F0] flex-shrink-0">
                    {item.image ? (
                      <Image src={item.image} alt={item.title} width={56} height={56} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                    <p className="text-xs text-gray-400">Qté : {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 flex-shrink-0">{formatGNF(item.priceGNF * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-[#E8E4DB] mt-4 pt-3 flex justify-between">
              <span className="text-sm font-semibold text-gray-700">Total</span>
              <span className="text-base font-bold text-[#1D9E75]">{formatGNF(order.totalGNF)}</span>
            </div>
          </div>

          {/* Paiement */}
          <div className="bg-white rounded-2xl border border-[#E8E4DB] p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard size={15} className="text-[#1D9E75]" />
              <h2 className="font-semibold text-gray-900 text-sm">Paiement</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Méthode</span>
                <span className="font-medium">{METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Statut</span>
                <span className="font-medium">{PAYMENT_LABELS[order.paymentStatus] ?? order.paymentStatus}</span>
              </div>
              {order.escrowReleased && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Escrow</span>
                  <span className="text-green-600 font-medium">Libéré ✓</span>
                </div>
              )}
            </div>
          </div>

          {/* Livraison */}
          {(order.deliveryAddress || order.shipment) && (
            <div className="bg-white rounded-2xl border border-[#E8E4DB] p-5 mb-4">
              <div className="flex items-center gap-2 mb-3">
                {order.shipment ? <Ship size={15} className="text-blue-500" /> : <MapPin size={15} className="text-[#1D9E75]" />}
                <h2 className="font-semibold text-gray-900 text-sm">Livraison</h2>
              </div>
              {order.deliveryAddress && (
                <p className="text-sm text-gray-600 mb-1">{order.deliveryAddress}, {order.deliveryCity} — {order.deliveryRegion}</p>
              )}
              {order.shipment && (
                <div className="mt-2 p-3 bg-[#F7F5F0] rounded-xl">
                  <p className="text-xs font-medium text-gray-700">Conteneur #{order.shipment.reference}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{order.shipment.status}</p>
                  {order.shipment.estimatedArrival && (
                    <p className="text-xs text-gray-400 mt-0.5">Arrivée prévue : {formatDate(order.shipment.estimatedArrival)}</p>
                  )}
                  <Link href={`/shipments`} className="text-xs text-[#1D9E75] font-medium mt-1 inline-block">Suivre le conteneur →</Link>
                </div>
              )}
            </div>
          )}

          {/* Avis — uniquement pour les commandes livrées */}
          {order.status === "DELIVERED" && !reviewDone && (
            <div className="bg-white rounded-2xl border border-[#E8E4DB] p-5 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Star size={15} className="text-[#EF9F27]" />
                <h2 className="font-semibold text-gray-900 text-sm">Laisser un avis</h2>
              </div>
              <div className="flex gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setReviewRating(star)} className="transition-transform hover:scale-110">
                    <Star size={24} className={star <= reviewRating ? "text-[#EF9F27] fill-[#EF9F27]" : "text-gray-300"} />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Votre commentaire (optionnel)..."
                rows={3}
                className="w-full text-sm border border-[#E8E4DB] rounded-xl px-3 py-2 focus:outline-none focus:border-[#1D9E75] resize-none mb-3"
              />
              <Button size="sm" onClick={submitReview} disabled={reviewRating === 0 || submittingReview}>
                {submittingReview ? "Envoi..." : "Soumettre l'avis"}
              </Button>
            </div>
          )}

          {reviewDone && (
            <div className="bg-green-50 rounded-2xl border border-green-200 p-4 mb-4 text-center">
              <p className="text-green-700 font-medium text-sm">✓ Merci pour votre avis !</p>
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
