"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ShoppingCart, Bell, User, LogOut, Package, Store, Ship, LayoutDashboard, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/useCartStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

function getDashboardLink(roles: string[]): { href: string; label: string } | null {
  if (roles.includes("ADMIN")) return { href: "/admin", label: "Admin" };
  if (roles.includes("SUPPLIER")) return { href: "/dashboard/supplier", label: "Espace fournisseur" };
  if (roles.includes("IMPORTER")) return { href: "/dashboard/importer", label: "Espace importateur" };
  if (roles.includes("LOCAL_MERCHANT")) return { href: "/dashboard/merchant", label: "Espace commerçant" };
  return null;
}

export function Navbar() {
  const { data: session } = useSession();
  const itemCount = useCartStore((s) => s.itemCount());
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const roles = (session?.user?.roles as string[]) ?? [];
  const dashboard = getDashboardLink(roles);

  return (
    <nav className="sticky top-0 z-50 h-16 border-b border-[#E8E4DB] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1D9E75]">
            <span className="text-sm font-bold text-white">SF</span>
          </div>
          <span className="text-lg font-bold text-gray-900 hidden sm:block">SokoFlux</span>
        </Link>

        {/* Navigation centrale */}
        <div className="hidden md:flex items-center gap-5 text-sm font-medium text-gray-600">
          <Link href="/products" className="hover:text-[#1D9E75] flex items-center gap-1.5 transition-colors">
            <Package size={15} /> Produits
          </Link>
          <Link href="/suppliers" className="hover:text-[#1D9E75] flex items-center gap-1.5 transition-colors">
            <Store size={15} /> Fournisseurs
          </Link>
          <Link href="/listings" className="hover:text-[#1D9E75] flex items-center gap-1.5 transition-colors">
            ♻️ Occasion
          </Link>
          <Link href="/shipments" className="hover:text-[#1D9E75] flex items-center gap-1.5 transition-colors">
            <Ship size={15} /> Conteneurs
          </Link>
        </div>

        {/* Actions droite */}
        <div className="flex items-center gap-1">

          {/* Panier */}
          <Link href="/cart" className="relative p-2 rounded-lg hover:bg-[#F7F5F0] transition-colors">
            <ShoppingCart size={20} className="text-gray-600" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#1D9E75] text-[10px] font-bold text-white">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </Link>

          {session ? (
            <>
              {/* Notifications */}
              <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-[#F7F5F0] transition-colors">
                <Bell size={20} className="text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* User menu */}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-[#F7F5F0] transition-colors">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={(session.user as { image?: string }).image ?? ""} />
                      <AvatarFallback className="text-xs bg-[#1D9E75] text-white">
                        {session.user.name?.[0]?.toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[100px] truncate">
                      {session.user.name}
                    </span>
                    <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="z-50 min-w-[200px] rounded-xl border border-[#E8E4DB] bg-white p-1 shadow-lg"
                    align="end"
                    sideOffset={8}
                  >
                    {/* Nom + rôle */}
                    <div className="px-3 py-2 mb-1 border-b border-[#F7F5F0]">
                      <p className="text-sm font-semibold text-gray-900">{session.user.name}</p>
                      <p className="text-xs text-gray-400">{roles[0] === "INDIVIDUAL" ? "Acheteur" : roles[0] === "SUPPLIER" ? "Fournisseur" : roles[0] === "IMPORTER" ? "Importateur" : roles[0] === "LOCAL_MERCHANT" ? "Commerçant" : roles[0]}</p>
                    </div>

                    {/* Dashboard selon rôle */}
                    {dashboard && (
                      <DropdownMenu.Item asChild>
                        <Link href={dashboard.href} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[#1D9E75]/10 text-[#1D9E75] font-medium cursor-pointer">
                          <LayoutDashboard size={15} /> {dashboard.label}
                        </Link>
                      </DropdownMenu.Item>
                    )}

                    <DropdownMenu.Item asChild>
                      <Link href="/profile" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[#F7F5F0] cursor-pointer text-gray-700">
                        <User size={15} /> Mon profil
                      </Link>
                    </DropdownMenu.Item>

                    <DropdownMenu.Item asChild>
                      <Link href="/orders" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[#F7F5F0] cursor-pointer text-gray-700">
                        <Package size={15} /> Mes commandes
                      </Link>
                    </DropdownMenu.Item>

                    <DropdownMenu.Separator className="my-1 h-px bg-[#E8E4DB]" />

                    <DropdownMenu.Item
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                      onClick={() => signOut({ callbackUrl: "/" })}
                    >
                      <LogOut size={15} /> Déconnexion
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Connexion</Link>
              </Button>
              <Button size="sm" asChild className="hidden sm:flex bg-[#1D9E75] hover:bg-[#0F6E56]">
                <Link href="/register">S&apos;inscrire</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
