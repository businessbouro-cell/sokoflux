"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ListingCard } from "@/components/listings/ListingCard";
import { SearchBar } from "@/components/common/SearchBar";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Plus, SlidersHorizontal, X } from "lucide-react";
import { ITEM_CONDITIONS, PRODUCT_CATEGORIES } from "@/constants/categories";
import { GUINEA_REGIONS } from "@/constants/regions";

interface Listing {
  id: string;
  title: string;
  price: number;
  images: string;
  condition: string;
  city: string;
  region: string;
  viewCount: number;
  createdAt: string;
  isSold: boolean;
}

const LIMIT = 20;

function ListingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);

  const category = searchParams.get("category") ?? "";
  const condition = searchParams.get("condition") ?? "";
  const region = searchParams.get("region") ?? "";
  const search = searchParams.get("search") ?? "";

  const buildParams = useCallback((p: number) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (condition) params.set("condition", condition);
    if (region) params.set("region", region);
    if (search) params.set("search", search);
    params.set("page", String(p));
    params.set("limit", String(LIMIT));
    return params;
  }, [category, condition, region, search]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setPage(1);
    const res = await fetch(`/api/listings?${buildParams(1)}`);
    const data = await res.json();
    setListings(data.listings ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [buildParams]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  // Infinite scroll
  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting || loadingMore || listings.length >= total) return;
      setLoadingMore(true);
      const nextPage = page + 1;
      const res = await fetch(`/api/listings?${buildParams(nextPage)}`);
      const data = await res.json();
      setListings((prev) => [...prev, ...(data.listings ?? [])]);
      setPage(nextPage);
      setLoadingMore(false);
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [listings.length, total, page, loadingMore, buildParams]);

  function setFilter(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    router.push(`/listings?${p}`);
  }

  const hasFilters = !!(category || condition || region);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Occasion</h1>
              <p className="text-sm text-gray-500">{total} annonce{total !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1.5">
                <SlidersHorizontal size={15} /> Filtres
                {hasFilters && <span className="bg-[#1D9E75] text-white text-[10px] rounded-full px-1.5">!</span>}
              </Button>
              <Button size="sm" asChild>
                <Link href="/listings/new" className="gap-1.5">
                  <Plus size={15} /> Publier
                </Link>
              </Button>
            </div>
          </div>

          {/* Recherche */}
          <SearchBar
            placeholder="Rechercher une annonce..."
            onSearch={(v) => setFilter("search", v)}
            className="mb-4"
          />

          {/* Filtres */}
          {showFilters && (
            <div className="bg-white border border-[#E8E4DB] rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Catégorie</label>
                <select className="w-full text-sm border border-[#E8E4DB] rounded-lg px-3 py-2 bg-white" value={category} onChange={(e) => setFilter("category", e.target.value)}>
                  <option value="">Toutes</option>
                  {PRODUCT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">État</label>
                <select className="w-full text-sm border border-[#E8E4DB] rounded-lg px-3 py-2 bg-white" value={condition} onChange={(e) => setFilter("condition", e.target.value)}>
                  <option value="">Tous</option>
                  {ITEM_CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Région</label>
                <select className="w-full text-sm border border-[#E8E4DB] rounded-lg px-3 py-2 bg-white" value={region} onChange={(e) => setFilter("region", e.target.value)}>
                  <option value="">Toutes</option>
                  {GUINEA_REGIONS.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
                </select>
              </div>
              {hasFilters && (
                <button onClick={() => { router.push("/listings"); setShowFilters(false); }} className="sm:col-span-3 flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
                  <X size={12} /> Effacer les filtres
                </button>
              )}
            </div>
          )}

          {/* Grille */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-[#F7F5F0] rounded-xl aspect-square animate-pulse" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📦</p>
              <p className="font-semibold text-gray-700">Aucune annonce trouvée</p>
              <p className="text-sm text-gray-400 mt-1">Soyez le premier à publier !</p>
              <Button asChild className="mt-4">
                <Link href="/listings/new">Publier une annonce</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
              </div>
              <div ref={observerRef} className="h-8 mt-4 flex items-center justify-center">
                {loadingMore && <div className="animate-spin w-5 h-5 border-2 border-[#1D9E75] border-t-transparent rounded-full" />}
              </div>
            </>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

export default function ListingsPage() {
  return <Suspense><ListingsContent /></Suspense>;
}
