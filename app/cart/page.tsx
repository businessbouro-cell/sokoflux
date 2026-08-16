"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/useCartStore";
import { formatGNF } from "@/lib/utils/currency";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Package } from "lucide-react";
import { useState } from "react";

export default function CartPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart, total } = useCartStore();
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    if (!session) { router.push("/login"); return; }
    if (items.length === 0) return;
    setOrdering(true);
    setError("");

    try {
      // Grouper les items par vendeur
      const bySeller = items.reduce<Record<string, typeof items>>((acc, item) => {
        if (!acc[item.sellerId]) acc[item.sellerId] = [];
        acc[item.sellerId].push(item);
        return acc;
      }, {});

      const orders: string[] = [];

      for (const [sellerId, sellerItems] of Object.entries(bySeller)) {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sellerId,
            type: sellerItems[0].productId ? "IMPORT_CHINA" : "LOCAL_SALE",
            paymentMethod: "ORANGE_MONEY",
            items: sellerItems.map((i) => ({
              productId: i.productId,
              listingId: i.listingId,
              title: i.title,
              image: i.image,
              quantity: i.quantity,
              priceGNF: i.priceGNF,
            })),
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          setError(err.error ?? "Erreur lors de la commande.");
          setOrdering(false);
          return;
        }

        const order = await res.json();
        orders.push(order.id);
      }

      clearCart();
      // Rediriger vers la première commande créée
      router.push(orders.length === 1 ? `/orders/${orders[0]}` : "/orders");
    } catch {
      setError("Erreur réseau. Réessayez.");
      setOrdering(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 px-4 pb-20 md:pb-0">
          <div className="text-6xl">🛒</div>
          <h1 className="text-xl font-bold text-gray-900">Votre panier est vide</h1>
          <p className="text-gray-500 text-sm text-center">Ajoutez des produits pour commencer vos achats</p>
          <div className="flex gap-3 mt-2">
            <Button asChild className="bg-[#1D9E75] hover:bg-[#0F6E56]">
              <Link href="/products"><Package size={16} className="mr-2" />Explorer les produits</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/listings">♻️ Occasion</Link>
            </Button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-24 md:pb-8">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart size={20} className="text-[#1D9E75]" />
              Mon panier <span className="text-base font-normal text-gray-400">({items.length} article{items.length > 1 ? "s" : ""})</span>
            </h1>
            <button onClick={clearCart} className="text-xs text-red-400 hover:text-red-600 transition-colors">
              Vider le panier
            </button>
          </div>

          <div className="space-y-3 mb-6">
            {items.map((item) => (
              <div key={item.id} className="bg-white border border-[#E8E4DB] rounded-2xl p-4 flex gap-4">
                {/* Image */}
                <div className="w-20 h-20 rounded-xl bg-[#F7F5F0] flex-shrink-0 overflow-hidden relative">
                  {item.image ? (
                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{item.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Vendeur : {item.sellerName}</p>
                  <p className="text-[#1D9E75] font-bold text-sm mt-1">{formatGNF(item.priceGNF)} / unité</p>

                  <div className="flex items-center justify-between mt-2">
                    {/* Quantité */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-full border border-[#E8E4DB] flex items-center justify-center hover:border-[#1D9E75] transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-semibold w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-full border border-[#E8E4DB] flex items-center justify-center hover:border-[#1D9E75] transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Sous-total + supprimer */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-900">{formatGNF(item.priceGNF * item.quantity)}</span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Récapitulatif */}
          <div className="bg-white border border-[#E8E4DB] rounded-2xl p-5 sticky bottom-20 md:bottom-4">
            <div className="flex items-center justify-between mb-2 text-sm text-gray-500">
              <span>Sous-total</span>
              <span className="font-medium text-gray-900">{formatGNF(total())}</span>
            </div>
            <div className="flex items-center justify-between mb-4 text-sm text-gray-400">
              <span>Livraison</span>
              <span>À calculer</span>
            </div>
            <div className="flex items-center justify-between mb-4 border-t border-[#F7F5F0] pt-4">
              <span className="font-bold text-gray-900">Total</span>
              <span className="text-xl font-bold text-[#1D9E75]">{formatGNF(total())}</span>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm mb-3">
                {error}
              </div>
            )}

            <Button
              className="w-full bg-[#1D9E75] hover:bg-[#0F6E56] h-12 text-base"
              onClick={handleCheckout}
              disabled={ordering}
            >
              {ordering ? "Commande en cours..." : (
                <>Commander — {formatGNF(total())} <ArrowRight size={16} className="ml-2" /></>
              )}
            </Button>

            {!session && (
              <p className="text-xs text-gray-400 text-center mt-2">
                Vous devrez vous connecter pour finaliser la commande
              </p>
            )}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
