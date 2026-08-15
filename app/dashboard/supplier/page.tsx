"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { formatUSD } from "@/lib/utils/currency";
import { Package, Star, ShoppingBag, Eye, Plus } from "lucide-react";
import { parseJsonField } from "@/lib/utils/formatters";
import Image from "next/image";

interface Product {
  id: string;
  title: string;
  priceUSD: number | null;
  images: string;
  viewCount: number;
  isVerified: boolean;
  isActive: boolean;
}

interface DashboardData {
  products: Product[];
  totalProducts: number;
  totalViews: number;
  verifiedProducts: number;
}

export default function SupplierDashboard() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/products?supplierId=me&limit=10")
        .then((r) => r.json())
        .then((res) => {
          const products = res.products ?? [];
          setData({
            products,
            totalProducts: res.total ?? 0,
            totalViews: products.reduce((s: number, p: Product) => s + p.viewCount, 0),
            verifiedProducts: products.filter((p: Product) => p.isVerified).length,
          });
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status]);

  const stats = [
    { icon: Package, label: "Produits actifs", value: data?.verifiedProducts ?? 0, color: "text-[#1D9E75]", bg: "bg-[#1D9E75]/10" },
    { icon: Eye, label: "Vues totales", value: data?.totalViews ?? 0, color: "text-blue-500", bg: "bg-blue-50" },
    { icon: ShoppingBag, label: "En attente", value: (data?.totalProducts ?? 0) - (data?.verifiedProducts ?? 0), color: "text-[#EF9F27]", bg: "bg-[#EF9F27]/10" },
    { icon: Star, label: "Note", value: "4.8", color: "text-purple-500", bg: "bg-purple-50" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Dashboard Fournisseur</h1>
              <p className="text-sm text-gray-500">Bonjour, {session?.user.name}</p>
            </div>
            <Button asChild size="sm">
              <Link href="/dashboard/supplier/products/new"><Plus size={15} className="mr-1" /> Produit</Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {stats.map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="bg-white rounded-xl border border-[#E8E4DB] p-4">
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-2`}>
                  <Icon size={18} className={color} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-[#E8E4DB] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Mes produits</h2>
              <Link href="/dashboard/supplier/products" className="text-sm text-[#1D9E75]">Tout voir →</Link>
            </div>

            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-[#F7F5F0] rounded-lg animate-pulse" />)}</div>
            ) : (data?.products ?? []).length === 0 ? (
              <div className="text-center py-8">
                <Package size={32} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Aucun produit publié</p>
                <Button asChild className="mt-3" size="sm"><Link href="/dashboard/supplier/products/new">Publier mon premier produit</Link></Button>
              </div>
            ) : (
              <div className="space-y-3">
                {(data?.products ?? []).map((product) => {
                  const imgs = parseJsonField<string[]>(product.images, []);
                  return (
                    <div key={product.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#E8E4DB] hover:border-[#1D9E75] transition-colors">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#F7F5F0] flex-shrink-0">
                        {imgs[0] ? <Image src={imgs[0]} alt="" width={48} height={48} className="object-cover w-full h-full" /> : <Package size={20} className="text-gray-300 m-auto mt-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.title}</p>
                        <p className="text-xs text-gray-400">{product.priceUSD ? formatUSD(product.priceUSD) : "—"} · {product.viewCount} vues</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${product.isVerified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {product.isVerified ? "Actif" : "En attente"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
