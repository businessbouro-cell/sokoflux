"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ShoppingCart, Bell, User, LogOut, Package, Store, Ship } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/useCartStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

export function Navbar() {
  const { data: session } = useSession();
  const itemCount = useCartStore((s) => s.itemCount());
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <nav className="sticky top-0 z-50 h-16 border-b border-[#E8E4DB] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1D9E75]">
            <span className="text-sm font-bold text-white">SF</span>
          </div>
          <span className="text-lg font-bold text-gray-900 hidden sm:block">SokoFlux</span>
        </Link>

        {/* Navigation centrale (desktop) */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/products" className="hover:text-[#1D9E75] flex items-center gap-1.5">
            <Package size={16} /> Produits
          </Link>
          <Link href="/suppliers" className="hover:text-[#1D9E75] flex items-center gap-1.5">
            <Store size={16} /> Fournisseurs
          </Link>
          <Link href="/listings" className="hover:text-[#1D9E75] flex items-center gap-1.5">
            ♻️ Occasion
          </Link>
          <Link href="/shipments" className="hover:text-[#1D9E75] flex items-center gap-1.5">
            <Ship size={16} /> Conteneurs
          </Link>
        </div>

        {/* Actions droite */}
        <div className="flex items-center gap-2">
          {/* Panier */}
          <Link href="/orders" className="relative p-2 rounded-lg hover:bg-[#F7F5F0]">
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
              <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-[#F7F5F0]">
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
                  <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-[#F7F5F0]">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={(session.user as { image?: string }).image ?? ""} />
                      <AvatarFallback>{session.user.name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content className="z-50 min-w-[180px] rounded-xl border border-[#E8E4DB] bg-white p-1 shadow-lg" align="end">
                    <DropdownMenu.Item asChild>
                      <Link href="/profile" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[#F7F5F0] cursor-pointer">
                        <User size={16} /> Mon profil
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <Link href="/orders" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[#F7F5F0] cursor-pointer">
                        <Package size={16} /> Mes commandes
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="my-1 h-px bg-[#E8E4DB]" />
                    <DropdownMenu.Item
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                      onClick={() => signOut({ callbackUrl: "/" })}
                    >
                      <LogOut size={16} /> Déconnexion
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
              <Button size="sm" asChild className="hidden sm:flex">
                <Link href="/register">S&apos;inscrire</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
