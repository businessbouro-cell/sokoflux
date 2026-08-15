"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid3X3, RefreshCcw, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Accueil" },
  { href: "/products", icon: Grid3X3, label: "Produits" },
  { href: "/listings", icon: RefreshCcw, label: "Occasion" },
  { href: "/orders", icon: ShoppingBag, label: "Commandes" },
  { href: "/profile", icon: User, label: "Profil" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E8E4DB] bg-white md:hidden pb-safe">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2.5 min-w-[60px] touch-none",
                active ? "text-[#1D9E75]" : "text-gray-400"
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
