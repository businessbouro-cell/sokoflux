"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ProductCard } from "@/components/products/ProductCard";
import { SearchBar } from "@/components/common/SearchBar";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X } from "lucide-react";
import { PRODUCT_CATEGORIES, SHIPPING_TYPES } from "@/constants/categories";

interface Product {
  id: string;
  title: string;
  priceUSD: number | null;
  images: string;
  minOrderQty: number;
  category: string;
  shippingType: string | null;
  leadTimeDays: number | null;
  supplier: {
    companyName: string;
    city: string;
    rating: number;
    isVerified: boolean;
  } | null;
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const LIMIT = 20;

  const category = searchParams.get("category") ?? "";
  const search = searchParams.get("search") ?? "";
  const shipping = searchParams.get("shipping") ?? "";

  const buildParams = useCallback((p: number) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    if (shipping) params.set("shippingType", shipping);
    params.set("page", String(p));
    params.set("limit", String(LIMIT));
    return params;
  }, [category, search, shipping, LIMIT]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setPage(1);
    const res = await fetch(`/api/products?${buildParams(1)}`);
    const data = await res.json();
    setProducts(data.products ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [buildParams]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting || loadingMore || products.length >= total) return;
      setLoadingMore(true);
      const nextPage = page + 1;
      const res = await fetch(`/api/products?${buildParams(nextPage)}`);
      const data = await res.json();
      setProducts((prev) => [...prev, ...(data.products ?? [])]);
      setPage(nextPage);
      setLoadingMore(false);
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [products.length, total, page, loadingMore, buildParams]);

  function setFilter(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    router.push(`/products?${p}`);
  }

  const hasFilters = !!(category || shipping);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Produits import Chine</h1>
              <p className="text-sm text-gray-500">{total} produit{total !== 1 ? "s" : ""}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1.5">
              <SlidersHorizontal size={15} /> Filtres
              {hasFilters && <span className="bg-[#1D9E75] text-white text-[10px] rounded-full px-1.5">!</span>}
            </Button>
          </div>

          {/* Catégories rapides */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
            <button
              onClick={() => setFilter("category", "")}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${!category ? "bg-[#1D9E75] text-white border-[#1D9E75]" : "bg-white text-gray-600 border-[#E8E4DB] hover:border-[#1D9E75]"}`}
            >
              Tout
            </button>
            {PRODUCT_CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setFilter("category", c.value)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${category === c.value ? "bg-[#1D9E75] text-white border-[#1D9E75]" : "bg-white text-gray-600 border-[#E8E4DB] hover:border-[#1D9E75]"}`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Recherche */}
          <SearchBar
            placeholder="Rechercher un produit..."
            onSearch={(v) => setFilter("search", v)}
            className="mb-4"
          />

          {/* Filtres avancés */}
          {showFilters && (
            <div className="bg-white border border-[#E8E4DB] rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Type d&apos;expédition</label>
                <select className="w-full text-sm border border-[#E8E4DB] rounded-lg px-3 py-2 bg-white" value={shipping} onChange={(e) => setFilter("shipping", e.target.value)}>
                  <option value="">Tous</option>
                  {SHIPPING_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              {hasFilters && (
                <button onClick={() => router.push("/products")} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 self-end">
                  <X size={12} /> Effacer
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
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📦</p>
              <p className="font-semibold text-gray-700">Aucun produit trouvé</p>
              <p className="text-sm text-gray-400 mt-1">Modifiez vos filtres ou revenez plus tard.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
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

export default function ProductsPage() {
  return <Suspense><ProductsContent /></Suspense>;
}
