"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { formatUSD } from "@/lib/utils/currency";
import { parseJsonField } from "@/lib/utils/formatters";
import { Package, Plus, Eye } from "lucide-react";

interface Product {
  id: string;
  title: string;
  priceUSD: number | null;
  images: string;
  viewCount: number;
  isVerified: boolean;
  isActive: boolean;
  category: string;
  minOrderQty: number;
}

const CATEGORY_MAP: Record<string, string> = {
  ELECTRONICS: "Électronique", TEXTILE_FASHION: "Mode", HOME_FURNITURE: "Maison",
  COSMETICS_BEAUTY: "Beauté", CONSTRUCTION: "Construction", AGRICULTURE: "Agriculture",
  FOOD_BEVERAGE: "Alimentation", AUTOMOTIVE: "Auto", OTHER: "Autre",
};

export default function SupplierProductsPage() {
  const { status } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/products?supplierId=me&limit=50")
        .then((r) => r.json())
        .then((res) => { setProducts(res.products ?? []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link href="/dashboard/supplier" className="text-sm text-gray-400 hover:text-gray-600">← Dashboard</Link>
              <h1 className="text-xl font-bold text-gray-900 mt-1">Mes produits</h1>
            </div>
            <Button asChild size="sm">
              <Link href="/dashboard/supplier/products/new"><Plus size={14} className="mr-1" /> Nouveau</Link>
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-[#F7F5F0] rounded-xl animate-pulse" />)}</div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <Package size={48} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">Aucun produit publié</p>
              <Button asChild><Link href="/dashboard/supplier/products/new">Publier mon premier produit</Link></Button>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product) => {
                const imgs = parseJsonField<string[]>(product.images, []);
                return (
                  <div key={product.id} className="bg-white rounded-xl border border-[#E8E4DB] p-3 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#F7F5F0] flex-shrink-0">
                      {imgs[0] ? (
                        <Image src={imgs[0]} alt={product.title} width={56} height={56} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={20} className="text-gray-300 m-auto mt-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.title}</p>
                      <p className="text-xs text-gray-500">{CATEGORY_MAP[product.category] ?? product.category} · MOQ {product.minOrderQty}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-semibold text-[#1D9E75]">{product.priceUSD ? formatUSD(product.priceUSD) : "—"}</span>
                        <span className="flex items-center gap-1 text-xs text-gray-400"><Eye size={10} /> {product.viewCount}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${product.isVerified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {product.isVerified ? "Actif" : "En attente"}
                    </span>
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
