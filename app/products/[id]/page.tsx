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
import { Badge } from "@/components/ui/badge";
import { PaymentModal } from "@/components/payments/PaymentModal";
import { formatUSD, formatGNF, usdToGnf } from "@/lib/utils/currency";
import { parseJsonField } from "@/lib/utils/formatters";
import { useCartStore } from "@/stores/useCartStore";
import { MapPin, Package, Clock, Ship, MessageCircle, ChevronLeft, ChevronRight, Star, ShoppingCart, MessageSquare, Check } from "lucide-react";

interface ProductDetail {
  id: string;
  title: string;
  description: string;
  priceUSD: number | null;
  priceGNF: number | null;
  images: string;
  minOrderQty: number;
  stockQty: number;
  weight: number | null;
  dimensions: string | null;
  shippingType: string | null;
  shippingPort: string | null;
  leadTimeDays: number | null;
  category: string;
  rating: number;
  supplier: {
    id: string;
    companyName: string;
    city: string;
    isVerified: boolean;
    rating: number;
    user: { id: string; name: string };
  } | null;
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const [reviews, setReviews] = useState<{ id: string; rating: number; comment: string | null; author: { name: string }; createdAt: string }[]>([]);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((data) => { setProduct(data); if (data?.minOrderQty) setQuantity(data.minOrderQty); setLoading(false); })
      .catch(() => setLoading(false));
    fetch(`/api/reviews?productId=${id}`)
      .then((r) => r.json())
      .then(setReviews)
      .catch(() => {});
  }, [id]);

  if (loading) return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Chargement...</div>
      </div>
      <BottomNav />
    </div>
  );

  if (!product) return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <p className="text-2xl">🔍</p>
        <p className="font-semibold">Produit introuvable</p>
        <Button asChild variant="outline"><Link href="/products">← Retour</Link></Button>
      </div>
      <BottomNav />
    </div>
  );

  const images = parseJsonField<string[]>(product.images, []);
  const moq = product.minOrderQty;
  const priceUSD = product.priceUSD ?? 0;
  const totalGNF = usdToGnf(priceUSD * quantity);

  async function handleOrder() {
    if (!session) { router.push("/login"); return; }
    if (!product || !product.supplier) return;
    setOrdering(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: product.supplier.user.id,
          type: "IMPORT_CHINA",
          paymentMethod: "ORANGE_MONEY",
          items: [{
            productId: product.id,
            title: product.title,
            image: images[0] ?? "",
            quantity,
            priceGNF: Math.round(totalGNF / quantity),
          }],
        }),
      });
      if (res.ok) {
        const order = await res.json();
        setOrderId(order.id);
        setShowPayment(true);
      }
    } finally {
      setOrdering(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <Link href="/products" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4">
            <ChevronLeft size={14} /> Retour
          </Link>

          <div className="md:grid md:grid-cols-2 md:gap-8">
            {/* Carrousel */}
            <div>
              <div className="relative bg-[#F7F5F0] rounded-2xl overflow-hidden aspect-square mb-3">
                {images.length > 0 ? (
                  <Image src={images[imgIndex]} alt={product.title} fill className="object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
                )}
                {images.length > 1 && (
                  <>
                    <button onClick={() => setImgIndex((i) => Math.max(0, i - 1))} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow">
                      <ChevronLeft size={16} />
                    </button>
                    <button onClick={() => setImgIndex((i) => Math.min(images.length - 1, i + 1))} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow">
                      <ChevronRight size={16} />
                    </button>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setImgIndex(i)} className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 ${i === imgIndex ? "border-[#1D9E75]" : "border-transparent"}`}>
                      <Image src={img} alt="" width={56} height={56} className="object-cover w-full h-full" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Détails */}
            <div className="mt-5 md:mt-0">
              <h1 className="text-xl font-bold text-gray-900 leading-tight mb-2">{product.title}</h1>

              <div className="bg-[#F7F5F0] rounded-xl p-4 mb-4">
                <p className="text-2xl font-bold text-[#1D9E75]">{priceUSD ? formatUSD(priceUSD) : "Prix sur demande"}</p>
                {priceUSD > 0 && <p className="text-sm text-gray-500">≈ {formatGNF(usdToGnf(priceUSD))} par unité</p>}
                <p className="text-xs text-gray-400 mt-1">Prix unitaire · MOQ {moq} unités</p>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="flex items-center gap-2 p-3 bg-white border border-[#E8E4DB] rounded-xl">
                  <Package size={16} className="text-[#1D9E75]" />
                  <div>
                    <p className="text-[10px] text-gray-400">MOQ</p>
                    <p className="text-sm font-semibold">{moq} unités</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-white border border-[#E8E4DB] rounded-xl">
                  <Clock size={16} className="text-blue-500" />
                  <div>
                    <p className="text-[10px] text-gray-400">Délai</p>
                    <p className="text-sm font-semibold">{product.leadTimeDays ?? "—"} jours</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-white border border-[#E8E4DB] rounded-xl">
                  <Ship size={16} className="text-blue-400" />
                  <div>
                    <p className="text-[10px] text-gray-400">Transport</p>
                    <p className="text-sm font-semibold">{product.shippingType?.replace("_", " ") ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-white border border-[#E8E4DB] rounded-xl">
                  <MapPin size={16} className="text-purple-500" />
                  <div>
                    <p className="text-[10px] text-gray-400">Port</p>
                    <p className="text-sm font-semibold">{product.shippingPort ?? product.supplier?.city ?? "—"}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 block mb-1">Quantité</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQuantity(Math.max(moq, quantity - moq))} className="w-9 h-9 rounded-full border border-[#E8E4DB] flex items-center justify-center text-lg font-semibold hover:border-[#1D9E75]">−</button>
                  <span className="text-lg font-bold w-16 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + moq)} className="w-9 h-9 rounded-full border border-[#E8E4DB] flex items-center justify-center text-lg font-semibold hover:border-[#1D9E75]">+</button>
                </div>
                <p className="text-sm text-gray-500 mt-2">Total estimé : <span className="font-semibold text-[#1D9E75]">{formatGNF(totalGNF)}</span></p>
              </div>

              <div className="flex flex-col gap-2">
                {/* Ajouter au panier */}
                <Button
                  variant="outline"
                  className="w-full border-[#1D9E75] text-[#1D9E75] hover:bg-[#1D9E75]/5"
                  size="lg"
                  onClick={() => {
                    if (!product.supplier) return;
                    addItem({
                      id: product.id,
                      productId: product.id,
                      title: product.title,
                      image: images[0],
                      priceGNF: Math.round(usdToGnf(priceUSD)),
                      quantity,
                      sellerId: product.supplier.user.id,
                      sellerName: product.supplier.companyName,
                    });
                    setAddedToCart(true);
                    setTimeout(() => setAddedToCart(false), 2000);
                  }}
                  disabled={!product.supplier}
                >
                  {addedToCart ? <><Check size={16} className="mr-2" />Ajouté !</> : <><ShoppingCart size={16} className="mr-2" />Ajouter au panier</>}
                </Button>
                {/* Commander directement */}
                <Button className="w-full bg-[#1D9E75] hover:bg-[#0F6E56]" size="lg" onClick={handleOrder} disabled={ordering || !product.supplier}>
                  {ordering ? "Création commande..." : <>Commander — {formatGNF(totalGNF)}</>}
                </Button>
                <Button variant="ghost" className="w-full text-gray-500" asChild>
                  <Link href={session && product.supplier ? `/messages?with=${product.supplier.user.id}&product=${product.id}` : "/login"}>
                    <MessageCircle size={16} className="mr-2" /> Contacter le fournisseur
                  </Link>
                </Button>
              </div>

              {product.supplier && (
                <Link href={`/suppliers/${product.supplier.id}`} className="mt-4 flex items-center gap-3 p-3 bg-white border border-[#E8E4DB] rounded-xl hover:border-[#1D9E75] transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{product.supplier.companyName}</p>
                      {product.supplier.isVerified && <Badge className="bg-[#1D9E75] text-white text-[10px]">✓ Vérifié</Badge>}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={11} className="text-[#EF9F27] fill-[#EF9F27]" />
                      <span className="text-xs text-gray-500">{product.supplier.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                </Link>
              )}
            </div>
          </div>

          <div className="mt-6 bg-white rounded-2xl border border-[#E8E4DB] p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Description du produit</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{product.description}</p>
            {(product.weight || product.dimensions) && (
              <div className="mt-4 pt-4 border-t border-[#E8E4DB] grid grid-cols-2 gap-3 text-sm">
                {product.weight && <div><span className="text-gray-400">Poids :</span> {product.weight} kg</div>}
                {product.dimensions && <div><span className="text-gray-400">Dimensions :</span> {product.dimensions}</div>}
              </div>
            )}
          </div>

          {reviews.length > 0 && (
            <div className="mt-4 bg-white rounded-2xl border border-[#E8E4DB] p-5">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare size={15} className="text-[#EF9F27]" />
                <h2 className="font-semibold text-gray-900">Avis clients ({reviews.length})</h2>
                <div className="flex items-center gap-1 ml-auto">
                  <Star size={13} className="text-[#EF9F27] fill-[#EF9F27]" />
                  <span className="text-sm font-bold text-gray-700">
                    {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                {reviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="border-b border-[#F7F5F0] last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800">{review.author.name}</span>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} size={11} className={s <= review.rating ? "text-[#EF9F27] fill-[#EF9F27]" : "text-gray-200"} />
                        ))}
                      </div>
                    </div>
                    {review.comment && <p className="text-xs text-gray-600">{review.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <BottomNav />

      {showPayment && orderId && (
        <PaymentModal
          orderId={orderId}
          totalAmount={totalGNF}
          currency="GNF"
          onClose={() => setShowPayment(false)}
          onSuccess={() => { setShowPayment(false); router.push("/orders"); }}
        />
      )}
    </div>
  );
}
