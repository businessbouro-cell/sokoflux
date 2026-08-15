"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { formatUSD } from "@/lib/utils/currency";
import { parseJsonField } from "@/lib/utils/formatters";
import { Star, Package, MapPin, Award, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SupplierDetail {
  id: string;
  companyName: string;
  city: string;
  description: string;
  isVerified: boolean;
  rating: number;
  avgRating: number;
  totalSales: number;
  createdAt: string;
  user: { id: string; name: string; createdAt: string };
  products: {
    id: string;
    title: string;
    priceUSD: number | null;
    images: string;
    minOrderQty: number;
    viewCount: number;
    category: string;
  }[];
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    author: { name: string };
    createdAt: string;
  }[];
}

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [supplier, setSupplier] = useState<SupplierDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/suppliers/${id}`)
      .then((r) => r.json())
      .then((d) => { setSupplier(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
          <div className="h-32 bg-[#F7F5F0] rounded-xl animate-pulse" />
          <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i => <div key={i} className="h-48 bg-[#F7F5F0] rounded-xl animate-pulse" />)}</div>
        </div>
      </main>
      <BottomNav />
    </div>
  );

  if (!supplier) return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center pb-20">
        <p className="text-gray-400">Fournisseur introuvable</p>
      </main>
      <BottomNav />
    </div>
  );

  const stars = Math.round(supplier.avgRating);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-4xl px-4 py-6 space-y-5">
          {/* Header */}
          <div className="bg-white rounded-xl border border-[#E8E4DB] p-5">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-[#1D9E75]/10 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-[#1D9E75]">{supplier.companyName[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold text-gray-900">{supplier.companyName}</h1>
                  {supplier.isVerified && (
                    <span className="flex items-center gap-1 text-xs bg-[#1D9E75]/10 text-[#1D9E75] px-2 py-0.5 rounded-full font-medium">
                      <Award size={10} /> Vérifié
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} className={i < stars ? "fill-[#EF9F27] text-[#EF9F27]" : "text-gray-200"} />
                  ))}
                  <span className="text-xs text-gray-500 ml-1">{supplier.avgRating.toFixed(1)} ({supplier.reviews.length} avis)</span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                  <MapPin size={11} />
                  <span>{supplier.city}, Chine</span>
                </div>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/messages?with=${supplier.user.id}`}><MessageCircle size={14} className="mr-1" /> Contacter</Link>
              </Button>
            </div>
            {supplier.description && (
              <p className="mt-4 text-sm text-gray-600 leading-relaxed">{supplier.description}</p>
            )}
            <div className="flex gap-6 mt-4 pt-4 border-t border-[#E8E4DB]">
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{supplier.products.length}</p>
                <p className="text-xs text-gray-500">Produits</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{supplier.avgRating.toFixed(1)}</p>
                <p className="text-xs text-gray-500">Note</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{new Date(supplier.user.createdAt).getFullYear()}</p>
                <p className="text-xs text-gray-500">Depuis</p>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="bg-white rounded-xl border border-[#E8E4DB] p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Produits ({supplier.products.length})</h2>
            {supplier.products.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <Package size={32} className="mx-auto mb-2 text-gray-200" />
                Aucun produit disponible
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {supplier.products.map((product) => {
                  const imgs = parseJsonField<string[]>(product.images, []);
                  return (
                    <Link key={product.id} href={`/products/${product.id}`} className="group">
                      <div className="aspect-square rounded-xl overflow-hidden bg-[#F7F5F0] mb-2">
                        {imgs[0] ? (
                          <Image src={imgs[0]} alt={product.title} width={200} height={200} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={24} className="text-gray-300" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium text-gray-900 line-clamp-2">{product.title}</p>
                      <p className="text-xs text-[#1D9E75] font-semibold mt-0.5">{product.priceUSD ? formatUSD(product.priceUSD) : "—"}</p>
                      <p className="text-[10px] text-gray-400">MOQ: {product.minOrderQty}</p>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reviews */}
          {supplier.reviews.length > 0 && (
            <div className="bg-white rounded-xl border border-[#E8E4DB] p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Avis clients</h2>
              <div className="space-y-4">
                {supplier.reviews.map((review) => (
                  <div key={review.id} className="border-b border-[#E8E4DB] last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{review.author.name}</span>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={11} className={i < review.rating ? "fill-[#EF9F27] text-[#EF9F27]" : "text-gray-200"} />
                        ))}
                      </div>
                    </div>
                    {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
                    <p className="text-xs text-gray-400 mt-1">{new Date(review.createdAt).toLocaleDateString("fr-FR")}</p>
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
