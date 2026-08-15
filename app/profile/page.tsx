"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, ShoppingBag, MessageCircle, Bell, Settings, LogOut, ChevronRight, Shield, Wallet } from "lucide-react";

const MENU_ITEMS = [
  { icon: ShoppingBag, label: "Mes commandes", href: "/orders", color: "text-[#1D9E75]" },
  { icon: Wallet, label: "Mon portefeuille", href: "/wallet", color: "text-purple-500" },
  { icon: MessageCircle, label: "Mes messages", href: "/messages", color: "text-blue-500" },
  { icon: Bell, label: "Notifications", href: "/notifications", color: "text-[#EF9F27]" },
  { icon: Settings, label: "Paramètres", href: "/settings", color: "text-gray-400" },
];

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === "unauthenticated") return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
        <User size={40} className="text-gray-200" />
        <p className="font-semibold text-gray-500">Connectez-vous pour accéder à votre profil</p>
        <div className="flex gap-3">
          <Button asChild variant="outline"><Link href="/register">Créer un compte</Link></Button>
          <Button asChild><Link href="/login">Se connecter</Link></Button>
        </div>
      </div>
      <BottomNav />
    </div>
  );

  const user = session?.user;
  const roles = (user?.roles as string[]) ?? [];
  const initials = user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "U";

  const dashboardLinks = [
    roles.includes("SUPPLIER") && { label: "Dashboard fournisseur", href: "/dashboard/supplier", icon: "🏭" },
    roles.includes("IMPORTER") && { label: "Dashboard importateur", href: "/dashboard/importer", icon: "🚢" },
    roles.includes("LOCAL_MERCHANT") && { label: "Dashboard commerçant", href: "/dashboard/merchant", icon: "🏪" },
    roles.includes("ADMIN") && { label: "Panel admin", href: "/admin", icon: "⚙️" },
  ].filter(Boolean) as { label: string; href: string; icon: string }[];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-lg px-4 py-6">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <Avatar className="h-20 w-20 mb-3">
              <AvatarFallback className="text-2xl bg-[#1D9E75] text-white">{initials}</AvatarFallback>
            </Avatar>
            <h1 className="text-xl font-bold text-gray-900">{user?.name}</h1>
            <p className="text-sm text-gray-400">{user?.phone}</p>
            <div className="flex gap-2 mt-2">
              {roles.map((r) => (
                <span key={r} className="text-xs bg-[#1D9E75]/10 text-[#1D9E75] px-2 py-0.5 rounded-full font-medium">
                  {r === "INDIVIDUAL" ? "Particulier" : r === "LOCAL_MERCHANT" ? "Commerçant" : r === "IMPORTER" ? "Importateur" : r === "SUPPLIER" ? "Fournisseur" : r}
                </span>
              ))}
            </div>
            {!user?.isVerified && (
              <div className="mt-2 flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full">
                <Shield size={12} /> Numéro non vérifié
              </div>
            )}
          </div>

          {/* Dashboards spécifiques au rôle */}
          {dashboardLinks.length > 0 && (
            <div className="bg-[#F7F5F0] rounded-xl p-1 mb-4">
              {dashboardLinks.map((item) => (
                <Link key={item.href} href={item.href} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white transition-colors">
                  <span className="text-xl">{item.icon}</span>
                  <span className="flex-1 font-medium text-sm text-gray-900">{item.label}</span>
                  <ChevronRight size={16} className="text-gray-300" />
                </Link>
              ))}
            </div>
          )}

          {/* Menu */}
          <div className="bg-white rounded-xl border border-[#E8E4DB] divide-y divide-[#F7F5F0]">
            {MENU_ITEMS.map(({ icon: Icon, label, href, color }) => (
              <Link key={href} href={href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#F7F5F0] transition-colors">
                <Icon size={18} className={color} />
                <span className="flex-1 text-sm font-medium text-gray-700">{label}</span>
                <ChevronRight size={16} className="text-gray-300" />
              </Link>
            ))}
          </div>

          {/* Déconnexion */}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-100 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
          >
            <LogOut size={16} /> Se déconnecter
          </button>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
