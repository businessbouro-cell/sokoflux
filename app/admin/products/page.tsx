"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { CheckCircle, XCircle } from "lucide-react";
import { formatUSD } from "@/lib/utils/currency";
import { parseJsonField } from "@/lib/utils/formatters";

interface Product {
  id: string;
  title: string;
  priceUSD: number | null;
  images: string;
  isVerified: boolean;
  category: string;
  supplier: { companyName: string; city: string; user: { name: string } } | null;
  createdAt: string;
}

export default function AdminProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  useEffect(() => {
    const roles = (session?.user?.roles as string[]) ?? [];
    if (status === "authenticated" && !roles.includes("ADMIN")) router.push("/");
  }, [session, status, router]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter === "pending") params.set("approved", "false");
    else if (filter === "approved") params.set("approved", "true");
    fetch(`/api/admin/products?${params}`)
      .then((r) => r.json())
      .then((d) => { setProducts(d?.products ?? d ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filter]);

  async function approveProduct(id: string, approve: boolean) {
    await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved: approve, isVerified: approve }),
    });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  const CATEGORY_MAP: Record<string, string> = {
    ELECTRONICS: "Électronique", TEXTILE_FASHION: "Mode", HOME_FURNITURE: "Maison",
    COSMETICS_BEAUTY: "Beauté", CONSTRUCTION: "Construction", AGRICULTURE: "Agriculture",
    FOOD_BEVERAGE: "Alimentation", AUTOMOTIVE: "Auto", OTHER: "Autre",
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/admin" className="text-gray-400 hover:text-gray-600">←</Link>
            <h1 className="text-xl font-bold text-gray-900">Produits</h1>
          </div>

          <div className="flex gap-2 mb-4">
            {[["pending", "En attente"], ["approved", "Approuvés"], ["all", "Tous"]].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)} className={`px-4 py-2 text-sm rounded-xl font-medium transition-colors ${filter === v ? "bg-[#1D9E75] text-white" : "bg-white border border-[#E8E4DB] text-gray-600"}`}>
                {l}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-[#F7F5F0] rounded-xl animate-pulse" />)}</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Aucun produit</div>
          ) : (
            <div className="space-y-3">
              {products.map((product) => {
                const imgs = parseJsonField<string[]>(product.images, []);
                return (
                  <div key={product.id} className="bg-white rounded-xl border border-[#E8E4DB] p-4 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#F7F5F0] flex-shrink-0">
                      {imgs[0] && <Image src={imgs[0]} alt={product.title} width={56} height={56} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{product.title}</p>
                      <p className="text-xs text-gray-500">{CATEGORY_MAP[product.category] ?? product.category} · {product.priceUSD ? formatUSD(product.priceUSD) : "—"}</p>
                      <p className="text-xs text-gray-400">{product.supplier?.companyName ?? "—"} · {product.supplier?.city ?? "—"}</p>
                    </div>
                    <div className="flex gap-2">
                      {!product.isVerified && (
                        <button
                          onClick={() => approveProduct(product.id, true)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[#1D9E75]/10 text-[#1D9E75] font-medium hover:bg-[#1D9E75]/20"
                        >
                          <CheckCircle size={12} /> Approuver
                        </button>
                      )}
                      <button
                        onClick={() => approveProduct(product.id, false)}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-medium hover:bg-red-100"
                      >
                        <XCircle size={12} /> Rejeter
                      </button>
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
