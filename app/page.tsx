import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Package, RefreshCcw, Ship, Store, ArrowRight, Shield, Smartphone, Zap, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { parseJsonField } from "@/lib/utils/formatters";
import { formatGNF, formatUSD } from "@/lib/utils/currency";

const categories = [
  { icon: "📱", label: "Électronique", href: "/products?category=ELECTRONICS" },
  { icon: "👗", label: "Mode", href: "/products?category=TEXTILE_FASHION" },
  { icon: "🛋️", label: "Maison", href: "/products?category=HOME_FURNITURE" },
  { icon: "💄", label: "Beauté", href: "/products?category=COSMETICS_BEAUTY" },
  { icon: "🔨", label: "Construction", href: "/products?category=CONSTRUCTION" },
  { icon: "🌱", label: "Agriculture", href: "/products?category=AGRICULTURE" },
];

async function getFeaturedData() {
  const [products, listings] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, isVerified: true },
      take: 6,
      orderBy: { viewCount: "desc" },
      include: {
        supplier: { select: { companyName: true, city: true, rating: true, isVerified: true } },
      },
    }),
    prisma.listing.findMany({
      where: { isActive: true, isSold: false },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return { products, listings };
}

export default async function HomePage() {
  const { products, listings } = await getFeaturedData();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1D9E75] to-[#085041] px-4 py-16 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            La marketplace qui connecte<br />
            <span className="text-[#EF9F27]">la Chine à la Guinée</span>
          </h1>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Importez directement depuis Guangzhou, Yiwu et Shenzhen. Vendez à Conakry et dans toutes les régions de Guinée.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" variant="gold" asChild>
              <Link href="/products">
                Explorer les produits <ArrowRight size={18} />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20" asChild>
              <Link href="/register">Créer un compte</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 4 types d'acteurs */}
      <section className="px-4 py-12 bg-[#F7F5F0]">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-xl font-bold text-center text-gray-900 mb-8">Comment fonctionne SokoFlux ?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "🏭", title: "Fournisseurs chinois", desc: "Guangzhou, Yiwu, Shenzhen", href: "/suppliers" },
              { icon: "🚢", title: "Importateurs", desc: "Conteneurs & groupage", href: "/shipments" },
              { icon: "🏪", title: "Commerçants locaux", desc: "Vente en gros en Guinée", href: "/products?type=local" },
              { icon: "👤", title: "Particuliers", desc: "Achat/vente d'occasion", href: "/listings" },
            ].map((item) => (
              <Link key={item.title} href={item.href} className="flex flex-col items-center p-4 bg-white rounded-xl border border-[#E8E4DB] hover:border-[#1D9E75] hover:shadow-md transition-all text-center gap-3">
                <span className="text-3xl">{item.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Catégories */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Parcourir par catégorie</h2>
            <Link href="/products" className="text-sm text-[#1D9E75] font-medium">Tout voir →</Link>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#E8E4DB] bg-white hover:border-[#1D9E75] hover:shadow-sm transition-all text-center"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-medium text-gray-700">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Produits vedettes */}
      {products.length > 0 && (
        <section className="px-4 py-12 bg-[#F7F5F0]">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Produits populaires</h2>
                <p className="text-sm text-gray-500">Directement depuis les fournisseurs chinois</p>
              </div>
              <Link href="/products" className="text-sm text-[#1D9E75] font-medium">Tout voir →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {products.map((product) => {
                const imgs = parseJsonField<string[]>(product.images, []);
                return (
                  <Link key={product.id} href={`/products/${product.id}`} className="bg-white rounded-xl border border-[#E8E4DB] overflow-hidden hover:border-[#1D9E75] hover:shadow-md transition-all group">
                    <div className="aspect-square relative bg-[#F7F5F0] overflow-hidden">
                      {imgs[0] ? (
                        <Image src={imgs[0]} alt={product.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight mb-1">{product.title}</p>
                      <p className="text-sm font-bold text-[#1D9E75]">
                        {product.priceUSD ? formatUSD(product.priceUSD) : "Sur demande"}
                      </p>
                      {product.supplier && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star size={10} className="text-[#EF9F27] fill-[#EF9F27]" />
                          <span className="text-[10px] text-gray-400">{product.supplier.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Annonces récentes */}
      {listings.length > 0 && (
        <section className="px-4 py-12">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Occasion récente</h2>
                <p className="text-sm text-gray-500">Achetez et vendez entre particuliers</p>
              </div>
              <Link href="/listings" className="text-sm text-[#1D9E75] font-medium">Tout voir →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {listings.map((listing) => {
                const imgs = parseJsonField<string[]>(listing.images, []);
                return (
                  <Link key={listing.id} href={`/listings/${listing.id}`} className="bg-white rounded-xl border border-[#E8E4DB] overflow-hidden hover:border-[#1D9E75] hover:shadow-md transition-all group">
                    <div className="aspect-square relative bg-[#F7F5F0] overflow-hidden">
                      {imgs[0] ? (
                        <Image src={imgs[0]} alt={listing.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight mb-1">{listing.title}</p>
                      <p className="text-sm font-bold text-[#1D9E75]">{formatGNF(listing.price)}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{listing.city}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Liens rapides */}
      <section className="px-4 py-8 border-t border-[#E8E4DB] bg-[#F7F5F0]">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/products" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[#E8E4DB] hover:shadow-sm">
              <Package className="text-[#1D9E75]" size={24} />
              <div>
                <p className="font-semibold text-sm">Produits import</p>
                <p className="text-xs text-gray-500">Depuis la Chine</p>
              </div>
            </Link>
            <Link href="/listings" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[#E8E4DB] hover:shadow-sm">
              <RefreshCcw className="text-[#EF9F27]" size={24} />
              <div>
                <p className="font-semibold text-sm">Occasion</p>
                <p className="text-xs text-gray-500">Achat/vente entre particuliers</p>
              </div>
            </Link>
            <Link href="/shipments" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[#E8E4DB] hover:shadow-sm">
              <Ship className="text-blue-500" size={24} />
              <div>
                <p className="font-semibold text-sm">Conteneurs</p>
                <p className="text-xs text-gray-500">Suivi en temps réel</p>
              </div>
            </Link>
            <Link href="/suppliers" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[#E8E4DB] hover:shadow-sm">
              <Store className="text-purple-500" size={24} />
              <div>
                <p className="font-semibold text-sm">Fournisseurs</p>
                <p className="text-xs text-gray-500">Vérifiés et notés</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-xl font-bold text-center text-gray-900 mb-8">Pourquoi SokoFlux ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Paiement sécurisé", desc: "Système d'escrow — votre argent est protégé jusqu'à réception de la marchandise.", color: "text-[#1D9E75]" },
              { icon: Smartphone, title: "Orange Money & MTN", desc: "Payez facilement avec votre mobile money guinéen. Sans carte bancaire requise.", color: "text-orange-500" },
              { icon: Zap, title: "Optimisé mobile", desc: "Application légère, fonctionne sur les connexions lentes. Disponible hors ligne.", color: "text-blue-500" },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="flex gap-4 p-5 bg-[#F7F5F0] rounded-xl">
                <Icon size={28} className={color} />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer minimal */}
      <footer className="border-t border-[#E8E4DB] px-4 py-8 text-center text-sm text-gray-500">
        <p>© 2026 SokoFlux — Marketplace Afrique de l&apos;Ouest</p>
        <p className="mt-1">Conakry, Guinée · Import Chine · Paiement Mobile Money</p>
      </footer>
    </div>
  );
}
