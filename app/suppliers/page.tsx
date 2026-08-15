"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { SearchBar } from "@/components/common/SearchBar";
import { Star, MapPin, Package, Shield } from "lucide-react";

interface Supplier {
  id: string;
  companyName: string;
  city: string;
  province: string;
  rating: number;
  totalSales: number;
  isVerified: boolean;
  logo?: string;
  description?: string;
  user: { name: string };
  _count: { products: number };
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filtered, setFiltered] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then((data) => { setSuppliers(data); setFiltered(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function handleSearch(query: string) {
    const q = query.toLowerCase();
    setFiltered(suppliers.filter((s) =>
      s.companyName.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q)
    ));
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Fournisseurs vérifiés</h1>
          <p className="text-sm text-gray-500 mb-4">Guangzhou, Yiwu, Shenzhen</p>

          <SearchBar placeholder="Rechercher un fournisseur..." onSearch={handleSearch} className="mb-5" />

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-40 bg-[#F7F5F0] rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">🏭</p>
              <p className="text-gray-500">Aucun fournisseur trouvé</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((s) => (
                <Link key={s.id} href={`/suppliers/${s.id}`} className="flex gap-4 p-4 bg-white rounded-xl border border-[#E8E4DB] hover:border-[#1D9E75] hover:shadow-sm transition-all">
                  {/* Logo */}
                  <div className="w-14 h-14 rounded-xl bg-[#F7F5F0] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {s.logo ? (
                      <Image src={s.logo} alt={s.companyName} width={56} height={56} className="object-cover" />
                    ) : (
                      <span className="text-2xl">🏭</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="font-semibold text-gray-900 truncate">{s.companyName}</p>
                      {s.isVerified && <Shield size={13} className="text-[#1D9E75] flex-shrink-0" />}
                    </div>

                    <div className="flex items-center gap-1 mb-1.5">
                      <Star size={12} className="text-[#EF9F27] fill-[#EF9F27]" />
                      <span className="text-xs font-medium">{s.rating.toFixed(1)}</span>
                      <span className="text-xs text-gray-400">· {s.totalSales} ventes</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-0.5"><MapPin size={11} />{s.city}</span>
                      <span className="flex items-center gap-0.5"><Package size={11} />{s._count.products} produits</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
