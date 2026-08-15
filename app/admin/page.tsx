"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Users, Package, ShoppingBag, Ship, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";
import { formatGNF } from "@/lib/utils/currency";

interface Stats {
  users: number;
  products: number;
  orders: number;
  shipments: number;
  pendingProducts: number;
  pendingOrders: number;
  totalRevenueGNF: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ users: 0, products: 0, orders: 0, shipments: 0, pendingProducts: 0, pendingOrders: 0, totalRevenueGNF: 0 });

  useEffect(() => {
    const roles = (session?.user?.roles as string[]) ?? [];
    if (status === "unauthenticated" || (status === "authenticated" && !roles.includes("ADMIN"))) {
      router.push("/");
    }
    if (status === "authenticated" && roles.includes("ADMIN")) {
      fetch("/api/admin/stats")
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setStats(d); })
        .catch(() => {});
    }
  }, [session, status, router]);

  const adminSections = [
    { icon: Users, label: "Utilisateurs", href: "/admin/users", count: stats.users, color: "text-blue-500", bg: "bg-blue-50" },
    { icon: Package, label: "Produits", href: "/admin/products", count: stats.products, color: "text-[#1D9E75]", bg: "bg-[#1D9E75]/10", badge: stats.pendingProducts > 0 ? `${stats.pendingProducts} en attente` : undefined },
    { icon: ShoppingBag, label: "Commandes", href: "/admin/orders", count: stats.orders, color: "text-[#EF9F27]", bg: "bg-[#EF9F27]/10", badge: stats.pendingOrders > 0 ? `${stats.pendingOrders} en attente` : undefined },
    { icon: Ship, label: "Conteneurs", href: "/admin/shipments", count: stats.shipments, color: "text-purple-500", bg: "bg-purple-50" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900">Panel Administrateur</h1>
            <p className="text-sm text-gray-500">Gestion de la plateforme SokoFlux</p>
          </div>

          {/* Revenue banner */}
          <div className="bg-gradient-to-r from-[#1D9E75] to-[#085041] rounded-xl p-5 mb-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-white/70" />
              <p className="text-sm text-white/70">Volume total traité</p>
            </div>
            <p className="text-3xl font-bold">{formatGNF(stats.totalRevenueGNF)}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {adminSections.map(({ icon: Icon, label, href, count, color, bg, badge }) => (
              <Link key={href} href={href} className="bg-white rounded-xl border border-[#E8E4DB] p-4 hover:border-[#1D9E75] hover:shadow-sm transition-all">
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-2`}>
                  <Icon size={18} className={color} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                {badge && <p className="text-xs text-[#EF9F27] font-medium mt-1">{badge}</p>}
              </Link>
            ))}
          </div>

          {/* Actions rapides */}
          <div className="bg-white rounded-xl border border-[#E8E4DB] p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Actions rapides</h2>
            <div className="space-y-2">
              {[
                { icon: CheckCircle, label: "Valider les fournisseurs en attente", href: "/admin/users?role=SUPPLIER&verified=false", color: "text-[#1D9E75]" },
                { icon: Package, label: "Approuver les produits en attente", href: "/admin/products?approved=false", color: "text-blue-500" },
                { icon: XCircle, label: "Gérer les litiges commandes", href: "/admin/orders?status=DISPUTED", color: "text-red-500" },
                { icon: Clock, label: "Mettre à jour les statuts conteneurs", href: "/admin/shipments", color: "text-purple-500" },
              ].map(({ icon: Icon, label, href, color }) => (
                <Link key={href} href={href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F7F5F0] transition-colors">
                  <Icon size={18} className={color} />
                  <span className="text-sm text-gray-700">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
