"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { ConditionBadge } from "@/components/common/ConditionBadge";
import { Button } from "@/components/ui/button";
import { formatGNF } from "@/lib/utils/currency";
import { formatRelative, parseJsonField } from "@/lib/utils/formatters";
import { MapPin, Phone, MessageCircle, Eye, ChevronLeft, ChevronRight, Share2 } from "lucide-react";

interface ListingDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string;
  condition: string;
  city: string;
  region: string;
  viewCount: number;
  isSold: boolean;
  createdAt: string;
  seller: { id: string; name: string; phone: string; createdAt: string };
}

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then((r) => r.json())
      .then((data) => { setListing(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Chargement...</div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-2xl">🔍</p>
          <p className="font-semibold text-gray-700">Annonce introuvable</p>
          <Button asChild variant="outline"><Link href="/listings">← Retour aux annonces</Link></Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const images = parseJsonField<string[]>(listing.images, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <Link href="/listings" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4">
            <ChevronLeft size={14} /> Retour
          </Link>

          {/* Carrousel images */}
          <div className="relative bg-[#F7F5F0] rounded-2xl overflow-hidden mb-5">
            <div className="aspect-[4/3] relative">
              {images.length > 0 ? (
                <Image src={images[imgIndex]} alt={listing.title} fill className="object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
              )}
              {listing.isSold && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="bg-white text-gray-900 font-bold px-4 py-2 rounded-full text-lg">VENDU</span>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <>
                <button onClick={() => setImgIndex((i) => Math.max(0, i - 1))} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => setImgIndex((i) => Math.min(images.length - 1, i + 1))} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow">
                  <ChevronRight size={16} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setImgIndex(i)} className={`w-2 h-2 rounded-full transition-colors ${i === imgIndex ? "bg-[#1D9E75]" : "bg-white/60"}`} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Miniatures */}
          {images.length > 1 && (
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button key={i} onClick={() => setImgIndex(i)} className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === imgIndex ? "border-[#1D9E75]" : "border-transparent"}`}>
                  <Image src={img} alt="" width={64} height={64} className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          )}

          {/* Infos principales */}
          <div className="bg-white rounded-2xl border border-[#E8E4DB] p-5 mb-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h1 className="text-xl font-bold text-gray-900 leading-tight">{listing.title}</h1>
              <button onClick={() => navigator.share?.({ title: listing.title, url: window.location.href })} className="p-2 rounded-lg hover:bg-[#F7F5F0] text-gray-400">
                <Share2 size={18} />
              </button>
            </div>
            <p className="text-2xl font-bold text-[#1D9E75] mb-3">{formatGNF(listing.price)}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <span className="flex items-center gap-1"><MapPin size={14} /> {listing.city}, {listing.region}</span>
              <span className="flex items-center gap-1"><Eye size={14} /> {listing.viewCount} vues</span>
              <span>{formatRelative(listing.createdAt)}</span>
            </div>
            <ConditionBadge condition={listing.condition} />
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-[#E8E4DB] p-5 mb-4">
            <h2 className="font-semibold text-gray-900 mb-2">Description</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{listing.description}</p>
          </div>

          {/* Vendeur */}
          <div className="bg-white rounded-2xl border border-[#E8E4DB] p-5 mb-4">
            <h2 className="font-semibold text-gray-900 mb-3">Vendeur</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{listing.seller.name}</p>
                <p className="text-xs text-gray-400">Membre depuis {formatRelative(listing.seller.createdAt)}</p>
              </div>
              {session && session.user.id !== listing.seller.id && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/messages?with=${listing.seller.id}`}>
                    <MessageCircle size={14} className="mr-1.5" /> Message
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* CTA contact */}
          {!listing.isSold && (
            <div className="sticky bottom-20 md:bottom-4 bg-white border-t border-[#E8E4DB] md:border md:rounded-2xl px-4 py-3 flex gap-3 shadow-lg">
              <Button className="flex-1" asChild>
                <a href={`tel:${listing.seller.phone}`}>
                  <Phone size={16} className="mr-2" /> Appeler
                </a>
              </Button>
              {session && session.user.id !== listing.seller.id && (
                <Button variant="outline" className="flex-1" asChild>
                  <Link href={`/messages?with=${listing.seller.id}&listing=${listing.id}`}>
                    <MessageCircle size={16} className="mr-2" /> Négocier
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
